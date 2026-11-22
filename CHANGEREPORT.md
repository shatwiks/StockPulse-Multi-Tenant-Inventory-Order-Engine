# Change Report

## 2026-11-22 07:16 IST — Automated Dependabot Security Updates

### Objective
Enable automated weekly GitHub Dependabot vulnerability & dependency updates across repository package ecosystems.

### Files Created
- `.github/dependabot.yml` — Configured weekly Dependabot monitoring for `npm` (/, /backend, /frontend), `github-actions`.

### Verification Results
- `yaml.safe_load(.github/dependabot.yml)` — PASS.

---

## 2026-11-22 07:10 IST — Pre-LinkedIn Production Security Hardening

### Objective
Harden public repository, API middleware, authentication, CORS, error handling, and CI workflow permissions prior to public LinkedIn sharing.

### Files Modified & Created
- `backend/src/middleware/auth.ts` — Enforced fail-closed production startup validation requiring `JWT_SECRET` (`>= 32` chars, non-default).
- `backend/src/server.ts` — Disabled `x-powered-by`, enabled `trust proxy` in production, tightened Helmet (`frameguard: deny`, `referrerPolicy`, prod `hsts`), and added strict auth rate limiter (`25 req / 15 min` in production) on `/api/v1/auth`.
- `.github/workflows/ci.yml` — Added least-privilege `permissions: contents: read`.
- `SECURITY.md` — Added responsible vulnerability disclosure policy.

### Verification Results
- `node --check --experimental-strip-types` on `auth.ts` and `server.ts` (PASS), `yaml.safe_load(.github/workflows/ci.yml)` (PASS).
