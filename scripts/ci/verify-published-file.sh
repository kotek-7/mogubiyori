#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 URL EXPECTED_FILE" >&2
  exit 2
fi

url="$1"
expected="$2"
attempts="${PUBLISH_VERIFY_ATTEMPTS:-20}"
delay="${PUBLISH_VERIFY_DELAY:-3}"
if [ ! -f "$expected" ] || ! [[ "$attempts" =~ ^[1-9][0-9]*$ && "$delay" =~ ^[0-9]+$ ]]; then
  echo 'Expected an existing file, a positive attempt count, and a nonnegative delay.' >&2
  exit 2
fi

actual="$(mktemp "${TMPDIR:-/tmp}/mogubiyori-published.XXXXXX")"
trap 'rm -f "$actual"' EXIT

for ((attempt = 1; attempt <= attempts; attempt++)); do
  if curl --fail --silent --show-error --max-time 15 "$url" --output "$actual" &&
    cmp --silent "$expected" "$actual"; then
    printf 'Published file matches %s: %s\n' "$expected" "$url"
    exit 0
  fi
  if [ "$attempt" -lt "$attempts" ]; then
    printf 'Waiting for published file (%d/%d): %s\n' "$attempt" "$attempts" "$url"
    sleep "$delay"
  fi
done

printf '::error::Published file did not match %s after %d attempts: %s\n' "$expected" "$attempts" "$url" >&2
cmp "$expected" "$actual" >&2 || true
exit 1
