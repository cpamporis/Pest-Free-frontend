const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseGreekStationCommand: parse } = require('../src/voice/parseGreekStationCommand');
for (const [text, stationNumber, consumption] of [
  ['Δολωματικός σταθμός δέκα — κατανάλωση είκοσι πέντε',10,25],
  ['Σταθμός 101, κατανάλωση 25%.',101,25],
  ['Σταθμός εκατόν ένα κατανάλωση εκατό',101,100],
  ['σταθμός δώδεκα κατανάλωση εικοσιπέντε',12,25],
  ['ΣΤΑΘΜΟΣ ΕΝΑ ΚΑΤΑΝΑΛΩΣΗ ΜΗΔΕΝ',1,0],
  ['σταθμός εννιακόσια ενενήντα εννιά κατανάλωση πενήντα τοις εκατό',999,50],
]) test(`parses: ${text}`, () => assert.deepEqual(parse(text), {ok:true,stationNumber,consumption}));
for (const text of [
  '',null,'πάμε στον σταθμό 10 κατανάλωση 25','σταθμός 1 κατανάλωση 101',
  'σταθμός 0 κατανάλωση 25','σταθμός 1000 κατανάλωση 25','σταθμός 1 κατανάλωση -25',
  'σταθμός 1 κατανάλωση 25.5','σταθμός 1 κατανάλωση 25 και μετά 50',
  'σταθμός 1 ή 2 κατανάλωση 25','σταθμός δέκα πέντε κατανάλωση 25',
  'σταθμός 1 κατανάλωση είκοσι δέκα','σταθμός 1 κατανάλωση 25 αποθήκευση',
]) test(`rejects ambiguous/invalid input: ${text}`, () => assert.equal(parse(text).ok,false));
test('voice build is opt-in, rejects production, leaves normal update configuration intact', () => {
  const configFactory = require('../app.config');
  const oldVariant = process.env.APP_VARIANT, oldVoice = process.env.PESTIFY_VOICE_LAB;
  const base = { name:'Pestify',ios:{bundleIdentifier:'com.cpamporis.pestfree'},plugins:['existing'],updates:{url:'existing-url'},runtimeVersion:'existing-runtime' };
  try {
    delete process.env.APP_VARIANT; delete process.env.PESTIFY_VOICE_LAB;
    const ordinary = configFactory({config:base});
    assert.deepEqual(ordinary.plugins,base.plugins); assert.deepEqual(ordinary.updates,base.updates);
    process.env.PESTIFY_VOICE_LAB='1';
    assert.throws(() => configFactory({config:base}),/restricted/);
    process.env.APP_VARIANT='development';
    const voice = configFactory({config:base});
    assert.equal(voice.ios.bundleIdentifier,'com.cpamporis.pestfree.dev');
    assert.equal(voice.updates.enabled,false);
    assert.equal(voice.plugins.at(-1),'./plugins/withPestifyVoiceProbe');
  } finally {
    if (oldVariant === undefined) delete process.env.APP_VARIANT; else process.env.APP_VARIANT=oldVariant;
    if (oldVoice === undefined) delete process.env.PESTIFY_VOICE_LAB; else process.env.PESTIFY_VOICE_LAB=oldVoice;
  }
});
