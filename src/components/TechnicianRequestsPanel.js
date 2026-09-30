import React,{useState,useEffect} from 'react';
import {View,Text} from 'react-native';
import apiService from '../services/apiService';
import ProtectedImage from './ProtectedImage';
import CommercialEditor from './CommercialEditor';
import {Action,s} from './ChargeableMaterials';
export default function TechnicianRequestsPanel(){
 const [requests,setRequests]=useState([]),[selected,setSelected]=useState(null),[error,setError]=useState('');
 async function load(){const c=await apiService.commercialCapabilities();if(!c.enabled)return;const r=await apiService.commercialRequests();if(r.success)setRequests(r.requests);else setError(r.error);}
 useEffect(()=>{load();},[]);
 async function reject(id){const r=await apiService.commercialReject(id);if(!r.success)setError(r.error);else load();}
 return <View>{requests.filter(r=>r.status==='pending').map(r=><View key={r.id} style={s.panel}><Text style={s.title}>Αίτημα τεχνικού · {r.customer_name}</Text><Text>{r.comment}</Text><Text>{String(r.appointment_date).slice(0,10)}</Text>{r.images.map(name=><ProtectedImage key={name} source={{uri:apiService.getUploadedFileUrl(name)}} style={{width:180,height:130}}/>)}<Action label="Αποδοχή — αλλαγή χρέωσης / υλικών" onPress={()=>setSelected(r)}/><Action label="Απόρριψη" onPress={()=>reject(r.id)}/></View>)}{!!error&&<Text style={{color:'#b00'}}>{error}</Text>}{selected&&<CommercialEditor appointmentId={selected.appointment_id} requestId={selected.id} onClose={()=>setSelected(null)} onSaved={load}/>}</View>;
}
