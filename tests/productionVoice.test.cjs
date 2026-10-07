const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const configFactory=require('../app.config');
const baseline=require('../app.json').expo;
function configured(env={}) {
 const keys=['APP_VARIANT','PESTIFY_VOICE_ENABLED','PESTIFY_VOICE_LAB','PESTIFY_VOICE_FIELD_LAB','EAS_BUILD_PLATFORM'];
 const old=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 try{for(const k of keys){delete process.env[k];if(env[k]!==undefined)process.env[k]=env[k];}return configFactory({config:structuredClone(baseline)});}
 finally{for(const k of keys){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}}
}
test('ordinary production retains current runtime, version, endpoints and no microphone plugin',()=>{
 const c=configured();assert.equal(c.version,baseline.version);assert.deepEqual(c.runtimeVersion,baseline.runtimeVersion);assert.deepEqual(c.plugins,baseline.plugins);assert.deepEqual(c.updates,baseline.updates);
 const api=fs.readFileSync(require.resolve('../src/services/apiService'),'utf8');assert.match(api,/https:\/\/api\.pestify\.gr/);
});
test('voice release has production identity, isolated runtime and no Lab diagnostics',()=>{
 const c=configured({PESTIFY_VOICE_ENABLED:'1',APP_VARIANT:'production',EAS_BUILD_PLATFORM:'ios'});
 assert.equal(c.ios.bundleIdentifier,'com.cpamporis.pestfree');assert.equal(c.version,'1.4.0');assert.equal(c.runtimeVersion,'pestify-ios-voice-1');assert.deepEqual(c.updates,baseline.updates);assert.equal(c.plugins.at(-1),'./plugins/withPestifyVoice');
 assert.equal(fs.existsSync(require('node:path').join(__dirname,'../src/voice/VoiceLabEntry.js')),false);
});
test('rejects mixed Lab, development and Android release settings',()=>{
 assert.throws(()=>configured({PESTIFY_VOICE_ENABLED:'1',APP_VARIANT:'development'}),/production variant/);
 assert.throws(()=>configured({PESTIFY_VOICE_LAB:'1'}),/Security Lab/);
 assert.throws(()=>configured({PESTIFY_VOICE_FIELD_LAB:'1'}),/Security Lab/);
 assert.throws(()=>configured({PESTIFY_VOICE_ENABLED:'1',EAS_BUILD_PLATFORM:'android'}),/iOS-only/);
});
test('voice profile preserves default production profile and isolates OTA channel',()=>{
 const eas=require('../eas.json');assert.deepEqual(eas.build.production,{autoIncrement:true,channel:'production'});
 assert.equal(eas.build['production-voice'].extends,'production');assert.equal(eas.build['production-voice'].channel,'production-voice');assert.equal(eas.build['production-voice'].env.PESTIFY_VOICE_ENABLED,'1');
});
test('voice plist adds real audio background mode and purpose strings while preserving other permissions',()=>{
 const {applyVoiceInfoPlist}=require('../plugins/withPestifyVoice');
 const original={UIBackgroundModes:['fetch'],NSCameraUsageDescription:'camera'};const c=applyVoiceInfoPlist(original);
 assert.deepEqual(c.UIBackgroundModes,['fetch','audio']);assert.equal(c.NSCameraUsageDescription,'camera');assert.equal(c.PestifyVoiceEnabled,true);assert.match(c.NSMicrophoneUsageDescription,/κλειδωμένη/);assert.match(c.NSSpeechRecognitionUsageDescription,/στη συσκευή/);assert.deepEqual(original.UIBackgroundModes,['fetch']);assert.deepEqual(applyVoiceInfoPlist(c),c);
 assert.equal(c.PestifyVoiceLabProbeEnabled,undefined);
});
