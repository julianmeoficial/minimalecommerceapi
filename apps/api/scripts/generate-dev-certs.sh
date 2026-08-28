#!/usr/bin/env bash
# Certificados autofirmados para desarrollo local (Safari + Swagger UI con HTTPS).
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
CERT_DIR="$DIR/certs"
mkdir -p "$CERT_DIR"

openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
  -keyout "$CERT_DIR/localhost-key.pem" \
  -out "$CERT_DIR/localhost.pem" \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo ""
echo "Certificados creados en apps/api/certs/"
echo "  - localhost.pem"
echo "  - localhost-key.pem"
echo ""
echo "Arranca la API con: pnpm dev"
echo "Swagger: https://localhost:8080/docs"
echo ""
echo "Safari: en la primera visita acepta el certificado (Avanzado → continuar)."
echo "Opcional (sin aviso): brew install mkcert && mkcert -install && mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1"
