package main

import (
	"bytes"
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"syscall"
	"time"
	"unicode"

	chromahtml "github.com/alecthomas/chroma/v2/formatters/html"
	"github.com/fsnotify/fsnotify"
	"github.com/gorilla/websocket"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer/html"
	highlighting "github.com/yuin/goldmark-highlighting/v2"
)

// version is set by -ldflags at build time
var version = "dev"

//go:embed static/*
var staticFS embed.FS

//go:embed templates/*
var templateFS embed.FS

var (
	docsDir    = getEnv("DOCS_DIR", "/docs/src")
	backupDir  = getEnv("BACKUP_DIR", "/backups")
	siteName   = getEnv("SITE_NAME", "My Docs")
	listenAddr = getEnv("LISTEN_ADDR", ":8000")
	authToken  = getEnv("GOMDSHELF_AUTH", "")     // "user:password" for basic auth
	defaultLang = getEnv("GOMDSHELF_LANG", "")    // "ja", "en", or "" (auto-detect)
	maxBackups = 50

	// Maximum request body sizes
	maxBodySize   int64 = 2 << 20  // 2MB for content API
	maxUploadSize int64 = 10 << 20 // 10MB for image upload

	// Snippet context: chars before/after search match
	snippetContext = 50
	// File watcher debounce interval
	watchDebounce = 300 * time.Millisecond

	tmpl *template.Template

	// WebSocket clients
	wsClients  = make(map[*websocket.Conn]bool)
	wsMu       sync.Mutex
	wsUpgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			// Allow same-origin and local connections
			origin := r.Header.Get("Origin")
			if origin == "" {
				return true
			}
			host := r.Host
			return strings.Contains(origin, host)
		},
	}

	// File operation mutex to prevent concurrent write corruption
	fileMu  sync.Mutex
	navMu   sync.Mutex

	tsRegex      = regexp.MustCompile(`^\d{8}_\d{6}$`)
	headingRegex = regexp.MustCompile(`(?m)^(#{1,6})\s+(.+)`)
	tocRegex     = regexp.MustCompile(`<h([1-6])\s+id="([^"]*)"[^>]*>(.*?)</h[1-6]>`)
	tagRegex     = regexp.MustCompile(`<[^>]*>`)
	safeNameRegex = regexp.MustCompile(`[^a-zA-Z0-9._-]`)

	allowedImageExts = map[string]bool{
		".png": true, ".jpg": true, ".jpeg": true,
		".gif": true, ".svg": true, ".webp": true,
	}

	mdRenderer goldmark.Markdown

	// Computed once at startup
	docsAbs string
)

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// ── i18n ──

// UIStrings holds all user-facing strings for the web UI.
type UIStrings struct {
	Lang             string
	Search           string
	EditTooltip      string
	MoreTooltip      string
	HistoryLabel     string
	HistoryTooltip   string
	NewTooltip       string
	DarkModeTooltip  string
	ThemeTooltip     string
	NavEditTooltip   string
	LastModified     string
	TOCTitle         string
	NotFoundTitle    string
	NotFoundHeading  string
	NotFoundMessage  string
	NotFoundLinkText string
}

var uiStringsMap = map[string]UIStrings{
	"en": {
		Lang: "en", Search: "Search (/)", EditTooltip: "Edit page",
		MoreTooltip: "More", HistoryLabel: "History", HistoryTooltip: "Edit history",
		NewTooltip: "New page", DarkModeTooltip: "Toggle dark mode",
		ThemeTooltip: "Change theme color", NavEditTooltip: "Edit navigation",
		LastModified: "Last updated:", TOCTitle: "Table of contents",
		NotFoundTitle: "Page not found",
		NotFoundHeading: "404",
		NotFoundMessage: "The page <code>%s</code> does not exist or has been moved.",
		NotFoundLinkText: "Return to top page",
	},
	"ja": {
		Lang: "ja", Search: "検索 (/)", EditTooltip: "ページを編集",
		MoreTooltip: "その他", HistoryLabel: "履歴", HistoryTooltip: "編集履歴",
		NewTooltip: "新規ページ", DarkModeTooltip: "ダークモード切替",
		ThemeTooltip: "テーマカラー変更", NavEditTooltip: "ナビゲーション編集",
		LastModified: "最終更新:", TOCTitle: "目次",
		NotFoundTitle: "ページが見つかりません",
		NotFoundHeading: "404",
		NotFoundMessage: "お探しのページ <code>%s</code> は存在しないか、移動された可能性があります。",
		NotFoundLinkText: "トップページに戻る",
	},
}

// detectLang determines the UI language from cookie > env > Accept-Language header.
func detectLang(r *http.Request) string {
	// 1. Cookie override
	if c, err := r.Cookie("gomdshelf_lang"); err == nil {
		if _, ok := uiStringsMap[c.Value]; ok {
			return c.Value
		}
	}
	// 2. Environment variable
	if defaultLang != "" {
		if _, ok := uiStringsMap[defaultLang]; ok {
			return defaultLang
		}
	}
	// 3. Accept-Language header
	accept := r.Header.Get("Accept-Language")
	if strings.Contains(accept, "ja") {
		return "ja"
	}
	return "en"
}

func getUIStrings(r *http.Request) UIStrings {
	lang := detectLang(r)
	if s, ok := uiStringsMap[lang]; ok {
		return s
	}
	return uiStringsMap["en"]
}

func initMarkdownRenderer() {
	mdRenderer = goldmark.New(
		goldmark.WithExtensions(
			extension.GFM,
			extension.TaskList,
			extension.Footnote,
			highlighting.NewHighlighting(
				highlighting.WithFormatOptions(chromahtml.WithClasses(true)),
			),
		),
		goldmark.WithParserOptions(
			parser.WithAutoHeadingID(),
		),
		goldmark.WithRendererOptions(
			html.WithUnsafe(),
		),
	)
}

// ── Authentication middleware ──

func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if authToken == "" {
			next.ServeHTTP(w, r)
			return
		}
		parts := strings.SplitN(authToken, ":", 2)
		if len(parts) != 2 {
			next.ServeHTTP(w, r)
			return
		}
		user, pass, ok := r.BasicAuth()
		if !ok || user != parts[0] || pass != parts[1] {
			w.Header().Set("WWW-Authenticate", `Basic realm="gomdshelf"`)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ── Navigation ──

type NavItem struct {
	Title    string
	Path     string
	Key      string // directory name or file stem for config lookup
	Children []*NavItem
	IsDir    bool
}

type NavConfig struct {
	Order map[string][]string `json:"order"`
}

func loadNavConfig() NavConfig {
	navMu.Lock()
	defer navMu.Unlock()
	cfg := NavConfig{Order: map[string][]string{}}
	data, err := os.ReadFile(filepath.Join(docsDir, "_nav.json"))
	if err != nil {
		return cfg
	}
	json.Unmarshal(data, &cfg) // ignore error: use defaults on malformed JSON
	if cfg.Order == nil {
		cfg.Order = map[string][]string{}
	}
	return cfg
}

func saveNavConfig(cfg NavConfig) error {
	navMu.Lock()
	defer navMu.Unlock()
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(docsDir, "_nav.json"), data, 0644)
}

func buildNav() []*NavItem {
	cfg := loadNavConfig()
	root := &NavItem{IsDir: true}
	dirMap := map[string]*NavItem{"": root}

	var paths []string
	filepath.WalkDir(docsDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		rel, _ := filepath.Rel(docsDir, path)
		if rel == "." || d.Name() == "_nav.json" {
			return nil
		}
		// Skip hidden directories and the images directory
		if d.IsDir() && (strings.HasPrefix(d.Name(), ".") || d.Name() == "images") {
			return filepath.SkipDir
		}
		if strings.HasPrefix(d.Name(), ".") {
			return nil
		}
		if d.IsDir() {
			item := &NavItem{Title: d.Name(), Path: "", Key: rel, IsDir: true}
			dirMap[rel] = item
			parent := dirMap[filepath.Dir(rel)]
			if parent == nil {
				parent = root
			}
			parent.Children = append(parent.Children, item)
		} else if strings.HasSuffix(d.Name(), ".md") {
			paths = append(paths, rel)
		}
		return nil
	})

	sort.Strings(paths)
	for _, rel := range paths {
		dir := filepath.Dir(rel)
		name := strings.TrimSuffix(filepath.Base(rel), ".md")
		pagePath := strings.TrimSuffix(rel, ".md")
		if name == "index" {
			pagePath = dir
			if pagePath == "." {
				pagePath = ""
			}
		}
		title := name
		item := &NavItem{
			Title: title,
			Path:  pagePath,
			Key:   pagePath,
		}
		parent := dirMap[dir]
		if parent == nil {
			parent = root
		}
		if name == "index" {
			parent.Title = filepath.Base(dir)
			parent.Path = pagePath
		} else {
			parent.Children = append(parent.Children, item)
		}
	}

	result := pruneEmptyDirs(root.Children)
	applyOrder(result, "", cfg)
	return result
}

func applyOrder(items []*NavItem, parentKey string, cfg NavConfig) {
	order, ok := cfg.Order[parentKey]
	if ok && len(order) > 0 {
		orderMap := map[string]int{}
		for i, key := range order {
			orderMap[key] = i
		}
		sort.SliceStable(items, func(i, j int) bool {
			oi, oki := orderMap[items[i].Key]
			oj, okj := orderMap[items[j].Key]
			if oki && okj {
				return oi < oj
			}
			if oki {
				return true
			}
			if okj {
				return false
			}
			return items[i].Title < items[j].Title
		})
	}
	for _, item := range items {
		if item.IsDir && len(item.Children) > 0 {
			applyOrder(item.Children, item.Key, cfg)
		}
	}
}

func pruneEmptyDirs(items []*NavItem) []*NavItem {
	var result []*NavItem
	for _, item := range items {
		if item.IsDir {
			item.Children = pruneEmptyDirs(item.Children)
			if len(item.Children) == 0 && item.Path == "" {
				continue // skip empty dirs without index.md
			}
		}
		result = append(result, item)
	}
	return result
}

// ── Markdown ──

// Custom heading ID generator that preserves Unicode characters (including CJK)
type unicodeIDs struct {
	used map[string]int
}

func newUnicodeIDs() parser.IDs {
	return &unicodeIDs{used: make(map[string]int)}
}

func (u *unicodeIDs) Generate(value []byte, kind ast.NodeKind) []byte {
	text := string(value)
	var b strings.Builder
	for _, r := range text {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(unicode.ToLower(r))
		} else if r == ' ' || r == '-' || r == '_' {
			b.WriteRune('-')
		}
	}
	id := b.String()
	id = strings.Trim(id, "-")
	if id == "" {
		id = "heading"
	}
	// Handle duplicates
	if count, ok := u.used[id]; ok {
		u.used[id] = count + 1
		id = fmt.Sprintf("%s-%d", id, count)
	} else {
		u.used[id] = 1
	}
	return []byte(id)
}

func (u *unicodeIDs) Put(value []byte) {
	u.used[string(value)] = 1
}

// ── Admonition preprocessor ──

var admonitionRe = regexp.MustCompile(`(?m)^!!!\s+(\w+)(?:\s+"([^"]*)")?\s*\n((?:    .+\n?)*)`)
var admonitionTitles = map[string]string{
	"note": "Note", "warning": "Warning", "danger": "Danger",
	"tip": "Tip", "info": "Info", "example": "Example",
	"success": "Success", "question": "Question", "bug": "Bug",
}

func preprocessAdmonition(content string) string {
	return admonitionRe.ReplaceAllStringFunc(content, func(match string) string {
		m := admonitionRe.FindStringSubmatch(match)
		if m == nil {
			return match
		}
		adType := strings.ToLower(m[1])
		title := m[2]
		if title == "" {
			if t, ok := admonitionTitles[adType]; ok {
				title = t
			} else {
				title = strings.ToUpper(adType[:1]) + adType[1:]
			}
		}
		body := strings.TrimRight(m[3], "\n")
		var lines []string
		for _, line := range strings.Split(body, "\n") {
			if len(line) >= 4 {
				lines = append(lines, line[4:])
			} else {
				lines = append(lines, "")
			}
		}
		bodyText := strings.Join(lines, "\n")
		safeTitle := template.HTMLEscapeString(title)
		return fmt.Sprintf("<div class=\"admonition admonition-%s\">\n<p class=\"admonition-title\">%s</p>\n\n%s\n\n</div>\n", adType, safeTitle, bodyText)
	})
}

func renderMarkdown(content string) string {
	content = preprocessAdmonition(content)
	var buf bytes.Buffer
	ctx := parser.NewContext(parser.WithIDs(newUnicodeIDs()))
	if err := mdRenderer.Convert([]byte(content), &buf, parser.WithContext(ctx)); err != nil {
		return "<p>Markdown rendering error</p>"
	}
	return buf.String()
}

// ── TOC ──

type TocItem struct {
	ID    string
	Title string
	Level int
}

func extractTOC(htmlContent string) []TocItem {
	matches := tocRegex.FindAllStringSubmatch(htmlContent, -1)
	var items []TocItem
	for _, m := range matches {
		level := int(m[1][0] - '0')
		id := m[2]
		title := stripTags(m[3])
		items = append(items, TocItem{ID: id, Title: title, Level: level})
	}
	return items
}

func stripTags(s string) string {
	return tagRegex.ReplaceAllString(s, "")
}

// ── File path safety ──

func safeDocPath(fp string) string {
	if fp == "" || strings.Contains(fp, "..") || strings.Contains(fp, "\x00") {
		return ""
	}
	abs, err := filepath.Abs(filepath.Join(docsDir, fp))
	if err != nil {
		return ""
	}
	if !strings.HasPrefix(abs, docsAbs+string(os.PathSeparator)) {
		return ""
	}
	return fp
}

func safeFilepath(fp string) string {
	if !strings.HasSuffix(fp, ".md") {
		return ""
	}
	return safeDocPath(fp)
}

func getBackupDir(fp string) string {
	safe := strings.ReplaceAll(fp, "/", "_")
	return filepath.Join(backupDir, safe)
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	_, err = io.Copy(out, in)
	if closeErr := out.Close(); err == nil {
		err = closeErr
	}
	if err != nil {
		os.Remove(dst) // clean up partial file
	}
	return err
}

// ── Request helpers ──

func limitBody(r *http.Request, maxBytes int64) {
	r.Body = http.MaxBytesReader(nil, r.Body, maxBytes)
}

func decodeJSON(r *http.Request, v any) error {
	limitBody(r, maxBodySize)
	dec := json.NewDecoder(r.Body)
	return dec.Decode(v)
}

// ── Image validation ──

// validateImageContent checks the file's magic bytes to verify it's a real image
func validateImageContent(data []byte) bool {
	if len(data) < 4 {
		return false
	}
	// PNG: 89 50 4E 47
	if data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47 {
		return true
	}
	// JPEG: FF D8 FF
	if data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF {
		return true
	}
	// GIF: GIF87a or GIF89a
	if string(data[:3]) == "GIF" {
		return true
	}
	// WebP: RIFF....WEBP
	if len(data) >= 12 && string(data[:4]) == "RIFF" && string(data[8:12]) == "WEBP" {
		return true
	}
	// SVG: starts with < (XML)
	trimmed := bytes.TrimLeft(data, " \t\r\n")
	if len(trimmed) > 0 && trimmed[0] == '<' {
		prefix := strings.ToLower(string(trimmed[:min(100, len(trimmed))]))
		if strings.Contains(prefix, "<svg") || strings.Contains(prefix, "<?xml") {
			return true
		}
	}
	return false
}

// ── Handlers ──

type Breadcrumb struct {
	Title string
	Path  string
}

func buildBreadcrumbs(pagePath string) []Breadcrumb {
	if pagePath == "" || pagePath == "index" {
		return nil
	}
	var crumbs []Breadcrumb
	parts := strings.Split(pagePath, "/")
	for i, part := range parts {
		path := "/" + strings.Join(parts[:i+1], "/")
		title := part
		crumbs = append(crumbs, Breadcrumb{Title: title, Path: path})
	}
	return crumbs
}

func render404(w http.ResponseWriter, r *http.Request, pagePath string) {
	nav := buildNav()
	ui := getUIStrings(r)
	notFoundMsg := fmt.Sprintf(ui.NotFoundMessage, template.HTMLEscapeString(pagePath))
	data := map[string]any{
		"SiteName":     siteName,
		"PageTitle":    ui.NotFoundTitle + " - " + siteName,
		"Content":      template.HTML(`<div class="not-found"><h1>` + ui.NotFoundHeading + `</h1><p>` + ui.NotFoundTitle + `</p><p>` + notFoundMsg + `</p><p><a href="/">` + ui.NotFoundLinkText + `</a></p></div>`),
		"TOC":          []TocItem{},
		"Nav":          nav,
		"FilePath":     "",
		"PagePath":     pagePath,
		"Breadcrumbs":  []Breadcrumb{},
		"LastModified": "",
		"T":            ui,
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(404)
	if err := tmpl.ExecuteTemplate(w, "page.html", data); err != nil {
		if !isConnectionClosed(err) {
			log.Printf("template error: %v", err)
		}
	}
}

func pageHandler(w http.ResponseWriter, r *http.Request) {
	pagePath := strings.TrimPrefix(r.URL.Path, "/")
	if pagePath == "" {
		pagePath = "index"
	}
	pagePath = strings.TrimSuffix(pagePath, "/")

	// Serve non-.md files directly (images, etc.)
	rawPath := filepath.Join(docsDir, pagePath)
	absRaw, _ := filepath.Abs(rawPath)
	if strings.HasPrefix(absRaw, docsAbs+string(os.PathSeparator)) {
		if info, err := os.Stat(rawPath); err == nil && !info.IsDir() {
			ext := strings.ToLower(filepath.Ext(rawPath))
			if ext != ".md" {
				http.ServeFile(w, r, rawPath)
				return
			}
		}
	}

	// Try exact .md file, then directory index
	mdPath := filepath.Join(docsDir, pagePath+".md")
	if _, err := os.Stat(mdPath); err != nil {
		mdPath = filepath.Join(docsDir, pagePath, "index.md")
		if _, err := os.Stat(mdPath); err != nil {
			render404(w, r, pagePath)
			return
		}
	}

	content, err := os.ReadFile(mdPath)
	if err != nil {
		http.Error(w, "Failed to read file", 500)
		return
	}

	htmlContent := renderMarkdown(string(content))
	toc := extractTOC(htmlContent)
	nav := buildNav()

	rel, _ := filepath.Rel(docsDir, mdPath)
	filePath := rel

	// Extract page title from first heading
	pageTitle := siteName
	if len(toc) > 0 {
		pageTitle = toc[0].Title + " - " + siteName
	}

	// Breadcrumbs
	breadcrumbs := buildBreadcrumbs(pagePath)

	// Last modified
	var lastModified string
	if info, err := os.Stat(mdPath); err == nil {
		lastModified = info.ModTime().Format("2006-01-02 15:04")
	}

	data := map[string]any{
		"SiteName":     siteName,
		"PageTitle":    pageTitle,
		"Content":      template.HTML(htmlContent),
		"TOC":          toc,
		"Nav":          nav,
		"FilePath":     filePath,
		"PagePath":     pagePath,
		"Breadcrumbs":  breadcrumbs,
		"LastModified": lastModified,
		"T":            getUIStrings(r),
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := tmpl.ExecuteTemplate(w, "page.html", data); err != nil {
		// Don't call http.Error here — headers are already sent by template output.
		// broken pipe errors are normal (client disconnected) and can be ignored.
		if !isConnectionClosed(err) {
			log.Printf("template error: %v", err)
		}
	}
}

// ── Content API ──

func getContentHandler(w http.ResponseWriter, r *http.Request) {
	fp := safeDocPath(r.URL.Query().Get("path"))
	if fp == "" {
		jsonResp(w, 400, map[string]string{"error": "invalid path"})
		return
	}
	fullPath := filepath.Join(docsDir, fp)
	data, err := os.ReadFile(fullPath)
	if err != nil {
		jsonResp(w, 404, map[string]string{"error": "file not found"})
		return
	}
	jsonResp(w, 200, map[string]string{"content": string(data)})
}

func saveContentHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Path    string `json:"path"`
		Content string `json:"content"`
	}
	if err := decodeJSON(r, &req); err != nil {
		jsonResp(w, 400, map[string]string{"error": "invalid request body"})
		return
	}
	if safeFilepath(req.Path) == "" {
		jsonResp(w, 400, map[string]string{"error": "invalid path"})
		return
	}
	fileMu.Lock()
	defer fileMu.Unlock()
	fullPath := filepath.Join(docsDir, req.Path)
	if err := os.WriteFile(fullPath, []byte(req.Content), 0644); err != nil {
		jsonResp(w, 500, map[string]string{"error": err.Error()})
		return
	}
	jsonResp(w, 200, map[string]any{"success": true})
}

func newPageHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Path string `json:"path"`
	}
	if err := decodeJSON(r, &req); err != nil {
		jsonResp(w, 400, map[string]string{"error": "invalid request body"})
		return
	}

	// Directory-only creation: path ends with /
	if strings.HasSuffix(req.Path, "/") {
		dirPath := strings.TrimSuffix(req.Path, "/")
		if safeDocPath(dirPath+"/dummy") == "" {
			jsonResp(w, 400, map[string]string{"error": "invalid path"})
			return
		}
		fileMu.Lock()
		defer fileMu.Unlock()
		fullDir := filepath.Join(docsDir, dirPath)
		if _, err := os.Stat(fullDir); err == nil {
			jsonResp(w, 409, map[string]string{"error": "directory already exists"})
			return
		}
		os.MkdirAll(fullDir, 0755)
		// Create index.md
		indexPath := filepath.Join(fullDir, "index.md")
		title := filepath.Base(dirPath)
		os.WriteFile(indexPath, []byte(fmt.Sprintf("# %s\n\n", title)), 0644)
		jsonResp(w, 200, map[string]any{"success": true, "page_path": dirPath})
		return
	}

	if !strings.HasSuffix(req.Path, ".md") {
		req.Path += ".md"
	}
	if safeDocPath(req.Path) == "" {
		jsonResp(w, 400, map[string]string{"error": "invalid path"})
		return
	}
	fileMu.Lock()
	defer fileMu.Unlock()
	fullPath := filepath.Join(docsDir, req.Path)
	if _, err := os.Stat(fullPath); err == nil {
		jsonResp(w, 409, map[string]string{"error": "file already exists"})
		return
	}
	// Create parent directories and index.md for each new one
	createDirsWithIndex(filepath.Dir(fullPath))
	title := strings.TrimSuffix(filepath.Base(req.Path), ".md")
	content := fmt.Sprintf("# %s\n\n", title)
	if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
		jsonResp(w, 500, map[string]string{"error": err.Error()})
		return
	}
	pagePath := strings.TrimSuffix(req.Path, ".md")
	// Add to nav order
	parentDir := filepath.Dir(pagePath)
	if parentDir == "." {
		parentDir = ""
	}
	cfg := loadNavConfig()
	if _, ok := cfg.Order[parentDir]; ok {
		cfg.Order[parentDir] = append(cfg.Order[parentDir], pagePath)
		saveNavConfig(cfg)
	}
	jsonResp(w, 200, map[string]any{"success": true, "page_path": pagePath})
}

func createDirsWithIndex(dir string) {
	// Walk from docsDir down to dir, creating index.md in each new directory
	dirAbs, _ := filepath.Abs(dir)
	if !strings.HasPrefix(dirAbs, docsAbs) {
		return
	}
	rel, _ := filepath.Rel(docsAbs, dirAbs)
	if rel == "." || rel == "" {
		return
	}
	parts := strings.Split(rel, string(os.PathSeparator))
	currentDir := docsAbs
	for _, part := range parts {
		currentDir = filepath.Join(currentDir, part)
		if _, err := os.Stat(currentDir); err != nil {
			// New directory - create it and index.md
			os.MkdirAll(currentDir, 0755)
			indexPath := filepath.Join(currentDir, "index.md")
			if _, err := os.Stat(indexPath); err != nil {
				os.WriteFile(indexPath, []byte(fmt.Sprintf("# %s\n\n", part)), 0644)
			}
		}
	}
}

func renamePageHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		OldPath string `json:"old_path"`
		NewPath string `json:"new_path"`
	}
	if err := decodeJSON(r, &req); err != nil {
		jsonResp(w, 400, map[string]string{"error": "invalid request body"})
		return
	}
	if safeDocPath(req.OldPath) == "" || safeDocPath(req.NewPath) == "" {
		jsonResp(w, 400, map[string]string{"error": "invalid path"})
		return
	}
	fileMu.Lock()
	defer fileMu.Unlock()
	oldFull := filepath.Join(docsDir, req.OldPath)
	newFull := filepath.Join(docsDir, req.NewPath)
	os.MkdirAll(filepath.Dir(newFull), 0755)
	if err := os.Rename(oldFull, newFull); err != nil {
		jsonResp(w, 500, map[string]string{"error": err.Error()})
		return
	}
	// Update _nav.json order
	oldKey := strings.TrimSuffix(req.OldPath, ".md")
	newKey := strings.TrimSuffix(req.NewPath, ".md")
	cfg := loadNavConfig()
	changed := false
	for parent, children := range cfg.Order {
		for i, child := range children {
			if child == oldKey {
				cfg.Order[parent][i] = newKey
				changed = true
			}
		}
	}
	// If parent directory changed, move between groups
	oldParent := filepath.Dir(oldKey)
	newParent := filepath.Dir(newKey)
	if oldParent == "." {
		oldParent = ""
	}
	if newParent == "." {
		newParent = ""
	}
	if oldParent != newParent {
		// Remove from old parent
		if children, ok := cfg.Order[oldParent]; ok {
			filtered := []string{}
			for _, child := range children {
				if child != newKey {
					filtered = append(filtered, child)
				}
			}
			cfg.Order[oldParent] = filtered
			changed = true
		}
		// Add to new parent
		cfg.Order[newParent] = append(cfg.Order[newParent], newKey)
		changed = true
	}
	if changed {
		saveNavConfig(cfg)
	}
	// Clean up empty parent directory
	cleanEmptyDir(filepath.Dir(oldFull))
	cleanNavOrder()
	jsonResp(w, 200, map[string]any{"success": true})
}

func deletePageHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Path string `json:"path"`
	}
	if err := decodeJSON(r, &req); err != nil {
		jsonResp(w, 400, map[string]string{"error": "invalid request body"})
		return
	}
	if safeDocPath(req.Path) == "" {
		jsonResp(w, 400, map[string]string{"error": "invalid path"})
		return
	}
	fileMu.Lock()
	defer fileMu.Unlock()
	fullPath := filepath.Join(docsDir, req.Path)
	if err := os.Remove(fullPath); err != nil {
		jsonResp(w, 500, map[string]string{"error": err.Error()})
		return
	}
	// Remove empty parent directory (only if it contains no .md files)
	parentDir := filepath.Dir(fullPath)
	cleanEmptyDir(parentDir)
	// Clean up nav order
	cleanNavOrder()
	jsonResp(w, 200, map[string]any{"success": true})
}

func cleanEmptyDir(dir string) {
	dirAbs, _ := filepath.Abs(dir)
	// Don't delete the docs root itself
	if dirAbs == docsAbs {
		return
	}
	// Don't delete if not under docs
	if !strings.HasPrefix(dirAbs, docsAbs+string(os.PathSeparator)) {
		return
	}
	// Skip special directories
	base := filepath.Base(dir)
	if base == "images" || base == "_nav.json" {
		return
	}
	// Check if directory has any .md files
	entries, err := os.ReadDir(dir)
	if err != nil {
		return
	}
	if len(entries) == 0 {
		os.Remove(dir)
		// Recursively clean parent
		cleanEmptyDir(filepath.Dir(dir))
	}
}

func cleanNavOrder() {
	cfg := loadNavConfig()
	changed := false
	newOrder := map[string][]string{}
	for parent, children := range cfg.Order {
		if children == nil {
			changed = true
			continue
		}
		filtered := []string{}
		for _, child := range children {
			dirPath := filepath.Join(docsDir, child)
			mdPath := filepath.Join(docsDir, child+".md")
			if _, err1 := os.Stat(dirPath); err1 == nil {
				filtered = append(filtered, child)
			} else if _, err2 := os.Stat(mdPath); err2 == nil {
				filtered = append(filtered, child)
			} else {
				changed = true
			}
		}
		if len(filtered) > 0 {
			newOrder[parent] = filtered
		} else {
			changed = true
		}
	}
	if changed {
		cfg.Order = newOrder
		saveNavConfig(cfg)
	}
}

// ── Render API ──

func renderHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Content string `json:"content"`
	}
	if err := decodeJSON(r, &req); err != nil {
		jsonResp(w, 400, map[string]string{"error": "invalid request body"})
		return
	}
	html := renderMarkdown(req.Content)
	jsonResp(w, 200, map[string]string{"html": html})
}

// ── Search ──

func searchHandler(w http.ResponseWriter, r *http.Request) {
	query := strings.ToLower(r.URL.Query().Get("q"))
	if query == "" {
		jsonResp(w, 200, map[string]any{"results": []any{}})
		return
	}

	type Result struct {
		Title   string `json:"title"`
		Path    string `json:"path"`
		Snippet string `json:"snippet"`
	}
	var results []Result

	filepath.WalkDir(docsDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() || !strings.HasSuffix(d.Name(), ".md") {
			return nil
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return nil
		}
		content := string(data)
		lower := strings.ToLower(content)
		rel, _ := filepath.Rel(docsDir, path)
		pagePath := strings.TrimSuffix(rel, ".md")
		if strings.HasSuffix(pagePath, "/index") {
			pagePath = strings.TrimSuffix(pagePath, "/index")
		}
		lowerPath := strings.ToLower(pagePath)

		contentMatch := strings.Contains(lower, query)
		pathMatch := strings.Contains(lowerPath, query)
		if !contentMatch && !pathMatch {
			return nil
		}

		// Extract title from first heading
		title := strings.TrimSuffix(filepath.Base(rel), ".md")
		if m := headingRegex.FindStringSubmatch(content); m != nil {
			title = m[2]
		}

		var snippet string
		if contentMatch {
			// Extract snippet around match
			idx := strings.Index(lower, query)
			runes := []rune(content)
			runeIdx := len([]rune(content[:idx]))
			runeStart := runeIdx - snippetContext
			if runeStart < 0 {
				runeStart = 0
			}
			runeEnd := runeIdx + len([]rune(query)) + snippetContext
			if runeEnd > len(runes) {
				runeEnd = len(runes)
			}
			snippet = strings.TrimSpace(string(runes[runeStart:runeEnd]))
			snippet = strings.ReplaceAll(snippet, "\n", " ")
		} else {
			snippet = pagePath
		}

		results = append(results, Result{Title: title, Path: pagePath, Snippet: snippet})
		return nil
	})

	jsonResp(w, 200, map[string]any{"results": results})
}

// ── Backup API ──

func backupHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Filepath string `json:"filepath"`
	}
	if err := decodeJSON(r, &req); err != nil {
		jsonResp(w, 400, map[string]string{"error": "invalid request body"})
		return
	}
	fp := safeFilepath(req.Filepath)
	if fp == "" {
		jsonResp(w, 400, map[string]string{"error": "invalid filepath"})
		return
	}
	src := filepath.Join(docsDir, fp)
	if _, err := os.Stat(src); err != nil {
		jsonResp(w, 404, map[string]string{"error": "file not found"})
		return
	}
	bdir := getBackupDir(fp)
	os.MkdirAll(bdir, 0755)
	ts := time.Now().Format("20060102_150405")
	dst := filepath.Join(bdir, ts+".md")
	if err := copyFile(src, dst); err != nil {
		jsonResp(w, 500, map[string]string{"error": "backup failed: " + err.Error()})
		return
	}
	entries, _ := filepath.Glob(filepath.Join(bdir, "*.md"))
	sort.Strings(entries)
	for len(entries) > maxBackups {
		os.Remove(entries[0])
		entries = entries[1:]
	}
	jsonResp(w, 200, map[string]any{"success": true, "backup": ts})
}

func listBackupsHandler(w http.ResponseWriter, r *http.Request) {
	fp := safeFilepath(r.URL.Query().Get("filepath"))
	if fp == "" {
		jsonResp(w, 400, map[string]string{"error": "invalid filepath"})
		return
	}
	bdir := getBackupDir(fp)
	entries, _ := filepath.Glob(filepath.Join(bdir, "*.md"))
	sort.Sort(sort.Reverse(sort.StringSlice(entries)))
	type backup struct {
		Timestamp string `json:"timestamp"`
		Datetime  string `json:"datetime"`
	}
	result := []backup{}
	for _, e := range entries {
		ts := strings.TrimSuffix(filepath.Base(e), ".md")
		t, err := time.Parse("20060102_150405", ts)
		if err != nil {
			continue
		}
		result = append(result, backup{Timestamp: ts, Datetime: t.Format("2006-01-02 15:04:05")})
	}
	jsonResp(w, 200, map[string]any{"backups": result})
}

func getBackupHandler(w http.ResponseWriter, r *http.Request) {
	fp := safeFilepath(r.URL.Query().Get("filepath"))
	ts := r.URL.Query().Get("timestamp")
	if fp == "" || !tsRegex.MatchString(ts) {
		jsonResp(w, 400, map[string]string{"error": "invalid filepath or timestamp"})
		return
	}
	data, err := os.ReadFile(filepath.Join(getBackupDir(fp), ts+".md"))
	if err != nil {
		jsonResp(w, 404, map[string]string{"error": "backup not found"})
		return
	}
	jsonResp(w, 200, map[string]string{"content": string(data)})
}

func restoreHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Filepath  string `json:"filepath"`
		Timestamp string `json:"timestamp"`
	}
	if err := decodeJSON(r, &req); err != nil {
		jsonResp(w, 400, map[string]string{"error": "invalid request body"})
		return
	}
	fp := safeFilepath(req.Filepath)
	if fp == "" || !tsRegex.MatchString(req.Timestamp) {
		jsonResp(w, 400, map[string]string{"error": "invalid filepath or timestamp"})
		return
	}
	bdir := getBackupDir(fp)
	src := filepath.Join(bdir, req.Timestamp+".md")
	if _, err := os.Stat(src); err != nil {
		jsonResp(w, 404, map[string]string{"error": "backup not found"})
		return
	}
	fileMu.Lock()
	defer fileMu.Unlock()
	dst := filepath.Join(docsDir, fp)
	ts := time.Now().Format("20060102_150405")
	copyFile(dst, filepath.Join(bdir, ts+".md")) // best-effort pre-restore backup
	if err := copyFile(src, dst); err != nil {
		jsonResp(w, 500, map[string]string{"error": "restore failed: " + err.Error()})
		return
	}
	jsonResp(w, 200, map[string]any{"success": true})
}

func deleteBackupHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Filepath  string `json:"filepath"`
		Timestamp string `json:"timestamp"`
	}
	if err := decodeJSON(r, &req); err != nil {
		jsonResp(w, 400, map[string]string{"error": "invalid request body"})
		return
	}
	fp := safeFilepath(req.Filepath)
	if fp == "" || !tsRegex.MatchString(req.Timestamp) {
		jsonResp(w, 400, map[string]string{"error": "invalid filepath or timestamp"})
		return
	}
	src := filepath.Join(getBackupDir(fp), req.Timestamp+".md")
	if _, err := os.Stat(src); err != nil {
		jsonResp(w, 404, map[string]string{"error": "backup not found"})
		return
	}
	os.Remove(src)
	jsonResp(w, 200, map[string]any{"success": true})
}

func deleteAllBackupsHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Filepath string `json:"filepath"`
	}
	if err := decodeJSON(r, &req); err != nil {
		jsonResp(w, 400, map[string]string{"error": "invalid request body"})
		return
	}
	fp := safeFilepath(req.Filepath)
	if fp == "" {
		jsonResp(w, 400, map[string]string{"error": "invalid filepath"})
		return
	}
	bdir := getBackupDir(fp)
	entries, _ := filepath.Glob(filepath.Join(bdir, "*.md"))
	for _, e := range entries {
		os.Remove(e)
	}
	jsonResp(w, 200, map[string]any{"success": true})
}

// ── WebSocket (live reload) ──

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	wsMu.Lock()
	wsClients[conn] = true
	wsMu.Unlock()

	defer func() {
		wsMu.Lock()
		delete(wsClients, conn)
		wsMu.Unlock()
		conn.Close()
	}()

	// Keep connection alive
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

func broadcastReload() {
	wsMu.Lock()
	defer wsMu.Unlock()
	msg := []byte(`{"action":"reload"}`)
	for conn := range wsClients {
		if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			conn.Close()
			delete(wsClients, conn)
		}
	}
}

func watchDocs() {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Printf("fsnotify error: %v", err)
		return
	}
	defer watcher.Close()

	// Watch docs directory recursively
	filepath.WalkDir(docsDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			watcher.Add(path)
		}
		return nil
	})

	var debounce *time.Timer
	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				return
			}
			if event.Has(fsnotify.Write) || event.Has(fsnotify.Create) || event.Has(fsnotify.Remove) {
				// Watch new directories
				if event.Has(fsnotify.Create) {
					if info, err := os.Stat(event.Name); err == nil && info.IsDir() {
						watcher.Add(event.Name)
					}
				}
				// Debounce reload
				if debounce != nil {
					debounce.Stop()
				}
				debounce = time.AfterFunc(watchDebounce, broadcastReload)
			}
		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			log.Printf("watcher error: %v", err)
		}
	}
}

// ── Helpers ──

// isConnectionClosed checks if an error is caused by the client disconnecting
func isConnectionClosed(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "broken pipe") ||
		strings.Contains(msg, "connection reset") ||
		strings.Contains(msg, "protocol wrong type")
}

func jsonResp(w http.ResponseWriter, code int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(data)
}

func methodGuard(method string, handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != method {
			jsonResp(w, 405, map[string]string{"error": "method not allowed"})
			return
		}
		handler(w, r)
	}
}

// ── Nav config API ──

type NavSaveRequest struct {
	Renames map[string]string   `json:"renames"` // old key -> new base name
	Moves   map[string]string   `json:"moves"`   // old key -> new parent key
	Order   map[string][]string `json:"order"`
}

func navConfigHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		cfg := loadNavConfig()
		jsonResp(w, 200, cfg)
	} else if r.Method == http.MethodPost {
		var req NavSaveRequest
		if err := decodeJSON(r, &req); err != nil {
			jsonResp(w, 400, map[string]string{"error": "invalid request body"})
			return
		}

		fileMu.Lock()
		defer fileMu.Unlock()

		keyMap := map[string]string{} // oldKey -> newKey

		// Process moves first: move files/dirs to new parent
		if req.Moves != nil {
			for oldKey, newParent := range req.Moves {
				if oldKey == "" {
					continue
				}
				// Validate paths to prevent traversal
				if safeDocPath(oldKey) == "" {
					continue
				}
				if newParent != "" && safeDocPath(newParent) == "" {
					continue
				}
				baseName := filepath.Base(oldKey)

				// Try as directory first
				oldPath := filepath.Join(docsDir, oldKey)
				newParentPath := docsDir
				if newParent != "" {
					newParentPath = filepath.Join(docsDir, newParent)
				}
				newPath := filepath.Join(newParentPath, baseName)

				if info, err := os.Stat(oldPath); err == nil && info.IsDir() {
					if oldPath != newPath {
						os.MkdirAll(newParentPath, 0755)
						if err := os.Rename(oldPath, newPath); err != nil {
							log.Printf("move dir error: %v", err)
							continue
						}
						newKey := baseName
						if newParent != "" {
							newKey = newParent + "/" + baseName
						}
						keyMap[oldKey] = newKey
						// Clean up empty parent
						cleanEmptyDir(filepath.Dir(oldPath))
					}
				} else {
					// Try as .md file
					oldFilePath := oldPath + ".md"
					newFilePath := newPath + ".md"
					if _, err := os.Stat(oldFilePath); err == nil && oldFilePath != newFilePath {
						os.MkdirAll(newParentPath, 0755)
						if err := os.Rename(oldFilePath, newFilePath); err != nil {
							log.Printf("move file error: %v", err)
							continue
						}
						newKey := baseName
						if newParent != "" {
							newKey = newParent + "/" + baseName
						}
						keyMap[oldKey] = newKey
						// Clean up empty parent
						cleanEmptyDir(filepath.Dir(oldFilePath))
					}
				}
			}
		}

		// Process renames: map old keys to new keys
		if req.Renames != nil {
			// Sort by path depth descending so children are renamed before parents
			type renameEntry struct {
				oldKey  string
				newName string
			}
			var entries []renameEntry
			for oldKey, newName := range req.Renames {
				if newName != "" && oldKey != "" {
					// Validate oldKey path and newName (must be a simple name, no path separators)
					if safeDocPath(oldKey) == "" {
						continue
					}
					if strings.ContainsAny(newName, "/\\..") || strings.Contains(newName, "..") {
						continue
					}
					entries = append(entries, renameEntry{oldKey, newName})
				}
			}
			sort.Slice(entries, func(i, j int) bool {
				return strings.Count(entries[i].oldKey, "/") > strings.Count(entries[j].oldKey, "/")
			})

			for _, e := range entries {
				oldKey := e.oldKey
				newName := e.newName

				// If item was moved, use the new key
				actualKey := oldKey
				if mapped, ok := keyMap[oldKey]; ok {
					actualKey = mapped
				}

				// Check if it's a directory
				oldDirPath := filepath.Join(docsDir, actualKey)
				if info, err := os.Stat(oldDirPath); err == nil && info.IsDir() {
					// Rename directory
					parentDir := filepath.Dir(oldDirPath)
					newDirPath := filepath.Join(parentDir, newName)
					if oldDirPath != newDirPath {
						if err := os.Rename(oldDirPath, newDirPath); err != nil {
							log.Printf("rename dir error: %v", err)
							continue
						}
						newKey := filepath.Join(filepath.Dir(actualKey), newName)
						if filepath.Dir(actualKey) == "." {
							newKey = newName
						}
						keyMap[oldKey] = newKey
						// Update child keys
						for oKey := range req.Renames {
							if strings.HasPrefix(oKey, oldKey+"/") {
								suffix := oKey[len(oldKey):]
								keyMap[oKey] = newKey + suffix
							}
						}
					}
				} else {
					// Rename .md file
					oldFilePath := filepath.Join(docsDir, actualKey+".md")
					if _, err := os.Stat(oldFilePath); err == nil {
						parentDir := filepath.Dir(oldFilePath)
						newFilePath := filepath.Join(parentDir, newName+".md")
						if oldFilePath != newFilePath {
							if err := os.Rename(oldFilePath, newFilePath); err != nil {
								log.Printf("rename file error: %v", err)
								continue
							}
							newKey := filepath.Join(filepath.Dir(actualKey), newName)
							if filepath.Dir(actualKey) == "." {
								newKey = newName
							}
							keyMap[oldKey] = newKey
						}
					}
				}
			}
		}

		// Update order keys based on renames
		newOrder := map[string][]string{}
		if req.Order != nil {
			for parentKey, children := range req.Order {
				newParent := parentKey
				if mapped, ok := keyMap[parentKey]; ok {
					newParent = mapped
				}
				var newChildren []string
				for _, child := range children {
					if mapped, ok := keyMap[child]; ok {
						newChildren = append(newChildren, mapped)
					} else {
						newChildren = append(newChildren, child)
					}
				}
				newOrder[newParent] = newChildren
			}
		}

		cfg := NavConfig{Order: newOrder}
		if err := saveNavConfig(cfg); err != nil {
			jsonResp(w, 500, map[string]string{"error": err.Error()})
			return
		}
		jsonResp(w, 200, map[string]any{"success": true, "renames": keyMap})
	} else {
		jsonResp(w, 405, map[string]string{"error": "method not allowed"})
	}
}

// ── Image upload ──

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		jsonResp(w, 400, map[string]string{"error": "file too large"})
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		jsonResp(w, 400, map[string]string{"error": "file required"})
		return
	}
	defer file.Close()

	// Validate extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedImageExts[ext] {
		jsonResp(w, 400, map[string]string{"error": "unsupported file type"})
		return
	}

	// Read file content for validation
	fileData, err := io.ReadAll(file)
	if err != nil {
		jsonResp(w, 500, map[string]string{"error": "failed to read file"})
		return
	}

	// Validate image magic bytes
	if !validateImageContent(fileData) {
		jsonResp(w, 400, map[string]string{"error": "file content does not match a supported image format"})
		return
	}

	// Save to docs/images/
	imgDir := filepath.Join(docsDir, "images")
	os.MkdirAll(imgDir, 0755)

	// Generate unique filename
	ts := time.Now().Format("20060102_150405")
	safeName := safeNameRegex.ReplaceAllString(header.Filename, "_")
	filename := ts + "_" + safeName
	dstPath := filepath.Join(imgDir, filename)

	if err := os.WriteFile(dstPath, fileData, 0644); err != nil {
		jsonResp(w, 500, map[string]string{"error": err.Error()})
		return
	}

	mdLink := fmt.Sprintf("![%s](/images/%s)", strings.TrimSuffix(header.Filename, ext), filename)
	jsonResp(w, 200, map[string]any{
		"success":  true,
		"path":     "/images/" + filename,
		"markdown": mdLink,
	})
}

// ── Main ──

func main() {
	os.MkdirAll(docsDir, 0755)
	os.MkdirAll(backupDir, 0755)

	// Pre-compute absolute docs path for security checks
	var absErr error
	docsAbs, absErr = filepath.Abs(docsDir)
	if absErr != nil {
		log.Fatal("failed to resolve docs dir:", absErr)
	}

	// Create default index.md if not exists
	indexPath := filepath.Join(docsDir, "index.md")
	if _, err := os.Stat(indexPath); err != nil {
		os.WriteFile(indexPath, []byte("# Welcome\n\nYour documentation server is ready.\n"), 0644)
	}

	// Clean stale nav order entries
	cleanNavOrder()

	// Initialize markdown renderer
	initMarkdownRenderer()

	// Parse templates
	var err error
	funcMap := template.FuncMap{
		"minus":    func(a, b int) int { return a - b },
		"multiply": func(a, b int) int { return a * b },
	}
	tmpl, err = template.New("").Funcs(funcMap).ParseFS(templateFS, "templates/*.html")
	if err != nil {
		log.Fatal("template parse error:", err)
	}

	// File watcher
	go watchDocs()

	// Create router
	mux := http.NewServeMux()

	// Static files
	staticSub, _ := fs.Sub(staticFS, "static")
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.FS(staticSub))))

	// WebSocket
	mux.HandleFunc("/ws", wsHandler)

	// Content API
	mux.HandleFunc("/api/content", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			getContentHandler(w, r)
		} else if r.Method == http.MethodPost {
			saveContentHandler(w, r)
		} else {
			jsonResp(w, 405, map[string]string{"error": "method not allowed"})
		}
	})
	mux.HandleFunc("/api/new", methodGuard(http.MethodPost, newPageHandler))
	mux.HandleFunc("/api/rename", methodGuard(http.MethodPost, renamePageHandler))
	mux.HandleFunc("/api/delete", methodGuard(http.MethodPost, deletePageHandler))
	mux.HandleFunc("/api/search", methodGuard(http.MethodGet, searchHandler))
	mux.HandleFunc("/api/render", methodGuard(http.MethodPost, renderHandler))
	mux.HandleFunc("/api/upload", methodGuard(http.MethodPost, uploadHandler))
	mux.HandleFunc("/api/nav", navConfigHandler)
	mux.HandleFunc("/api/lang", func(w http.ResponseWriter, r *http.Request) {
		lang := r.URL.Query().Get("lang")
		if lang != "ja" && lang != "en" {
			jsonResp(w, 400, map[string]string{"error": "invalid language"})
			return
		}
		http.SetCookie(w, &http.Cookie{
			Name: "gomdshelf_lang", Value: lang,
			Path: "/", MaxAge: 365 * 24 * 3600, SameSite: http.SameSiteLaxMode,
		})
		jsonResp(w, 200, map[string]any{"success": true, "lang": lang})
	})

	// Backup API
	mux.HandleFunc("/api/backup", methodGuard(http.MethodPost, backupHandler))
	mux.HandleFunc("/api/backups", methodGuard(http.MethodGet, listBackupsHandler))
	mux.HandleFunc("/api/backups/content", methodGuard(http.MethodGet, getBackupHandler))
	mux.HandleFunc("/api/restore", methodGuard(http.MethodPost, restoreHandler))
	mux.HandleFunc("/api/backups/delete", methodGuard(http.MethodPost, deleteBackupHandler))
	mux.HandleFunc("/api/backups/delete-all", methodGuard(http.MethodPost, deleteAllBackupsHandler))

	// Page handler (catch-all)
	mux.HandleFunc("/", pageHandler)

	// Wrap with auth middleware
	handler := authMiddleware(mux)

	// Create server with timeouts
	srv := &http.Server{
		Addr:         listenAddr,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGTERM)

	go func() {
		fmt.Printf("gomdshelf %s listening on %s\n", version, listenAddr)
		if authToken != "" {
			fmt.Println("Basic authentication enabled")
		}
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("server error:", err)
		}
	}()

	<-done
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Close WebSocket connections
	wsMu.Lock()
	for conn := range wsClients {
		conn.Close()
		delete(wsClients, conn)
	}
	wsMu.Unlock()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}
	log.Println("Server stopped")
}
