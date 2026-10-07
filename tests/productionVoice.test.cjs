const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const configFactory=require('../app.config');
const baseline=require('../app.json').expo;
function configured(env={}) {
 const keys=['APP_VARIANT','PESTIFY_VOICE_ENABLED','PESTIFY_VOICE_LAB','PESTIFY_VOICE_FIELD_LAB','EAS_BUILD_PLATFORM'];
 const old=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 try{for(const k of keys){delete process.env[k];if(env[k]!==undefined)process.env[k]=env[k];}return configFactory({config:structuredClone(baseline)});}
 finally{for(const k of keys){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}}
}
test('DR branch refuses ordinary and voice production builds',()=>{
 assert.throws(()=>configured(), /refuses production/);
 assert.throws(()=>configured({PESTIFY_VOICE_ENABLED:'1',APP_VARIANT:'production',EAS_BUILD_PLATFORM:'ios'}), /refuses production/);
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
