import React, {useEffect,useState} from 'react';
import {View,Text,TextInput,TouchableOpacity,ScrollView,Modal,StyleSheet,Alert} from 'react-native';
import apiService from '../services/apiService';
export const money=v=>(Number(v||0)/100).toFixed(2)+' €';
export function Action({label,onPress,disabled=false}) {return <TouchableOpacity disabled={disabled} onPress={onPress} style={[s.button,disabled&&{opacity:.4}]}><Text style={{color:'white',fontWeight:'600'}}>{label}</Text></TouchableOpacity>;}
export function Field({label,value,onChangeText,...rest}) {return <View><Text style={s.label}>{label}</Text><TextInput style={s.input} value={String(value??'')} onChangeText={onChangeText} {...rest}/></View>;}
export function Select({label,items,value,onChange,search=false}) {
 const [open,setOpen]=useState(false),[q,setQ]=useState('');
 return <View><Action label={items.find(i=>i.id===value)?.name||label} onPress={()=>setOpen(!open)}/>{open&&<View style={s.panel}>
 {search&&<Field label="Αναζήτηση" value={q} onChangeText={setQ}/>}
 <ScrollView nestedScrollEnabled style={{maxHeight:210}} keyboardShouldPersistTaps="handled">{items.filter(i=>i.name.toLocaleLowerCase().includes(q.toLocaleLowerCase())).map(i=><TouchableOpacity key={i.id} style={{padding:13}} onPress={()=>{onChange(i.id);setOpen(false);setQ('');}}><Text>{i.name}</Text></TouchableOpacity>)}</ScrollView></View>}</View>;
}
export function materialsTotal(lines,catalog) {return lines.reduce((sum,l)=>{const i=catalog.find(i=>i.id===l.itemId);if(!i)return sum;const net=Number(i.unit_net_cents)*Number(l.quantity||0);return sum+net+Math.round(net*Number(i.vat_basis_points)/10000);},0);}
export function MaterialSelector({value=[],onChange,onTotal,manage=false,snapshotLines=[]}) {
 const [expanded,setExpanded]=useState(manage);
 const [catalog,setCatalog]=useState({categories:[],items:[]}),[enabled,setEnabled]=useState(false),[category,setCategory]=useState(null),[form,setForm]=useState(null),[name,setName]=useState(''),[net,setNet]=useState(''),[vat,setVat]=useState('24'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const pricedItems=catalog.items.map(i=>{const old=snapshotLines.find(l=>l.key===i.id);return old?{...i,unit_net_cents:old.unitNetCents,vat_basis_points:old.vatBasisPoints}:i;});
 async function reload(){const r=await apiService.commercialCatalog();if(r.success){setCatalog(r);setEnabled(true);}else setError(r.error||'Αποτυχία φόρτωσης υλικών');}
 useEffect(()=>{apiService.commercialCapabilities().then(r=>{if(r.enabled)reload();});},[]);
 useEffect(()=>{onTotal?.(materialsTotal(value,pricedItems));},[JSON.stringify(value),catalog.items,JSON.stringify(snapshotLines)]);
 function qty(id,n){onChange(value.map(l=>l.itemId===id?{...l,quantity:n}:l));}
 async function save(){setBusy(true);setError('');try{const r=form==='category'?await apiService.commercialCreateCategory({name}):await apiService.commercialCreateItem({name,categoryId:category,netPrice:net.replace(',','.'),vatPercent:vat.replace(',','.')});if(!r.success)throw Error(r.error);setForm(null);setName('');setNet('');setVat('24');await reload();}catch(e){setError(e.message);}finally{setBusy(false);}}
 if(!enabled)return null;
 return <View style={s.panel}><Text style={s.title}>Υλικά{!manage?' (προαιρετικά)':''}</Text>{!manage&&<Action label={`${expanded?"Κλείσιμο υλικών":"Επιλογή υλικών"} · ${value.length}`} onPress={()=>setExpanded(!expanded)}/>}
 {expanded&&<>
 {manage&&<Action label="Δημιουργία Κατηγορίας" onPress={()=>{setForm('category');setName('');}}/>}
 <Select label="Κατηγορία" items={catalog.categories} value={category} onChange={setCategory}/>
 {category&&<><Select label="Είδη" search items={catalog.items.filter(i=>i.category_id===category)} onChange={id=>{if(!manage&&!value.some(l=>l.itemId===id))onChange([...value,{itemId:id,quantity:1}]);else if(manage){const i=catalog.items.find(i=>i.id===id);Alert.alert(i.name,`Καθαρή: ${money(i.unit_net_cents)} · ΦΠΑ ${i.vat_basis_points/100}%`);}}}/>{manage&&<Action label="Νέο Είδος" onPress={()=>{setForm('item');setName('');}}/>}</>}
 {!manage&&value.map(l=><View key={l.itemId} style={{marginVertical:10}}><Text>{catalog.items.find(i=>i.id===l.itemId)?.name||'Υλικό'}</Text><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Action label="−" onPress={()=>qty(l.itemId,Math.max(1,Number(l.quantity||1)-1))}/><TextInput accessibilityLabel="Ποσότητα" style={[s.input,{width:80}]} keyboardType="number-pad" value={String(l.quantity)} onChangeText={v=>{if(/^\d{0,5}$/.test(v))qty(l.itemId,v===''?'':Number(v));}}/><Action label="+" onPress={()=>qty(l.itemId,Math.min(10000,Number(l.quantity||0)+1))}/><Action label="Αφαίρεση" onPress={()=>onChange(value.filter(x=>x.itemId!==l.itemId))}/></View></View>)}
 </>}
 {!manage&&<Text>Σύνολο υλικών με ΦΠΑ: {money(materialsTotal(value,pricedItems))}</Text>}
 {!!error&&<Text style={{color:'#b00'}}>{error}</Text>}
 <Modal visible={!!form} transparent onRequestClose={()=>!busy&&setForm(null)}><View style={s.overlay}><ScrollView style={s.dialog} keyboardShouldPersistTaps="handled"><Text style={s.title}>{form==='category'?'Νέα κατηγορία':'Νέο είδος'}</Text><Field label="Ονομασία" value={name} onChangeText={setName} maxLength={120}/>{form==='item'&&<><Field label="Καθαρή τιμή (€)" value={net} onChangeText={setNet} keyboardType="decimal-pad"/><Field label="ΦΠΑ (%)" value={vat} onChangeText={setVat} keyboardType="decimal-pad"/><Text>Συνολική τιμή: {money(Math.round(Number(net.replace(',','.'))*100)*(1+Number(vat.replace(',','.'))/100))}</Text></>}{!!error&&<Text style={{color:'#b00'}}>{error}</Text>}<Action label={busy?'Αποθήκευση…':form==='category'?'Αποθήκευση κατηγορίας':'Αποθήκευση Είδους'} disabled={busy} onPress={save}/><Action label="Άκυρο" disabled={busy} onPress={()=>setForm(null)}/></ScrollView></View></Modal>
 </View>;
}
export const s=StyleSheet.create({panel:{marginVertical:12,padding:12,borderWidth:1,borderColor:'#dde6e4',borderRadius:10,backgroundColor:'white'},title:{fontSize:18,fontWeight:'700',marginBottom:10},label:{marginTop:8,marginBottom:4,color:'#234'},input:{borderWidth:1,borderColor:'#bbb',borderRadius:8,padding:10,minHeight:44,backgroundColor:'white'},button:{backgroundColor:'#218776',borderRadius:8,padding:12,marginVertical:5,alignItems:'center'},overlay:{flex:1,backgroundColor:'#0008',justifyContent:'center',padding:18},dialog:{flexGrow:0,maxHeight:'90%',backgroundColor:'white',padding:18,borderRadius:14}});
