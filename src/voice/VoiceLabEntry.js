import React, { useEffect, useRef, useState } from "react";
import { AppState, Button, Modal, NativeEventEmitter, NativeModules, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
const { parseGreekStationCommand } = require("./parseGreekStationCommand");
const probe = Platform.OS === "ios" ? NativeModules.PestifyVoiceProbe : null;
export const voiceProbeAvailable = Boolean(probe?.labEnabled);
const messages = {
  EMPTY_TRANSCRIPT: "Η αναγνώριση επέστρεψε κενό κείμενο. Δοκιμάστε ξανά.",
  INVALID_COMMAND: "Το κείμενο δεν έχει τη μορφή «Σταθμός … κατανάλωση …». Ενεργοποιήστε την προσωρινή εμφάνιση κειμένου και επαναλάβετε.",
  INVALID_STATION: "Δεν αναγνωρίστηκε έγκυρος αριθμός σταθμού (1–999).",
  INVALID_CONSUMPTION: "Δεν αναγνωρίστηκε έγκυρη κατανάλωση (ακέραιος 0–100).",
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
  const [showText, setShowText] = useState(false);
  const [preview, setPreview] = useState(null);
  const previewEnabled = useRef(false);
  const previewTimer = useRef(null);
  const accepting = useRef(false);
  function clearPreview() { clearTimeout(previewTimer.current); previewTimer.current = null; setPreview(null); }
  const alive = useRef(true);
  const operation = useRef(0);
  useEffect(() => {
    alive.current = true;
    const events = new NativeEventEmitter(probe);
    const subscription = events.addListener("PestifyVoiceProbeResult", event => {
      if (!alive.current || !accepting.current) return;
      accepting.current = false;
      operation.current++;
      clearPreview();
      setPhase("idle");
      if (event.code === "RESULT") {
        // Optional Lab-only preview in component memory, cleared after 30s.
        // No transcript logging, persistence, analytics or network transport.
        if (previewEnabled.current) {
          setPreview(typeof event.text === "string" ? event.text.slice(0, 240) : "");
          previewTimer.current = setTimeout(() => { if (alive.current) setPreview(null); }, 30000);
        }
        const parsed = parseGreekStationCommand(event.text);
        setResult(parsed.ok ? { stationNumber: parsed.stationNumber, consumption: parsed.consumption } : null);
        setStatus(parsed.ok ? "Αναγνωρίστηκε η εντολή. Δεν αποθηκεύτηκε έλεγχος." : messages[parsed.code] || "Δεν αναγνωρίστηκε έγκυρη εντολή.");
      } else { setResult(null); setStatus(messages[event.code] || "Η αναγνώριση δεν ολοκληρώθηκε."); }
    });
    const app = AppState.addEventListener("change", state => {
      if (state !== "active") {
        operation.current++; accepting.current = false; clearPreview();
        probe.stop(); setPhase(current => current === "permissions" ? current : "idle"); setResult(null);
        setStatus("Η δοκιμή σταμάτησε. Πατήστε έναρξη όταν επιστρέψετε.");
      }
    });
    probe.getCapabilities().then(value => {
      if (alive.current) { setCaps(value); setStatus("Πατήστε «Άδειες και έλεγχος» πριν από τη δοκιμή."); }
    }).catch(() => { if (alive.current) setStatus("Αδυναμία ελέγχου δυνατοτήτων."); });
    return () => { alive.current = false; accepting.current = false; clearTimeout(previewTimer.current); operation.current++; probe.stop(); subscription.remove(); app.remove(); };
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
    clearPreview(); accepting.current = true;
    const token = ++operation.current;
    setResult(null); setPhase("recording"); setStatus("Ακούω έως 20 δευτερόλεπτα. Πείτε την εντολή και πατήστε «Τέλος ομιλίας».");
    try { await probe.start(); }
    catch (error) {
      if (alive.current && token === operation.current) { accepting.current = false; setPhase("idle"); setStatus(messages[error.code] || "Το μικρόφωνο δεν ξεκίνησε. Ελέγξτε τις άδειες και δοκιμάστε ξανά."); }
    }
  }
  function cancel() { accepting.current = false; clearPreview(); operation.current++; probe.stop(); setResult(null); setPhase("idle"); setStatus("Η δοκιμή ακυρώθηκε και το μικρόφωνο έκλεισε."); }
  const ready = caps?.onDevice && caps?.speechAuthorized && caps?.microphoneAuthorized;
  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Δοκιμή φωνής — iOS Lab</Text>
    <Text>Φάση 1: έλεγχος ελληνικών στη συσκευή. Η οθόνη πρέπει να παραμένει ανοικτή. Δεν υπάρχει ακόμη ενεργοποίηση με «Pestify Alert».</Text>
    <Text>Ο ήχος και το κείμενο χρησιμοποιούνται προσωρινά στη μνήμη. Δεν αποθηκεύονται και δεν αποστέλλονται από αυτή τη δοκιμή. Δεν καταχωρίζεται πραγματικός έλεγχος σταθμού.</Text>
    <Text style={styles.example}>«Δολωματικός σταθμός δέκα, κατανάλωση είκοσι πέντε»</Text>
    {caps && <Text>Ελληνικά στη συσκευή: {caps.onDevice ? "Ναι" : "Όχι"}{"\n"}Αναγνώριση διαθέσιμη: {caps.available ? "Ναι" : "Όχι"}{"\n"}Άδεια ομιλίας: {caps.speechAuthorized ? "Ναι" : "Όχι"}{"\n"}Άδεια μικροφώνου: {caps.microphoneAuthorized ? "Ναι" : "Όχι"}</Text>}
    <View>
      <Text>Προσωρινή εμφάνιση αναγνωρισμένου κειμένου (30 δευτερόλεπτα)</Text>
      <Switch accessibilityLabel="Προσωρινή εμφάνιση αναγνωρισμένου κειμένου" value={showText} disabled={phase !== "idle"} onValueChange={value => { previewEnabled.current = value; setShowText(value); clearPreview(); }} />
      <Text>Μόνο για τη δοκιμαστική φράση. Το κείμενο εμφανίζεται στην οθόνη χωρίς αποθήκευση ή αποστολή.</Text>
    </View>
    <Text accessibilityLiveRegion="polite">{status}</Text>
    {preview !== null && <View><Text selectable>Αναγνωρίστηκε: «{preview || "(κενό κείμενο)"}»</Text><Button title="Απόκρυψη κειμένου" onPress={clearPreview} /></View>}
    {result && <Text style={styles.example}>Σταθμός {result.stationNumber} — κατανάλωση {result.consumption}%{"\n"}Μόνο προεπισκόπηση • χωρίς επιλογή κάτοψης</Text>}
    <Button title="Άδειες και έλεγχος" onPress={permissions} disabled={phase !== "idle"} />
    <Button title="Έναρξη δοκιμής" onPress={start} disabled={!ready || phase !== "idle"} />
    {phase === "recording" && <Button title="Τέλος ομιλίας" onPress={() => { setPhase("finishing"); setStatus("Επεξεργασία στη συσκευή…"); probe.finishInput(); }} />}
    {(phase === "recording" || phase === "finishing") && <Button title="Ακύρωση δοκιμής" onPress={cancel} />}
    <Button title="Κλείσιμο" onPress={() => { accepting.current = false; clearPreview(); probe.stop(); onClose(); }} />
  </ScrollView></SafeAreaView>;
}
export default function VoiceLabEntry() {
  const [open, setOpen] = useState(false);
  if (!probe?.labEnabled) return null;
  return <View><TouchableOpacity accessibilityRole="button" accessibilityLabel="Lab: δοκιμή ελληνικής φωνής" style={styles.entryButton} onPress={() => setOpen(true)}><MaterialIcons name="mic" size={17} color="#1f9c8b" /><Text style={styles.entryText}>Lab · Δοκιμή ελληνικής φωνής</Text></TouchableOpacity>
    <Modal visible={open} onRequestClose={() => setOpen(false)} animationType="slide">
      {open && <SafeAreaProvider><Diagnostic onClose={() => setOpen(false)} /></SafeAreaProvider>}
    </Modal>
  </View>;
}
const styles = StyleSheet.create({ entryButton:{flexDirection:"row",alignItems:"center",gap:6,paddingHorizontal:12,paddingVertical:10,borderRadius:10,backgroundColor:"#edf8f5",borderWidth:1,borderColor:"#cbe9e2"},entryText:{fontSize:12,fontWeight:"600",color:"#167d6f"}, screen: { flex:1, backgroundColor:"#fff" }, content: { padding:24, gap:18 }, title: { fontSize:22, fontWeight:"700" }, example: { fontSize:18, fontWeight:"600" } });
