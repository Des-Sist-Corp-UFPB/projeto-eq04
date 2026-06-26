#!/usr/bin/env bash
set -euo pipefail

echo "==> Atualizando código..."
git pull origin main

echo "==> Rebuild e restart do container..."
docker compose down app || true
docker compose up --build -d app

echo "==> Aguardando healthcheck..."
sleep 15
curl -sf http://127.0.0.1:8104/ping | head -c 200
echo

echo "==> Rodando seed (opcional, ignora erro se já existir)..."
docker compose exec -T app npx tsx prisma/seed.ts || true

echo "==> Deploy concluído. Verifique https://eq04.dsc.rodrigor.com"
