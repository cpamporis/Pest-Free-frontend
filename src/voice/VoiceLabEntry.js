import React, { useEffect, useRef, useState } from "react";
import { AppState, Button, Modal, NativeEventEmitter, NativeModules, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
const { parseGreekStationCommand } = require("./parseGreekStationCommand");
const probe = Platform.OS === "ios" ? NativeModules.PestifyVoiceProbe : null;
const messages = {
  GREEK_ON_DEVICE_UNAVAILABLE: "Η συσκευή δεν δηλώνει υποστήριξη τοπικής αναγνώρισης ελληνικών.",
  RECOGNIZER_UNAVAILABLE: "Η αναγνώριση δεν είναι διαθέσιμη αυτή τη στιγμή.",
  PERMISSION_REQUIRED: "Χρειάζονται άδειες μικροφώνου και αναγνώρισης ομιλίας από τις Ρυθμίσεις.",
  BACKGROUND_STOPPED: "Η δοκιμή σταμάτησε επειδή κλείδωσε το κινητό ή έκλεισε η οθόνη της εφαρμογής.",
  AUDIO_INTERRUPTED: "Η δοκιμή σταμάτησε λόγω διακοπής ήχου.",
  NO_FINAL_RESULT: "Δεν προέκυψε τελικό αποτέλεσμα. Δοκιμάστε ξανά.",
};
function Diagnostic({ onClose }) {
  const [caps, setCaps] = useState(null);
  const [status, setStatus] = useState("Έλεγχος δυνατοτήτων…");
  const [phase, setPhase] = useState("idle");
  const [result, setResult] = useState(null);
  const alive = useRef(true);
  const operation = useRef(0);
  useEffect(() => {
    const events = new NativeEventEmitter(probe);
    const subscription = events.addListener("PestifyVoiceProbeResult", event => {
      operation.current++;
      setPhase("idle");
      if (event.code === "RESULT") {
        // Keep only numeric parsed fields in memory. Never log/store the transcript.
        const parsed = parseGreekStationCommand(event.text);
        setResult(parsed.ok ? { stationNumber: parsed.stationNumber, consumption: parsed.consumption } : null);
        setStatus(parsed.ok ? "Αναγνωρίστηκε η εντολή. Δεν αποθηκεύτηκε έλεγχος." : "Δεν αναγνωρίστηκε έγκυρη εντολή. Πείτε μόνο το παράδειγμα.");
      } else { setResult(null); setStatus(messages[event.code] || "Η αναγνώριση δεν ολοκληρώθηκε."); }
    });
    const app = AppState.addEventListener("change", state => {
      if (state !== "active") {
        operation.current++;
        probe.stop(); setPhase(current => current === "permissions" ? current : "idle"); setResult(null);
        setStatus("Η δοκιμή σταμάτησε. Πατήστε έναρξη όταν επιστρέψετε.");
      }
    });
    probe.getCapabilities().then(value => {
      if (alive.current) { setCaps(value); setStatus("Πατήστε «Άδειες και έλεγχος» πριν από τη δοκιμή."); }
    }).catch(() => { if (alive.current) setStatus("Αδυναμία ελέγχου δυνατοτήτων."); });
    return () => { alive.current = false; operation.current++; probe.stop(); subscription.remove(); app.remove(); };
  }, []);
  async function permissions() {
    setPhase("permissions");
    try {
      const value = await probe.requestPermissions();
      if (!alive.current) return;
      setCaps(value);
      setStatus(!value.onDevice ? messages.GREEK_ON_DEVICE_UNAVAILABLE :
        !value.speechAuthorized || !value.microphoneAuthorized ? messages.PERMISSION_REQUIRED : "Έτοιμο για δοκιμή. Η έναρξη ενεργοποιεί το μικρόφωνο για έως 20 δευτερόλεπτα.");
    } catch { if (alive.current) setStatus("Αδυναμία ελέγχου αδειών."); }
    finally { if (alive.current) setPhase("idle"); }
  }
  async function start() {
    const token = ++operation.current;
    setResult(null); setPhase("recording"); setStatus("Ακούω έως 20 δευτερόλεπτα. Πείτε την εντολή και πατήστε «Τέλος ομιλίας».");
    try { await probe.start(); }
    catch (error) {
      if (alive.current && token === operation.current) { setPhase("idle"); setStatus(messages[error.code] || "Το μικρόφωνο δεν ξεκίνησε. Ελέγξτε τις άδειες και δοκιμάστε ξανά."); }
    }
  }
  function cancel() { operation.current++; probe.stop(); setResult(null); setPhase("idle"); setStatus("Η δοκιμή ακυρώθηκε και το μικρόφωνο έκλεισε."); }
  const ready = caps?.onDevice && caps?.speechAuthorized && caps?.microphoneAuthorized;
  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Δοκιμή φωνής — iOS Lab</Text>
    <Text>Φάση 1: έλεγχος ελληνικών στη συσκευή. Η οθόνη πρέπει να παραμένει ανοικτή. Δεν υπάρχει ακόμη ενεργοποίηση με «Pestify Alert».</Text>
    <Text>Ο ήχος και το κείμενο χρησιμοποιούνται προσωρινά στη μνήμη. Δεν αποθηκεύονται και δεν αποστέλλονται από αυτή τη δοκιμή. Δεν καταχωρίζεται πραγματικός έλεγχος σταθμού.</Text>
    <Text style={styles.example}>«Δολωματικός σταθμός δέκα, κατανάλωση είκοσι πέντε»</Text>
    {caps && <Text>Ελληνικά στη συσκευή: {caps.onDevice ? "Ναι" : "Όχι"}{"\n"}Αναγνώριση διαθέσιμη: {caps.available ? "Ναι" : "Όχι"}{"\n"}Άδεια ομιλίας: {caps.speechAuthorized ? "Ναι" : "Όχι"}{"\n"}Άδεια μικροφώνου: {caps.microphoneAuthorized ? "Ναι" : "Όχι"}</Text>}
    <Text accessibilityLiveRegion="polite">{status}</Text>
    {result && <Text style={styles.example}>Σταθμός {result.stationNumber} — κατανάλωση {result.consumption}%{"\n"}Μόνο προεπισκόπηση • χωρίς επιλογή κάτοψης</Text>}
    <Button title="Άδειες και έλεγχος" onPress={permissions} disabled={phase !== "idle"} />
    <Button title="Έναρξη δοκιμής" onPress={start} disabled={!ready || phase !== "idle"} />
    {phase === "recording" && <Button title="Τέλος ομιλίας" onPress={() => { setPhase("finishing"); setStatus("Επεξεργασία στη συσκευή…"); probe.finishInput(); }} />}
    {(phase === "recording" || phase === "finishing") && <Button title="Ακύρωση δοκιμής" onPress={cancel} />}
    <Button title="Κλείσιμο" onPress={() => { probe.stop(); onClose(); }} />
  </ScrollView></SafeAreaView>;
}
export default function VoiceLabEntry() {
  const [open, setOpen] = useState(false);
  if (!probe?.labEnabled) return null;
  return <View><Button title="Lab: δοκιμή ελληνικής φωνής" onPress={() => setOpen(true)} />
    <Modal visible={open} onRequestClose={() => setOpen(false)} animationType="slide">
      {open && <SafeAreaProvider><Diagnostic onClose={() => setOpen(false)} /></SafeAreaProvider>}
    </Modal>
  </View>;
}
const styles = StyleSheet.create({ screen: { flex:1, backgroundColor:"#fff" }, content: { padding:24, gap:18 }, title: { fontSize:22, fontWeight:"700" }, example: { fontSize:18, fontWeight:"600" } });
