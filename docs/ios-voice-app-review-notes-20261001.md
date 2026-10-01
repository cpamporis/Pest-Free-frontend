# App Review notes draft — Pestify 1.4.0 voice field entry

Supply a real reviewer account and demo appointment before submitting. Do not put
credentials in this repository. The following is a draft for App Store Connect;
it has not been sent to Apple.

Pestify is a work application for pest-control technicians. The optional voice
entry feature lets a technician inspect bait stations without touching the phone
with contaminated gloves. It is available in the map screens of rodent-control
and certification appointments, after starting work.

The technician selects bait/dose defaults and explicitly taps “Έναρξη ακρόασης”
(Start listening). iOS requests microphone and speech-recognition permissions.
The app returns to the map and displays an active listening indicator/status.

The app uses AVAudioEngine and Apple's on-device Greek speech recognizer. Every
recognition request requires on-device recognition; there is no cloud fallback.
Audio and transcripts are transient in memory, are not written to files and are
not sent by the app to a speech service. Only structured inspection fields are
retained in the appointment and submitted through the existing work completion.
This feature does not identify a speaker or build voice profiles.

Background audio mode supports actual microphone input during this explicitly
started field session, including with the screen locked. The technician can say
“Αλέρτ” (Alert), wait for “Έτοιμος” (Ready), then “Σταθμός δύο, κατανάλωση είκοσι
πέντε” (Station two, consumption twenty-five). After spoken readback, the station
check is entered automatically. “Κάτοψη δύο” selects floor plan two and announces
its administrator-entered name. Configure demo station/map numbers accordingly.

“Άκυρο” (Akýro / cancel), spoken while listening, stops microphone input even in
wake waiting. Alternatively reopen “Ηχογράφηση” and tap “Διακοπή”. Previously
completed entries remain. Closing the work screen or an audio interruption also
stops the session. It never restarts automatically after app termination. Microphone
buffers are discarded during synthesized readback; commands are spoken afterwards.

Recognition requires Greek on-device support on the test device. If unavailable,
the feature reports that it cannot start; ordinary manual inspection remains usable.
The app is not a Siri integration and does not claim low-power wake detection.

## Owner metadata checks before submission

- Supply reviewer login and a demo appointment with named maps and known BS stations.
- Confirm the current App Privacy answers and privacy policy describe this optional
  microphone use accurately. Do not automatically mark audio as collected merely
  because the microphone is used locally, and do not certify the whole app's
  privacy declarations from this feature alone.
- Existing privacy/legal files were not edited by this release preparation.
- Add a short real-device demonstration if needed, including locked-screen use
  and the visible stop action; never record real customer information for review.

Relevant Apple review guidance checked on 2026-10-01:
https://developer.apple.com/app-store/review/guidelines/
Sections 2.5.4 and 2.5.14 address intended background-service use and consent/
recording indications. These notes explain the implementation; approval remains
Apple's decision and has not been obtained for the new production build.
