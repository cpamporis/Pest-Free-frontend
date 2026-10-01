# iOS Lab — continuous foreground voice entry

Supersedes the normal-form/confirmation steps in the preceding phase-2 and
voice-defaults notes. User authorized automatic entry after short read-back.

## Behaviour

Choose the existing bait/dose defaults, then tap **Έναρξη συνεχόμενης ακρόασης**
once. Say one complete command, e.g. `Σταθμός δύο, κατανάλωση είκοσι πέντε`, then
pause. The app reads only `Σταθμός 2, κατανάλωση 25%.`, commits the numeric check
to the current work, and automatically listens for another station. There is no
station form, confirmation word, end-speech button or next-command button.

Missing/damaged/no-access commands use their existing null-clearing rules and a
similarly short read-back before committing. Normal checks use the selected bait
and dose plus Functional / access Yes. Incomplete commands do not invent
consumption; unknown station numbers, ambiguity and unsupported values trigger
a short repetition prompt with no commit. The existing 0/25/50/75/100 percentages
remain in force.

Say **Παύση**, **Σταμάτημα** or **Ακύρωση**, or press **Παύση ακρόασης**, to stop.
These commands pause the loop; they do not undo previously committed checks.
Closing, locking, backgrounding and interruptions stop the session. Start must
be pressed again after a stop. The screen must remain open; no wake phrase or
background field mode has been introduced.

## Native endpointing

New `startAutomatic` enables partial hypotheses internally, only to detect that
speech has occurred and track when the text last changed. Audio is metered in
memory at roughly 10Hz. When both metered audio activity (threshold ~-40dBFS)
and transcript changes have been quiet for at least 1.4 seconds, capture ends.
Only a FINAL recognition result is sent to the parser; partial hypotheses are
never committed. Recognition's own final result can end the utterance earlier.

The 20-second safety bound discards a speech capture that did not end cleanly;
it does not save a truncated command. Twenty seconds with no recognized speech
rearms the listener automatically. A capture/finalization error stops the loop
rather than retrying endlessly. The existing final-result grace period is 3s.
Noise above the fixed threshold may delay endpointing until the safety limit;
real factory/field trials are needed to tune this prototype's threshold.

The microphone is closed before read-back begins. The controller waits for
successful speech completion, revalidates the active context and station, commits
once, then allows 250ms for acoustic decay before starting the next capture.
Tagged capture events, state guards and cancellation epochs reject late/duplicate
results. Stop during read-back or a failed/interrupted read-back prevents that
pending check from committing. No separate 'saved' utterance follows a success.

`loggedStations` remains the storage path. Final server persistence still occurs
with the ordinary completion of the work; automatic voice entry does not submit
the whole appointment on every station. No new audio/transcript logging, file
storage, cloud recognition fallback, dependency or backend/backup change.

## Build and validation

A NEW development build is required for native automatic endpointing. Phase-2
binaries show an upgrade message. Profile stays `security-lab-voice`; runtime is
`pestify-voice-probe-3`. OTA stays disabled.

```powershell
cd "C:\Users\chris\PestFree\Security iOS Lab"
git pull --ff-only origin feature/ios-lab-voice-probe-20261001
npx eas-cli build --platform ios --profile security-lab-voice
```

Install the new Pestify Dev, then run the same Metro command:

```powershell
$env:APP_VARIANT = "development"
$env:PESTIFY_VOICE_LAB = "1"
npx expo start --dev-client -c
```

177 automated tests pass, including continuous-session tests for ordering,
read-back cancellation, stale/duplicate events, changed context, silent rearming,
voice pause and failure handling. iOS prebuild and JS export pass. No local Apple
SDK is available: native compilation and physical-device endpointing/echo tests
remain required. Do not equate prebuild with native runtime validation.

Device trial: enter three real Lab station numbers consecutively without touching
buttons; verify consumption and exactly one entry per station. Pause during
read-back and verify that pending entry is absent. Test missing/damaged/no-access,
unknown numbers, unrelated speech, silence longer than 20 seconds, lock/unlock,
a phone interruption, and offline operation with the JS bundle already loaded.
Wait for **Ακούω τον επόμενο σταθμό** before the next command. Check the resulting
Lab report after ordinary work completion. Repeat in representative background
noise before field use.
