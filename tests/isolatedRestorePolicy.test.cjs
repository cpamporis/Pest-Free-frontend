const test = require("node:test");
const assert = require("node:assert/strict");
const {assertRestoreInfo,BACKUP_ID} = require("../src/security/isolatedRestorePolicy");
test("login gate accepts only this restored backup identity", () => {
  const good = {scope:"isolated-security-lab-restore",backupId:BACKUP_ID,restoredPublicTables:50,verifiedUploadFiles:30,restoredReferences:22};
  assert.doesNotThrow(()=>assertRestoreInfo(good));
  for (const bad of [null,{}, {...good,backupId:"another"}, {...good,scope:"production"}, {...good,restoredReferences:20}, {...good,verifiedUploadFiles:28}, {...good,restoredPublicTables:49}]) {
    assert.throws(()=>assertRestoreInfo(bad));
  }
});
