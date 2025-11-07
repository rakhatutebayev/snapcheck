#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$ROOT_DIR/.env"
EXAMPLE_FILE="$ROOT_DIR/.env.example"

color_green() { printf "\033[0;32m%s\033[0m\n" "$1"; }
color_yellow() { printf "\033[1;33m%s\033[0m\n" "$1"; }
color_red() { printf "\033[0;31m%s\033[0m\n" "$1"; }

ensure_var() {
  local var_name="$1"
  if ! grep -q "^${var_name}=" "$ENV_FILE" 2>/dev/null; then
    echo "${var_name}=" >> "$ENV_FILE"
    color_yellow "Добавлена переменная ${var_name} (пустая) в .env"
  fi
}

color_green "Env Helper: подготовка .env"

if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$EXAMPLE_FILE" ]; then
    cp "$EXAMPLE_FILE" "$ENV_FILE"
    color_green "Скопирован шаблон .env.example → .env"
  else
    echo "# Generated .env" > "$ENV_FILE"
    color_yellow ".env.example не найден, создан пустой .env"
  fi
fi

# Убедимся, что нужные переменные для OAuth существуют
ensure_var "MICROSOFT_CLIENT_ID"
ensure_var "MICROSOFT_CLIENT_SECRET"
ensure_var "GOOGLE_CLIENT_ID"
ensure_var "GOOGLE_CLIENT_SECRET"

color_green "Готово. Проверьте и заполните значения в .env:"
cat "$ENV_FILE" | grep -E '^(MICROSOFT_CLIENT_ID|MICROSOFT_CLIENT_SECRET|GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET)=' | sed 's/=.*$/=.../'

color_yellow "Подсказка: после изменения .env перезапустите систему командой ./start.sh"
