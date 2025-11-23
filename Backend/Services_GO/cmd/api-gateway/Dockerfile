FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o main ./cmd/api-gateway

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/main .
COPY --from=builder /app/config.env .
EXPOSE 8080
CMD ["./main"]

