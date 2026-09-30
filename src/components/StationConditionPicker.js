import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
export default function StationConditionPicker({value, onChange}) {
  return <View style={{marginVertical:12}}><Text style={{fontWeight:"600", marginBottom:8}}>Κατάσταση</Text>
    <View style={{flexDirection:"row", flexWrap:"wrap", gap:6}}>
      {[["Functional","Λειτουργικό"],["Damaged","Κατεστραμμένο"],["Missing","Λείπει"]].map(([key,label]) =>
        <TouchableOpacity key={key} accessibilityRole="radio" accessibilityState={{checked:value===key}}
          onPress={()=>onChange(key)} style={{padding:10,borderRadius:8,borderWidth:1,borderColor:"#1f9c8b",backgroundColor:value===key?"#1f9c8b":"white"}}>
          <Text style={{color:value===key?"white":"#234"}}>{label}</Text>
        </TouchableOpacity>)}
    </View>{["Damaged","Missing"].includes(value)&&<Text style={{marginTop:8,color:"#596"}}>Δεν απαιτούνται μετρήσεις. Πατήστε Αποθήκευση.</Text>}
  </View>;
}
