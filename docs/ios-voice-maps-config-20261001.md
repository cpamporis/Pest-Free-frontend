# iOS Security Lab: voice floor plans and configurable field engine (v4)

Current controls/build instructions: [ios-voice-recording-ui-20261001.md](ios-voice-recording-ui-20261001.md).
The user confirmed this v4 functionality on iPhone.

## Confirmed baseline

The user verified v3 “Αλέρτ” activation and station entry in the background,
including a spoken rejection for nonexistent stations. V4 preserves the same
native audio engine, local Greek recognition, final-only wake matching, background
audio capability, TTS/microphone separation, watchdogs and rearming protocol.
Foreground continuous capture and its native module are unchanged.

## Floor plan rules

- The voice screen lists “Κάτοψη 1: <admin name>”, “Κάτοψη 2: <admin name>”, etc.
  Numbers follow the customer's current map list, not database IDs or station ranges.
- “Κάτοψη δύο” reads “Κάτοψη 2, Υπόγειο” (the actual administrator-entered name).
  After successful readback, it selects that map without creating a station record,
  restarting the microphone, clearing defaults or closing voice entry.
- A station number present on the active map always refers to that map. Thus two
  maps may each have station 1: explicitly select the desired map first.
- If absent on the active map, a number found in exactly one other map automatically
  selects that map and stores the check there. The readback includes the new map name.
- If found on multiple other maps, ask for a map; do not select the first match.
  Unknown stations/maps and duplicate identities do not create records.
- Only BS stations in the current customer's active appointment context participate.
  Voice map navigation works in both the foreground and field voice controllers.
- All existing consumption, condition/access, bait/dose, short readback and automatic
  commit rules apply. A normal check still needs consumption; “Σταθμός 101” alone
  is not a complete normal check.
- Revalidate source work/visit/technician/map, target identity, expiry and station
  presence before and after speech. A reordered/renamed target map invalidates a
  pending explicit map selection. A stop during readback cannot switch or commit.
- Parent upsert receives the validated target map explicitly, preventing the old
  UI selection from overriding the new station's map ID. Manual upserts retain
  their existing selected-map default. Saved rows remain separated by map+type+ID.

## Native configuration (one build now, Metro edits afterwards)

`src/voice/fieldVoiceConfig.js` is passed to `configureField` before native start.
The native method requires an idle, foreground Lab app, all five known fields,
and validates the entire dictionary before replacing any setting:

| Field | Default | Native bounds |
| --- | --- | --- |
| wakePhrases | Αλέρτ / Alert | 1–8 nonempty normalized phrases, at most 80 UTF-16 units each |
| readyMessage | Έτοιμος | Nonblank, at most 160 UTF-16 units |
| idleSeconds | 60 | 15–300, finite number, not boolean |
| silenceSeconds | 1.4 | 0.7–3, finite number, not boolean |
| captureSeconds | 20 | 5–45, finite number, not boolean |

Unknown fields, missing fields or invalid values reject the whole update and
prevent JS from starting capture. Configuration is fixed during each session.
Stop the session, edit the JS config, reload Metro, then restart to apply changes.
The optional foreground-only wake preview remains controlled by its existing
`configureWakePreview` bridge method and switch, with no persistence/cloud calls.
Changing permissions, frameworks, native audio behaviour or validation bounds
still requires a new build. No dependency, backend, production or backup changes.

## Build and run

```powershell
cd "C:\Users\chris\PestFree\Security iOS Lab"
git pull --ff-only origin feature/ios-lab-voice-probe-20261001
npx eas-cli build --platform ios --profile security-lab-field
```

Install the new build; then:

```powershell
$env:APP_VARIANT = "development"
$env:PESTIFY_VOICE_LAB = "1"
$env:PESTIFY_VOICE_FIELD_LAB = "1"
npx expo start --dev-client -c
```

Runtime: `pestify-field-lab-4`; native `wakeVersion=4`, `configurationVersion=1`.
OTA remains disabled for the Lab. Existing binaries are detected and the UI asks
for the new field build; foreground mode remains available.

## Validation and device acceptance

203 automated tests passed, including map routing, ambiguous/missing stations,
map changes during readback, terminal checks with null fields, preserved defaults,
consecutive map-then-station commands without restarting the field session,
configuration-before-capture ordering, rejection and cancellation during setup.
JS iOS export and native prebuild were checked separately. The new Objective-C
source was copied into the generated Xcode target. This workspace has no Apple
SDK or authenticated EAS build session: signed native compilation and device
acceptance must run through the owner's EAS/iPhone.

On device, first visibly then locked/background:
1. Alert -> station on current map -> existing short readback and correct values.
2. “Κάτοψη δύο” -> actual name -> “Σταθμός ένα, κατανάλωση 25”. Verify map 2 row;
   a previous map 1 / station 1 row must remain intact.
3. From map 1, request a unique station 101 on map 2. Verify map announcement,
   new selection and stored map ID. Follow with a shared station number.
4. Request a number missing here but present on two other maps: no selection or
   entry until explicitly choosing a map. Test an unknown map and station.
5. Missing, damaged and no-access checks on the newly selected map need no
   consumption/bait/dose; ordinary checks retain session bait/dose.
6. Pause, wake, idle return, termination, interruptions and offline recognition
   should behave as in v3. Inspect the completed work report for map association.
7. Later, change one bounded JS setting and reload Metro: confirm the same
   installed binary accepts it. Restore the default before field trials.
