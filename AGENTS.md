# AGENTS.md

Purpose: This file is the living memory for this repo. Keep it short, factual, and updated.

Update rules:
- After each non-trivial task, add a bullet to Progress Log.
- When you learn or change an architectural or integration detail, add it under the relevant notes.
- When you ask the user a question or need follow-up, add it to Open Questions and remove/mark resolved once answered.
- Do not record secrets or sensitive data.

## Project Snapshot
- Next.js App Router prototype for Aspire - Archicava Case Inference Studio.
- Live mode uses Ratio1 Edge Node services.

## Architecture Notes
- Case and job data flows through `lib/data-platform.ts` and the Ratio1 SDK.
- Ratio1 Edge SDK client is created in `lib/ratio1-client.ts` (CStore/R1FS + peers).
- Data keys: `platformConfig.casesHKey` and `platformConfig.jobsHKey`.

## Auth & Security Notes
- Live auth uses `@ratio1/cstore-auth-ts` in `lib/auth/cstore.ts` (`simple.init()` + `simple.authenticate()`).
- Session cookie is signed (HMAC) in `r1-session` (see `lib/auth/session.ts`); set `AUTH_SESSION_SECRET` in prod.
- Auth UI caches sessions in `aspire-session` localStorage for client-side reloads.
- Authenticated pages gate via `useAuth` in `app/(authenticated)/layout.tsx`; admin APIs validate the session cookie.

## Env Vars
- `R1EN_CHAINSTORE_API_URL` / `R1EN_R1FS_API_URL` set endpoints; `R1EN_CHAINSTORE_PEERS` optional.
- `R1EN_CSTORE_AUTH_HKEY`, `R1EN_CSTORE_AUTH_SECRET`, `R1EN_CSTORE_AUTH_BOOTSTRAP_ADMIN_PWD` (legacy: `EE_CSTORE_AUTH_HKEY`, `EE_CSTORE_AUTH_SECRET`, `EE_CSTORE_AUTH_BOOTSTRAP_ADMIN_PW`) for CStore auth.
- `AUTH_SESSION_SECRET` is required in production for signed sessions.
- `AUTH_SESSION_COOKIE`, `AUTH_SESSION_TTL_SECONDS` override session cookie settings.

## Progress Log
- 2025-12-23: Initial project review and created AGENTS.md with auth + architecture notes.
- 2025-12-23: Added signed session cookies, server-side auth checks, and updated docs/login copy.
- 2026-01-10: Fixed admin page error handling type guard to unblock Next.js build.
- 2026-01-10: Added `.env.example` with documented environment variables.
- 2026-01-10: Reviewed upstream `cstore-auth-ts` implementation for integration risks.
- 2026-01-10: Corrected CStore auth bootstrap env var names in docs and `.env.example`.
- 2026-01-10: Removed demo-mode credentials and UI references.
- 2026-01-10: Removed demo env vars from `.env`.
- 2026-01-10: Removed mock-mode code paths and configuration.
- 2026-01-10: Updated login button label to remove dAuth mention.
- 2026-01-10: Added live admin user management page and `/api/users` endpoints.
- 2026-01-10: Added admin password-change form on the user management page.
- 2026-01-10: Added account page for self-service password changes and linked it in the nav.
- 2026-01-11: Renamed the product in UI metadata, landing pill, and README.
- 2026-01-11: Updated footer brand copy to Aspire - Archicava Inference Studio.
- 2026-01-11: Swapped navbar branding to AspireLogo.svg, wired favicon metadata, and filled in the web manifest.
- 2026-01-11: Removed navbar brand text to show only the logo.
- 2026-01-12: Renamed the ASD program extension section to Aspire.
- 2026-01-12: Updated research insights headline to Aspire product decisions.
- 2026-01-12: Enlarged the navbar SVG logo size fourfold.
- 2026-01-12: Matched the navbar logo height to nav elements and removed square styling.
- 2026-01-12: Updated predictive lab copy to Aspire probability scenarios.
- 2026-01-13: Added condensed Romanian user and technical documentation files.
- 2026-02-04: Replaced em dashes with ASCII hyphens across UI copy and docs.
- 2026-02-04: Added a mock client download page and navbar link.
- 2026-02-04: Moved the account link to the username in the navbar.
- 2026-02-04: Removed the credential security heading from the account page.
- 2026-02-04: Removed introductory copy from the download page hero and header card.
- 2026-02-04: Removed the hero card from the download page to reduce unused space.
- 2026-02-04: Removed system notes and tightened spacing on the download page.
- 2026-02-04: Tightened the download page layout using the existing content only.
- 2026-02-04: Simplified the download card copy to only show the download button.
- 2026-02-04: Reorganized download page layout to align the button with release info.
- 2026-02-04: Refined the download page spacing and typography for a tighter layout.
- 2026-02-04: Centered the download card and reordered the release info with the button below.
- 2026-02-04: Compressed download page spacing and typography to be more compact.
- 2026-02-04: Redesigned the download page layout for a more professional, tech-styled presentation.
- 2026-02-04: Reduced vertical spacing on the download page for a tighter layout.
- 2026-02-04: Restyled the download page to mirror the Predictive Lab layout pattern.
- 2026-02-04: Placed the download button inline with the download client header.
- 2026-02-04: Tightened spacing between the Release info label and details.
- 2026-02-04: Reduced padding and gaps on the download page cards and release rows.
- 2026-02-04: Centered the download content inside a single narrow card layout.
- 2026-02-04: Reduced bottom padding on the download page to tighten footer spacing.
- 2026-02-04: Set download page grid items to align to the start to prevent stretching.
