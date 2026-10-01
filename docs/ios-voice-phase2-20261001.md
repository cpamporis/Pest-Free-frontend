# Security iOS Lab — phase 2: scoped station entry and spoken confirmation

For subsequent bait/dose defaults and immediate condition/access shortcuts, see
`ios-voice-defaults-20261001.md`, which supersedes the restrictions below.

Phase 1 user acceptance: the user installed the development build and confirmed
Greek recognition with different consumption values, including while offline.
This establishes recognition on that device, not background/wake-word support.

## Scope and UI

Start a myocide appointment, select its floorplan, and tap
**Lab: Φωνητική καταχώριση στην ενεργή κάτοψη** (below the work action buttons).
The entry is only present in the native Lab build during active new work. It is
excluded while editing a map, saving, or editing a completed visit.

1. Tap **Νέα φωνητική εντολή** and say `Σταθμός δέκα, κατανάλωση είκοσι πέντε`.
2. Tap **Τέλος ομιλίας**. Only one BS station with that number on the current
   floorplan can match. Other plans and device types are never fallback matches.
3. The existing station form opens with consumption filled in. Complete/review
   bait, dosage, condition and access, then tap **Φωνητική επιβεβαίωση**.
   This button prepares a candidate; it does not log the station yet.
4. The app reads the floorplan, number, consumption, bait, dosage and status.
   Recording begins only after read-back finishes. Say exactly **Αποθήκευση** or
   **Ακύρωση**, then tap **Τέλος ομιλίας** if needed. A complete replacement station
   command is a correction that returns to the form and requires new confirmation.
5. Confirmed data enters the same `loggedStations` state as a manual station form.
   The ordinary work-completion flow sends it to the server. The voice response
   deliberately says **Καταχωρίστηκε στην τρέχουσα εργασία**, not server-saved.

This phase is not fully hands-free: missing mandatory fields are completed using
the existing form. It does not invent bait, dosage, access or condition defaults.
Only functional, accessible BS checks are supported; use the existing manual
workflow for missing/damaged/inaccessible stations. Consumption follows the form's
existing choices (0, 25, 50, 75, 100 percent), dosage its 10–100g choices. The
standalone diagnostic still accepts arbitrary integer percentages for testing.

## Identity and cancellation

Pending identity includes appointment, customer, technician, visit and stable
floorplan ID plus BS station ID. The station is re-resolved before committing.
Duplicate identities, missing stations or changed context fail closed. The
candidate expires after 60 seconds, starting when read-back is prepared.
Unrecognized confirmation, capture error, app background/lock, explicit cancel,
closing or unmounting discards it. A candidate is consumed before the parent
callback, so duplicate result events cannot append a second entry. Per-capture
tags reject delayed events from a previous capture or screen instance.

## Native build

This phase adds Apple AVSpeechSynthesizer read-back and request tags to the
existing Lab-only module. No new npm dependencies. A NEW native development
build is required; the phase-1 binary shows an explanatory message instead of
running the new flow. OTA remains disabled. Runtime: `pestify-voice-probe-2`.

```powershell
cd "C:\Users\chris\PestFree\Security iOS Lab"
git pull --ff-only origin feature/ios-lab-voice-probe-20261001
npx eas-cli build --platform ios --profile security-lab-voice
```

Install the resulting Pestify Dev build and run:

```powershell
$env:APP_VARIANT = "development"
$env:PESTIFY_VOICE_LAB = "1"
npx expo start --dev-client -c
```

## Verification and device gate

Automated tests: 137 passed, covering map/type isolation, duplicate numbers,
context changes, expired candidates, required fields and exact confirmation
commands, plus the previous Lab suite. Expo iOS prebuild and JS export pass.
Native compilation/signing and phase-2 device behaviour require the new build;
there is no Apple SDK in the development workspace.

On a disposable Lab appointment with two maps containing station 1, verify:
- Correct map/number/bait/dosage are read back; there is no microphone capture
  while the app speaks. Repeated tests must not recognize the app's own speech.
- No station entry exists before spoken confirmation. Confirm once and inspect
  the current work entry; repeat with cancel, unrelated speech and corrections.
- Change maps and test station 1 again: the previous map's entry stays separate.
- Close, lock, background or interrupt during read-back/confirmation: no entry
  should be committed, and the microphone must turn off.
- Complete the Lab work through the existing save action and inspect its report.
- With the JS bundle loaded, disable Wi-Fi/cellular and test recognition and
  Greek read-back again. Phase-1 offline success does not validate new TTS.

No production, backend, backup, Android or Web changes are included. No new API,
audio file writes, transcript logging or biometric identification is introduced.
The separate diagnostic's optional temporary-text preview is unchanged. No wake
phrase, background recognition or screen-locked field mode is implemented yet.

## Native crash fix (2026-10-01)

The first phase-2 binary crashed when starting a command. Inspection found that
`setRequestTag:` was both the exported React Native method and the setter for the
Objective-C property `requestTag`. Its `self.requestTag = ...` assignment called
itself indefinitely. The backing property is now `captureRequestTag`; the bridge
method name and event field remain unchanged. A regression check fails on the
original source and passes on the corrected source, guarding exported methods
against property-setter collisions. The full JS/static suite passes 138 tests.
This check is not a physical-device native execution test. A new development
build is required; Metro reload cannot replace the faulty native binary.
