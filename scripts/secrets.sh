#!/usr/bin/env bash
# =========================================================================
# secrets.sh — Helper para cargar configuración sensible
# =========================================================================
# Uso:
#   source scripts/secrets.sh            # carga .env al entorno actual
#   scripts/secrets.sh env               # imprime todas las variables
#   scripts/secrets.sh pull-pass         # trae valores de `pass` al .env
#   scripts/secrets.sh push-pass         # guarda .env en `pass` (GPG)
#
# Requiere: pass (GPG), gpg
# =========================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"
PASS_PREFIX="casatapputi"

load_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "⚠️  No existe .env — copia primero .env.example:" >&2
    echo "   cp .env.example .env && nano .env" >&2
    return 1
  fi
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  echo "✅  .env cargado en el shell actual"
}

cmd_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    echo ".env no existe" >&2
    return 1
  fi
  grep -E '^[A-Z_]+=' "$ENV_FILE" | cut -d= -f1
}

cmd_pull_pass() {
  command -v pass >/dev/null || { echo "pass no está instalado" >&2; return 1; }
  [[ -d ~/.password-store ]] || { echo "pass no está inicializado. Corre: pass init <gpg-id>" >&2; return 1; }
  if [[ ! -f "$ENV_FILE" ]]; then
    cp "$REPO_ROOT/.env.example" "$ENV_FILE"
    echo "📝  .env creado desde .env.example"
  fi
  while IFS='=' read -r key _; do
    case "$key" in
      ''|\#*) continue ;;
    esac
    if pass show "$PASS_PREFIX/$key" >/dev/null 2>&1; then
      val=$(pass show "$PASS_PREFIX/$key")
      sed -i "s|^$key=.*|$key=$val|" "$ENV_FILE"
      echo "  ✅  $key actualizado desde pass"
    fi
  done < "$REPO_ROOT/.env.example"
}

cmd_push_pass() {
  command -v pass >/dev/null || { echo "pass no está instalado" >&2; return 1; }
  [[ -d ~/.password-store ]] || { echo "pass no está inicializado" >&2; return 1; }
  [[ -f "$ENV_FILE" ]] || { echo "No existe .env" >&2; return 1; }
  while IFS='=' read -r key val; do
    case "$key" in
      ''|\#*|WA_PHONE|WA_DEFAULT_MSG) continue ;; # públicas, no guardar
    esac
    [[ -z "$val" || "$val" =~ ^# ]] && continue  # vacías o comentadas
    pass insert -f "$PASS_PREFIX/$key" <<< "$val" >/dev/null
    echo "  ✅  $key guardado en pass"
  done < "$ENV_FILE"
}

case "${1:-load}" in
  load) load_env ;;
  env) cmd_env ;;
  pull-pass) cmd_pull_pass ;;
  push-pass) cmd_push_pass ;;
  *) echo "Uso: $0 {load|env|pull-pass|push-pass}" >&2; exit 1 ;;
esac
