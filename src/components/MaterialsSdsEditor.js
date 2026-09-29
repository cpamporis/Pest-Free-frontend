import React, {useEffect,useState} from 'react';
import {View,Text,TextInput,Pressable,StyleSheet,ActivityIndicator} from 'react-native';
import api from '../services/apiService';
import MaterialsFilePicker from './MaterialsFilePicker';
const kinds=[['antidote','Αντίδοτο'],['symptomatic','Συμπτωματική θεραπεία'],['mixed','Αντίδοτο και συμπτωματική θεραπεία']];
export default function MaterialsSdsEditor({product,versions,initialVersionId,suggestion,onSaved}) {
  const [file,setFile]=useState(null),[versionId,setVersionId]=useState(null),[kind,setKind]=useState(''),[text,setText]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{
    const version=versions.find(v=>v.id===(initialVersionId||product.sds_version_id));
    setFile(null);setVersionId(version?.id||null);const proposed=suggestion?.treatment_kind||version?.treatment_kind||'';setKind(kinds.some(([k])=>k===proposed)?proposed:'');
    setText(suggestion?.treatment_name||version?.treatment_text||'');setError('');
  },[product.id,product.revision,initialVersionId,versions,suggestion]);
  async function save(){
    if(busy)return;setBusy(true);setError('');
    try {
      const data={expectedRevision:product.revision,treatmentKind:kind,treatmentText:kind==='symptomatic'?'Συμπτωματική θεραπεία':text.trim()};
      const r=file?await api.uploadSdsManual(product.id,file,data):await api.approveSdsManual(product.id,versionId,data);
      if(!r?.success)throw Error(r?.error==='PRODUCT_CHANGED_REFRESH'?'Η εγγραφή άλλαξε. Επίλεξέ την ξανά πριν αποθηκεύσεις.':'Η αποθήκευση απέτυχε. Ελέγξτε ότι το αρχείο είναι PDF έως 8 MB.');
      await onSaved();setFile(null);
    }catch(e){setError(e.message);}finally{setBusy(false);}
  }
  return <View style={s.box}>
    <Text style={s.title}>Δελτίο Δεδομένων Ασφαλείας</Text>
    <Text>Επίλεξε PDF και συμπλήρωσε τη θεραπεία. Με την αποθήκευση εγκρίνεις και δημοσιεύεις το ΔΔΑ για αυτό το σκεύασμα.</Text>
    <MaterialsFilePicker kind="pdf" disabled={busy} label={file?file.name:'Επιλογή PDF (έως 8 MB)'} onSelect={setFile}/>
    {!file&&versionId&&<Text style={s.help}>Θα χρησιμοποιηθεί το επιλεγμένο, ήδη αποθηκευμένο PDF.</Text>}
    {kinds.map(([value,label])=><Pressable key={value} accessibilityRole="radio" accessibilityState={{checked:kind===value}} disabled={busy} onPress={()=>setKind(value)} style={s.row}><Text>{kind===value?'●':'○'} {label}</Text></Pressable>)}
    {kind!=='symptomatic'&&<TextInput accessibilityLabel="Αντίδοτο ή θεραπεία" placeholder="Ονομασία αντιδότου / θεραπεία" multiline maxLength={4000} value={text} onChangeText={setText} editable={!busy} style={s.input}/>}
    {kind==='symptomatic'&&<Text style={s.help}>Θα αποθηκευτεί: Συμπτωματική θεραπεία</Text>}
    {!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Pressable accessibilityRole="button" disabled={busy||!kind||(!file&&!versionId)||(kind!=='symptomatic'&&!text.trim())} onPress={save} style={[s.button,(busy||!kind||(!file&&!versionId)||(kind!=='symptomatic'&&!text.trim()))&&s.disabled]}><Text style={s.buttonText}>Αποθήκευση ΔΔΑ</Text></Pressable>
    {busy&&<ActivityIndicator/>}
    {versions.map(v=><View key={v.id} style={s.version}>
      <Text>{v.state==='verified'?'Εγκεκριμένο':v.state==='rejected'?'Απορρίφθηκε':'Προς έλεγχο'} · {v.document_date?String(v.document_date).slice(0,10):'Χωρίς δηλωμένη ημερομηνία έκδοσης'}</Text>
      <Pressable accessibilityRole="button" disabled={busy} onPress={async()=>{try{const r=await api.downloadCatalogSds(product.id,v.id);if(!r?.success)setError('Δεν ήταν δυνατή η λήψη του PDF.');}catch{setError('Δεν ήταν δυνατή η λήψη του PDF.');}}} style={s.row}><Text style={s.link}>Λήψη PDF</Text></Pressable>
      {v.state!=='rejected'&&<Pressable accessibilityRole="button" disabled={busy} onPress={()=>{setVersionId(v.id);setFile(null);setKind(v.treatment_kind||'');setText(v.treatment_text||'');}} style={s.row}><Text style={s.link}>Χρήση αυτού του PDF / αλλαγή θεραπείας</Text></Pressable>}
    </View>)}
  </View>;
}
const s=StyleSheet.create({box:{padding:18,backgroundColor:'#fff',borderRadius:12,marginBottom:18,gap:12},title:{fontSize:18,fontWeight:'700',color:'#244237'},row:{paddingVertical:10},input:{borderWidth:1,borderColor:'#becfc5',borderRadius:8,padding:12,minHeight:64},button:{backgroundColor:'#1f8875',padding:14,borderRadius:8,alignItems:'center'},buttonText:{color:'#fff',fontWeight:'600'},disabled:{opacity:0.4},help:{color:'#50665c'},error:{color:'#932d2d'},version:{borderTopWidth:1,borderColor:'#e1e9e4',paddingTop:12},link:{color:'#176e60'}});
