# Security Lab administrator MFA and session UI

Status: implemented for the Security Lab branch only. Do not merge, publish an
Expo update, or point this build at production until the runtime gates below
have passed.

## User policy represented by the UI

| Role/state | Login experience |
| --- | --- |
| Simple admin, not enrolled | `MFAScreen.js` is shown when the backend returns the first or 30-day enrollment offer. The admin may configure Google Authenticator or defer. |
| Simple admin, enrolled | The backend requests TOTP on a new device or after that device's fixed seven-day grant expires. |
| Super admin | Enrollment cannot be deferred and every new session requires TOTP or a one-use recovery code. |
| Technician/customer | Existing login flow is unchanged. |

The 30-day and seven-day decisions are server controlled. The client does not
use a local timer to decide whether MFA is due.

## Session timer

- Every admin and super-admin authentication result must include a server
  session object.
- The floating timer derives its value from `accessTokenExpiresAt` and appears
  on root admin screens and every native admin modal.
- Refresh occurs only when the user presses the timer.
- A successful refresh must retain the same session ID and absolute expiry and
  must increase `refreshVersion`.
- A network failure does not reset the display. A 401, secure-storage failure,
  invalid refresh response, or zero remaining time returns the user to login.
- The backend's immutable eight-hour boundary remains authoritative.

## Credential storage

- Native access tokens and per-admin trusted-device grants use Expo
  SecureStore with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
- Normal logout removes the access token but intentionally retains an
  unexpired seven-day device grant. The grant alone cannot authenticate; the
  password is still required.
- Super-admin responses containing a trusted-device token are rejected.
- Web builds use same-origin browser storage because SecureStore is native
  only. Before a browser client is approved for production, prefer moving the
  trusted-device grant to a Secure, HttpOnly, SameSite cookie and complete an
  XSS-focused review.

## Security Lab verification gates

1. Deploy only the matching Security Lab backend branch and apply migration
   005 only to the marked Security Lab database.
2. Build this frontend branch with the Security Lab API origin and confirm it
   refuses the production backend hostname.
3. Test existing and newly created simple admins: first offer, defer, and exact
   30-day server reminder.
4. Test two devices for one enrolled admin: each device must establish its own
   grant, and the grant must stop bypassing TOTP after seven days.
5. Confirm every super-admin password login produces an MFA challenge and that
   no trusted-device value is stored for that role.
6. Confirm the timer remains visible on all admin screens and nested modals.
7. Confirm one press rotates the token and resets the access window to at most
   15 minutes without changing the absolute expiry.
8. Confirm offline refresh leaves the old countdown running, and expiry,
   invalid/stale tokens, and the eight-hour cap all return to login.
9. Re-run frontend tests, Android/iOS bundles, backend tests, and the final
   read-only database audit.

No production deploy, Expo update, migration, or merge is part of this branch.
