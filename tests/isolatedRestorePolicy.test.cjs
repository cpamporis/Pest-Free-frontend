const test = require("node:test");
const assert = require("node:assert/strict");
const {assertRestoreInfo,BACKUP_ID} = require("../src/security/isolatedRestorePolicy");
test("login gate accepts only this restored backup identity", () => {
  const good = {scope:"isolated-production-restore",backupId:BACKUP_ID,restoredPublicTables:50,verifiedUploadFiles:281,restoredReferences:139,postgresVersion:"17.11",mfaEnabled:true};
  assert.doesNotThrow(()=>assertRestoreInfo(good));
  for (const bad of [null,{}, {...good,mfaEnabled:false}, {...good,postgresVersion:"18.1"}, {...good,backupId:"another"}, {...good,scope:"production"}, {...good,restoredReferences:20}, {...good,verifiedUploadFiles:28}, {...good,restoredPublicTables:49}]) {
    assert.throws(()=>assertRestoreInfo(bad));
  }
});

