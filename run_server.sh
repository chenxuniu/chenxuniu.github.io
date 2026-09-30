#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Reuse the dependency bundle installed for this local workspace.
if ! bundle check >/dev/null 2>&1; then
  if [[ -z "${BUNDLE_PATH:-}" && -d /tmp/chenxu-jekyll-bundle ]]; then
    export BUNDLE_PATH=/tmp/chenxu-jekyll-bundle
    export BUNDLE_USER_HOME="${BUNDLE_USER_HOME:-/tmp/chenxu-bundler-home}"
  fi
fi

bundle check
exec bundle exec jekyll serve --host 127.0.0.1 --port "${PORT:-4000}" --watch "$@"
