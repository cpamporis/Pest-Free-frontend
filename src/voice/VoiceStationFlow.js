import React, { useEffect, useRef, useState } from 'react';
import { AppState, Button, NativeEventEmitter, NativeModules, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import BaitStationForm from '../components/BaitStationForm';
const { contextKey, resolveStation, confirmation, validateCandidate } = require('./stationVoiceSession');
const native = Platform.OS === 'ios' ? NativeModules.PestifyVoiceProbe : null;
export const voiceLabAvailable = Boolean(native?.labEnabled);
const errors = {
  STATION_NOT_FOUND: 'Δεν υπάρχει αυτός ο δολωματικός σταθμός στην ενεργή κάτοψη.',
  AMBIGUOUS_STATION: 'Ο αριθμός δεν προσδιορίζει μοναδικό σταθμό. Ελέγξτε την κάτοψη.',
  CONTEXT_CHANGED: 'Άλλαξε η εργασία ή ο σταθμός. Η εντολή ακυρώθηκε.',
  INACTIVE_CONTEXT: 'Ξεκινήστε εργασία σε συγκεκριμένο ραντεβού και επιλέξτε κάτοψη.',
  INCOMPLETE_DATA: 'Για αυτή τη φάση απαιτείται λειτουργικός, προσβάσιμος σταθμός, δόλωμα, ποσότητα και κατανάλωση 0, 25, 50, 75 ή 100%. Για άλλη κατάσταση χρησιμοποιήστε την κανονική φόρμα.',
  EXPIRED: 'Έληξε η επιβεβαίωση. Επαναλάβετε την εντολή.',
};
export default function VoiceStationFlow({ context, loggedStations, technician, onCommit, onClose }) {
  const current = useRef({ context, loggedStations, onCommit });
  current.current = { context, loggedStations, onCommit };
  const [phase, setPhase] = useState('idle');
  const stage = useRef('idle');
  const requestTag = useRef(null);
  const requestCounter = useRef(0);
  const instanceTag = useRef(`${Date.now()}-${Math.random()}`);
  const [status, setStatus] = useState('Πείτε «Σταθμός δέκα, κατανάλωση είκοσι πέντε».');
  const [form, setForm] = useState(null);
  const [pending, setPending] = useState(null);
  const candidate = useRef(null);
  const sequence = useRef(0);
  const alive = useRef(true);
  const expiry = useRef(null);
  const mountedKey = useRef(contextKey(context));
  function change(next) { stage.current = next; setPhase(next); }
  function reset(message) {
    sequence.current++; requestTag.current = null; native?.stop(); clearTimeout(expiry.current);
    candidate.current = null; setPending(null); setForm(null); change('idle'); setStatus(message);
  }
  useEffect(() => {
    alive.current = true;
    const sub = new NativeEventEmitter(native).addListener('PestifyVoiceProbeResult', event => {
      if (!alive.current || !['command','confirm'].includes(stage.current) || event.requestTag !== requestTag.current) return;
      requestTag.current = null;
      const previous = stage.current; change('idle');
      if (event.code !== 'RESULT') { reset('Η ακρόαση δεν ολοκληρώθηκε. Η εντολή ακυρώθηκε.'); return; }
      if (previous === 'command') { handleCommand(event.text); return; }
      const action = confirmation(event.text);
      if (action === 'cancel') { reset('Ακυρώθηκε.'); return; }
      if (action === 'save') { commit(); return; }
      // A complete replacement command is a correction, never an implicit save.
      const replacement = resolveStation(current.current.context, event.text);
      if (replacement.ok) { handleCommand(event.text); return; }
      reset('Δεν ακούστηκε «Αποθήκευση» ή «Ακύρωση». Δεν καταχωρίστηκε τίποτα.');
    });
    const app = AppState.addEventListener('change', value => {
      if (value !== 'active' && stage.current !== 'permissions') reset('Η φωνητική εντολή ακυρώθηκε επειδή η εφαρμογή δεν είναι ενεργή.');
    });
    return () => { alive.current = false; sequence.current++; requestTag.current = null; native?.stop(); clearTimeout(expiry.current); sub.remove(); app.remove(); };
  }, []);
  useEffect(() => {
    if (contextKey(context) !== mountedKey.current || !context.active) {
      reset(errors.CONTEXT_CHANGED); onClose();
    }
  }, [contextKey(context), context.active]);
  async function listen(mode) {
    requestTag.current = `${instanceTag.current}-${++requestCounter.current}`;
    native.setRequestTag(requestTag.current);
    change(mode);
    setStatus(mode === 'confirm' ? 'Ακούω: «Αποθήκευση», «Ακύρωση» ή νέα πλήρη εντολή.' : 'Ακούω τον σταθμό και την κατανάλωση. Πατήστε «Τέλος ομιλίας» αφού μιλήσετε.');
    const token = sequence.current;
    try { await native.start(); }
    catch { if (alive.current && sequence.current === token) reset('Δεν ξεκίνησε η τοπική αναγνώριση. Ελέγξτε τις άδειες και τη διαθεσιμότητα.'); }
  }
  async function start() {
    reset('Έλεγχος αδειών…'); change('permissions');
    const token = sequence.current;
    try {
      const caps = await native.requestPermissions();
      if (!alive.current || sequence.current !== token) return;
      if (!caps.onDevice || !caps.available || !caps.speechAuthorized || !caps.microphoneAuthorized || AppState.currentState !== 'active') {
        reset('Η τοπική αναγνώριση ή οι άδειες δεν είναι διαθέσιμες.'); return;
      }
      await listen('command');
    } catch { if (alive.current && sequence.current === token) reset('Δεν ολοκληρώθηκε ο έλεγχος αδειών.'); }
  }
  function handleCommand(text) {
    reset('Συμπληρώστε τα υπόλοιπα στοιχεία πριν από τη φωνητική επιβεβαίωση.');
    const c = current.current.context;
    const target = resolveStation(c, text);
    if (!target.ok) { setStatus(errors[target.code] || 'Δεν αναγνωρίστηκε έγκυρη εντολή σταθμού.'); return; }
    if (!['0%','25%','50%','75%','100%'].includes(target.consumption)) { setStatus(errors.INCOMPLETE_DATA); return; }
    const existing = current.current.loggedStations.filter(s => String(s.mapId ?? s.map_id ?? '') === String(c.map.mapId ?? c.map.map_id) && String(s.stationId) === String(target.stationId) && s.stationType === 'BS');
    if (existing.length > 1) { setStatus(errors.AMBIGUOUS_STATION); return; }
    setForm({ target, data: { ...(existing[0] || {}), consumption: target.consumption } });
    change('form');
  }
  async function prepare(data, target) {
    const c = current.current.context;
    const value = { ...target, expiresAt: Date.now() + 60000, data: { ...data, mapId: String(c.map.mapId ?? c.map.map_id), mapName: c.map.name || null, visitId: c.visitId } };
    const valid = validateCandidate(c, value);
    setForm(null);
    if (!valid.ok) { reset(errors[valid.code] || 'Μη έγκυρα στοιχεία.'); return; }
    candidate.current = value; setPending(value); change('speaking');
    const message = `Κάτοψη ${c.map.name || value.data.mapId}. Σταθμός ${value.stationId}. Κατανάλωση ${value.data.consumption}. Δόλωμα ${value.data.baitType}, ${value.data.dosage_g} γραμμάρια. Λειτουργικός και προσβάσιμος. Μετά το τέλος της εκφώνησης πείτε Αποθήκευση για καταχώριση στην τρέχουσα εργασία, ή Ακύρωση.`;
    setStatus(message);
    expiry.current = setTimeout(() => { if (alive.current) reset(errors.EXPIRED); }, 60000);
    const token = sequence.current;
    try {
      const spoken = await native.speak(message);
      if (!alive.current || sequence.current !== token) return;
      if (!spoken) { reset('Η εκφώνηση διακόπηκε. Δεν καταχωρίστηκε τίποτα.'); return; }
      await listen('confirm');
    } catch { if (alive.current && sequence.current === token) reset('Δεν ολοκληρώθηκε η ελληνική εκφώνηση. Δεν καταχωρίστηκε τίποτα.'); }
  }
  function commit() {
    const value = candidate.current;
    const valid = validateCandidate(current.current.context, value);
    if (!valid.ok) { reset(errors[valid.code] || 'Μη έγκυρη επιβεβαίωση.'); return; }
    // Consume before calling the parent: repeated callbacks cannot write twice.
    candidate.current = null; clearTimeout(expiry.current); sequence.current++; native.stop();
    try {
      current.current.onCommit(value);
      setPending(null); change('idle');
      setStatus('Καταχωρίστηκε στην τρέχουσα εργασία. Η τελική αποθήκευση στον server γίνεται με την ολοκλήρωση της εργασίας.');
      native.speak('Καταχωρίστηκε στην τρέχουσα εργασία.').catch(() => {});
    } catch { reset('Η καταχώριση δεν έγινε. Ελέγξτε την εργασία και επαναλάβετε.'); }
  }
  const compatible = native?.phase >= 2 && typeof native?.speak === 'function' && typeof native?.setRequestTag === 'function';
  return <SafeAreaProvider><SafeAreaView style={{flex:1,backgroundColor:'#fff'}}><ScrollView contentContainerStyle={{padding:22,gap:18}}>
    <Text style={{fontSize:22,fontWeight:'700'}}>Φωνητική καταχώριση — Lab</Text>
    <Text>Ραντεβού: {context.appointmentId}{'\n'}Κάτοψη: {context.map?.name || 'Χωρίς όνομα'} ({context.map?.mapId ?? context.map?.map_id}){'\n'}Συσκευές: δολωματικοί σταθμοί (BS)</Text>
    <Text>Επιλέξτε άλλη κάτοψη από την οθόνη μυοκτονίας. Η εντολή αναζητά σταθμό μόνο εδώ. Η οθόνη παραμένει ανοικτή.</Text>
    <Text>{compatible ? status : 'Απαιτείται το νέο Dev build της φάσης 2 για φωνητική εκφώνηση και επιβεβαίωση.'}</Text>
    {pending && <Text>Προς καταχώριση: σταθμός {pending.stationId}, κατανάλωση {pending.data.consumption}, {pending.data.baitType}, {pending.data.dosage_g}g.</Text>}
    <Button title="Νέα φωνητική εντολή" onPress={start} disabled={!compatible || phase !== 'idle'} />
    {['command','confirm'].includes(phase) && <Button title="Τέλος ομιλίας" onPress={() => native.finishInput()} />}
    {phase !== 'idle' && <Button title="Ακύρωση εντολής" onPress={() => reset('Ακυρώθηκε.')} />}
    <Button title="Επιστροφή στην κάτοψη" onPress={() => { reset(''); onClose(); }} />
  </ScrollView>
    {form && phase === 'form' && <BaitStationForm key={String(form.target.stationId)} stationId={form.target.stationId}
      customerId={context.customerId} technician={technician} timerData={null}
      existingStationData={form.data} submitLabel="Φωνητική επιβεβαίωση"
      onStationLogged={data => prepare(data, form.target)}
      onClose={() => { if (stage.current === 'form') reset('Η συμπλήρωση ακυρώθηκε.'); }} />}
  </SafeAreaView></SafeAreaProvider>;
}
