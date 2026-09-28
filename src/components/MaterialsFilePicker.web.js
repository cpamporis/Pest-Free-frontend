import React, { useRef } from "react";
import { Pressable, Text, View } from "react-native";
export default function MaterialsFilePicker({kind,onSelect,label,disabled=false}) {
  const input=useRef(null);
  return <View style={{marginVertical:8}}>
    <input ref={input} type="file" accept={kind === "xls" ? ".xls" : ".pdf,application/pdf"} style={{display:"none"}} onChange={e=>{
      const file=e.target.files?.[0];e.target.value="";
      if(file && file.size<=8388608) onSelect({file,name:file.name,size:file.size,kind});
      else if(file) window.alert("Μέγιστο μέγεθος αρχείου: 8 MB");
    }}/>
    <Pressable accessibilityRole="button" disabled={disabled} onPress={()=>input.current?.click()} style={{padding:14,borderWidth:1,borderColor:"#1f9c8b",borderRadius:8,opacity:disabled?0.5:1}}><Text>{label}</Text></Pressable>
  </View>;
}
