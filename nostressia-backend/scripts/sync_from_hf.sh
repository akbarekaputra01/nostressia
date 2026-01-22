#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${HF_REPO_URL:-https://huggingface.co/akbarekaputra01/nostressia-backend}"
DEST_DIR="${DEST_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
TEMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

if [[ -z "${HF_TOKEN:-}" ]]; then
  echo "HF_TOKEN is required to authenticate with Hugging Face." >&2
  echo "Example: HF_TOKEN=hf_*** ./scripts/sync_from_hf.sh" >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git is required to run this sync script." >&2
  exit 1
fi

ASKPASS_SCRIPT="$TEMP_DIR/askpass.sh"
cat > "$ASKPASS_SCRIPT" <<'ASKPASS'
#!/usr/bin/env sh
echo "$HF_TOKEN"
ASKPASS
chmod +x "$ASKPASS_SCRIPT"

GIT_ASKPASS="$ASKPASS_SCRIPT" GIT_TERMINAL_PROMPT=0 git clone "$REPO_URL" "$TEMP_DIR/nostressia-backend"

if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete "$TEMP_DIR/nostressia-backend/" "$DEST_DIR/"
else
  rm -rf "$DEST_DIR"
  mkdir -p "$DEST_DIR"
  cp -a "$TEMP_DIR/nostressia-backend/." "$DEST_DIR/"
fi

echo "Sync complete: $DEST_DIR"
