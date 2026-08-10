#!/bin/sh
set -eu

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

ENCRYPTION_KEY="$(security find-generic-password -a trek-family -s 'TREK Family Encryption Key' -w)"
ADMIN_PASSWORD="$(security find-generic-password -a admin@trek.local -s 'TREK Family Initial Admin Password' -w)"

export ENCRYPTION_KEY ADMIN_PASSWORD
export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@trek.local}"
export APP_URL="${APP_URL:-https://trek.jiqiao.ai}"
export ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-https://trek.jiqiao.ai,https://trek.xinyi.dev}"

cloudflared_config="${CLOUDFLARED_CONFIG_FILE:-$HOME/.cloudflared/config.yml}"
if [ -f "$cloudflared_config" ]; then
  parsed_tunnel_id="$(awk '$1 == "tunnel:" { print $2; exit }' "$cloudflared_config")"
  parsed_credentials_file="$(awk '$1 == "credentials-file:" { print $2; exit }' "$cloudflared_config")"
  export CLOUDFLARED_TUNNEL_ID="${CLOUDFLARED_TUNNEL_ID:-$parsed_tunnel_id}"
  export CLOUDFLARED_CREDENTIALS_FILE="${CLOUDFLARED_CREDENTIALS_FILE:-$parsed_credentials_file}"
fi

if [ -z "${CLOUDFLARED_TUNNEL_ID:-}" ] || [ -z "${CLOUDFLARED_CREDENTIALS_FILE:-}" ]; then
  echo "Cloudflare Tunnel configuration is missing. Set CLOUDFLARED_TUNNEL_ID and CLOUDFLARED_CREDENTIALS_FILE." >&2
  exit 1
fi

if [ "${1:-}" = "external-backup" ]; then
  backup_root="${TREK_BACKUP_ROOT:-/Users/manxc/Backups/TREK}"
  backup_path="$backup_root/$(date -u +%Y%m%dT%H%M%SZ)"
  image_tag="${TREK_IMAGE_TAG:-3.4.1-family-zh-en-baidu.1}"
  mkdir -p "$backup_path"
  docker run --rm --network none --entrypoint sh \
    -v trek-family-data:/source/data:ro \
    -v trek-family-uploads:/source/uploads:ro \
    -v "$backup_path:/backup" \
    "trek-family:$image_tag" \
    -c 'tar -C /source -czf /backup/trek-runtime.tar.gz data uploads && cd /backup && sha256sum trek-runtime.tar.gz > SHA256SUMS && tar -tzf trek-runtime.tar.gz >/dev/null'
  chmod 700 "$backup_path"
  echo "Verified backup created at $backup_path"
  exit 0
fi

exec docker compose -f "$script_dir/compose.yaml" "$@"
