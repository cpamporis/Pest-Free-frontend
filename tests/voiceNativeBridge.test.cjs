const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('exported native methods do not shadow synthesized Objective-C property setters', () => {
  const source = fs.readFileSync(path.join(__dirname, '../native/voice-probe/PestifyVoiceProbe.m'), 'utf8');
  const properties = [...source.matchAll(/@property\([^)]*\)[^;]*?\b(\w+)\s*;/g)].map(match => match[1]);
  const setters = new Set(properties.map(name => `set${name[0].toUpperCase()}${name.slice(1)}`));
  const exported = [...source.matchAll(/RCT_EXPORT_METHOD\(\s*(\w+)/g)].map(match => match[1]);
  for (const selector of exported) {
    assert.equal(setters.has(selector), false, `${selector} shadows a property setter; assigning that property can recurse and crash`);
  }
});
