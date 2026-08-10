#!/bin/sh
set -eu

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

ENCRYPTION_KEY="$(security find-generic-password -a trek-family -s 'TREK Family Encryption Key' -w)"
ADMIN_PASSWORD="$(security find-generic-password -a admin@trek.local -s 'TREK Family Initial Admin Password' -w)"

export ENCRYPTION_KEY ADMIN_PASSWORD
export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@trek.local}"
export APP_URL="${APP_URL:-https://trek.xinyi.dev}"

exec docker compose -f "$script_dir/compose.yaml" "$@"
