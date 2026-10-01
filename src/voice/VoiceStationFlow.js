import React, { useEffect, useRef, useState } from 'react';
import { AppState, Button, NativeEventEmitter, NativeModules, Platform, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import apiService from '../services/apiService';
import { Picker } from '@react-native-picker/picker';
const { stationDraft } = require('./parseStationFields');
const { createFieldVoiceSession } = require('./fieldVoiceSession');
const { createContinuousVoiceSession } = require('./continuousVoiceSession');
const { contextKey, resolveStation, validateCandidate } = require('./stationVoiceSession');
const native = Platform.OS === 'ios' ? NativeModules.PestifyVoiceProbe : null;
const fieldNative = Platform.OS === 'ios' ? NativeModules.PestifyFieldSession : null;
export const voiceLabAvailable = Boolean(native?.labEnabled);
const errors = {
  STATION_NOT_FOUND: 'Δεν υπάρχει αυτός ο δολωματικός σταθμός στην ενεργή κάτοψη.',
  AMBIGUOUS_STATION: 'Ο αριθμός δεν προσδιορίζει μοναδικό σταθμό. Ελέγξτε την κάτοψη.',
  CONTEXT_CHANGED: 'Άλλαξε η εργασία ή ο σταθμός. Η εντολή ακυρώθηκε.',
  INACTIVE_CONTEXT: 'Ξεκινήστε εργασία σε συγκεκριμένο ραντεβού και επιλέξτε κάτοψη.',
  INCOMPLETE_DATA: 'Ελέγξτε δόλωμα, δοσολογία και κατανάλωση (0, 25, 50, 75 ή 100%).',
  INVALID_CONDITION: 'Πείτε κατάσταση λειτουργικό, λείπει ή κατεστραμμένο.',
  INVALID_ACCESS: 'Πείτε πρόσβαση ναι ή όχι.',
  EXPIRED: 'Έληξε η επιβεβαίωση. Επαναλάβετε την εντολή.',
};
export default function VoiceStationFlow({ context, loggedStations, technician, onCommit, onClose, defaults, onDefaultsChange }) {
  const current = useRef({ context, loggedStations, onCommit, defaults, technician });
  current.current = { context, loggedStations, onCommit, defaults, technician };
  const [baitTypes, setBaitTypes] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState('Φόρτωση δολωμάτων…');
  const [catalogReload, setCatalogReload] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(!defaults?.baitType || !defaults?.dosageG);
  const [baitChoice, setBaitChoice] = useState(defaults?.baitType || '');
  const [doseChoice, setDoseChoice] = useState(defaults?.dosageG || 0);
  const [fieldMode, setFieldMode] = useState(false);
  const fieldActive = useRef(false);
  const [phase, setPhase] = useState('idle');
  const [status, setStatus] = useState('Πατήστε έναρξη μία φορά και πείτε κάθε εντολή με μια σύντομη παύση στο τέλος.');
  const alive = useRef(true);
  const permissionAttempt = useRef(0);
  const permissionPrompt = useRef(false);
  const mountedKey = useRef(contextKey(context));
  const controller = useRef(null);
  const callbacks = {
    onState: (next,message) => { if (alive.current) { setPhase(next); setStatus(message); } },
    prepare: text => {
      const { context:c, defaults:d, loggedStations:logs, technician:tech } = current.current;
      const target = resolveStation(c,text);
      if (!target.ok) return {ok:false,message:errors[target.code] || 'Δεν αναγνωρίστηκε εντολή. Επαναλάβετε τον σταθμό και την κατανάλωση.'};
      if (logs.filter(s => String(s.mapId ?? s.map_id ?? '') === String(c.map.mapId ?? c.map.map_id) && String(s.stationId) === String(target.stationId) && s.stationType === 'BS').length > 1)
        return {ok:false,message:errors.AMBIGUOUS_STATION};
      const data = { ...stationDraft(target,d), mapId:String(c.map.mapId ?? c.map.map_id),mapName:c.map.name || null,
        visitId:c.visitId,customerId:c.customerId,technicianId:tech?.id,technicianName:tech?.name,timestamp:new Date().toISOString() };
      const value = { ...target,expiresAt:Date.now()+60000,data };
      if (!validateCandidate(c,value).ok) return {ok:false,message:'Πείτε σταθμό και κατανάλωση μηδέν, είκοσι πέντε, πενήντα, εβδομήντα πέντε ή εκατό.'};
      const detail = data.access === 'No' ? 'πρόσβαση όχι' : data.condition === 'Missing' ? 'κατάσταση λείπει' : data.condition === 'Damaged' ? 'κατάσταση κατεστραμμένο' : `κατανάλωση ${data.consumption}`;
      return {ok:true,candidate:value,readback:`Σταθμός ${value.stationId}, ${detail}.`};
    },
    validate: value => (AppState.currentState === 'active' || fieldActive.current) && contextKey(current.current.context) === mountedKey.current && validateCandidate(current.current.context,value).ok,
    commit: value => current.current.onCommit(value),
  };
  if (!controller.current) controller.current = createContinuousVoiceSession({native,...callbacks});
  const fieldController = useRef(null);
  if (!fieldController.current && fieldNative?.labEnabled) fieldController.current=createFieldVoiceSession({
    native:fieldNative,...callbacks,onActive:value=>{fieldActive.current=value;}
  });
  function pause(message) {
    permissionAttempt.current++;
    controller.current.stop(message);
    fieldController.current?.stop(message);
  }
  useEffect(() => {
    let active = true;
    setCatalogStatus('Φόρτωση δολωμάτων…');
    apiService.getBaitTypes().then(items => {
      if (!active) return;
      const names = [...new Set((Array.isArray(items) ? items : []).map(item => typeof item === 'string' ? item : item?.name).filter(name => typeof name === 'string' && name.trim()))];
      setBaitTypes(names); setCatalogStatus(names.length ? '' : 'Δεν υπάρχουν διαθέσιμα δολώματα.');
    }).catch(() => { if (active) { setBaitTypes([]); setCatalogStatus('Δεν φορτώθηκαν τα δολώματα. Ελέγξτε τη σύνδεση και επαναλάβετε.'); } });
    return () => { active = false; };
  }, [catalogReload]);
  useEffect(() => {
    alive.current = true;
    const sub = new NativeEventEmitter(native).addListener('PestifyVoiceProbeResult', event => { void controller.current.handleEvent(event); });
    const app = AppState.addEventListener('change', value => {
      if (!fieldActive.current && (value === 'background' || (value !== 'active' && !permissionPrompt.current))) pause('Η φωνητική λειτουργία σταμάτησε επειδή η εφαρμογή δεν είναι ενεργή.');
    });
    const fieldSub=fieldNative?.labEnabled ? new NativeEventEmitter(fieldNative).addListener('PestifyFieldEvent',event=>{void fieldController.current.handleEvent(event);}) : null;
    return () => { alive.current = false; permissionAttempt.current++; controller.current.stop(); fieldController.current?.stop(); sub.remove(); fieldSub?.remove(); app.remove(); };
  }, []);
  useEffect(() => {
    if (contextKey(context) !== mountedKey.current || !context.active) { pause(errors.CONTEXT_CHANGED); onClose(); }
  }, [contextKey(context), context.active]);
  async function start() {
    if (!current.current.defaults?.baitType || !current.current.defaults?.dosageG || settingsOpen) return;
    pause('Έλεγχος αδειών…'); setPhase('permissions');
    const token = permissionAttempt.current;
    permissionPrompt.current = true;
    try {
      const caps = await native.requestPermissions();
      if (!alive.current || token !== permissionAttempt.current) return;
      if (!caps.onDevice || !caps.available || !caps.speechAuthorized || !caps.microphoneAuthorized || AppState.currentState !== 'active') {
        pause('Η τοπική αναγνώριση ή οι άδειες δεν είναι διαθέσιμες.'); return;
      }
      if (fieldMode) await fieldController.current.start();
      else controller.current.start();
    } catch { if (alive.current && token === permissionAttempt.current) pause('Δεν ολοκληρώθηκε ο έλεγχος αδειών.'); }
    finally { permissionPrompt.current = false; }
  }
  const compatible = fieldMode ? Boolean(fieldNative?.labEnabled) : native?.phase >= 3 && typeof native?.startAutomatic === 'function';
  return <SafeAreaProvider><SafeAreaView style={{flex:1,backgroundColor:'#fff'}}><ScrollView contentContainerStyle={{padding:22,gap:18}}>
    <Text style={{fontSize:22,fontWeight:'700'}}>Φωνητική καταχώριση — Lab</Text>
    <Text>Ραντεβού: {context.appointmentId}{'\n'}Κάτοψη: {context.map?.name || 'Χωρίς όνομα'} ({context.map?.mapId ?? context.map?.map_id}){'\n'}Συσκευές: δολωματικοί σταθμοί (BS)</Text>
    <Text>Επιλέξτε άλλη κάτοψη από την οθόνη μυοκτονίας. Η εντολή αναζητά σταθμό μόνο εδώ. {fieldMode ? "Η συνεδρία ξεκινά εδώ και μπορεί να δοκιμαστεί με κλειδωμένη οθόνη." : "Η οθόνη παραμένει ανοικτή."}</Text>
    <Text>Χωρίς σχετική εντολή ισχύει Πρόσβαση: Ναι και Κατάσταση: Λειτουργικός. Μετά τη σύντομη επανάληψη καταχωρίζεται ο έλεγχος στην τρέχουσα εργασία και ακούω τον επόμενο. Η τελική αποθήκευση στον server γίνεται με την ολοκλήρωση εργασίας.</Text>
    {settingsOpen ? <View>
      <Text style={{fontWeight:'700'}}>Προεπιλογές για αυτή την εργασία</Text>
      <Text>{catalogStatus}</Text>
      <Picker accessibilityLabel="Προεπιλεγμένο δόλωμα" selectedValue={baitChoice} onValueChange={setBaitChoice}>
        <Picker.Item label="Επιλέξτε διαθέσιμο δόλωμα" value="" />
        {baitTypes.map(name => <Picker.Item key={name} label={name} value={name} />)}
      </Picker>
      <Picker accessibilityLabel="Προεπιλεγμένη δοσολογία" selectedValue={doseChoice} onValueChange={setDoseChoice}>
        <Picker.Item label="Επιλέξτε δοσολογία" value={0} />
        {[10,20,30,40,50,60,70,80,90,100].map(g => <Picker.Item key={g} label={`${g} g`} value={g} />)}
      </Picker>
      <Button title="Χρήση προεπιλογών" disabled={!baitTypes.includes(baitChoice) || !doseChoice || phase !== 'idle'} onPress={() => { onDefaultsChange({baitType:baitChoice,dosageG:doseChoice}); setSettingsOpen(false); }} />
      {!!catalogStatus && <Button title="Επαναφόρτωση δολωμάτων" onPress={() => setCatalogReload(n => n+1)} />}
    </View> : <View>
      <Text>Προεπιλογές: {defaults?.baitType} — {defaults?.dosageG}g</Text>
      <Button title="Αλλαγή προεπιλογών" disabled={phase !== 'idle'} onPress={() => setSettingsOpen(true)} />
    </View>}
    <View>
      <Text style={{fontWeight:'700'}}>Δοκιμαστική λειτουργία πεδίου — Pestify Alert</Text>
      <Switch accessibilityLabel="Λειτουργία πεδίου με ενεργό μικρόφωνο στην κλειδωμένη οθόνη" value={fieldMode} disabled={phase !== 'idle' || !fieldNative?.labEnabled} onValueChange={setFieldMode} />
      {!fieldNative?.labEnabled && <Text>Απαιτείται το νέο build security-lab-field.</Text>}
      {fieldMode && <Text>Το μικρόφωνο παραμένει ενεργό ακόμη και στην αναμονή και με κλειδωμένη οθόνη. Πείτε «Pestify Alert», περιμένετε «Έτοιμος» και δώστε εντολές. Μετά από ένα λεπτό αδράνειας επιστρέφει στην αναμονή. Όσο ακούει εντολές, «Παύση» επιστρέφει στην αναμονή και «Τερματισμός» κλείνει το μικρόφωνο. Στην αναμονή πείτε πρώτα «Pestify Alert». Δοκιμάστε πρώτα με την οθόνη ανοικτή.</Text>}
    </View>
    <Text>{compatible ? status : 'Απαιτείται το νέο Dev build της φάσης 3 για αυτόματο τέλος ομιλίας.'}</Text>
    <Text>{fieldMode ? "Περιμένετε να ολοκληρωθεί η εκφώνηση πριν πείτε την επόμενη εντολή." : "Μιλήστε όταν εμφανίζεται «Ακούω τον επόμενο σταθμό». Για παύση πείτε «Παύση» ή πατήστε το κουμπί."}</Text>
    <Button title={fieldMode ? "Έναρξη συνεδρίας Pestify Alert" : "Έναρξη συνεχόμενης ακρόασης"} onPress={start} disabled={!compatible || phase !== 'idle' || settingsOpen || !defaults?.baitType || !defaults?.dosageG} />
    {phase !== 'idle' && <Button title={fieldMode ? "Τερματισμός και κλείσιμο μικροφώνου" : "Παύση ακρόασης"} onPress={() => pause('Η ακρόαση σταμάτησε.')} />}
    <Button title="Επιστροφή στην κάτοψη" onPress={() => { pause(''); onClose(); }} />
  </ScrollView>
  </SafeAreaView></SafeAreaProvider>;
}
