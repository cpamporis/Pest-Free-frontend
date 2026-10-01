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

for (const text of [
  'Δολωματικός σταθμός 10. Κατανάλωση 25%.',
  'Σταθμός: δέκα, κατανάλωση: είκοσι πέντε.',
  'Σταθμός:10,κατανάλωση:25%',
  'Σταθμός δέκα· κατανάλωση είκοσι πέντε!',
  'Σταθμός δέκα\nκατανάλωση είκοσι πέντε',
]) test(`accepts punctuation only at command boundaries: ${text}`, () =>
  assert.deepEqual(parse(text), {ok:true,stationNumber:10,consumption:25}));
for (const text of [
  'Σταθμός 10.5. Κατανάλωση 25%.',
  'Σταθμός -10. Κατανάλωση 25%.',
  'Σταθμός 10. Κατανάλωση: -25%.',
  'Σταθμός 10. Κατανάλωση: 25,5%.',
  'Σταθμός 10. Κατανάλωση: 25.5%.',
  'Σταθμός 10. Κατανάλωση: 2 5%.',
  'Σταθμός 10. Κατανάλωση 25%. Μίλα στον Γιάννη.',
]) test(`punctuation tolerance does not accept unsafe input: ${text}`, () => assert.equal(parse(text).ok,false));
test('diagnostic separates empty text, grammar, station and consumption errors without echoing input', () => {
  assert.deepEqual(parse(''),{ok:false,code:'EMPTY_TRANSCRIPT'});
  assert.deepEqual(parse('γειά σου'),{ok:false,code:'INVALID_COMMAND'});
  assert.deepEqual(parse('σταθμός κάτι κατανάλωση 25'),{ok:false,code:'INVALID_STATION'});
  assert.deepEqual(parse('σταθμός 10 κατανάλωση κάτι'),{ok:false,code:'INVALID_CONSUMPTION'});
});
