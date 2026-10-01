# iOS Lab — bait defaults, condition and access commands

For the subsequent automatic read-back/commit loop and native build requirements,
see `ios-voice-continuous-20261001.md`, which supersedes the form/confirmation steps.

Supersedes the functional/access-only restrictions in the phase-2 notes.
JS-only update; compatible with the corrected phase-2 native build (1485fe8).
No native, dependency, backend, production or backup changes.

## Setup

After starting work and opening voice entry, select a bait from the existing
`getBaitTypes()` catalog and a dosage (10–100g in the existing 10g increments).
Neither is selected silently. Confirm **Χρήση προεπιλογών**. These preferences
live in the active MyocideScreen instance, survive leaving voice entry and
changing maps, and reset on work start/stop or appointment/customer/technician
change. They are not persisted across leaving the appointment/restarting the app.

Every new voice form uses this bait/dose, access Yes and condition Functional.
An ordinary manually opened new BS form also uses these defaults after setup;
an existing manual entry still keeps its recorded values. Voice re-entry builds
fresh values from the new command/defaults, so an old damaged/no-access check
cannot accidentally override a new normal observation. Changing the defaults
affects subsequent forms, not previously logged stations.

## Commands

- `Σταθμός 2, κατανάλωση 25`: opens the fully prefilled normal form. The existing
  spoken confirmation path is retained for normal entries.
- `Σταθμός 2, κατάσταση λειτουργικό, πρόσβαση ναι, κατανάλωση 25`: same explicit
  normal entry. Functional adjective forms in different genders are accepted.
- `Σταθμός 2, κατάσταση λείπει`: immediately records Missing, access Yes, no
  bait/dosage/consumption, and announces the result. No extra form or confirmation.
- `Σταθμός 2, κατάσταση κατεστραμμένο` (or `κατεστραμμένος`): same shortcut with
  Damaged. No extra form or confirmation.
- `Σταθμός 2, πρόσβαση όχι`: immediately records access No, condition null and
  bait/dosage/consumption null. This matches the existing no-access form rule.
- `Σταθμός 2`: opens a normal form with bait/dose/status defaults but consumption
  still empty. Zero consumption is never invented.

Fields can be spoken in different orders. Duplicate, unknown or ambiguous values
are rejected. No-access takes precedence over a condition, just as in the manual
form. A valid numeric consumption spoken with a terminal condition is discarded;
all irrelevant bait fields are explicitly cleared. These shortcuts were explicitly
requested to complete without further input. They still validate station identity,
active appointment/map/type and expiry through the same parent commit gate.

Results enter current `loggedStations`; the ordinary completion operation saves
the work to the backend. Recognition remains foreground-only, on-device, with no
new transcript/audio persistence. Defaults need the catalog to load initially;
recognition does not acquire a cloud fallback when the catalog is unavailable.

## Validation

162 tests pass, including condition/access variants, ambiguous phrases, complete
null clearing, default selection, context/expiry rejection and existing Lab tests.
Expo iOS JS export passes. Device acceptance: choose PRORAT 50 PASTA / 20g where
available, try a normal entry then each shortcut, reopen the affected stations,
switch maps with duplicate station numbers, and verify a new work session asks
for defaults again. Changing defaults must not rewrite previous observations.

```powershell
git pull --ff-only origin feature/ios-lab-voice-probe-20261001
$env:APP_VARIANT = "development"
$env:PESTIFY_VOICE_LAB = "1"
npx expo start --dev-client -c
```
