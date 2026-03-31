(function () {
  const filePath = window.__filePath;
  const pagePath = window.__pagePath;

  /* ── SVG Icons ── */
  const ICONS = {
    edit: '<svg width="12" height="12" viewBox="1 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
    link: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    check:
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
    grip: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>',
    gear: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>',
    arrowUp:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
    chevronDown:
      '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    chevronRight:
      '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
  };

  /* ── i18n ── */
  const LANG = window.__lang || "en";
  const I18N = {
    en: {
      editSection: "Edit this section",
      sectionNotFound: "Section not found",
      save: "Save",
      cancel: "Cancel",
      draftFound: "A previous draft was found. Restore it?",
      discardConfirm: "Discard changes?",
      newPagePrompt: "New page path (e.g. server/setup):",
      renamePrompt: "Enter new filename:",
      renameFailed: "Rename failed: ",
      deleteFailed: "Delete failed: ",
      createFailed: "Create failed: ",
      copyPrompt: "Copy destination path:",
      copySuffix: " copy",
      copyFailed: "Copy failed: ",
      deleteConfirm: " — delete this page?",
      loading: "Loading...",
      noHistory: "No history",
      preview: "Preview",
      restore: "Restore",
      delete: "Delete",
      restoreConfirm: " — restore to this version?",
      restored: "Restored",
      restoreFailed: "Restore failed",
      deleteHistoryConfirm: " — delete this history entry?",
      deleteHistoryFailed: "Delete failed",
      deleteAll: "Delete all",
      deleteAllConfirm: "Delete all history for this page?",
      diffTitle: "Diff (left: history {0} / right: current)",
      diffHistory: "History",
      diffCurrent: "Current",
      diffTooLarge: "File too large to show diff.",
      noResults: "No results",
      resultsCount: "{0} results",
      fullDraftFound:
        "Unsaved draft found for full page edit.\n\n[OK] Resume editing\n[Cancel] Discard draft",
      sectionDraftFound:
        'Unsaved draft found for section \"{0}\".\n\n[OK] Resume editing\n[Cancel] Discard draft',
      imageDrop: "Drop image here",
      uploadFailed: "Upload failed: ",
      uploadError: "Upload error: ",
      backToTop: "Back to top",
      copyLink: "Copy link",
      dragToMove: "Drag to move",
      justNow: "just now",
      minAgo: "min ago",
      hourAgo: "hr ago",
      dayAgo: "d ago",
      monthAgo: "mo ago",
      yearAgo: "yr ago",
    },
    ja: {
      editSection: "このセクションを編集",
      sectionNotFound: "セクションが見つかりませんでした",
      save: "保存",
      cancel: "キャンセル",
      draftFound: "前回の下書きが見つかりました。復元しますか？",
      discardConfirm: "編集内容を破棄しますか？",
      newPagePrompt: "新しいページのパス（例: server/setup）:",
      renamePrompt: "新しいファイル名を入力してください:",
      renameFailed: "リネームに失敗しました: ",
      deleteFailed: "削除に失敗しました: ",
      createFailed: "作成に失敗しました: ",
      copyPrompt: "コピー先のパス:",
      copySuffix: "のコピー",
      copyFailed: "コピーに失敗しました: ",
      deleteConfirm: " を削除しますか？",
      loading: "読み込み中...",
      noHistory: "履歴がありません",
      preview: "プレビュー",
      restore: "復元",
      delete: "削除",
      restoreConfirm: " の状態に復元しますか？",
      restored: "復元しました",
      restoreFailed: "復元に失敗しました",
      deleteHistoryConfirm: " の履歴を削除しますか？",
      deleteHistoryFailed: "削除に失敗しました",
      deleteAll: "全履歴を削除",
      deleteAllConfirm: "このページの全履歴を削除しますか？",
      diffTitle: "差分（左: 履歴 {0} / 右: 現在）",
      diffHistory: "履歴",
      diffCurrent: "現在",
      diffTooLarge: "ファイルが大きすぎるため差分を省略しました。",
      noResults: "結果がありません",
      resultsCount: "{0}件の結果",
      fullDraftFound:
        "ページ全体編集の保存されていない下書きがあります。\n\n[OK] 編集を続ける\n[キャンセル] 下書きを破棄",
      sectionDraftFound:
        "「{0}」セクションに保存されていない下書きがあります。\n\n[OK] 編集を続ける\n[キャンセル] 下書きを破棄",
      imageDrop: "画像をドロップ",
      uploadFailed: "アップロード失敗: ",
      uploadError: "アップロードエラー: ",
      backToTop: "トップへ戻る",
      copyLink: "リンクをコピー",
      dragToMove: "ドラッグで移動",
      justNow: "たった今",
      minAgo: "分前",
      hourAgo: "時間前",
      dayAgo: "日前",
      monthAgo: "ヶ月前",
      yearAgo: "年前",
    },
  };
  function t(key, ...args) {
    let s = (I18N[LANG] || I18N.en)[key] || I18N.en[key] || key;
    args.forEach((a, i) => {
      s = s.replace("{" + i + "}", a);
    });
    return s;
  }

  /* ── Config ── */
  const DEBOUNCE_SEARCH = 300; // ms before firing search query
  const DEBOUNCE_PREVIEW = 500; // ms before server-side preview render
  const WS_RECONNECT = 2000; // ms before WebSocket reconnect attempt
  const COPY_FEEDBACK = 1500; // ms to show "Copied!" feedback
  const NAV_SAVE_GUARD = 1500; // ms to suppress WS reload after nav save
  const BLUR_DELAY = 200; // ms before closing search dropdown on blur

  /* ── Draft (localStorage) ── */
  function getDraftKey(headingText) {
    return `draft:${filePath}:${headingText || "__full__"}`;
  }
  function saveDraft(headingText, content) {
    try {
      localStorage.setItem(getDraftKey(headingText), content);
    } catch (e) {}
  }
  function loadDraft(headingText) {
    try {
      return localStorage.getItem(getDraftKey(headingText));
    } catch (e) {
      return null;
    }
  }
  function clearDraft(headingText) {
    try {
      localStorage.removeItem(getDraftKey(headingText));
    } catch (e) {}
  }

  /* ── Auto markdown link on paste ── */
  function enableAutoLink(textarea) {
    textarea.addEventListener("paste", (e) => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start === end) return;
      const pasted = (e.clipboardData || window.clipboardData)
        .getData("text")
        .trim();
      if (!pasted.match(/^https?:\/\//)) return;
      e.preventDefault();
      const selected = textarea.value.substring(start, end);
      const mdLink = `[${selected}](${pasted})`;
      document.execCommand("insertText", false, mdLink);
      textarea.dispatchEvent(new Event("input"));
    });
  }

  /* ── Tab indent in textareas ── */
  function enableTabIndent(textarea) {
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        if (start === end && !e.shiftKey) {
          document.execCommand("insertText", false, "  ");
        } else {
          const val = textarea.value;
          const lineStart = val.lastIndexOf("\n", start - 1) + 1;
          const lineEnd = val.indexOf("\n", end);
          const blockEnd = lineEnd === -1 ? val.length : lineEnd;
          textarea.selectionStart = lineStart;
          textarea.selectionEnd = blockEnd;
          const block = val.substring(lineStart, blockEnd);
          let newBlock;
          if (e.shiftKey) {
            newBlock = block
              .split("\n")
              .map((l) => (l.startsWith("  ") ? l.substring(2) : l))
              .join("\n");
          } else {
            newBlock = block
              .split("\n")
              .map((l) => "  " + l)
              .join("\n");
          }
          document.execCommand("insertText", false, newBlock);
          textarea.selectionStart = lineStart;
          textarea.selectionEnd = lineStart + newBlock.length;
        }
        textarea.dispatchEvent(new Event("input"));
      }
    });
  }

  /* ── API helpers ── */
  async function api(path, opts) {
    const res = await fetch(path, opts);
    return await res.json();
  }
  async function apiPost(path, body) {
    return api(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  function getContent() {
    return api(`/api/content?path=${encodeURIComponent(filePath)}`);
  }
  function saveContent(content) {
    return apiPost("/api/content", { path: filePath, content });
  }
  function backupFile() {
    return apiPost("/api/backup", { filepath: filePath });
  }
  function listBackups() {
    return api(`/api/backups?filepath=${encodeURIComponent(filePath)}`);
  }
  function getBackup(ts) {
    return api(
      `/api/backups/content?filepath=${encodeURIComponent(filePath)}&timestamp=${ts}`,
    );
  }
  function restoreBackup(ts) {
    return apiPost("/api/restore", { filepath: filePath, timestamp: ts });
  }
  function deleteBackup(ts) {
    return apiPost("/api/backups/delete", {
      filepath: filePath,
      timestamp: ts,
    });
  }
  function deleteAllBackups() {
    return apiPost("/api/backups/delete-all", { filepath: filePath });
  }

  /* ── WebSocket (live reload) ── */
  function connectWS() {
    const ws = new WebSocket(
      `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws`,
    );
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.action === "reload" && !window.__editingMode) {
          location.reload();
        }
      } catch (err) {}
    };
    ws.onclose = () => setTimeout(connectWS, WS_RECONNECT);
  }
  connectWS();

  /* ── Markdown helpers ── */
  function splitSections(markdown) {
    const lines = markdown.split("\n");
    const sections = [];
    let current = null;
    let inCodeBlock = false;
    for (const line of lines) {
      if (line.match(/^```/)) inCodeBlock = !inCodeBlock;
      const match = !inCodeBlock && line.match(/^(#{1,6})\s+(.+)/);
      if (match) {
        if (current) sections.push(current);
        current = {
          heading: line,
          level: match[1].length,
          title: match[2],
          lines: [line],
        };
      } else {
        if (!current)
          current = { heading: null, level: 0, title: "", lines: [line] };
        else current.lines.push(line);
      }
    }
    if (current) sections.push(current);
    return sections;
  }

  function getHeadingText(el) {
    let text = "";
    el.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) text += n.textContent;
    });
    return text.trim();
  }

  /* ── Code copy buttons ── */
  function addCopyButtons() {
    document.querySelectorAll("#article-body pre").forEach((pre) => {
      if (pre.querySelector(".code-copy-btn")) return;
      if (pre.closest("pre") !== pre && pre.parentElement.closest("pre"))
        return;
      if (pre.parentElement.classList.contains("code-wrapper")) return;
      const wrapper = document.createElement("div");
      wrapper.className = "code-wrapper";
      pre.parentElement.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      if (pre.scrollWidth > pre.clientWidth) {
        wrapper.classList.add("has-overflow-right");
        pre.addEventListener("scroll", () => {
          wrapper.classList.toggle(
            "has-overflow-right",
            pre.scrollLeft + pre.clientWidth < pre.scrollWidth - 2,
          );
          wrapper.classList.toggle("has-overflow-left", pre.scrollLeft > 2);
        });
      }
      const code = pre.querySelector("code");
      const btn = document.createElement("button");
      btn.className = "code-copy-btn";
      btn.innerHTML = ICONS.copy + " Copy";
      btn.addEventListener("click", () => {
        const text = code ? code.textContent : pre.textContent;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.cssText = "position:fixed;opacity:0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        btn.innerHTML = ICONS.check + " Copied!";
        setTimeout(() => (btn.innerHTML = ICONS.copy + " Copy"), COPY_FEEDBACK);
      });
      wrapper.appendChild(btn);
    });
  }

  /* ── Section editing ── */
  function addSectionEditButtons() {
    const article = document.getElementById("article-body");
    if (!article) return;
    article.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
      const btn = document.createElement("button");
      btn.className = "section-edit-btn";
      btn.innerHTML = ICONS.edit;
      btn.title = t("editSection");
      btn.addEventListener("click", () => openSectionEdit(heading, btn));
      heading.appendChild(btn);
    });
  }

  async function openSectionEdit(heading, btn) {
    const res = await getContent();
    if (!res.content && res.content !== "") return;
    const fullMd = res.content;
    const sections = splitSections(fullMd);
    const headingText = getHeadingText(heading);
    const sectionIndex = sections.findIndex(
      (s) =>
        s.heading && s.heading.replace(/^#+\s+/, "").trim() === headingText,
    );
    if (sectionIndex === -1) {
      alert(t("sectionNotFound"));
      return;
    }

    const section = sections[sectionIndex];
    const sectionLevel = section.level;
    let endIndex = sectionIndex + 1;
    while (endIndex < sections.length) {
      if (
        sections[endIndex].heading &&
        sections[endIndex].level <= sectionLevel
      )
        break;
      endIndex++;
    }
    const sectionMd = sections
      .slice(sectionIndex, endIndex)
      .map((s) => s.lines.join("\n"))
      .join("\n");

    const existing = document.querySelector(".section-edit-area");
    if (existing) {
      closeSectionEdit(existing);
    }

    let nextEl = heading.nextElementSibling;
    while (nextEl) {
      const tag = nextEl.tagName ? nextEl.tagName.toLowerCase() : "";
      if (
        ["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag) &&
        parseInt(tag[1]) <= sectionLevel
      )
        break;
      if (!nextEl.classList.contains("section-edit-area")) {
        nextEl.setAttribute("data-section-hidden", "1");
        nextEl.style.display = "none";
      }
      nextEl = nextEl.nextElementSibling;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "section-edit-area";
    const buttons = document.createElement("div");
    buttons.className = "edit-buttons";
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-save";
    saveBtn.textContent = t("save");
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-cancel";
    cancelBtn.textContent = t("cancel");
    buttons.appendChild(saveBtn);
    buttons.appendChild(cancelBtn);

    const isMobile = window.innerWidth < 768;
    const row = document.createElement("div");
    row.className = "section-edit-row";
    if (isMobile) row.style.cssText = "flex-direction:column;height:70vh;";
    const textarea = document.createElement("textarea");
    if (isMobile) textarea.style.cssText = "width:100%;height:50%;";
    const preview = document.createElement("div");
    preview.className = "preview md-typeset";
    if (isMobile) preview.style.cssText = "width:100%;height:50%;";

    const autoOpen = btn.dataset.draftAutoOpen === "1";
    delete btn.dataset.draftAutoOpen;
    const draft = loadDraft(headingText);
    if (draft && draft !== sectionMd) {
      if (autoOpen) {
        textarea.value = draft;
        saveDraft(headingText, draft);
      } else if (confirm(t("draftFound"))) {
        textarea.value = draft;
      } else {
        textarea.value = sectionMd;
        clearDraft(headingText);
      }
    } else {
      textarea.value = sectionMd;
    }

    let previewTimer = null;
    const updatePreview = () => {
      if (window.marked) {
        preview.innerHTML = marked.parse(textarea.value);
        preview.querySelectorAll("a[href]").forEach((a) => {
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
        });
      }
      clearTimeout(previewTimer);
      previewTimer = setTimeout(async () => {
        try {
          const res = await apiPost("/api/render", { content: textarea.value });
          if (res.html) {
            preview.innerHTML = res.html;
            preview.querySelectorAll("pre").forEach((pre) => {
              pre.style.position = "relative";
            });
            preview.querySelectorAll("a[href]").forEach((a) => {
              a.setAttribute("target", "_blank");
              a.setAttribute("rel", "noopener noreferrer");
            });
          }
        } catch (e) {}
      }, DEBOUNCE_PREVIEW);
    };
    textarea.addEventListener("input", () => {
      updatePreview();
      saveDraft(headingText, textarea.value);
    });
    updatePreview();

    function syncScroll(source, target, isTextarea) {
      const sourceTop = source.scrollTop;
      const sourceHeight = source.scrollHeight - source.clientHeight;
      if (sourceHeight <= 0) return;
      if (isTextarea) {
        const lineHeight =
          parseFloat(getComputedStyle(source).lineHeight) || 18;
        const topLine = Math.floor(sourceTop / lineHeight);
        const lines = source.value
          .substring(
            0,
            source.value
              .split("\n")
              .slice(0, topLine + 1)
              .join("\n").length,
          )
          .split("\n");
        let lastHeading = null;
        for (const line of lines) {
          const m = line.match(/^(#{1,6})\s+(.+)/);
          if (m) lastHeading = m[2].trim();
        }
        if (lastHeading) {
          const headings = target.querySelectorAll("h1, h2, h3, h4, h5, h6");
          for (const h of headings) {
            if (h.textContent.trim() === lastHeading) {
              const offset = h.offsetTop - target.offsetTop;
              target.scrollTop = offset;
              return;
            }
          }
        }
      }
      const ratio = sourceTop / sourceHeight;
      target.scrollTop = ratio * (target.scrollHeight - target.clientHeight);
    }

    let syncLock = false;
    textarea.addEventListener("scroll", () => {
      if (syncLock) return;
      syncLock = true;
      syncScroll(textarea, preview, true);
      requestAnimationFrame(() => {
        syncLock = false;
      });
    });

    textarea.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveBtn.click();
      }
    });
    enableTabIndent(textarea);
    enableAutoLink(textarea);

    const beforeUnloadHandler = () => saveDraft(headingText, textarea.value);
    window.addEventListener("beforeunload", beforeUnloadHandler);

    saveBtn.addEventListener("click", async () => {
      await backupFile();
      const newSectionMd = textarea.value;
      const newSections = [...sections];
      newSections.splice(sectionIndex, endIndex - sectionIndex, {
        ...section,
        lines: newSectionMd.split("\n"),
      });
      const newFullMd = newSections.map((s) => s.lines.join("\n")).join("\n");
      await saveContent(newFullMd);
      window.__editingMode = false;
      clearDraft(headingText);
      window.removeEventListener("beforeunload", beforeUnloadHandler);
    });

    cancelBtn.addEventListener("click", () => {
      clearDraft(headingText);
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      closeSectionEdit(wrapper);
      btn.style.display = "";
    });

    btn.style.display = "none";
    row.appendChild(textarea);
    row.appendChild(preview);
    wrapper.appendChild(buttons);
    wrapper.appendChild(row);
    heading.insertAdjacentElement("afterend", wrapper);
    window.__editingMode = true;
    enableImageDrop(textarea);
    textarea.focus();
  }

  function closeSectionEdit(wrapper) {
    document.querySelectorAll("[data-section-hidden]").forEach((el) => {
      el.style.display = "";
      el.removeAttribute("data-section-hidden");
    });
    document
      .querySelectorAll(".section-edit-btn")
      .forEach((b) => (b.style.display = ""));
    window.__editingMode = false;
    wrapper.remove();
  }

  /* ── Full page editing ── */
  if (document.getElementById("btn-edit")) {
    const editArea = document.getElementById("full-edit-area");
    const editTextarea = document.getElementById("full-edit-textarea");
    const editPreview = document.getElementById("full-edit-preview");
    const articleBody = document.getElementById("article-body");

    let fullEditDirty = false;
    let fullPreviewTimer = null;
    const fullEditBeforeUnload = (e) => {
      if (fullEditDirty) {
        saveDraft("__full__", editTextarea.value);
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const updateFullPreview = () => {
      if (window.marked) {
        editPreview.innerHTML = marked.parse(editTextarea.value);
        editPreview.querySelectorAll("a[href]").forEach((a) => {
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
        });
      }
      clearTimeout(fullPreviewTimer);
      fullPreviewTimer = setTimeout(async () => {
        try {
          const res = await apiPost("/api/render", {
            content: editTextarea.value,
          });
          if (res.html) {
            editPreview.innerHTML = res.html;
            editPreview.querySelectorAll("a[href]").forEach((a) => {
              a.setAttribute("target", "_blank");
              a.setAttribute("rel", "noopener noreferrer");
            });
          }
        } catch (e) {}
      }, DEBOUNCE_PREVIEW);
    };

    document.getElementById("btn-edit").addEventListener("click", async () => {
      document
        .querySelectorAll(".section-edit-area")
        .forEach((el) => closeSectionEdit(el));
      const res = await getContent();
      const serverContent = res.content || "";
      const draft = loadDraft("__full__");
      if (draft && draft !== serverContent) {
        if (confirm(t("draftFound"))) {
          editTextarea.value = draft;
        } else {
          editTextarea.value = serverContent;
          clearDraft("__full__");
        }
      } else {
        editTextarea.value = serverContent;
      }
      editArea.style.display = "block";
      window.__editingMode = true;
      articleBody.style.display = "none";
      fullEditDirty = false;
      window.addEventListener("beforeunload", fullEditBeforeUnload);
      updateFullPreview();
      editTextarea.focus();
      enableImageDrop(editTextarea);
    });

    editTextarea.addEventListener("input", () => {
      fullEditDirty = true;
      updateFullPreview();
      saveDraft("__full__", editTextarea.value);
    });

    let fullSyncLock = false;
    editTextarea.addEventListener("scroll", () => {
      if (fullSyncLock) return;
      fullSyncLock = true;
      const lineHeight =
        parseFloat(getComputedStyle(editTextarea).lineHeight) || 18;
      const topLine = Math.floor(editTextarea.scrollTop / lineHeight);
      const lines = editTextarea.value.split("\n").slice(0, topLine + 1);
      let lastHeading = null;
      for (const line of lines) {
        const m = line.match(/^(#{1,6})\s+(.+)/);
        if (m) lastHeading = m[2].trim();
      }
      if (lastHeading) {
        const headings = editPreview.querySelectorAll("h1, h2, h3, h4, h5, h6");
        for (const h of headings) {
          if (h.textContent.trim() === lastHeading) {
            editPreview.scrollTop = h.offsetTop - editPreview.offsetTop;
            requestAnimationFrame(() => {
              fullSyncLock = false;
            });
            return;
          }
        }
      }
      const ratio =
        editTextarea.scrollTop /
        (editTextarea.scrollHeight - editTextarea.clientHeight || 1);
      editPreview.scrollTop =
        ratio * (editPreview.scrollHeight - editPreview.clientHeight);
      requestAnimationFrame(() => {
        fullSyncLock = false;
      });
    });

    editTextarea.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        document.getElementById("btn-save").click();
      }
    });
    enableTabIndent(editTextarea);
    enableAutoLink(editTextarea);

    document.getElementById("btn-save").addEventListener("click", async () => {
      await backupFile();
      await saveContent(editTextarea.value);
      fullEditDirty = false;
      window.__editingMode = false;
      window.removeEventListener("beforeunload", fullEditBeforeUnload);
      clearDraft("__full__");
      editArea.style.display = "none";
      articleBody.style.display = "";
    });

    document.getElementById("btn-cancel").addEventListener("click", () => {
      if (fullEditDirty && !confirm(t("discardConfirm"))) return;
      fullEditDirty = false;
      window.__editingMode = false;
      window.removeEventListener("beforeunload", fullEditBeforeUnload);
      clearDraft("__full__");
      editArea.style.display = "none";
      articleBody.style.display = "";
    });

    /* ── More menu ── */
    const moreBtn = document.getElementById("btn-more");
    const dropdown = document.getElementById("more-dropdown");
    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.style.display =
        dropdown.style.display === "block" ? "none" : "block";
    });
    document.addEventListener("click", () => (dropdown.style.display = "none"));

    document
      .getElementById("btn-rename")
      .addEventListener("click", async () => {
        const currentName = filePath.replace(/\.md$/, "");
        const newName = prompt(t("renamePrompt"), currentName);
        if (!newName || newName === currentName) return;
        const oldPath = filePath.endsWith(".md") ? filePath : filePath + ".md";
        const newPath = newName.endsWith(".md") ? newName : newName + ".md";
        const res = await apiPost("/api/rename", {
          old_path: oldPath,
          new_path: newPath,
        });
        if (res.success) {
          const newPage = newName.replace(/\.md$/, "");
          location.href = "/" + newPage;
        } else {
          alert(t("renameFailed") + (res.error || ""));
        }
      });

    document
      .getElementById("btn-delete")
      .addEventListener("click", async () => {
        if (!confirm(filePath + t("deleteConfirm"))) return;
        const res = await apiPost("/api/delete", { path: filePath });
        if (res.success) {
          location.href = "/";
        } else {
          alert(t("deleteFailed") + (res.error || ""));
        }
      });

    document.getElementById("btn-copy").addEventListener("click", async () => {
      const currentPath = filePath.replace(/\.md$/, "");
      const defaultDest = currentPath + t("copySuffix");
      const dest = prompt(t("copyPrompt"), defaultDest);
      if (!dest) return;
      const res = await apiPost("/api/copy", {
        src_path: filePath,
        dest_path: dest,
      });
      if (res.success) {
        location.href = "/" + res.page_path;
      } else {
        alert(t("copyFailed") + (res.error || ""));
      }
    });

    /* ── New page ── */
    document.getElementById("btn-new").addEventListener("click", async () => {
      const currentDir = pagePath.includes("/")
        ? pagePath.substring(0, pagePath.lastIndexOf("/") + 1)
        : "";
      const name = prompt(t("newPagePrompt"), currentDir);
      if (!name) return;
      const res = await apiPost("/api/new", { path: name });
      if (res.success) {
        location.href = "/" + res.page_path;
      } else {
        alert(t("createFailed") + (res.error || ""));
      }
    });

    /* ── History ── */
    const historyPanel = document.getElementById("history-panel");
    document
      .getElementById("btn-history")
      .addEventListener("click", async (e) => {
        e.stopPropagation();
        if (historyPanel.style.display === "block") {
          historyPanel.style.display = "none";
          return;
        }
        historyPanel.innerHTML =
          '<div style="padding:12px;color:#888;">' + t("loading") + "</div>";
        historyPanel.style.display = "block";
        try {
          const data = await listBackups();
          if (!data.backups || data.backups.length === 0) {
            historyPanel.innerHTML =
              '<div style="padding:12px;color:#888;">' +
              t("noHistory") +
              "</div>";
            return;
          }
          historyPanel.innerHTML = "";
          data.backups.forEach((b) => {
            const row = document.createElement("div");
            row.className = "history-row";
            row.innerHTML = `<span class="datetime">${b.datetime}</span>`;
            const mkBtn = (text, cls, fn) => {
              const btn = document.createElement("button");
              btn.className = "btn " + cls;
              btn.textContent = text;
              btn.style.fontSize = "11px";
              btn.style.padding = "2px 8px";
              btn.addEventListener("click", fn);
              return btn;
            };
            row.appendChild(
              mkBtn(t("preview"), "btn-edit", async () => {
                const bdata = await getBackup(b.timestamp);
                const current = await getContent();
                const html = buildDiffHtml(
                  bdata.content || "",
                  current.content || "",
                  b.datetime,
                );
                const win = window.open("", "_blank");
                win.document.write(html);
                win.document.close();
              }),
            );
            row.appendChild(
              mkBtn(t("restore"), "btn-save", async () => {
                if (!confirm(b.datetime + t("restoreConfirm"))) return;
                const res = await restoreBackup(b.timestamp);
                if (res.success) {
                  alert(t("restored"));
                  location.reload();
                } else alert(t("restoreFailed"));
              }),
            );
            row.appendChild(
              mkBtn(t("delete"), "btn-cancel", async () => {
                if (!confirm(b.datetime + t("deleteHistoryConfirm"))) return;
                const res = await deleteBackup(b.timestamp);
                if (res.success) row.remove();
                else alert(t("deleteHistoryFailed"));
              }),
            );
            historyPanel.appendChild(row);
          });
          const delAllRow = document.createElement("div");
          delAllRow.style.cssText = "margin-top:8px;text-align:right;";
          const delAllBtn = document.createElement("button");
          delAllBtn.className = "btn btn-cancel";
          delAllBtn.textContent = t("deleteAll");
          delAllBtn.style.fontSize = "11px";
          delAllBtn.addEventListener("click", async () => {
            if (!confirm(t("deleteAllConfirm"))) return;
            const res = await deleteAllBackups();
            if (res.success)
              historyPanel.innerHTML =
                '<div style="padding:12px;color:#888;">' +
                t("noHistory") +
                "</div>";
          });
          delAllRow.appendChild(delAllBtn);
          historyPanel.appendChild(delAllRow);
        } catch (err) {
          historyPanel.innerHTML =
            '<div style="padding:12px;color:#888;">' +
            t("noHistory") +
            "</div>";
        }
      });

    historyPanel.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", () => {
      historyPanel.style.display = "none";
    });

    /* ── Diff viewer ── */
    function buildDiffHtml(oldContent, newContent, label) {
      const oldLines = oldContent.split("\n");
      const newLines = newContent.split("\n");
      const esc = (s) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      if (oldLines.length > 20000 || newLines.length > 20000) {
        return "<p>" + t("diffTooLarge") + "</p>";
      }
      const m = oldLines.length,
        n = newLines.length;
      const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
          dp[i][j] =
            oldLines[i - 1] === newLines[j - 1]
              ? dp[i - 1][j - 1] + 1
              : Math.max(dp[i - 1][j], dp[i][j - 1]);
      const diff = [];
      let i = m,
        j = n;
      while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
          diff.push({ t: "s", v: oldLines[i - 1] });
          i--;
          j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
          diff.push({ t: "a", v: newLines[j - 1] });
          j--;
        } else {
          diff.push({ t: "d", v: oldLines[i - 1] });
          i--;
        }
      }
      diff.reverse();
      let html =
        '<div style="font-family:monospace;font-size:12px;padding:1rem;">';
      html += `<h3>${t("diffTitle", label)}</h3>`;
      html += '<table style="width:100%;border-collapse:collapse;">';
      html +=
        '<tr><th style="width:50%;background:#f5f5f5;padding:4px;border:1px solid #ddd;">' +
        t("diffHistory") +
        "</th>";
      html +=
        '<th style="width:50%;background:#f5f5f5;padding:4px;border:1px solid #ddd;">' +
        t("diffCurrent") +
        "</th></tr>";
      for (const d of diff) {
        const v = esc(d.v) || "&nbsp;";
        if (d.t === "s")
          html += `<tr><td style="padding:2px 4px;border:1px solid #ddd;">${v}</td><td style="padding:2px 4px;border:1px solid #ddd;">${v}</td></tr>`;
        else if (d.t === "d")
          html += `<tr><td style="padding:2px 4px;border:1px solid #ddd;background:#ffd7d5;">${v}</td><td style="padding:2px 4px;border:1px solid #ddd;"></td></tr>`;
        else
          html += `<tr><td style="padding:2px 4px;border:1px solid #ddd;"></td><td style="padding:2px 4px;border:1px solid #ddd;background:#d4f0d4;">${v}</td></tr>`;
      }
      html += "</table></div>";
      return html;
    }
  }

  /* ── Search ── */
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  let searchTimer = null;

  function addSearchCloseBtn() {
    if (searchResults.querySelector(".search-close-btn")) return;
    const btn = document.createElement("button");
    btn.className = "search-close-btn";
    btn.innerHTML = "&times;";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      searchResults.style.display = "none";
      searchInput.value = "";
      searchInput.blur();
    });
    searchResults.prepend(btn);
  }

  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    const q = searchInput.value.trim();
    if (!q) {
      searchResults.style.display = "none";
      return;
    }
    searchTimer = setTimeout(async () => {
      const scrollY = window.scrollY;
      const data = await api(`/api/search?q=${encodeURIComponent(q)}`);
      if (!data.results || data.results.length === 0) {
        searchResults.innerHTML =
          '<div class="search-result-item">' + t("noResults") + "</div>";
      } else {
        const esc = (s) =>
          s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const highlight = (text, query) => {
          const escaped = esc(text);
          const re = new RegExp(
            "(" + query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")",
            "gi",
          );
          return escaped.replace(re, "<mark>$1</mark>");
        };
        const count = `<div class="search-result-count">${t("resultsCount", data.results.length)}</div>`;
        searchResults.innerHTML =
          count +
          data.results
            .map((r) => {
              const pathLabel = r.path.includes("/")
                ? r.path.substring(0, r.path.lastIndexOf("/"))
                : "";
              return `<a href="/${r.path}" class="search-result-item" style="display:block;text-decoration:none;">
            <div class="title">${esc(r.title)}${pathLabel ? ' <span class="search-path">' + esc(pathLabel) + "</span>" : ""}</div>
            <div class="snippet">${highlight(r.snippet, q)}</div>
          </a>`;
            })
            .join("");
      }
      addSearchCloseBtn();
      searchResults.style.display = "block";
      window.scrollTo(0, scrollY);
    }, DEBOUNCE_SEARCH);
  });

  let searchSelectedIndex = -1;
  searchInput.addEventListener("keydown", (e) => {
    const items = searchResults.querySelectorAll("a.search-result-item");
    if (items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      searchSelectedIndex = Math.min(searchSelectedIndex + 1, items.length - 1);
      items.forEach((item, i) =>
        item.classList.toggle("search-selected", i === searchSelectedIndex),
      );
      items[searchSelectedIndex].scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      searchSelectedIndex = Math.max(searchSelectedIndex - 1, 0);
      items.forEach((item, i) =>
        item.classList.toggle("search-selected", i === searchSelectedIndex),
      );
      items[searchSelectedIndex].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && searchSelectedIndex >= 0) {
      e.preventDefault();
      items[searchSelectedIndex].click();
    } else if (e.key === "Escape") {
      searchResults.style.display = "none";
      searchInput.blur();
    }
  });
  searchInput.addEventListener("input", () => {
    searchSelectedIndex = -1;
  });
  searchInput.addEventListener("blur", () =>
    setTimeout(() => (searchResults.style.display = "none"), BLUR_DELAY),
  );
  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim()) searchInput.dispatchEvent(new Event("input"));
  });

  /* ── Draft check on page load ── */
  function checkDraftsOnLoad() {
    const prefix = `draft:${filePath}:`;
    let hasFullDraft = false;
    const draftKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix)) {
        const headingText = key.substring(prefix.length);
        if (headingText === "__full__") {
          hasFullDraft = true;
        } else if (headingText) {
          draftKeys.push(headingText);
        }
      }
    }
    if (hasFullDraft) {
      const action = confirm(t("fullDraftFound"));
      if (action) {
        const editBtn = document.getElementById("btn-edit");
        if (editBtn) editBtn.click();
        return;
      } else {
        clearDraft("__full__");
      }
    }
    draftKeys.forEach((headingText) => {
      const action = confirm(t("sectionDraftFound", headingText));
      if (action) {
        const btns = document.querySelectorAll(".section-edit-btn");
        for (const btn of btns) {
          if (
            btn.parentElement &&
            getHeadingText(btn.parentElement) === headingText
          ) {
            btn.dataset.draftAutoOpen = "1";
            btn.click();
            break;
          }
        }
      } else {
        clearDraft(headingText);
      }
    });
  }

  /* ── Scroll: switch header title ── */
  function initScrollTitle() {
    const headerTitle = document.getElementById("header-title");
    const siteName = window.__siteName || headerTitle.textContent;
    const h1 = document.querySelector("#article-body h1");
    if (!h1 || !headerTitle) return;
    // Don't switch title on the top/index page
    if (!pagePath || pagePath === "index") return;
    const parts = pagePath.split("/");
    const pageTitle =
      parts[parts.length - 1] || parts[parts.length - 2] || pagePath;
    let showing = "site";

    const update = () => {
      const rect = h1.getBoundingClientRect();
      if (rect.bottom < 0 && showing === "site") {
        headerTitle.textContent = pageTitle;
        headerTitle.href = "#";
        showing = "page";
      } else if (rect.bottom >= 0 && showing === "page") {
        headerTitle.textContent = siteName;
        headerTitle.href = "/";
        showing = "site";
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ── Mermaid ── */
  function initMermaid() {
    const codeBlocks = document.querySelectorAll(
      "#article-body pre code.language-mermaid",
    );
    if (codeBlocks.length === 0) return;
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js";
    script.onload = () => {
      mermaid.initialize({ startOnLoad: false, theme: "default" });
      codeBlocks.forEach((code, i) => {
        const pre = code.parentElement;
        const div = document.createElement("div");
        div.className = "mermaid";
        div.textContent = code.textContent;
        pre.replaceWith(div);
      });
      mermaid.run();
    };
    document.head.appendChild(script);
  }

  /* ── TOC scroll tracking ── */
  function initTocTracking() {
    const tocLinks = document.querySelectorAll("#toc-list a");
    if (tocLinks.length === 0) return;
    const hrefMap = {};
    tocLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href) {
        const id = decodeURIComponent(href.replace("#", ""));
        hrefMap[id] = link;
      }
    });
    const headings = [];
    document
      .querySelectorAll(
        "#article-body h1, #article-body h2, #article-body h3, #article-body h4, #article-body h5, #article-body h6",
      )
      .forEach((el) => {
        if (el.id && hrefMap[el.id]) {
          headings.push({ el, link: hrefMap[el.id] });
        }
      });
    if (headings.length === 0) return;
    let active = null;
    const tocSidebar = document.querySelector(".sidebar-right");
    let tocHovered = false;
    if (tocSidebar) {
      tocSidebar.addEventListener("mouseenter", () => {
        tocHovered = true;
      });
      tocSidebar.addEventListener("mouseleave", () => {
        tocHovered = false;
      });
    }
    let firstRun = true;
    const scrollTocTo = (li) => {
      if (!tocSidebar) return;
      const sidebarTop = tocSidebar.getBoundingClientRect().top;
      const liTop = li.getBoundingClientRect().top;
      const liBottom = li.getBoundingClientRect().bottom;
      const sidebarBottom = tocSidebar.getBoundingClientRect().bottom;
      if (liTop < sidebarTop + 60 || liBottom > sidebarBottom - 20) {
        const target =
          tocSidebar.scrollTop +
          (liTop - sidebarTop) -
          tocSidebar.clientHeight / 2 +
          li.offsetHeight / 2;
        tocSidebar.scrollTo({ top: target, behavior: "smooth" });
      }
    };
    const update = () => {
      let current = headings[0];
      for (const h of headings) {
        if (h.el.getBoundingClientRect().top <= 100) current = h;
      }
      if (active !== current.link) {
        if (active) active.classList.remove("toc-active");
        current.link.classList.add("toc-active");
        active = current.link;
        // Skip TOC scroll on first run (already restored from sessionStorage)
        if (!firstRun && !tocHovered) {
          const li = active.closest("li");
          if (li) scrollTocTo(li);
        }
      }
      firstRun = false;
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ── KaTeX ── */
  function initKaTeX() {
    const article = document.getElementById("article-body");
    if (!article) return;
    const html = article.innerHTML;
    if (!html.includes("$")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/katex/dist/katex.min.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/katex/dist/katex.min.js";
    script.onload = () => {
      const autoScript = document.createElement("script");
      autoScript.src =
        "https://cdn.jsdelivr.net/npm/katex/dist/contrib/auto-render.min.js";
      autoScript.onload = () => {
        renderMathInElement(article, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
          ],
          throwOnError: false,
        });
      };
      document.head.appendChild(autoScript);
    };
    document.head.appendChild(script);
  }

  /* ── Image drag & drop ── */
  function enableImageDrop(textarea) {
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:absolute;inset:0;background:rgba(74,111,165,0.15);border:2px dashed #4a6fa5;border-radius:3px;z-index:10;display:none;align-items:center;justify-content:center;font-size:14px;color:#4a6fa5;pointer-events:none;";
    overlay.textContent = t("imageDrop");
    const wrapper = textarea.parentElement;
    wrapper.style.position = "relative";
    wrapper.appendChild(overlay);
    let dragCount = 0;
    textarea.addEventListener("dragenter", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCount++;
      overlay.style.display = "flex";
    });
    textarea.addEventListener("dragleave", (e) => {
      e.stopPropagation();
      dragCount--;
      if (dragCount <= 0) {
        overlay.style.display = "none";
        dragCount = 0;
      }
    });
    textarea.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    textarea.addEventListener("drop", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      overlay.style.display = "none";
      dragCount = 0;
      const files = e.dataTransfer.files;
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        const fd = new FormData();
        fd.append("file", file);
        try {
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const data = await res.json();
          if (data.success) {
            const pos = textarea.selectionStart;
            const before = textarea.value.substring(0, pos);
            const after = textarea.value.substring(pos);
            textarea.value = before + data.markdown + "\n" + after;
            textarea.dispatchEvent(new Event("input"));
          } else {
            alert(t("uploadFailed") + (data.error || ""));
          }
        } catch (err) {
          alert(t("uploadError") + err);
        }
      }
    });
  }

  /* ── Sidebar nav editing ── */
  function initSidebarEdit() {
    const editBtn = document.getElementById("sidebar-edit-btn");
    if (!editBtn) return;

    let editing = false;

    editBtn.addEventListener("click", async () => {
      if (editing) return;
      editing = true;
      window.__editingMode = true;
      editBtn.textContent = "...";

      const res = await fetch("/api/nav");
      const cfg = await res.json();
      // Find all nav items and add edit controls
      const sidebar = editBtn.closest(".sidebar-inner");

      // Expand all collapsed directories for editing
      sidebar.querySelectorAll(".nav-list").forEach((ul) => {
        if (ul.style.display === "none") ul.style.display = "";
      });
      sidebar.querySelectorAll(".nav-collapse-toggle").forEach((t) => {
        t.style.display = "none";
      });

      const allItems = sidebar.querySelectorAll(".nav-item[data-key]");

      let dragItem = null;
      let dragIndicator = null;

      allItems.forEach((li) => {
        const key = li.dataset.key;
        const link = li.querySelector(
          ":scope > .nav-link, :scope > .nav-dir-title",
        );
        if (!link) return;

        const segments = key.split("/");
        const fileName = segments[segments.length - 1];

        link.style.display = "none";

        const wrapper = document.createElement("div");
        wrapper.className = "nav-edit-wrapper";

        const handle = document.createElement("span");
        handle.className = "nav-drag-handle";
        handle.innerHTML = ICONS.grip;
        handle.title = t("dragToMove");

        const input = document.createElement("input");
        input.className = "nav-edit-input";
        input.value = fileName;
        input.dataset.key = key;

        wrapper.appendChild(handle);
        wrapper.appendChild(input);
        li.insertBefore(wrapper, link);

        li.setAttribute("draggable", "true");
        li.addEventListener("dragstart", (e) => {
          e.stopPropagation();
          dragItem = li;
          li.classList.add("nav-dragging");
          e.dataTransfer.effectAllowed = "move";
          dragIndicator = document.createElement("div");
          dragIndicator.className = "nav-drop-indicator";
          document.body.appendChild(dragIndicator);
        });

        li.addEventListener("dragend", () => {
          li.classList.remove("nav-dragging");
          dragItem = null;
          sidebar
            .querySelectorAll(
              ".nav-drop-above, .nav-drop-below, .nav-drop-into",
            )
            .forEach((el) => {
              el.classList.remove(
                "nav-drop-above",
                "nav-drop-below",
                "nav-drop-into",
              );
            });
          if (dragIndicator) {
            dragIndicator.remove();
            dragIndicator = null;
          }
        });

        li.addEventListener("dragover", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!dragItem || dragItem === li) return;
          e.dataTransfer.dropEffect = "move";
          const rect = li.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const h = rect.height;
          sidebar
            .querySelectorAll(
              ".nav-drop-above, .nav-drop-below, .nav-drop-into",
            )
            .forEach((el) => {
              el.classList.remove(
                "nav-drop-above",
                "nav-drop-below",
                "nav-drop-into",
              );
            });
          const isDir = li.classList.contains("nav-dir");
          const hasChildren = !!li.querySelector(":scope > .nav-list");
          if (isDir && !hasChildren) {
            if (y < h * 0.2) li.classList.add("nav-drop-above");
            else if (y > h * 0.8) li.classList.add("nav-drop-below");
            else li.classList.add("nav-drop-into");
          } else if (isDir && y > h * 0.25 && y < h * 0.75) {
            li.classList.add("nav-drop-into");
          } else if (y < h / 2) {
            li.classList.add("nav-drop-above");
          } else {
            li.classList.add("nav-drop-below");
          }
        });

        li.addEventListener("dragleave", () => {
          li.classList.remove(
            "nav-drop-above",
            "nav-drop-below",
            "nav-drop-into",
          );
        });

        li.addEventListener("drop", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!dragItem || dragItem === li) return;
          const rect = li.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const h = rect.height;
          const isDir = li.classList.contains("nav-dir");
          const hasChildren = !!li.querySelector(":scope > .nav-list");
          let action;
          if (isDir && !hasChildren) {
            if (y < h * 0.2) action = "above";
            else if (y > h * 0.8) action = "below";
            else action = "into";
          } else if (isDir && y > h * 0.25 && y < h * 0.75) {
            action = "into";
          } else if (y < h / 2) {
            action = "above";
          } else {
            action = "below";
          }
          if (action === "into") {
            let childUl = li.querySelector(":scope > .nav-list");
            if (!childUl) {
              childUl = document.createElement("ul");
              childUl.className = "nav-list";
              li.appendChild(childUl);
            }
            childUl.appendChild(dragItem);
          } else if (action === "above") {
            li.parentElement.insertBefore(dragItem, li);
          } else {
            li.parentElement.insertBefore(dragItem, li.nextSibling);
          }
          sidebar
            .querySelectorAll(
              ".nav-drop-above, .nav-drop-below, .nav-drop-into",
            )
            .forEach((el) => {
              el.classList.remove(
                "nav-drop-above",
                "nav-drop-below",
                "nav-drop-into",
              );
            });
        });
      });

      const saveRow = document.createElement("div");
      saveRow.className = "nav-edit-save";
      const saveBtn = document.createElement("button");
      saveBtn.className = "save";
      saveBtn.textContent = t("save");
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "cancel";
      cancelBtn.textContent = t("cancel");
      saveRow.appendChild(saveBtn);
      saveRow.appendChild(cancelBtn);
      sidebar.appendChild(saveRow);

      const cleanup = () => {
        sidebar
          .querySelectorAll(".nav-edit-wrapper")
          .forEach((w) => w.remove());
        sidebar
          .querySelectorAll(".nav-link, .nav-dir-title")
          .forEach((l) => (l.style.display = ""));
        sidebar
          .querySelectorAll(".nav-collapse-toggle")
          .forEach((t) => (t.style.display = ""));
        sidebar
          .querySelectorAll(".nav-item[draggable]")
          .forEach((li) => li.removeAttribute("draggable"));
        saveRow.remove();
        editBtn.innerHTML = ICONS.gear;
        editing = false;
        // Re-apply collapsed state from localStorage
        try {
          const collapsed =
            JSON.parse(localStorage.getItem("gomdshelf-collapsed")) || {};
          sidebar.querySelectorAll(".nav-dir[data-key]").forEach((li) => {
            const key = li.dataset.key;
            const childUl = li.querySelector(":scope > .nav-list");
            const toggle = li.querySelector(
              ":scope > .nav-link .nav-collapse-toggle, :scope > .nav-dir-title .nav-collapse-toggle",
            );
            if (childUl && toggle && collapsed[key]) {
              childUl.style.display = "none";
              toggle.innerHTML = ICONS.chevronRight;
            }
          });
        } catch (e) {}
      };

      cancelBtn.addEventListener("click", () => {
        cleanup();
        location.reload();
      });

      saveBtn.addEventListener("click", async () => {
        const renames = {};
        const moves = {};
        const newOrder = {};

        sidebar.querySelectorAll(".nav-edit-input").forEach((input) => {
          const key = input.dataset.key;
          const segments = key.split("/");
          const fileName = segments[segments.length - 1];
          const newName = input.value.trim();
          if (newName && newName !== fileName) {
            renames[key] = newName;
          }
          const li = input.closest(".nav-item[data-key]");
          const currentParentLi = li.parentElement.closest(
            ".nav-item[data-key]",
          );
          const currentParent = currentParentLi
            ? currentParentLi.dataset.key
            : "";
          const originalParent =
            segments.length > 1 ? segments.slice(0, -1).join("/") : "";
          if (currentParent !== originalParent) {
            moves[key] = currentParent;
          }
        });

        sidebar.querySelectorAll(".nav-list").forEach((ul) => {
          const parentLi = ul.closest(".nav-item[data-key]");
          const parentKey = parentLi ? parentLi.dataset.key : "";
          const keys = [];
          ul.querySelectorAll(":scope > .nav-item[data-key]").forEach((li) => {
            keys.push(li.dataset.key);
          });
          if (keys.length > 0) {
            newOrder[parentKey] = keys;
          }
        });

        const payload = { renames, moves, order: newOrder };
        const hasChanges =
          Object.keys(renames).length > 0 || Object.keys(moves).length > 0;
        const result = await fetch("/api/nav", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then((r) => r.json());

        // Check if current page was renamed
        if (result.renames && pagePath) {
          for (const [oldKey, newKey] of Object.entries(result.renames)) {
            if (pagePath === oldKey || pagePath.startsWith(oldKey + "/")) {
              const newPath = pagePath.replace(oldKey, newKey);
              location.href = "/" + newPath;
              return;
            }
          }
        }
        // Only reload if files were renamed/moved; order-only changes don't need it
        if (hasChanges) {
          location.reload();
        } else {
          cleanup();
          // Keep __editingMode true briefly to suppress WebSocket reload from _nav.json write
          setTimeout(() => {
            window.__editingMode = false;
          }, NAV_SAVE_GUARD);
        }
      });
    });
  }

  /* ── Sidebar active page highlight ── */
  function initSidebarActive() {
    const currentPath = decodeURIComponent(location.pathname).replace(
      /\/$/,
      "",
    );
    document.querySelectorAll(".sidebar-left .nav-link").forEach((link) => {
      const href = decodeURIComponent(link.getAttribute("href")).replace(
        /\/$/,
        "",
      );
      if (href === currentPath) {
        link.classList.add("nav-active");
        // Ensure parent directories are expanded
        let parent = link.closest(".nav-dir");
        while (parent) {
          const childUl = parent.querySelector(":scope > .nav-list");
          if (childUl && childUl.style.display === "none") {
            childUl.style.display = "";
            const toggle = parent.querySelector(
              ":scope > .nav-link .nav-collapse-toggle, :scope > .nav-dir-title .nav-collapse-toggle",
            );
            if (toggle) toggle.innerHTML = ICONS.chevronDown;
          }
          parent = parent.parentElement.closest(".nav-dir");
        }
      }
    });
  }

  /* ── Search shortcut ── */
  function initSearchShortcut() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const active = document.activeElement;
        if (
          active &&
          (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
        )
          return;
        e.preventDefault();
        document.getElementById("search-input").focus();
      }
    });
  }

  /* ── Smooth scroll for anchor links ── */
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = decodeURIComponent(link.getAttribute("href").slice(1));
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top, behavior: "smooth" });
      history.pushState(null, "", "#" + id);
    }
  });

  if (location.hash) {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = document.getElementById(id);
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top, behavior: "instant" });
    }
  }

  /* ── Sidebar directory collapse/expand ── */
  function initSidebarCollapse() {
    const storageKey = "gomdshelf-collapsed";
    let collapsed = {};
    try {
      collapsed = JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch (e) {}

    document.querySelectorAll(".sidebar-left .nav-dir").forEach((li) => {
      const key = li.dataset.key;
      const titleEl = li.querySelector(
        ":scope > .nav-link.nav-dir-title, :scope > .nav-dir-title",
      );
      const childUl = li.querySelector(":scope > .nav-list");
      if (!titleEl || !childUl) return;

      const toggle = document.createElement("span");
      toggle.className = "nav-collapse-toggle";
      toggle.innerHTML = ICONS.chevronDown;
      titleEl.insertBefore(toggle, titleEl.firstChild);

      const setCollapsed = (isCollapsed) => {
        if (isCollapsed) {
          childUl.style.display = "none";
          toggle.innerHTML = ICONS.chevronRight;
          collapsed[key] = true;
        } else {
          childUl.style.display = "";
          toggle.innerHTML = ICONS.chevronDown;
          delete collapsed[key];
        }
        try {
          localStorage.setItem(storageKey, JSON.stringify(collapsed));
        } catch (e) {}
      };

      if (collapsed[key]) setCollapsed(true);

      toggle.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCollapsed(childUl.style.display !== "none");
      });
    });
  }

  /* ── Dark mode ── */
  function initDarkMode() {
    const toggle = document.getElementById("dark-toggle");
    if (!toggle) return;
    const root = document.documentElement;
    const moonSvg =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    const sunSvg =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    if (root.classList.contains("dark")) {
      document.body.classList.add("dark");
      toggle.innerHTML = sunSvg;
    }
    toggle.addEventListener("click", () => {
      const isDark = root.classList.toggle("dark");
      document.body.classList.toggle("dark", isDark);
      toggle.innerHTML = isDark ? sunSvg : moonSvg;
      localStorage.setItem("darkMode", isDark);
      window.dispatchEvent(new Event("themechange"));
    });
  }

  /* ── Theme color picker ── */
  function initThemePicker() {
    const btn = document.getElementById("theme-picker-btn");
    const dropdown = document.getElementById("theme-picker-dropdown");
    if (!btn || !dropdown) return;
    const faviconColors = {
      blue: "%237aaed5",
      green: "%2381c784",
      red: "%23ef9a9a",
      yellow: "%23ffcc80",
    };
    const faviconColorsDark = {
      blue: "%23456a8f",
      green: "%23438a47",
      red: "%23a33030",
      yellow: "%23b06010",
    };
    function updateFavicon(theme) {
      const isDark = document.documentElement.classList.contains("dark");
      const colors = isDark ? faviconColorsDark : faviconColors;
      const fc = colors[theme] || colors.blue;
      const favicon = document.querySelector('link[rel="icon"]');
      if (favicon) {
        favicon.href =
          "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect fill='" +
          fc +
          "' width='32' height='32' rx='6'/><path d='M6 7L6 25Q16 20 26 25L26 7Q16 12 6 7Z' fill='none' stroke='white' stroke-width='2' stroke-linejoin='round'/><path d='M16 10L16 23' stroke='white' stroke-width='1.2'/></svg>";
      }
    }
    function applyTheme(theme) {
      const root = document.documentElement;
      if (theme && theme !== "blue") {
        root.setAttribute("data-theme", theme);
        document.body.setAttribute("data-theme", theme);
      } else {
        root.removeAttribute("data-theme");
        document.body.removeAttribute("data-theme");
        theme = "blue";
      }
      dropdown.querySelectorAll(".theme-color-option").forEach((o) => {
        o.classList.toggle("active", o.dataset.theme === theme);
      });
      updateFavicon(theme);
    }
    const saved = localStorage.getItem("themeColor") || "blue";
    applyTheme(saved);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("visible");
    });
    dropdown.addEventListener("click", (e) => {
      e.stopPropagation();
      const option = e.target.closest(".theme-color-option");
      if (!option) return;
      const theme = option.dataset.theme;
      localStorage.setItem("themeColor", theme);
      applyTheme(theme);
      dropdown.classList.remove("visible");
    });
    document.addEventListener("click", () =>
      dropdown.classList.remove("visible"),
    );
    window.addEventListener("themechange", () => {
      const current = localStorage.getItem("themeColor") || "blue";
      updateFavicon(current);
    });
  }

  /* ── Back to top button ── */
  function initBackToTop() {
    const btn = document.createElement("button");
    btn.className = "back-to-top";
    btn.innerHTML = ICONS.arrowUp;
    btn.title = t("backToTop");
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    document.body.appendChild(btn);
    window.addEventListener(
      "scroll",
      () => {
        btn.classList.toggle("visible", window.scrollY > 400);
      },
      { passive: true },
    );
  }

  /* ── Heading anchor links ── */
  function initHeadingLinks() {
    document
      .querySelectorAll(
        "#article-body h1, #article-body h2, #article-body h3, #article-body h4, #article-body h5, #article-body h6",
      )
      .forEach((h) => {
        if (!h.id) return;
        const link = document.createElement("a");
        link.className = "heading-anchor";
        link.href = "#" + h.id;
        link.innerHTML = ICONS.link;
        link.title = t("copyLink");
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const url = location.origin + location.pathname + "#" + h.id;
          if (navigator.clipboard) {
            navigator.clipboard.writeText(url);
          } else {
            const ta = document.createElement("textarea");
            ta.value = url;
            ta.style.cssText = "position:fixed;opacity:0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
          }
          link.innerHTML = ICONS.check;
          setTimeout(() => (link.innerHTML = ICONS.link), COPY_FEEDBACK);
        });
        h.appendChild(link);
      });
  }

  /* ── Interactive checkboxes ── */
  function initCheckboxes() {
    if (!filePath) return;
    const article = document.getElementById("article-body");
    if (!article) return;
    const checkboxes = article.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length === 0) return;
    checkboxes.forEach((cb, index) => {
      cb.disabled = false;
      cb.style.cursor = "pointer";
      cb.addEventListener("change", async () => {
        const res = await getContent();
        if (!res.content && res.content !== "") return;
        let md = res.content;
        let cbIndex = 0;
        md = md.replace(
          /^(\s*[-*+]\s+)\[([ xX])\]/gm,
          (match, prefix, check) => {
            if (cbIndex === index) {
              cbIndex++;
              const newCheck = cb.checked ? "x" : " ";
              return prefix + "[" + newCheck + "]";
            }
            cbIndex++;
            return match;
          },
        );
        await backupFile();
        await saveContent(md);
      });
    });
  }

  /* ── External links open in new tab ── */
  function initExternalLinks() {
    document.querySelectorAll("#article-body a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (
        href &&
        (href.startsWith("http://") || href.startsWith("https://")) &&
        !href.includes(location.host)
      ) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      }
    });
  }

  /* ── Image lightbox ── */
  function initImageLightbox() {
    const images = document.querySelectorAll("#article-body img");
    if (images.length === 0) return;
    const overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";
    const img = document.createElement("img");
    overlay.appendChild(img);
    document.body.appendChild(overlay);
    overlay.addEventListener("click", () =>
      overlay.classList.remove("visible"),
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") overlay.classList.remove("visible");
    });
    images.forEach((image) => {
      image.style.cursor = "zoom-in";
      image.addEventListener("click", (e) => {
        e.preventDefault();
        img.src = image.src;
        overlay.classList.add("visible");
      });
    });
  }

  /* ── Relative time ── */
  function initRelativeTime() {
    const el = document.querySelector(".last-modified");
    if (!el) return;
    const text = el.textContent.replace(/^[^:]+:\s*/, "").trim();
    const date = new Date(text.replace(/-/g, "/"));
    if (isNaN(date)) return;
    const diff = Date.now() - date.getTime();
    const sec = Math.floor(diff / 1000);
    let rel;
    if (sec < 60) rel = t("justNow");
    else if (sec < 3600) rel = Math.floor(sec / 60) + " " + t("minAgo");
    else if (sec < 86400) rel = Math.floor(sec / 3600) + " " + t("hourAgo");
    else if (sec < 2592000) rel = Math.floor(sec / 86400) + " " + t("dayAgo");
    else if (sec < 31536000)
      rel = Math.floor(sec / 2592000) + " " + t("monthAgo");
    else rel = Math.floor(sec / 31536000) + " " + t("yearAgo");
    el.textContent += " (" + rel + ")";
  }

  /* ── Language toggle ── */
  function initLangToggle() {
    const btn = document.getElementById("lang-toggle");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      const newLang = LANG === "ja" ? "en" : "ja";
      await fetch("/api/lang?lang=" + newLang);
      location.reload();
    });
  }

  /* ── Mobile sidebar & TOC drawers ── */
  function initMobileMenu() {
    const hamburger = document.getElementById("hamburger-btn");
    const sidebarLeft = document.querySelector(".sidebar-left");
    const sidebarRight = document.querySelector(".sidebar-right");
    const overlay = document.getElementById("sidebar-overlay");
    const tocBtn = document.getElementById("mobile-toc-btn");
    if (!hamburger || !overlay) return;

    function closeAll() {
      if (sidebarLeft) sidebarLeft.classList.remove("open");
      if (sidebarRight) sidebarRight.classList.remove("open");
      overlay.classList.remove("visible");
    }

    hamburger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = sidebarLeft && sidebarLeft.classList.contains("open");
      closeAll();
      if (!isOpen && sidebarLeft) {
        sidebarLeft.classList.add("open");
        overlay.classList.add("visible");
      }
    });

    if (tocBtn) {
      tocBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = sidebarRight && sidebarRight.classList.contains("open");
        closeAll();
        if (!isOpen && sidebarRight) {
          sidebarRight.classList.add("open");
          overlay.classList.add("visible");
        }
      });
    }

    overlay.addEventListener("click", closeAll);

    if (sidebarLeft) {
      sidebarLeft.addEventListener("click", (e) => {
        if (e.target.closest(".nav-link")) closeAll();
      });
    }
    if (sidebarRight) {
      sidebarRight.addEventListener("click", (e) => {
        if (e.target.closest("a")) closeAll();
      });
    }
  }

  /* ── Mobile settings panel ── */
  function initMobileSettings() {
    const btn = document.getElementById("mobile-settings-btn");
    const panel = document.getElementById("mobile-settings-panel");
    if (!btn || !panel) return;

    const root = document.documentElement;
    const darkToggle = document.getElementById("msetting-dark-toggle");
    const darkLabel = document.getElementById("msetting-dark-label");
    const langRow = document.getElementById("msetting-lang");
    const langVal = document.getElementById("msetting-lang-val");
    const colors = panel.querySelectorAll(".msetting-color");

    // Sync initial state
    function syncState() {
      const isDark = root.classList.contains("dark");
      if (darkToggle) darkToggle.classList.toggle("on", isDark);
      const theme = localStorage.getItem("themeColor") || "blue";
      colors.forEach((c) =>
        c.classList.toggle("active", c.dataset.theme === theme),
      );
      if (langVal) langVal.textContent = LANG === "ja" ? "JA" : "EN";
    }
    syncState();

    // Toggle panel
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      syncState();
      panel.classList.toggle("visible");
    });
    document.addEventListener("click", (e) => {
      if (!panel.contains(e.target) && e.target !== btn) {
        panel.classList.remove("visible");
      }
    });
    panel.addEventListener("click", (e) => e.stopPropagation());

    // Dark mode
    const darkRow = document.getElementById("msetting-dark");
    if (darkRow) {
      darkRow.addEventListener("click", () => {
        const desktopToggle = document.getElementById("dark-toggle");
        if (desktopToggle) desktopToggle.click();
        syncState();
      });
    }

    // Theme colors
    colors.forEach((c) => {
      c.addEventListener("click", (e) => {
        e.stopPropagation();
        const theme = c.dataset.theme;
        localStorage.setItem("themeColor", theme);
        // Trigger desktop theme picker logic
        const desktopOption = document.querySelector(
          '.theme-color-option[data-theme="' + theme + '"]',
        );
        if (desktopOption) desktopOption.click();
        syncState();
      });
    });

    // Language
    if (langRow) {
      langRow.addEventListener("click", async () => {
        const newLang = LANG === "ja" ? "en" : "ja";
        await fetch("/api/lang?lang=" + newLang);
        location.reload();
      });
    }
  }

  /* ── Init ── */
  document.addEventListener("dragover", (e) => e.preventDefault());
  document.addEventListener("drop", (e) => e.preventDefault());
  addCopyButtons();
  addSectionEditButtons();
  checkDraftsOnLoad();
  initScrollTitle();
  initMermaid();
  initTocTracking();
  initKaTeX();
  initDarkMode();
  initSidebarEdit();
  initSidebarActive();
  initSearchShortcut();
  initBackToTop();
  initThemePicker();
  initSidebarCollapse();
  initExternalLinks();
  initImageLightbox();
  initHeadingLinks();
  initCheckboxes();
  initRelativeTime();
  initLangToggle();
  initMobileMenu();
  initMobileSettings();

  // Remove early-collapse style (now managed by initSidebarCollapse)
  const earlyStyle = document.getElementById("early-collapse");
  if (earlyStyle) earlyStyle.remove();

  // Save scroll position (heading-based) and TOC sidebar position before unload
  window.addEventListener("beforeunload", () => {
    try {
      // Find the heading closest to the top of the viewport
      const allHeadings = document.querySelectorAll(
        "#article-body h1, #article-body h2, #article-body h3, #article-body h4, #article-body h5, #article-body h6",
      );
      let anchorId = "";
      let anchorOffset = window.scrollY;
      for (const h of allHeadings) {
        if (!h.id) continue;
        const rect = h.getBoundingClientRect();
        if (rect.top <= 120) {
          anchorId = h.id;
          anchorOffset = window.scrollY - (h.offsetTop || 0);
        }
      }
      sessionStorage.setItem(
        "gomdshelf-scroll",
        JSON.stringify({
          path: location.pathname,
          anchorId: anchorId,
          offset: anchorOffset,
        }),
      );
      // Save TOC sidebar scroll
      const tocSidebar = document.querySelector(".sidebar-right");
      if (tocSidebar) {
        sessionStorage.setItem(
          "gomdshelf-toc-scroll",
          JSON.stringify({
            path: location.pathname,
            y: tocSidebar.scrollTop,
          }),
        );
      }
    } catch (e) {}
  });

  // Restore scroll position using heading anchor, then reveal
  if (!location.hash) {
    try {
      const saved = JSON.parse(sessionStorage.getItem("gomdshelf-scroll"));
      if (saved && saved.path === location.pathname) {
        if (saved.anchorId) {
          const anchor = document.getElementById(saved.anchorId);
          if (anchor) {
            window.scrollTo(0, (anchor.offsetTop || 0) + saved.offset);
          }
        } else {
          window.scrollTo(0, saved.offset);
        }
      }
    } catch (e) {}
  }
  sessionStorage.removeItem("gomdshelf-scroll");

  // Reveal page - all JS init and scroll restoration complete
  document.body.style.opacity = "1";
  document.body.style.animation = "none";
  document.documentElement.removeAttribute("data-loading");
})();
