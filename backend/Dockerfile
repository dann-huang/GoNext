# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app
COPY go.* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/web

# Production stage
FROM alpine:latest

WORKDIR /app
COPY --from=builder /app/server .
COPY --from=builder /app/static ./static

EXPOSE 3333
CMD ["./server"] 