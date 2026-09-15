# Production candidate administrator MFA and session UI

Status: local production release candidate. Do not merge, publish an Expo
update, create an App Store build, or contact production until the backend and
release gates below have passed and the owner has explicitly approved them.

## User policy represented by the UI

| Role/state | Login experience |
| --- | --- |
| Simple admin, not enrolled | MFAScreen.js is shown when the backend returns the first or 30-day enrollment offer. The admin may configure Google Authenticator or defer. |
| Simple admin, enrolled | The backend requests TOTP on a new device or after that device's fixed seven-day grant expires. |
| Super admin | Enrollment cannot be deferred and every new session requires TOTP or a one-use recovery code. |
| Technician/customer | Existing login flow is unchanged. |

The 30-day and seven-day decisions are server controlled. The client does not
use a local timer to decide whether MFA is due.

## Session timer

- Every admin and super-admin authentication result must include a server
  session object.
- The header-bound timer derives its value from accessTokenExpiresAt and
  appears on root admin screens and every native admin modal.
- Refresh occurs only when the user presses the timer.
- A successful refresh must retain the same session ID and absolute expiry and
  must increase refreshVersion.
- A network failure does not reset the display. A 401, secure-storage failure,
  invalid refresh response, or zero remaining time returns the user to login.
- The backend's immutable eight-hour boundary remains authoritative.

## Credential storage

- Native access tokens and per-admin trusted-device grants use Expo
  SecureStore with WHEN_UNLOCKED_THIS_DEVICE_ONLY.
- Normal logout removes the access token but intentionally retains an
  unexpired seven-day device grant. The grant alone cannot authenticate; the
  password is still required.
- Super-admin responses containing a trusted-device token are rejected.
- Web builds require a separate XSS and cookie-focused production review.

## Production release gates

1. Create and review production-specific backend configuration and migrations;
   never run the Lab-guarded migrations against production.
2. Take and validate a fresh production database backup immediately before any
   production schema change.
3. Deploy the compatible backend only in an explicitly approved maintenance
   window and verify health and schema before any administrator login.
4. Create a new iOS build for app version 1.3.0 and test it through TestFlight.
5. Confirm existing technician and customer clients remain unchanged.
6. Confirm updated admins receive 15-minute renewable access windows with the
   immutable eight-hour session cap.
7. Confirm optional administrator enrollment, the 30-day reminder, seven-day
   trusted-device grant, super-admin MFA on every session, replay protection,
   maximum attempts, expiry, recovery codes, logout, and audit events.
8. Activate administrator MFA modes only after the compatible client is ready
   and the owner gives explicit approval.
9. Merge only through a reviewed pull request with passing checks.

This candidate preparation performs no production deploy, Expo update,
migration, build, push, or merge.
