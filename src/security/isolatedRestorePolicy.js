"use strict";
const BACKUP_ID = "pb-20261006T065558Z-0eac42561f0d67bb";
function assertRestoreInfo(info) {
  if (!info || info.scope !== "isolated-production-restore" ||
      info.backupId !== BACKUP_ID || info.restoredPublicTables !== 50 ||
      info.verifiedUploadFiles !== 281 || info.restoredReferences !== 139 || info.postgresVersion !== "17.11" || info.mfaEnabled !== true) {
    throw new Error("Δεν επιβεβαιώθηκε το συγκεκριμένο backup. Η σύνδεση ακυρώθηκε.");
  }
}
module.exports = { assertRestoreInfo, BACKUP_ID };

