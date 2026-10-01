# iOS Security Lab — phase 1 offline Greek voice probe

Based on production-parity iOS commit `96b92c5bf95798b91e1a1c0e448223c33a916dd2`.
This is a diagnostic prototype, not a complete hands-free field mode. No backend,
backup, Android, Web, package.json, or lockfile changes are part of this phase.

## What it does

A button on the technician home opens a separate Lab diagnostic. The native
module is included only by the `security-lab-voice` build profile, with bundle
identifier `com.cpamporis.pestfree.dev`. It checks the actual iPhone's `el-GR`
`SFSpeechRecognizer.supportsOnDeviceRecognition`. A request also sets
`requiresOnDeviceRecognition = YES`; unsupported/unavailable recognition fails
closed. There is no cloud fallback or external speech SDK.

The user explicitly grants Speech and Microphone permissions, then starts a
capture lasting at most 20 seconds, with up to 3 additional seconds for a final
result. They can end speech early or cancel. Backgrounding/locking, an audio
interruption, closing the diagnostic, and unmounting stop capture. No wake phrase,
background audio entitlement, read-back, voice confirmation, or station writes
are implemented in this phase.

Audio buffers and the final transcript exist transiently in memory. The native
module passes the final string directly to a strict Greek command parser; the UI
retains only station number and consumption in component memory. This feature
has no file writes, analytics, transcript logging, API calls, or voiceprints.
It does not promise that no audio processing occurs: local processing is exactly
what is being tested. Developer debugging/recording of sensitive speech should
not be enabled during the device trial.

Example: `Δολωματικός σταθμός δέκα, κατανάλωση είκοσι πέντε` yields `10`, `25%`.
Numbers 1–999 and integer consumption 0–100 are supported; unrelated text,
ambiguous commands and out-of-range values are rejected. This strict prototype
is not a general Greek language parser. Results are previews with no floorplan
selected and cannot be saved as inspection data.

## Windows / EAS development build

This adds native code: Expo Go and EAS Update cannot install the feature. The
profile disables OTA updates and uses runtime `pestify-voice-probe-1` to avoid
mixing this native prototype with ordinary builds. A new development build is
required. EAS/Apple account, signing and build-plan requirements still apply;
no paid speech API is introduced, which does not imply every build is free.
The Dev bundle can replace an existing Pestify Dev installation on the device.

From the iOS Lab checkout, with existing dependencies installed and the EAS CLI
available:

```powershell
git status --short --branch
git remote set-branches --add origin feature/ios-lab-voice-probe-20261001
git fetch origin
git switch -c feature/ios-lab-voice-probe-20261001 --track origin/feature/ios-lab-voice-probe-20261001
eas build --platform ios --profile security-lab-voice
```

If the working tree has edits, preserve them before switching branches. Do not
use `reset --hard`. Install the resulting internal development build on the
registered iPhone, then start Metro from this same checkout:

```powershell
$env:APP_VARIANT = "development"
$env:PESTIFY_VOICE_LAB = "1"
npx expo start --dev-client
```

Log in as a Lab technician, then open **Lab: δοκιμή ελληνικής φωνής**.
This standalone diagnostic does not depend on new backend endpoints or schema
migrations. It still uses the existing app's authentication. A Git sync is not
proof that the separate Lab backend deployment or migrations have completed.

## Device acceptance gate

1. Record iPhone model and iOS version, plus the four capability/permission
   statuses shown on screen. Do not collect actual customer conversations.
2. Grant permissions and speak the example, then tap **Τέλος ομιλίας**. Confirm
   preview `10`, `25%`, and that the orange microphone indicator turns off.
3. Try `Σταθμός 101, κατανάλωση 100` and unrelated/ambiguous speech. Invalid
   commands must not produce a numeric preview.
4. Confirm cancellation, closing, locking, and switching apps stop the microphone.
   Return to the app: capture must require another explicit start.
5. Test denied permissions, silence, repeated captures, and an audio interruption.
6. Verify offline recognition. With a development client, start the trial while
   the JS bundle is already loaded, then disable Wi-Fi and cellular without
   reloading. A fully isolated offline launch requires a separately prepared
   embedded-bundle internal build; this development profile expects Metro.
7. A negative on-device capability or offline failure is a valid diagnostic
   result. Do not enable a server fallback silently. Decide next whether to
   evaluate a bundled Greek offline model (size, licence, accuracy, dependencies).

Native compilation, signing, physical-device recognition, offline behaviour,
battery impact and interruption timing require this actual-device gate. Linux
prebuild generation and JS export cannot establish these properties.

## Subsequent phases

After feasibility is established, build a session controller whose context is
`appointment ID + stable floorplan ID + device type + device ID`. Spoken labels
resolve within that context; a duplicate/ambiguous station must trigger a
clarification, never silently select the first match. Then add read-back and
explicit confirmation through the existing inspection save path.

Evaluate an iOS background audio session and a local wake detector separately,
including Apple lifecycle/review constraints, battery, phone calls, Bluetooth
and a two-hour real field trial. A third-party app is not Siri and cannot promise
to relaunch after force-quit just because a phrase was spoken. Only after that
trial should the proposed one-minute inactivity/wake-phrase workflow be accepted.
Other device types can reuse the session controller with type-specific grammars
and validation; the present prototype handles only bait-station numbers.

## Validation in this change

- Existing + new automated JS tests: 102 passed.
- Expo iOS JS export: passed.
- Expo iOS prebuild using the installed local template: passed; verified source
  added to Sources, Speech/AVFoundation linked, and permissions/flag in Info.plist.
- Native Xcode build and physical iPhone acceptance: pending; no Apple SDK here.
- Dependencies and backup-related files unchanged.
