FROM golang:1.23-alpine AS builder
WORKDIR /src
COPY go.mod go.sum* ./
RUN go mod download 2>/dev/null || true
COPY . .
RUN go build -ldflags="-s -w" -o /gomdshelf .

FROM alpine:3.20
RUN apk add --no-cache tzdata
COPY --from=builder /gomdshelf /usr/local/bin/gomdshelf
EXPOSE 8000
ENTRYPOINT ["gomdshelf"]
