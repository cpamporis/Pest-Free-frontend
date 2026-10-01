# Security iOS Lab — certification map voice entry

CertificationServiceScreen's MapScreen now uses the existing v5 VoiceStationFlow.
No native, dependencies, backend or backup changes; reload Metro on the installed
v5 Dev build. The user confirmed the same controls in myocide before this change.

- Recording toolbar button requires active work and a selected map image. No
  recording start is offered for certification without a floor plan.
- Same settings, bait/dose defaults, persistent hidden settings Modal, background
  Alert, station routing, named map selection and Άκυρο/stop behaviour as myocide.
- Voice applies only to BS map checks. It cannot populate certification narrative,
  treated areas, chemicals, photos, billing or certificate-generation fields.
- Target map is passed explicitly to the certification upsert; voice saves suppress
  the manual success alert. Ordinary manual saves keep their existing behaviour.
- Bait/dose defaults also prefill new manual BS forms for this work; existing station
  values take precedence. Defaults reset at work/customer/technician changes.
- Work completion uses the existing certification save/report path. Leaving the
  owner screen, invalidating work context or losing the map stops the voice session.

Validation: existing 207 tests passed and iOS JS export passed. Check on iPhone:
start certification work with a map, choose voice defaults, start and return to map;
enter consecutive checks, select another map, test a shared station number, stop
with Άκυρο, then inspect the certificate/report. Verify treated-area and chemical
fields stay unchanged, and no recording button appears for a customer without maps.

```powershell
cd "C:\Users\chris\PestFree\Security iOS Lab"
git pull --ff-only origin feature/ios-lab-voice-probe-20261001
$env:APP_VARIANT = "development"
$env:PESTIFY_VOICE_LAB = "1"
$env:PESTIFY_VOICE_FIELD_LAB = "1"
npx expo start --dev-client -c
```
