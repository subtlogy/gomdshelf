VERSION ?= dev

.PHONY: build run clean docker

build:
	go build -ldflags="-s -w -X main.version=$(VERSION)" -o gomdshelf .

run: build
	DOCS_DIR=./docs BACKUP_DIR=./backups ./gomdshelf

clean:
	rm -f gomdshelf

docker:
	docker compose up -d --build
