const test = require('node:test');
const assert = require('node:assert/strict');
const {resolveTarget} = require('../src/security/drTarget.cjs');
test('test client refuses production and insecure origins',()=>{
  for(const origin of ['https://api.pestify.gr','https://field-inspections-backend-production.up.railway.app','http://dr.example.test','https://dr.example.test/api','https://user:pass@dr.example.test']) assert.throws(()=>resolveTarget('hetzner-dr-test',origin));
  assert.throws(()=>resolveTarget('production','https://dr.example.test'));
  assert.equal(resolveTarget('hetzner-dr-test','https://dr.example.test'),'https://dr.example.test');
});
test('test branch refuses production app configuration',()=>{
  const previous = process.env.APP_VARIANT;
  process.env.APP_VARIANT='production';
  try {assert.throws(()=>require('../app.config')({config:{ios:{bundleIdentifier:'com.cpamporis.pestfree'}}}),/refuses production/);} finally {if(previous===undefined) delete process.env.APP_VARIANT; else process.env.APP_VARIANT=previous;}
});
