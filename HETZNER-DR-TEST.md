# Isolated Pestify Dev test

Pending deployment; there is no live test API yet. This branch refuses production
build configuration, disables OTA updates and uses separate auth/session storage.
It starts from the production frontend to test the restored production schema.

Set APP_VARIANT=development, EXPO_PUBLIC_PESTIFY_TARGET=hetzner-dr-test and
EXPO_PUBLIC_HETZNER_API_ORIGIN to the reviewed dedicated HTTPS origin (no /api).
Use a separate checkout and the `hetzner-dr-test` EAS build profile for iOS.
Never run EAS Update against an existing development or production channel.
For an existing compatible development client, run Metro with these variables
and open that server explicitly; native compatibility still needs verification.

After server readiness, test login, MFA, private photos, reports, tenant isolation
and test-only writes. Inspect network traffic to confirm no production requests.
Do not use real MFA recovery codes for testing; TOTP enrollment is copied from
the backup, but sessions and trusted devices must be reset in the test database.
