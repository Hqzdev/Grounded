FROM rust:1.86-slim AS builder

WORKDIR /app

COPY apps/gateway/Cargo.toml ./Cargo.toml
COPY apps/gateway/Cargo.lock ./Cargo.lock
COPY apps/gateway/src ./src

RUN cargo build --release

FROM debian:bookworm-slim

WORKDIR /app

COPY --from=builder /app/target/release/grounded-gateway /usr/local/bin/grounded-gateway

ENV PORT=8080

CMD ["grounded-gateway"]
