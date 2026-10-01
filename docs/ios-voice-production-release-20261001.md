# Pestify iOS voice — production release preparation

Status: prepared on `release/ios-voice-production-20261001`, based on production
main `09c5459d59bba81c3fe0197482e082edf209cd70`. No main merge, EAS build,
submission, OTA publication, server deployment or production data writes performed.
The owner confirmed the v5 Lab flow and certification extension on iPhone.

## What is included

Only the tested map voice functionality for myocide and certification:
- Ηχογράφηση toolbar and styled settings, bait/dose defaults, return to map while
  listening, local Greek Alert/Άκυρο, condition/access and automatic readback/save.
- Explicit map selection, unique-station routing and current-map priority for
  shared numbers. Certification voice applies only to map checks.
- Existing completion/report path; no migrations or new backend endpoints.
- Local on-device requests only, no speech upload or audio/transcript files.
- Explicit start, permission prompts, active indicator, stop button and native stop
  phrase. Work/context change, interruption and unmount retain fail-closed behaviour.

Technician Home remains byte-identical to production: no Lab diagnostic button.
The legacy diagnostic capture methods remain Lab-gated in the native permissions
module; production uses its permission/capability methods and the field engine.
Production native activation requires the production bundle AND PestifyVoiceEnabled.
No Lab API URL, token-storage key, login/auth, legal document, payment, materials,
backup, package.json or lockfile changes are included.

## Build identity and isolation

| Setting | Existing production | Voice candidate |
| --- | --- | --- |
| Profile | production | production-voice (extends production) |
| Bundle | com.cpamporis.pestfree | com.cpamporis.pestfree |
| Marketing version | current app.json: 1.3.0 | planned 1.4.0 |
| Runtime | existing appVersion policy | pestify-ios-voice-1 |
| OTA channel | production | production-voice |
| Native voice plugin | absent | withPestifyVoice |
| Backend/auth storage | production baseline | exactly unchanged |

The new profile inherits remote auto-increment. Verify 1.4.0 is available in App
Store Connect before the first signed upload; it is a proposed next release based
on main's 1.3.0, not a claim about unseen App Store Connect state.

Voice requires a new binary. Do NOT attempt to introduce it through an OTA to old
installations. The separate runtime/channel prevents compatible-runtime confusion.
Existing profile and channel configuration are unchanged. Updates to the new voice
binary must use both the voice env and its channel; none have been published here.
Lab flags or a development bundle are rejected in the voice release config, and
EAS Android builds cannot use the iOS voice flag.

## Review/checkout (Windows)

Keep the Security iOS Lab folder on its tested branch. Use a separate checkout:

```powershell
git clone --single-branch --branch release/ios-voice-production-20261001 https://github.com/cpamporis/Pest-Free-frontend.git "C:\Users\chris\PestFree\Production iOS Voice"
cd "C:\Users\chris\PestFree\Production iOS Voice"
git status --short --branch
```

Install the repository's declared dependencies as in the existing production
workflow, without upgrading packages. No dependency edits are needed by this change.
Clear inherited Lab settings before resolving the release configuration:

```powershell
$env:APP_VARIANT = "production"
$env:PESTIFY_VOICE_ENABLED = "1"
$env:PESTIFY_VOICE_LAB = "0"
$env:PESTIFY_VOICE_FIELD_LAB = "0"
```

After reviewing the candidate and confirming release metadata, the owner can build:

```powershell
npx eas-cli build --platform ios --profile production-voice
```

No `--auto-submit`. After successful build, submit the EXACT returned build ID to
App Store Connect for TestFlight (do not use `--latest` across Lab/production jobs):

```powershell
npx eas-cli submit --platform ios --profile production-voice --id <EXACT_BUILD_ID>
```

Use only an internal tester first. The production bundle uses production accounts
and data and replaces the installed production app on that test iPhone; Pestify Dev
is a separate bundle and remains separate. Use a designated test organization and
appointments, not real customer work. No test organization was created here.

## Gates before a public release

1. Signed compilation and TestFlight installation; permissions denied/granted and
   Greek local model unavailable -> clear failure, manual workflow still usable.
2. Both services: start, auto-return, consecutive station entries, defaults,
   missing/damaged/no-access, map names and duplicate numbers, report accuracy.
3. Locked/background Alert, station entries, Άκυρο both during command listening
   and during wake waiting; prior entries retained. Stop/leave/log out/interruption
   must close input; failed readback must not commit.
4. Offline speech after data/models are available. Do not equate local recognition
   with guaranteed offline server submission or a complete offline application.
5. Sustained-noise and two-hour battery/thermal trial. Lab success does not establish
   long-session endurance on every device; no endurance measurements are invented.
6. Review App Store permission/privacy descriptions and supply an actual reviewer
   account with demo maps/stations. See the accompanying App Review notes draft.
7. After owner acceptance, merge/reconcile this branch with the then-current main
   and choose the approved App Store release. Neither action has been performed.

## Rollback

Before publication, retain the currently published build; reject the candidate if
acceptance fails. The new binary cannot be removed from users by reverting JS or
changing the old production channel. For a released voice binary, a reviewed
compatible JS update can hide the optional entry point, or a replacement store
build can disable it; this requires a separate authorized action. Do not change
backend schema or restore backups for this frontend-only feature.

## Checks performed

195 tests passed: production auth/endpoint/feature regression tests plus voice
parsing, routing, default handling, stop/readback isolation and release config gates.
The count differs from Lab because Lab-specific build and foreground diagnostic
controller tests are not part of this production candidate.

iOS JS export and clean native prebuild passed. Verified production bundle, 1.4.0,
PestifyVoiceEnabled=true, absence of Lab flag, audio background mode, microphone and
speech purpose strings, both Objective-C sources in Sources, and Speech/AVFoundation
frameworks. No Apple SDK/native compilation, signed build or device test was run here.
