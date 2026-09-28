import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../services/apiService";
import AdminHeaderSessionActions from "../../components/AdminHeaderSessionActions";
import MaterialsFilePicker from "../../components/MaterialsFilePicker";

const notify=message=>Platform.OS === "web" ? window.alert(message) : Alert.alert("Materials Database",message);
const confirm=message=>Platform.OS === "web" ? Promise.resolve(window.confirm(message)) : new Promise(resolve=>Alert.alert("Materials Database",message,[{text:"Ακύρωση",style:"cancel",onPress:()=>resolve(false)},{text:"Συνέχεια",onPress:()=>resolve(true)}],{cancelable:true,onDismiss:()=>resolve(false)}));
const errorCopy={EXCEL_PARSER_NOT_INSTALLED:"Η εισαγωγή Excel δεν έχει ενεργοποιηθεί ακόμη.",SDS_TEXT_PARSER_NOT_INSTALLED:"Η ανάγνωση ΔΔΑ δεν έχει ενεργοποιηθεί ακόμη.",CATALOG_CHANGED_PREVIEW_AGAIN:"Ο κατάλογος άλλαξε. Ακυρώστε την προεπισκόπηση και δημιουργήστε νέα.",PRODUCT_CHANGED_REFRESH:"Η εγγραφή άλλαξε. Επιλέξτε την ξανά πριν την αποθήκευση.",INVALID_DATE:"Ελέγξτε την ημερομηνία. Χρησιμοποιήστε YYYY-MM-DD.",PUBLISHER_NOT_SUPPORTED:"Ο εκδότης δεν υποστηρίζεται ακόμη. Ανεβάστε το επίσημο PDF.",PUBLISHER_PATH_NOT_SUPPORTED:"Χρειάζεται ο σύνδεσμος της επίσημης σελίδας προϊόντος.",SDS_REVIEW_STALE_OR_ALREADY_FINAL:"Αυτή η έκδοση χρειάζεται νέο έλεγχο μετά από αλλαγή στο προϊόν. Επαναλάβετε την εισαγωγή ΔΔΑ.",FINISH_OR_CANCEL_PENDING_IMPORTS:"Ολοκληρώστε ή ακυρώστε τις προηγούμενες εισαγωγές.",CATALOG_CONFLICT:"Υπάρχει ήδη εγγραφή με αυτόν τον αριθμό έγκρισης.",MINISTRY_WORKBOOK_HEADERS_REQUIRED:"Χρειάζεται το πρωτότυπο Excel με τις στήλες του υπουργείου."};
const need=r=>{if(!r?.success)throw Error(errorCopy[r?.error] || "Η ενέργεια απέτυχε. Ελέγξτε τα πεδία και δοκιμάστε ξανά.");return r;};
const fields=[["name","Εμπορικό όνομα"],["category","Κατηγορία"],["manufacturer","Παρασκευαστής"],["country","Χώρα"],["holder","Κάτοχος έγκρισης"],["approval_date","Ημερομηνία έγκρισης"],["approval_expiry","Λήξη έγκρισης"],["stock_expiry","Λήξη διάθεσης αποθεμάτων"]];
const kinds=[["antidote","Αντίδοτο"],["symptomatic","Συμπτωματική θεραπεία"],["mixed","Αντίδοτο και συμπτωματική θεραπεία"],["not_mentioned","Δεν αναφέρεται στο ΔΔΑ"]];
function Button({children,onPress,disabled,danger=false}) {return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button,danger && {backgroundColor:"#a23a3a"},disabled && {opacity:0.4}]}><Text style={s.buttonText}>{children}</Text></Pressable>;}
function Field({label,value,onChangeText,...props}) {return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput value={String(value ?? "")} onChangeText={onChangeText} style={[s.input,props.multiline && {minHeight:90,textAlignVertical:"top"}]} maxLength={1500} {...props}/></View>;}

export default function MaterialsDatabaseScreen({onClose}) {
  const [caps,setCaps]=useState(null),[q,setQ]=useState(""),[items,setItems]=useState([]),[more,setMore]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [selected,setSelected]=useState(null),[form,setForm]=useState({}),[ministry,setMinistry]=useState({}),[reason,setReason]=useState("");
  const [preview,setPreview]=useState(null),[sourceDate,setSourceDate]=useState(new Date().toISOString().slice(0,10));
  const [sourcePage,setSourcePage]=useState(""),[job,setJob]=useState(null);
  const [versions,setVersions]=useState([]),[sds,setSds]=useState(null),[sdsFile,setSdsFile]=useState(null),[sourceUrl,setSourceUrl]=useState(""),[documentDate,setDocumentDate]=useState(""),[language,setLanguage]=useState("el");
  const [treatmentKind,setTreatmentKind]=useState(""),[treatmentText,setTreatmentText]=useState(""),[excerpt,setExcerpt]=useState(""),[page,setPage]=useState(""),[identity,setIdentity]=useState(false),[reviewed,setReviewed]=useState(false),[extracted,setExtracted]=useState([]);
  useEffect(()=>{let live=true;api.getMaterialsCatalogCapabilities().then(r=>live && setCaps(r));return()=>{live=false;};},[]);
  useEffect(()=>{let live=true;const timer=setTimeout(async()=>{if(!caps?.enabled)return;const r=await api.searchMaterialsCatalog(q);if(live){if(r.success){setItems(r.items);setMore(r.more);}else setError("Δεν ήταν δυνατή η φόρτωση του καταλόγου.");}},300);return()=>{live=false;clearTimeout(timer);};},[q,caps]);
  useEffect(()=>{
    if(!selected?.id || !["queued","running"].includes(job?.state) || !caps?.sdsText)return;
    let live=true;
    const timer=setInterval(async()=>{
      const r=await api.getCatalogSdsResearch(selected.id);
      if(!live || !r.success)return;setJob(r.research);
      if(r.research.state === "pending_review"){
        const versionsResult=await api.getCatalogSdsVersions(selected.id);
        if(live && versionsResult.success)setVersions(versionsResult.versions);
      }
    },15000);
    return()=>{live=false;clearInterval(timer);};
  },[selected?.id,job?.state,caps?.sdsText]);
  async function action(fn) {if(busy)return;setBusy(true);setError("");try{await fn();}catch(e){setError(e.message);}finally{setBusy(false);}}
  async function refresh() {const r=need(await api.searchMaterialsCatalog(q));setItems(r.items);setMore(r.more);}
  function resetReview() {setSds(null);setSdsFile(null);setTreatmentKind("");setTreatmentText("");setExcerpt("");setPage("");setIdentity(false);setReviewed(false);setExtracted([]);setSourceUrl("");setDocumentDate("");}
  async function select(id) {
    const r=need(await api.getCatalogProduct(id));setSelected(r.product);setForm({...r.product});setMinistry(r.ministry || {});setReason("");resetReview();setSourcePage(r.sourcePage || "");setJob(need(await api.getCatalogSdsResearch(id)).research);
    setVersions(need(await api.getCatalogSdsVersions(id)).versions);
  }
  async function save() {
    const overrides={};
    for(const [key] of fields) if((form[key] || "") !== (ministry[key] || ""))overrides[key]=form[key] || "";
    if(JSON.stringify(form.ingredients || []) !== JSON.stringify(ministry.ingredients || []))overrides.ingredients=form.ingredients || [];
    if(!selected?.id){overrides.name=form.name || "";overrides.ingredients=form.ingredients || [];}
    const r=need(await api.saveCatalogProduct(selected?.id,{approvalId:form.approval_id,expectedRevision:selected?.revision,active:form.active ?? true,reason,overrides}));
    await select(r.product.id);await refresh();notify("Η εγγραφή αποθηκεύτηκε.");
  }
  function review(v) {setSds(v);setDocumentDate(v.document_date ? String(v.document_date).slice(0,10) : "");setLanguage(v.language || "el");setTreatmentKind(v.treatment_kind || "");setTreatmentText(v.treatment_text || "");setExcerpt(v.evidence_excerpt || "");setPage(String(v.evidence_page || ""));setIdentity(false);setReviewed(false);setExtracted(job?.result_id === v.id ? job.evidence?.pages || [] : []);}
  const canManage=caps?.success && caps.enabled && caps.canManage;
  return <SafeAreaView style={s.page} edges={["top","right","bottom","left"]}>
    <View style={s.header}><Button onPress={onClose}>Πίσω</Button><Text style={s.title}>Materials Database</Text><AdminHeaderSessionActions/></View>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {!caps ? <ActivityIndicator/> : !canManage ? <Text>Η βάση υλικών δεν είναι διαθέσιμη σε αυτή τη συνεδρία.</Text> : <>
        {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
        {busy && <ActivityIndicator color="#1f9c8b"/>}
        <View style={s.card}><Text style={s.heading}>Ανανέωση καταλόγου υπουργείου</Text>
          <Text style={s.help}>Πρώτα θα εμφανιστούν οι διαφορές. Οι χειροκίνητες διορθώσεις διατηρούνται. Όσα προϊόντα λείπουν από το νέο αρχείο τίθενται σε εκκρεμότητα ελέγχου.</Text>
          <Field label="Ημερομηνία αρχείου (YYYY-MM-DD)" value={sourceDate} onChangeText={setSourceDate} maxLength={10}/>
          <MaterialsFilePicker kind="xls" disabled={busy || !caps.excel || !!preview} label="Επιλογή Excel υπουργείου (.xls, έως 8 MB)" onSelect={file=>action(async()=>setPreview(need(await api.previewCatalogExcel(file,sourceDate)).preview))}/>
          {!caps.excel && <Text style={s.help}>Η εισαγωγή νέου Excel δεν έχει ενεργοποιηθεί ακόμη στο Lab.</Text>}
          <Button disabled={busy || !!preview} onPress={()=>action(async()=>setPreview(need(await api.previewCatalogSeed()).preview))}>Αρχικός κατάλογος 28/09/2026</Button>
          {preview && <View style={s.preview}><Text style={s.heading}>Προεπισκόπηση · {preview.summary.total} προϊόντα</Text>
            <Text>Νέα: {preview.summary.counts.added} · Αλλαγές: {preview.summary.counts.changed} · Απουσίες: {preview.summary.counts.missing}</Text>
            <Text>Αλλαγές σε διορθωμένα πεδία: {preview.summary.counts.manualConflicts}</Text>
            <Text>Μη έγκυρες ημερομηνίες: {(preview.summary.dateWarnings || []).join(", ") || "—"}</Text>
            <Text selectable style={s.help}>SHA-256: {preview.source_sha256}</Text>
            <Button disabled={busy} onPress={()=>action(async()=>{need(await api.applyCatalogImport(preview.id));setPreview(null);await refresh();notify("Ο συγχρονισμός ολοκληρώθηκε.");})}>Εφαρμογή αυτών των αλλαγών</Button>
            <Button disabled={busy} onPress={()=>action(async()=>{need(await api.cancelCatalogImport(preview.id));setPreview(null);})}>Ακύρωση εισαγωγής</Button>
          </View>}
        </View>
        <View style={s.card}><Text style={s.heading}>Προϊόντα</Text><Field label="Αναζήτηση ονόματος ή αριθμού έγκρισης" value={q} onChangeText={setQ} maxLength={100}/>
          <Button disabled={busy} onPress={()=>{setSelected({});setForm({name:"",approval_id:"",ingredients:[],active:true});setMinistry({});setVersions([]);setReason("");resetReview();}}>Προσθήκη εγγραφής</Button>
          {items.map(v=><Pressable accessibilityRole="button" key={v.id} disabled={busy} onPress={()=>action(()=>select(v.id))} style={s.row}>
            <Text style={s.name}>{v.name}</Text><Text>{v.approval_id} · {v.active ? v.missing_from_source ? "Απουσία από πηγή" : "Στον κατάλογο" : "Αρχειοθετημένο"}</Text><Text style={s.help}>{v.sds_state === "verified" ? "Ελεγμένο ΔΔΑ" : "ΔΔΑ σε εκκρεμότητα"}</Text>
          </Pressable>)}
          {more && <Button disabled={busy} onPress={()=>action(async()=>{const r=need(await api.searchMaterialsCatalog(q,items.length));setItems([...items,...r.items]);setMore(r.more);})}>Περισσότερα</Button>}
        </View>
        {selected && <View style={s.card}><Text style={s.heading}>{selected.id ? "Επεξεργασία προϊόντος" : "Νέο προϊόν"}</Text>
          <Field label="Αριθμός έγκρισης" value={form.approval_id} editable={!selected.id} onChangeText={v=>setForm({...form,approval_id:v})} maxLength={100}/>
          {fields.map(([key,label])=><Field key={key} label={label} value={form[key]} onChangeText={v=>setForm({...form,[key]:v})}/>)}
          <Text style={s.label}>Εγγυημένη σύνθεση</Text>
          {(form.ingredients || []).map((ingredient,index)=><View key={index} style={s.ingredient}>
            <Field label="Δραστική ουσία" value={ingredient.name} onChangeText={name=>setForm({...form,ingredients:form.ingredients.map((v,i)=>i===index?{...v,name}:v)})}/>
            <Field label="Περιεκτικότητα %" value={ingredient.percent} onChangeText={percent=>setForm({...form,ingredients:form.ingredients.map((v,i)=>i===index?{...v,percent}:v)})}/>
            <Button onPress={()=>setForm({...form,ingredients:form.ingredients.filter((_,i)=>i!==index)})}>Αφαίρεση</Button>
          </View>)}
          <Button disabled={(form.ingredients || []).length>=30} onPress={()=>setForm({...form,ingredients:[...(form.ingredients || []),{name:"",percent:""}]})}>Προσθήκη δραστικής</Button>
          <View style={s.check}><Switch value={form.active !== false} onValueChange={active=>setForm({...form,active})}/><Text style={s.help}>Εμφάνιση στον κοινό κατάλογο</Text></View>
          <Field label="Αιτιολογία αλλαγής" value={reason} onChangeText={setReason} maxLength={1000}/>
          <Button disabled={busy || !reason.trim()} onPress={()=>action(save)}>Αποθήκευση εγγραφής</Button>
          {selected.id && <Button danger disabled={busy || !reason.trim()} onPress={()=>action(async()=>{if(!await confirm("Να αρχειοθετηθεί το προϊόν; Οι παλιές υπηρεσίες και τα ΔΔΑ τους διατηρούνται."))return;need(await api.retireCatalogProduct(selected.id,{expectedRevision:selected.revision,reason}));await select(selected.id);await refresh();})}>Διαγραφή από τον διαθέσιμο κατάλογο</Button>}
        </View>}
        {!!selected?.id && <View style={s.card}><Text style={s.heading}>Δελτία Δεδομένων Ασφαλείας</Text>
          <Text style={s.help}>Αντίδοτο και θεραπεία δημοσιεύονται αφού ελεγχθούν το συγκεκριμένο προϊόν και η ενότητα 4 του ΔΔΑ.</Text>
          <View style={s.preview}>
            <Text style={s.label}>Αυτόματος εντοπισμός ΔΔΑ</Text>
            <Text style={s.help}>Η πρώτη σύνδεση υποστηρίζει τις επίσημες σελίδες προϊόντων της ΔΑΦΝΗ Agrotrade. Για άλλους εκδότες μπορείτε να ανεβάσετε το ΔΔΑ παρακάτω.</Text>
            <Field label="Επίσημη σελίδα προϊόντος" value={sourcePage} onChangeText={setSourcePage} maxLength={2048}/>
            <Button disabled={busy || !sourcePage || !caps.sdsResearch} onPress={()=>action(async()=>{need(await api.queueCatalogSdsResearch(selected.id,{sourcePageUrl:sourcePage,expectedRevision:selected.revision}));await select(selected.id);})}>Εντοπισμός / ανανέωση ΔΔΑ</Button>
            {!caps.sdsResearch && <Text style={s.help}>Η αυτόματη αναζήτηση ΔΔΑ παραμένει απενεργοποιημένη. Μπορείτε να ανεβάσετε το επίσημο PDF και να το ελέγξετε παρακάτω.</Text>}
            {!!job && <Text style={s.help}>{({queued:"Στην ουρά ελέγχου",running:"Αναζήτηση και ανάγνωση πηγής",needs_source:"Χρειάζεται επίσημη πηγή",pending_review:"Βρέθηκε ΔΔΑ προς έλεγχο",current:"Το ελεγμένο ΔΔΑ παραμένει ίδιο",failed:"Η πηγή χρειάζεται χειροκίνητο έλεγχο"})[job.state]}</Text>}
          </View>
          <Field label="Σύνδεσμος πηγής (HTTPS)" value={sourceUrl} onChangeText={setSourceUrl} maxLength={2048}/>
          <Field label="Ημερομηνία έκδοσης ΔΔΑ (YYYY-MM-DD)" value={documentDate} onChangeText={setDocumentDate} maxLength={10}/>
          <View style={s.check}><Button onPress={()=>setLanguage("el")} disabled={language==="el"}>Ελληνικά</Button><Button onPress={()=>setLanguage("en")} disabled={language==="en"}>English</Button></View>
          <MaterialsFilePicker kind="pdf" disabled={busy} label={sdsFile ? sdsFile.name : "Επιλογή ΔΔΑ PDF (έως 8 MB)"} onSelect={setSdsFile}/>
          <Button disabled={busy || !sdsFile || !sourceUrl || !documentDate} onPress={()=>action(async()=>{need(await api.uploadCatalogSds(selected.id,sdsFile,{sourceUrl,documentDate,language,expectedRevision:selected.revision}));setSdsFile(null);setVersions(need(await api.getCatalogSdsVersions(selected.id)).versions);})}>Αποθήκευση προς έλεγχο</Button>
          {versions.map(v=><View key={v.id} style={s.row}><Text>{String(v.document_date).slice(0,10)} · {v.language} · {v.state === "verified" ? "Ελεγμένο" : v.state === "pending" ? "Προς έλεγχο" : "Απορρίφθηκε"}</Text>
            <Button disabled={busy} onPress={()=>action(async()=>need(await api.downloadCatalogSds(selected.id,v.id)))}>Λήψη PDF</Button>
            {v.state === "pending" && <Button disabled={busy} onPress={()=>review(v)}>Έλεγχος αυτής της έκδοσης</Button>}
          </View>)}
          {sds && <View style={s.preview}><Text style={s.heading}>Έλεγχος ΔΔΑ</Text>
            <Text selectable style={s.help}>{sds.source_url}</Text>
            <Field label="Επιβεβαιωμένη ημερομηνία έκδοσης (YYYY-MM-DD)" value={documentDate} onChangeText={setDocumentDate} maxLength={10}/>
            <Text style={s.help}>Γλώσσα: {language === "el" ? "Ελληνικά" : "English"}</Text>
            <Button onPress={()=>setLanguage(language === "el" ? "en" : "el")}>Αλλαγή γλώσσας</Button>
            <Button disabled={busy || !caps.sdsText} onPress={()=>action(async()=>setExtracted(need(await api.extractCatalogSdsText(selected.id,sds.id)).pages))}>Ανάγνωση σχετικών αποσπασμάτων</Button>
            {extracted.map(v=><View key={v.page}><Text style={s.label}>Σελίδα {v.page}</Text><Text selectable style={s.help}>{v.text}</Text></View>)}
            {kinds.map(([value,label])=><Pressable accessibilityRole="radio" accessibilityState={{checked:treatmentKind===value}} key={value} onPress={()=>setTreatmentKind(value)} style={s.check}><Text>{treatmentKind===value ? "●" : "○"} {label}</Text></Pressable>)}
            <Field label="Αντίδοτο / θεραπεία από το ΔΔΑ" multiline maxLength={4000} value={treatmentKind === "not_mentioned" ? "Δεν αναφέρεται στο ΔΔΑ" : treatmentText} editable={treatmentKind !== "not_mentioned"} onChangeText={setTreatmentText}/>
            <Field label="Ακριβές απόσπασμα ενότητας 4" multiline maxLength={12000} value={excerpt} onChangeText={setExcerpt}/>
            <Field label="Σελίδα στο PDF" value={page} onChangeText={setPage} keyboardType="number-pad" maxLength={3}/>
            <View style={s.check}><Switch value={identity} onValueChange={setIdentity}/><Text style={s.checkText}>Επιβεβαίωσα προϊόν, σύνθεση και έκδοση ΔΔΑ.</Text></View>
            <View style={s.check}><Switch value={reviewed} onValueChange={setReviewed}/><Text style={s.checkText}>Διάβασα την ενότητα 4 και επιβεβαίωσα το παραπάνω κείμενο.</Text></View>
            <Button disabled={busy || !identity || !reviewed || !treatmentKind || !excerpt || !page || !documentDate || (treatmentKind !== "not_mentioned" && !treatmentText.trim())} onPress={()=>action(async()=>{need(await api.verifyCatalogSds(selected.id,sds.id,{expectedRevision:selected.revision,identityConfirmed:identity,section4Reviewed:reviewed,documentDate,language,treatmentKind,treatmentText,evidenceExcerpt:excerpt,evidencePage:Number(page)}));await select(selected.id);await refresh();notify("Το ελεγμένο ΔΔΑ συνδέθηκε με το προϊόν.");})}>Δημοσίευση ελεγμένου ΔΔΑ</Button>
          </View>}
        </View>}
      </>}
    </ScrollView>
  </SafeAreaView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:"#f4f6f8"},header:{padding:14,backgroundColor:"#e5f1ec",flexDirection:"row",alignItems:"center",flexWrap:"wrap",gap:12},title:{fontSize:20,fontWeight:"700",flex:1,color:"#244237"},content:{padding:16,width:"100%",maxWidth:1000,alignSelf:"center",paddingBottom:60},card:{padding:18,marginBottom:18,borderRadius:12,backgroundColor:"#fff",borderWidth:1,borderColor:"#dce6e1"},heading:{fontSize:18,fontWeight:"700",color:"#244237",marginBottom:10},help:{fontSize:13,lineHeight:20,color:"#50665c",marginVertical:6},label:{fontSize:13,fontWeight:"600",color:"#344f43",marginBottom:5},field:{marginVertical:7,flexGrow:1,flexShrink:1},input:{fontSize:16,padding:12,borderWidth:1,borderColor:"#becfc5",borderRadius:8,backgroundColor:"#fff"},button:{padding:13,borderRadius:8,backgroundColor:"#1f8875",marginVertical:6,alignItems:"center"},buttonText:{fontSize:14,color:"#fff",fontWeight:"600",textAlign:"center"},row:{paddingVertical:12,borderTopWidth:1,borderColor:"#e1e9e4"},name:{fontSize:16,fontWeight:"600",color:"#245749",marginBottom:4},preview:{padding:14,marginTop:12,borderRadius:8,backgroundColor:"#edf5f1",gap:6},check:{flexDirection:"row",alignItems:"center",gap:12,marginVertical:8,flexWrap:"wrap"},checkText:{flex:1,minWidth:180,fontSize:14,lineHeight:21},ingredient:{padding:10,backgroundColor:"#f6f8f7",borderRadius:8,marginVertical:5},error:{padding:12,backgroundColor:"#fbeaea",color:"#932d2d",marginBottom:12,borderRadius:8}});
