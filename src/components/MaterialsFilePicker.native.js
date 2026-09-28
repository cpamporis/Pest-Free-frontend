import React from "react";
import { Alert, View } from "react-native";
import { WebView } from "react-native-webview";

// An isolated local document chooser uses the already-installed WebView. No
// authentication tokens, remote HTML, cookies or native filesystem access enter it.
export default function MaterialsFilePicker({kind,onSelect,label,disabled=false}) {
  const accept=kind === "xls" ? ".xls" : ".pdf,application/pdf";
  const safeLabel=String(label).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const html=`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'"><style>body{margin:0;font:16px -apple-system,sans-serif}label{display:block;border:1px solid #1f9c8b;border-radius:8px;padding:15px;color:#234238}input{position:absolute;opacity:0;width:1px}</style></head><body><label>${safeLabel}<input id="file" type="file" accept="${accept}" ${disabled?"disabled":""}></label><script>document.getElementById('file').onchange=function(){var f=this.files[0];if(!f)return;if(f.size>8388608){window.ReactNativeWebView.postMessage(JSON.stringify({error:true}));return;}var reader=new FileReader();reader.onload=function(){window.ReactNativeWebView.postMessage(JSON.stringify({name:f.name,size:f.size,base64:reader.result.split(',')[1]}));};reader.onerror=function(){window.ReactNativeWebView.postMessage(JSON.stringify({error:true}));};reader.readAsDataURL(f);this.value='';};</script></body></html>`;
  return <View style={{height:58,marginVertical:8,opacity:disabled?0.5:1}} pointerEvents={disabled?"none":"auto"}>
    <WebView source={{html}} originWhitelist={["*"]} onShouldStartLoadWithRequest={r=>r.url === "about:blank"}
      incognito sharedCookiesEnabled={false} thirdPartyCookiesEnabled={false} allowFileAccess={false}
      allowFileAccessFromFileURLs={false} allowUniversalAccessFromFileURLs={false}
      javaScriptCanOpenWindowsAutomatically={false} setSupportMultipleWindows={false}
      scrollEnabled={false} onMessage={e=>{
        try {
          if(e.nativeEvent.data.length>11200000)throw Error();
          const file=JSON.parse(e.nativeEvent.data);
          if(file.error || !Number.isInteger(file.size) || file.size<1 || file.size>8388608 || typeof file.base64!=="string" || typeof file.name!=="string")throw Error();
          onSelect({...file,name:file.name.slice(0,255),kind});
        } catch {Alert.alert("Αρχείο","Δεν ήταν δυνατή η επιλογή. Μέγιστο μέγεθος: 8 MB.");}
      }}/>
  </View>;
}
