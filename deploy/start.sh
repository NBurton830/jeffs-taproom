#!/bin/sh
set -e
# SEC-008: the test API must never be reachable in production.
if [ -n "$ENABLE_TEST_API" ] || [ -n "$E2E" ]; then
  echo "Refusing to start: ENABLE_TEST_API / E2E must not be set in production." >&2
  exit 1
fi
pnpm payload migrate
exec pnpm start
