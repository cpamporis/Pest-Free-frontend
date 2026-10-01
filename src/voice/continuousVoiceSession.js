'use strict';
// One capture -> one final result -> read-back -> one commit -> next capture.
// The controller never retains a transcript and rejects stale capture events.
function createContinuousVoiceSession({ native, prepare, validate, commit, onState,
  schedule = (fn,ms) => setTimeout(fn,ms), cancel = id => clearTimeout(id),
  instanceId = `${Date.now()}-${Math.random()}` }) {
  let running = false, epoch = 0, capture = 0, tag = null, stage = 'idle', timer = null;
  const state = (next,message) => { stage = next; onState(next,message); };
  function stop(message = 'Η φωνητική λειτουργία σταμάτησε.') {
    running = false; epoch++; tag = null; if (timer !== null) cancel(timer); timer = null;
    native.stop(); state('idle',message);
  }
  async function listen(ticket) {
    if (!running || epoch !== ticket) return;
    tag = `${instanceId}-${++capture}`;
    native.setRequestTag(tag);
    state('listening','Ακούω τον επόμενο σταθμό…');
    try { await native.startAutomatic(); }
    catch { if (epoch === ticket) stop('Δεν ξεκίνησε η τοπική αναγνώριση. Πατήστε έναρξη για νέα προσπάθεια.'); }
  }
  function next(ticket) {
    if (!running || epoch !== ticket) return;
    state('settling','Ετοιμάζομαι για τον επόμενο σταθμό…');
    // Small acoustic drain after playback; microphone is still off.
    timer = schedule(() => { timer = null; void listen(ticket); },250);
  }
  async function announce(message,ticket) {
    state('speaking',message);
    try {
      const complete = await native.speak(message);
      if (!running || epoch !== ticket) return false;
      if (!complete) { stop('Η εκφώνηση διακόπηκε. Η λειτουργία σταμάτησε.'); return false; }
      return true;
    } catch { if (epoch === ticket) stop('Η εκφώνηση απέτυχε. Δεν έγινε νέα καταχώριση.'); return false; }
  }
  async function handleEvent(event) {
    if (!running || stage !== 'listening' || !tag || event.requestTag !== tag) return;
    tag = null; // consume immediately, before any await
    const ticket = epoch;
    state('processing','Επεξεργασία στη συσκευή…');
    if (event.code === 'NO_SPEECH') { next(ticket); return; }
    if (event.code !== 'RESULT') {
      stop(event.code === 'CAPTURE_LIMIT' ? 'Η φράση ή ο θόρυβος ξεπέρασε τον χρόνο ακρόασης. Δεν έγινε καταχώριση.' : 'Η ακρόαση διακόπηκε. Δεν έγινε νέα καταχώριση.'); return;
    }
    const spoken = String(event.text || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[.!;]+$/,'').trim();
    if (['παυση','σταματημα','ακυρωση'].includes(spoken)) { stop(); return; }
    let prepared;
    try { prepared = prepare(event.text); }
    catch { stop('Δεν ελέγχθηκαν τα στοιχεία της εργασίας.'); return; }
    if (!prepared.ok) {
      if (await announce(prepared.message || 'Δεν αναγνωρίστηκε πλήρης εντολή. Επαναλάβετε.',ticket)) next(ticket);
      return;
    }
    if (!validate(prepared.candidate)) { stop('Άλλαξε η εργασία ή ο σταθμός. Δεν έγινε καταχώριση.'); return; }
    if (!(await announce(prepared.readback,ticket))) return;
    // A stop, lock, context change or failed read-back must never commit afterwards.
    if (!running || epoch !== ticket) return;
    if (!validate(prepared.candidate)) { stop('Άλλαξε η εργασία ή έληξε η εντολή. Δεν έγινε καταχώριση.'); return; }
    try { commit(prepared.candidate); }
    catch { stop('Δεν έγινε η καταχώριση. Ελέγξτε την εργασία.'); return; }
    next(ticket);
  }
  return {
    start() { stop(''); running = true; void listen(epoch); },
    stop,
    handleEvent,
  };
}
module.exports = { createContinuousVoiceSession };
