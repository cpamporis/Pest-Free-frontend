# Pestify Dev: iOS image test in Security Lab

Candidate source branch: `security-lab-g2-private-uploads-20260924`.
Backend candidate branch: `security-lab-g2-private-uploads-20260924` in
`cpamporis/field-inspections-backend`, based on Lab commit `ebf17853`.
This is a test plan, not evidence of a device test or a backend deployment.

## Target and launch

- `APP_VARIANT=development` selects `Pestify Dev`, bundle ID
  `com.cpamporis.pestfree.dev`, and the `development` EAS profile/channel.
- This source uses only
  `https://security-lab-security-lab.up.railway.app/api` and Lab auth keys.
- A Git branch does not change the running API. The Railway `Security Lab`
  service currently follows the backup branch. Deploy the candidate backend
  to that service only after the first scheduled backup and receipt have been
  verified, or use a fully isolated test service with synthetic data and its
  own uploads volume. Avoid creating a second backup producer.
- On the computer that hosts the development server, check out this exact iOS
  branch, run `npm ci`, then set `APP_VARIANT=development` and run
  `npx expo start --dev-client -c`. Open the installed **Pestify Dev** app on
  the iPhone and connect it to that development server. The iPhone must be able
  to reach that server. This does not publish an EAS Update.
- Confirm that the installed dev build has the required native Expo runtime.
  Rebuild the development app with `eas build --profile development --platform
  ios` if its native dependencies/SDK are older than this source. No native
  dependencies were added by this image candidate.

## Test with synthetic Lab users and images

1. Confirm the app label/bundle ID and that login requests reach the Lab API.
   Use a synthetic account; log in again if an old dev client session is stale.
2. Upload a new image from iOS, attach it to a customer request or service
   log, reopen it in the thumbnail and full-screen viewer, then relaunch the
   app and reopen it. Test a customer map preview as well.
3. Repeat with another synthetic organization and a second user in the same
   organization. An owner should see the image; an unrelated user or tenant
   should not. Test customer, technician, admin and super admin where their
   respective image category applies.
4. Verify that the image URL without an Authorization header returns 401; a
   valid account without resource access receives 404. On logout, the viewer
   should close; after token revocation, a fresh image request must fail.
5. Check a newly uploaded photo after the backend cutover. A successful POST
   alone tests upload; the protected GET is what tests G2 image delivery.

The backend's resource SQL still needs a read-only check against the actual
synthetic Lab schema before deployment. Neither this source nor its unit tests
prove that the currently installed iPhone app or running Lab backend uses
these branches. Existing public cache entries may linger on a device.
