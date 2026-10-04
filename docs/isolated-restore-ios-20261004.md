# Isolated restore iOS client — 2026-10-04

This branch is ONLY for the detached runtime-ios worktree under the user's
local restore directory. Do not merge into main or a deployed Lab branch,
publish an EAS update, or create a production build from this branch.

The API is pinned to https://192.168.1.71:43818. Login checks the exact restore
identity before sending the entered credentials. Auth token, MFA device token,
legacy cleanup key and web session channel use separate restore-only names.
The login screen identifies the backup test. APP_VARIANT must be development;
updates are disabled and the API rejects a non-development JS bundle.
No authentication, MFA, or image authorization bypass is added.

Dependencies/package lock are unchanged. Metro watches runtime-ios and only
the real node_modules junction target, never the parent restore directory
(which contains database files and runtime secrets).

Keep the isolated backend and HTTPS bridge running. The phone must first
trust the exact temporary root certificate and load the restore identity over
HTTPS with no certificate warning. Start the installed Expo CLI in this
worktree on port 8088 with --dev-client --lan --clear. The Metro development
bundle uses its normal LAN development transport; application API/login/image
traffic uses the verified HTTPS bridge. Scope any new Windows firewall rule
for Metro port 8088 to local 192.168.1.71 and remote 192.168.1.234.

Use Pestify Dev to scan/open THIS Metro session. Log in with the original
Security Lab Organization D administrator and normal MFA. Open Backup Test
Customer and both original maps A/B. New C must be absent. Client code setup,
API health and marker checks alone do not prove application runtime success.

After testing, stop this Metro, stop the bridge and temporary database,
remove only the temporary firewall rules and iPhone root profile, and return
Pestify Dev to the original Security iOS Lab Metro session.
