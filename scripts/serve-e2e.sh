#!/bin/sh
# Local loop: build once, run this, then `PW_REUSE_SERVER=1 pnpm test:e2e`.
export PORT=3100 DATABASE_URI=file:./data/e2e.db PAYLOAD_SECRET=e2e-secret-not-for-production \
  NEXT_PUBLIC_SITE_URL=http://localhost:3100 ENABLE_TEST_API=1 E2E=1
exec node scripts/start-e2e.mjs
