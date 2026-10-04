"use strict";
const BACKUP_ID = "slb-20261004T080709Z-fd19342f6b84f488";
function assertRestoreInfo(info) {
  if (!info || info.scope !== "isolated-security-lab-restore" ||
      info.backupId !== BACKUP_ID || info.restoredPublicTables !== 50 ||
      info.verifiedUploadFiles !== 30 || info.restoredReferences !== 22) {
    throw new Error("Δεν επιβεβαιώθηκε το συγκεκριμένο backup. Η σύνδεση ακυρώθηκε.");
  }
}
module.exports = { assertRestoreInfo, BACKUP_ID };
