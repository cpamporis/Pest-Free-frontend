const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createContinuousVoiceSession}=require('../src/voice/continuousVoiceSession');
function fixture(options={}) {
 let resolveSpeech, tag, valid=true; const commits=[],states=[],speech=[],timers=[];let starts=0;
 const native={stop(){},setRequestTag(t){tag=t;},async startAutomatic(){starts++;if(options.startFails) throw Error('mic');},speak(text){speech.push(text);return new Promise(resolve=>{resolveSpeech=resolve;});}};
 const controller=createContinuousVoiceSession({native,instanceId:'test',
  prepare:text=>options.invalid ? {ok:false,message:'Επαναλάβετε.'} : {ok:true,candidate:{number:text},readback:'Σταθμός 2, κατανάλωση 25%.'},
  validate:()=>valid,commit:c=>{if(options.commitFails) throw Error('context');commits.push(c);},
  onState:(...args)=>states.push(args),schedule:fn=>{timers.push(fn);return timers.length-1;},cancel:id=>{timers[id]=null;}});
 return {controller,commits,states,speech,get tag(){return tag;},get starts(){return starts;},setValid:v=>valid=v,
  finishSpeech:value=>resolveSpeech(value),tick:()=>{const fn=timers.shift();if(fn) fn();},
  result:(text='station2')=>controller.handleEvent({code:'RESULT',text,requestTag:tag})};
}
test('read-back completes before exactly one commit and microphone restart',async()=>{
 const f=fixture();f.controller.start();const firstTag=f.tag;
 const work=f.result();assert.equal(f.commits.length,0);assert.equal(f.starts,1);
 await f.controller.handleEvent({code:'RESULT',text:'duplicate',requestTag:firstTag});
 assert.equal(f.speech.length,1);f.finishSpeech(true);await work;
 assert.equal(f.commits.length,1);assert.equal(f.starts,1);f.tick();assert.equal(f.starts,2);assert.notEqual(f.tag,firstTag);
 await f.controller.handleEvent({code:'RESULT',text:'stale',requestTag:firstTag});assert.equal(f.speech.length,1);
});
test('stop during read-back prevents commit and restart',async()=>{
 const f=fixture();f.controller.start();const work=f.result();f.controller.stop();f.finishSpeech(true);await work;f.tick();assert.equal(f.commits.length,0);assert.equal(f.starts,1);
});
test('context changed while speaking cannot be committed',async()=>{
 const f=fixture();f.controller.start();const work=f.result();f.setValid(false);f.finishSpeech(true);await work;assert.equal(f.commits.length,0);assert.equal(f.states.at(-1)[0],'idle');
});
test('interrupted read-back prevents commit',async()=>{
 const f=fixture();f.controller.start();const work=f.result();f.finishSpeech(false);await work;assert.equal(f.commits.length,0);assert.equal(f.states.at(-1)[0],'idle');
});
test('unrecognized command requests repetition and resumes with no commit',async()=>{
 const f=fixture({invalid:true});f.controller.start();const work=f.result();f.finishSpeech(true);await work;f.tick();assert.equal(f.commits.length,0);assert.equal(f.starts,2);
});
test('silence rearms automatically without recording a station',async()=>{
 const f=fixture();f.controller.start();await f.controller.handleEvent({code:'NO_SPEECH',requestTag:f.tag});f.tick();assert.equal(f.starts,2);assert.equal(f.commits.length,0);assert.equal(f.speech.length,0);
});
for(const code of ['CAPTURE_LIMIT','NO_FINAL_RESULT','AUDIO_INTERRUPTED','RECOGNITION_FAILED']) test(`native ${code} stops instead of committing a partial result`,async()=>{
 const f=fixture();f.controller.start();await f.controller.handleEvent({code,requestTag:f.tag});assert.equal(f.commits.length,0);assert.equal(f.states.at(-1)[0],'idle');
});
for(const word of ['Παύση.','ακύρωση','Σταμάτημα']) test(`voice pause: ${word}`,async()=>{
 const f=fixture();f.controller.start();await f.result(word);assert.equal(f.commits.length,0);assert.equal(f.speech.length,0);assert.equal(f.states.at(-1)[0],'idle');
});
test('failed parent commit halts loop',async()=>{
 const f=fixture({commitFails:true});f.controller.start();const work=f.result();f.finishSpeech(true);await work;f.tick();assert.equal(f.commits.length,0);assert.equal(f.starts,1);
});
test('failed microphone start halts loop',async()=>{
 const f=fixture({startFails:true});f.controller.start();await Promise.resolve();assert.equal(f.states.at(-1)[0],'idle');assert.equal(f.commits.length,0);
});
