#!/usr/bin/env bash
# Applies every migration in order to the database in $1 (a libpq connection string/URI). Used by CI and local runs.
set -euo pipefail
for f in "$(dirname "$0")"/migrations/*.sql; do psql "$1" -q -v ON_ERROR_STOP=1 -f "$f"; done
