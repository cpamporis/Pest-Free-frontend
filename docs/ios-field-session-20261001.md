# Security iOS Lab — optional background/wake-phrase experiment

The user confirmed correct consecutive station entries, their data and final
report in the foreground prototype. This next phase is a separate opt-in native
module and build profile. The existing phase-3 foreground controller and native
module remain available unchanged.

## Architecture and limits

`PestifyFieldSession` starts only from the visible Lab app, after explicit user
activation, with an active appointment/map and selected bait/dose. The native
module requires the Dev bundle, a dedicated Info.plist flag, both microphone and
Speech permission, and AVAILABLE ON-DEVICE recognizers for `en-US` and `el-GR`.
Every recognition request sets `requiresOnDeviceRecognition=YES`. No cloud
fallback, external speech SDK or npm dependency is added.

A genuine PlayAndRecord audio session and running input engine keep the field
session active with `UIBackgroundModes: audio`. This is real microphone use,
not silent audio playback to keep arbitrary work alive. The input engine remains
active during wake waiting and TTS; during TTS and JS processing its buffers are
discarded and no recognition request receives them. No audio files are written.
While waiting, an English on-device recognizer accepts ONLY a complete final
utterance normalizing to `pestify alert`, with that contextual hint. It does not
accept substrings, fuzzy variants or partial hypotheses. Actual recognition of
the brand phrase MUST be tested on the device; the hint is not a guarantee.

This is NOT a dedicated low-power keyword detector or Siri integration. Waiting
still uses full local speech recognition. Battery, heat, route behaviour and
long-session reliability need device measurements; no two-hour endurance claim
is made. The system cannot restart a force-quit app on hearing a phrase. App Store
review acceptance has not been established by this internal experiment.

## State flow

- Start in wake waiting; lock the phone only after testing the phrase visibly.
- Exact `Pestify Alert` -> native Greek TTS **Έτοιμος** -> Greek command capture.
- Native recognition, endpointing, timeout and capture rearming use native timers,
  not JS timers. Endpointing uses the same 1.4-second quiet/transcript threshold
  as the foreground prototype. Twenty-second boundaries discard unfinished
  speech. No partial transcript becomes station data.
- One final Greek command is handed to JS with session and command IDs. JS reuses
  the active-context resolver, station defaults and validation. Native read-back
  completes, then JS revalidates and commits through the existing parent
  `upsertLoggedStation` path; it acknowledges the command so native can rearm.
- Native watchdogs stop the session if JS does not respond/acknowledge within 10s
  or if TTS does not complete within 30s. Therefore background JS suspension
  causes a visible stop on return, not indefinite hidden microphone use or a
  deliberately deferred station commit.
- After 60 seconds since the last accepted command, return to wake waiting when
  the capture is idle (no recognized speech and a quiet interval). No in-progress
  command/read-back is interrupted by this inactivity check. Sustained sound can
  delay reaching that idle point; test factory noise separately.
- While command mode is active, **Παύση** / **Ακύρωση** returns to wake waiting.
  **Τερματισμός** / **Σταμάτημα** closes the session and microphone. In wake waiting,
  first say `Pestify Alert` before a termination command, or use the visible stop
  button. These commands do not undo already committed checks.
- Phone/audio interruptions, connecting/disconnecting an audio device, media
  reset, closing the screen/component or context change stop the session. It
  never resumes automatically after interruption or app relaunch.

Spoken text exists only transiently in memory. Neither controller logs/persists
transcripts or makes speech-network calls. `loggedStations` and final work
completion retain their current persistence behaviour. No server deployment,
backup changes, production changes or dependency changes are included.

## New build profile and installation

`security-lab-field` extends `security-lab-voice`, uses the Dev bundle, disables
OTA and selects runtime `pestify-field-lab-1`. Only this profile includes the new
module, background audio mode and its explicit microphone usage text. The normal
voice profile still selects runtime `pestify-voice-probe-3` and its original
foreground native module. Build from the managed checkout (generated /ios is not
committed); do not reuse a hand-modified generated Xcode directory across profiles.

```powershell
cd "C:\Users\chris\PestFree\Security iOS Lab"
git pull --ff-only origin feature/ios-lab-voice-probe-20261001
npx eas-cli build --platform ios --profile security-lab-field
```

Install this new Pestify Dev build, then start Metro:

```powershell
$env:APP_VARIANT = "development"
$env:PESTIFY_VOICE_LAB = "1"
$env:PESTIFY_VOICE_FIELD_LAB = "1"
npx expo start --dev-client -c
```

Inside active myocide work, choose a map, open voice entry, set bait/dose, enable
**Δοκιμαστική λειτουργία πεδίου — Pestify Alert**, and press **Έναρξη συνεδρίας
Pestify Alert**. Enabling the switch alone does not open the microphone.

## Device acceptance gate (not yet completed)

1. Visible screen: say `Pestify Alert`, wait for **Έτοιμος**, then enter a Lab
   station. Verify that unrelated conversation in wake mode creates no entry.
2. Lock the iPhone while waiting. Repeat the phrase, wait for **Έτοιμος**, speak
   three valid station commands and wait for each short read-back.
3. Stay quiet for over a minute, speak a station command alone (must not enter
   data), then wake explicitly and enter another station.
4. Say **Παύση**, wake again, then **Τερματισμός**. Verify the microphone indicator
   turns off and the phrase no longer activates anything until a new UI start.
5. Unlock and inspect actual station values and map identity. Finish the Lab work
   through the usual operation and inspect its report.
6. Test interruption, audio-route change, offline operation after bundle/model
   availability, and sustained noise. If the session stops, note the displayed
   reason code. Do not assume the background bridge works until this is observed.
7. Only after correctness, run an endurance trial with a charged phone and record
   device/iOS, starting and ending battery, duration, wake misses and false wakes.

Validation here: 187 automated tests passed, including stale/duplicate field
commands, stop/interruption/context changes during read-back, pause/termination,
and build-profile opt-in isolation. iOS prebuild and JS export passed; verified
new source in Sources and the field flag/audio mode in Info.plist. Physical native
compilation, signed installation, lock-screen recognition, exact wake accuracy
and endurance remain pending because this workspace has no Apple SDK/device.

Primary platform references:
- https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/record
- https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/playandrecord
- https://developer.apple.com/documentation/speech/sfspeechrecognizer/supportsondevicerecognition
- https://developer.apple.com/documentation/speech/sfspeechrecognitionrequest/requiresondevicerecognition
