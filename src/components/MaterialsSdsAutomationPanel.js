import React,{useEffect,useState} from 'react';
import {View,Text,Pressable,ActivityIndicator,StyleSheet,Linking} from 'react-native';
import api from '../services/apiService';
const reasons={SOURCE_UNVERIFIED:'Η πηγή δεν έχει επιβεβαιωθεί.',DOCUMENT_CHECKS_INCOMPLETE:'Χρειάζεται επιβεβαίωση στοιχείων του ΔΔΑ.',NOT_AN_SDS:'Το αρχείο φαίνεται να είναι άλλου τύπου έγγραφο.',CANDIDATE_REJECTED:'Απέρριψες το υποψήφιο αρχείο.',PRODUCT_CHANGED_REFRESH:'Τα στοιχεία του σκευάσματος άλλαξαν.'};
function Button({children,onPress,disabled}){return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button,disabled&&{opacity:0.4}]}><Text style={s.buttonText}>{children}</Text></Pressable>;}
export default function MaterialsSdsAutomationPanel({onSelect,refreshToken=0}) {
  const [data,setData]=useState(null),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function load(){const r=await api.getSdsAutomation();if(!r?.success)throw Error('Δεν ήταν δυνατή η φόρτωση των εκκρεμοτήτων.');setData(r);return r;}
  useEffect(()=>{let live=true;api.getSdsAutomation().then(r=>{if(live&&r?.success)setData(r);}).catch(()=>{});return()=>{live=false;};},[refreshToken]);
  useEffect(()=>{if(data?.batch?.state!=='running')return;let live=true;const timer=setInterval(()=>{api.getSdsAutomation().then(r=>{if(live&&r?.success)setData(r);}).catch(()=>{});},15000);return()=>{live=false;clearInterval(timer);};},[data?.batch?.state]);
  async function action(fn){if(busy)return;setBusy(true);setError('');try{const r=await fn();if(r?.success===false)throw Error('Η ενέργεια δεν ολοκληρώθηκε. Ελέγξτε τη σύνδεση και τις ρυθμίσεις της αναζήτησης.');await load();}catch(e){setError(e.message);}finally{setBusy(false);}}
  const running=data?.batch?.state==='running',counts=data?.batch?.counts||{};
  return <View style={s.card}>
    <Text style={s.heading}>Αυτόματη συλλογή ΔΔΑ</Text>
    <Text>Τα εξακριβωμένα ΔΔΑ εισάγονται αυτόματα. Οι υπόλοιπες εγγραφές συγκεντρώνονται παρακάτω.</Text>
    {!!data?.capabilities?.ready&&<Text style={s.help}>Όριο νέων κλήσεων ανά εκκίνηση: {data.capabilities.callsPerBatch}. Ημερήσιο όριο: {data.capabilities.dailyCallLimit}.</Text>}
    <Button disabled={busy||running||!data?.capabilities?.ready} onPress={()=>action(()=>api.startSdsAutomation())}>{data?.batch?.state==='paused'?'Συνέχιση συλλογής ΔΔΑ':'Αυτόματη συλλογή και εισαγωγή ΔΔΑ'}</Button>
    {!data?.capabilities?.ready&&<Text style={s.help}>Η αυτόματη συλλογή χρειάζεται ενεργοποίηση και κλειδί API στο Security Lab. Η χειροκίνητη εισαγωγή είναι διαθέσιμη.</Text>}
    {running&&<><ActivityIndicator/><Text>Η εργασία συνεχίζεται στον server. Μπορείς να κλείσεις την οθόνη.</Text><Button disabled={busy} onPress={()=>action(()=>api.pauseSdsAutomation())}>Παύση μετά την τρέχουσα ενέργεια</Button></>}
    {!!data?.batch&&<Text style={s.help}>Εισήχθησαν: {counts.published||0} · Επιλύθηκαν: {counts.resolved||0} · Απομένουν: {(counts.queued||0)+(counts.running||0)} · Κλήσεις: {data.batch.calls}</Text>}
    {data?.batch?.state==='paused'&&<Text style={s.help}>{data.batch.pause_reason==='CALL_LIMIT'?'Η εργασία σταμάτησε στο όριο κλήσεων. Η πρόοδος αποθηκεύτηκε.':data.batch.pause_reason==='USER_PAUSED'?'Η εργασία είναι σε παύση.':'Η αναζήτηση διακόπηκε. Χρειάζεται έλεγχος της σύνδεσης API.'}</Text>}
    <Pressable accessibilityRole="button" accessibilityState={{expanded:open}} onPress={()=>{setOpen(!open);if(!open)load().catch(e=>setError(e.message));}} style={s.dropdown}><Text style={s.heading}>Προς έλεγχο ({data?.total||0}) {open?'▴':'▾'}</Text></Pressable>
    {open&&(data?.items||[]).map(item=><View key={item.id} style={s.item}>
      <Text style={s.name}>{item.name}</Text>
      <Text>{item.state==='not_found'?'Δεν βρέθηκε ΔΔΑ':item.state==='failed'?'Δεν ολοκληρώθηκε η αναζήτηση':reasons[item.reason]||'Βρέθηκε ΔΔΑ προς έλεγχο'}</Text>
      {!!item.candidate?.page_url&&<Text selectable style={s.help}>{item.candidate.page_url}</Text>}
      {!!item.candidate?.page_url&&/^https:\/\//i.test(item.candidate.page_url)&&<Button disabled={busy} onPress={()=>Linking.openURL(item.candidate.page_url).catch(()=>setError('Δεν ήταν δυνατό να ανοίξει η πηγή.'))}>Άνοιγμα πηγής</Button>}
      <Button disabled={busy} onPress={()=>{setOpen(false);onSelect(item);}}>{item.sds_id?'Έλεγχος PDF και θεραπείας':'Εισαγωγή ΔΔΑ από εμένα'}</Button>
      {item.state==='review'&&item.sds_id&&<Button disabled={busy} onPress={()=>action(()=>api.rejectSdsTask(item.id))}>Απόρριψη υποψήφιου PDF</Button>}
      <Button disabled={busy||running||!data?.capabilities?.ready} onPress={()=>action(async()=>{const r=await api.retrySdsTask(item.id);if(!r?.success)return r;return api.startSdsAutomation();})}>Νέα αναζήτηση</Button>
    </View>)}
    {open&&!data?.items?.length&&<Text style={s.help}>Δεν υπάρχουν εκκρεμότητες ελέγχου.</Text>}
    {open&&data?.more&&<Button disabled={busy} onPress={async()=>{setBusy(true);try{const r=await api.getSdsAutomation(data.items.length);if(r?.success)setData({...data,items:[...data.items,...r.items],more:r.more});}finally{setBusy(false);}}}>Περισσότερα</Button>}
    {!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}
  </View>;
}
const s=StyleSheet.create({card:{padding:18,backgroundColor:'#fff',borderRadius:12,marginBottom:18,gap:10},heading:{fontSize:18,fontWeight:'700',color:'#244237'},help:{color:'#50665c',fontSize:13,lineHeight:20},button:{backgroundColor:'#1f8875',padding:13,borderRadius:8,alignItems:'center',marginVertical:4},buttonText:{color:'#fff',fontWeight:'600'},dropdown:{paddingVertical:14,borderTopWidth:1,borderColor:'#e1e9e4'},item:{paddingVertical:12,borderTopWidth:1,borderColor:'#e1e9e4'},name:{fontWeight:'700',fontSize:16,marginBottom:8},error:{color:'#932d2d'}});
