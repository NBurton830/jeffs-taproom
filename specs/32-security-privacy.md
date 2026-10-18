# 32 — Security, Privacy & Abuse

- **SEC-001 (P0)** Order pricing and validation happen only on the server (CHK-050).
- **SEC-002 (P0)** Staff routes and APIs require an authenticated role (KDS-001/002, ADM-001). Payload access control
  denies public read of `orders`, `inquiries`, `users` and unapproved `challenge-entries`.
- **SEC-003 (P0)** Rate limits are per IP: `POST /api/orders` allows 5 per 10 min, and `POST /api/inquiries` allows 3
  per 10 min. Over the limit returns `429` with a `Retry-After` header. (In-memory store for single-node. The interface
  allows Redis/Valkey.)
- **SEC-004 (P0)** A honeypot field `website` on public forms. Bots that fill it get a success-looking response, but
  nothing is stored.
- **SEC-005 (P0)** Security headers: `Content-Security-Policy` (self + OSM tiles), `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic off), and
  `frame-ancestors 'none'` except for Payload live preview.
- **SEC-006 (P0)** The public order status endpoint never exposes PII (TRK-007).
- **SEC-007 (P1)** Customer PII on orders older than 180 days is redacted by a daily job (the phone becomes `***-0123`
  and the email is removed). Tests trigger it with `POST /api/test/jobs/redact-pii`. A privacy policy at `/privacy` states this.
- **SEC-008 (P0)** _(manual: verified by the Docker image start-up check)_ `/api/test/*` returns 404 unless **both** `ENABLE_TEST_API=1` and `E2E=1` are set. The production
  Docker image refuses to start if either is set.
- **SEC-009 (P0)** Admin and KDS cookies are `HttpOnly`, `Secure` (in prod) and `SameSite=Lax`. Login is rate limited
  (Payload `maxLoginAttempts: 5`, `lockTime: 10 min`).
- **SEC-010 (P1)** All user text (notes, names) is rendered escaped (no `dangerouslySetInnerHTML` with user content).
