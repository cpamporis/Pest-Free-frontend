const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const babel=require("@babel/core");

function client({os="web",fetchImpl=async()=>({ok:false,headers:{get:()=>"application/json"}})}={}) {
  const calls=[],downloads=[],deleted=[];
  let token="token-one";
  const source=fs.readFileSync(path.join(__dirname,"../src/services/materialsCatalogClient.js"),"utf8");
  const code=babel.transformSync(source,{babelrc:false,configFile:false,plugins:[require.resolve("@babel/plugin-transform-modules-commonjs")]}).code;
  const module={exports:{}};
  const deps={"react-native":{Platform:{OS:os}},"expo-file-system/legacy":{cacheDirectory:"cache/",makeDirectoryAsync:async()=>{},downloadAsync:async(url,file,options)=>{downloads.push({url,file,options});return {status:401,headers:{"content-type":"application/json"}};},deleteAsync:async file=>deleted.push(file)},"expo-file-system":{File:class{constructor(uri){this.uri=uri;}}},"expo-sharing":{isAvailableAsync:async()=>true,shareAsync:async()=>{throw Error("must not share a failed response");}},"expo/fetch":{fetch:fetchImpl}};
  vm.runInNewContext(code,{module,exports:module.exports,require:name=>{if(!deps[name])throw Error(name);return deps[name];},fetch:fetchImpl,FormData,URL,Date,Math,setTimeout});
  const api=module.exports.createMaterialsCatalogClient({request:async(...args)=>{calls.push(args);return {success:true,enabled:true};},ready:async()=>{},token:()=>token,baseUrl:"https://lab.example/api"});
  return {api,calls,downloads,deleted,setToken:value=>{token=value;}};
}
test("search encodes text and catalog mutations target only dedicated endpoints",async()=>{
  const c=client();await c.api.searchMaterialsCatalog("Dob & x=1");
  assert.equal(c.calls[0][1],"/materials-catalog/products?q=Dob%20%26%20x%3D1&offset=0");
  await c.api.saveCatalogProduct("id/other",{overrides:{name:"Local"}});
  assert.equal(c.calls[1][1],"/materials-catalog/products/id%2Fother");
  await c.api.applyCatalogImport("batch");assert.equal(c.calls[2][2].confirm,true);
  await c.api.getLocalMaterials("bait");assert.equal(c.calls[3][1],"/materials/bait-types");
});
test("capability cache is invalidated on a session token change",async()=>{
  const c=client();await c.api.getMaterialsCatalogCapabilities();await c.api.getMaterialsCatalogCapabilities();assert.equal(c.calls.length,1);
  c.setToken("different-organization-token");await c.api.getMaterialsCatalogCapabilities();assert.equal(c.calls.length,2);
});
test("binary downloads use authorization headers and remove failed native files",async()=>{
  const c=client({os:"ios"});const r=await c.api.downloadReportSds("private report");
  assert.equal(r.success,false);assert.equal(c.downloads[0].url,"https://lab.example/api/materials-catalog/reports/private%20report/sds.zip");
  assert.equal(c.downloads[0].options.headers.Authorization,"Bearer token-one");
  assert.ok(c.downloads[0].file.endsWith("/Δελτία Δεδομένων Ασφαλείας (MSDS).zip"));
  assert.equal(c.deleted.length,1);
});
test("expired sessions do not start downloads and oversized uploads do not reach the network",async()=>{
  let requests=0;const c=client({os:"ios",fetchImpl:async()=>{requests++;throw Error();}});
  c.setToken(null);assert.equal((await c.api.downloadReportSds("r")).error,"SESSION_EXPIRED");assert.equal(c.downloads.length,0);
  c.setToken("token");assert.equal((await c.api.previewCatalogExcel({size:8388609},"2026-09-28")).error,"DOCUMENT_LIMIT_8_MB");assert.equal(requests,0);
});
test("a successful JSON error response cannot be presented as an SDS zip",async()=>{
  const c=client({fetchImpl:async()=>({ok:true,headers:{get:()=>"application/json"}})});
  assert.equal((await c.api.downloadReportSds("report")).success,false);
});
test("pilot action uses its dedicated confirmed endpoint", async () => {
  const c = client();

  await c.api.publishCatalogPilotThree();

  assert.equal(c.calls[0][0], "POST");
  assert.equal(
    c.calls[0][1],
    "/materials-catalog/imports/pilot-three"
  );
  assert.equal(c.calls[0][2].confirm, true);
});
