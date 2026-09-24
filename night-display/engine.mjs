// [KAI] Night Display experiment B — deterministic, framework-independent core.
// Logic source: Rin v0.3 + Dan SYNC 02 decision update 02.1 (2026-09-24).
export const RULES_VERSION = 'B-rules-v0.3-sync02.1';
export const ITEMS = Object.freeze({ M: '거울', C: '촛불', B: '종', K: '열쇠' });
export const RESIDUALS = Object.freeze({ H: 'hiddenPaperGuest', R1: 'reflectedMark', R2: 'vibrationMark', R3: 'keyMark', R0: 'unmovedDust' });
export const CUES = Object.freeze({ H: 'CANDLE_TO_BACKWALL', R1: 'CANDLE_TO_MIRROR', R2: 'BELL_TO_CANDLE', R3: 'KEY_TO_BELL_TO_PLATE', R0: 'NONE_SCAN' });
export const BEATS = Object.freeze(['CUE', 'GAZE', 'ACTION', 'RESIDUE']);
const isItem = x => Object.hasOwn(ITEMS, x);
const sortedSlots = (slots, items) => items.map(x => slots.indexOf(x)).sort((a, b) => a - b);
const adjacent = (slots, a, b) => {
  const x = slots.indexOf(a), y = slots.indexOf(b);
  return x >= 0 && y >= 0 && Math.abs(x - y) === 1;
};
const safeSlots = slots => {
  if (!Array.isArray(slots) || slots.length !== 3 || slots.some(x => !isItem(x)) || new Set(slots).size !== 3) {
    throw new TypeError('evaluate requires three different placed items M/C/B/K');
  }
  return [...slots];
};

/** Evaluate exactly once on the snapshot; no timing, DOM, renderer, or randomness. */
export function evaluate(input) {
  const slots = safeSlots(input);
  const hidden = slots[1] === 'C' && new Set([slots[0], slots[2]]).has('M')
    && new Set([slots[0], slots[2]]).has('B');
  const matchedRuleIds = [
    ...(hidden ? ['H'] : []),
    ...(adjacent(slots, 'M', 'C') ? ['R1'] : []),
    ...(adjacent(slots, 'C', 'B') ? ['R2'] : []),
    ...(adjacent(slots, 'B', 'K') ? ['R3'] : []),
  ];
  const reactionId = matchedRuleIds[0] || 'R0'; // H > R1 > R2 > R3 > R0
  const causeSlots = reactionId === 'H' ? [0, 1, 2]
    : reactionId === 'R1' ? sortedSlots(slots, ['M', 'C'])
    : reactionId === 'R2' ? sortedSlots(slots, ['C', 'B'])
    : reactionId === 'R3' ? sortedSlots(slots, ['B', 'K']) : [];
  const clueItem = { H: 'C', R1: 'C', R2: 'B', R3: 'K' }[reactionId];
  // This array is safe for PUBLIC highlighting. Do not expose causeSlots in game UI.
  const visibleClueSlots = clueItem ? [slots.indexOf(clueItem)] : [];
  return Object.freeze({
    rulesVersion: RULES_VERSION,
    reactionId,
    matchedRuleIds: Object.freeze(matchedRuleIds),
    causeSlots: Object.freeze(causeSlots),
    visibleClueSlots: Object.freeze(visibleClueSlots),
    evidenceCueId: CUES[reactionId],
    residualChange: RESIDUALS[reactionId],
  });
}

const copyResult = result => result ? ({
  ...result,
  matchedRuleIds: [...result.matchedRuleIds],
  causeSlots: [...result.causeSlots],
  visibleClueSlots: [...result.visibleClueSlots],
}) : null;
const editing = phase => phase === 'PLACE' || phase === 'READY';

export class Game {
  #s = { phase: 'PLACE', slots: [null, null, null], selectedItemId: null,
    slotSnapshot: null, result: null, beatIndex: -1, runId: 0, history: [], events: [] };
  #listener;
  constructor(onChange = () => {}) { this.#listener = onChange; }
  get state() {
    const s = this.#s;
    return {
      phase: s.phase, slots: [...s.slots], selectedItemId: s.selectedItemId,
      slotSnapshot: s.slotSnapshot ? [...s.slotSnapshot] : null,
      result: copyResult(s.result), animationStep: s.beatIndex < 0 ? null : BEATS[s.beatIndex],
      runId: s.runId, history: s.history.map(h => ({ ...h, slots: [...h.slots] })),
      canEdit: editing(s.phase), canOpen: s.phase === 'READY', canSkip: s.phase === 'REACT',
    };
  }
  get debugEvents() { return this.#s.events.map(e => structuredClone(e)); }
  #emit() { this.#listener(this.state); }
  #log(type, details = {}) { this.#s.events.push({ type, runId: this.#s.runId, ...details }); }
  #updatePhase() { this.#s.phase = this.#s.slots.every(isItem) ? 'READY' : 'PLACE'; }
  select(id) {
    if (!editing(this.#s.phase) || !isItem(id)) return false;
    this.#s.selectedItemId = this.#s.selectedItemId === id ? null : id;
    this.#log('select', { itemId: this.#s.selectedItemId }); this.#emit(); return true;
  }
  place(itemId, index, via = 'tap') {
    const s = this.#s;
    if (!editing(s.phase) || !isItem(itemId) || !Number.isInteger(index) || index < 0 || index > 2) return false;
    const before = [...s.slots];
    const source = before.indexOf(itemId), target = before[index];
    if (source === index) { s.selectedItemId = null; this.#emit(); return true; }
    // Shelf item onto another shelf item swaps; tray item replaces and displaces to tray.
    if (source >= 0) s.slots[source] = target || null;
    s.slots[index] = itemId;
    s.selectedItemId = null;
    this.#updatePhase();
    this.#log('place', { via, itemId, index, action: source < 0 ? (target ? 'replace' : 'insert') : (target ? 'swap' : 'move'), before, after: [...s.slots] });
    this.#emit(); return true;
  }
  placeSelected(index) { return this.#s.selectedItemId ? this.place(this.#s.selectedItemId, index, 'tap') : false; }
  open() {
    const s = this.#s;
    if (s.phase !== 'READY') return false;
    s.runId++;
    s.slotSnapshot = Object.freeze([...s.slots]);
    s.result = evaluate(s.slotSnapshot);
    s.phase = 'REACT'; s.beatIndex = 0; s.selectedItemId = null;
    this.#log('open', { slotSnapshot: [...s.slotSnapshot], rulesVersion: RULES_VERSION,
      matchedRuleIds: [...s.result.matchedRuleIds], chosenRuleId: s.result.reactionId,
      reactionId: s.result.reactionId, causeSlots: [...s.result.causeSlots] });
    this.#emit(); return true;
  }
  advance(runId = this.#s.runId) {
    const s = this.#s;
    if (s.phase !== 'REACT' || runId !== s.runId) return false;
    if (s.beatIndex < BEATS.length - 1) {
      s.beatIndex++;
      this.#log('beat', { step: BEATS[s.beatIndex] }); this.#emit();
    } else this.#finish('complete');
    return true;
  }
  #finish(via) {
    const s = this.#s;
    if (s.phase !== 'REACT') return false;
    s.phase = 'RESULT'; s.beatIndex = -1;
    s.history.push({ runId: s.runId, slots: [...s.slotSnapshot], reactionId: s.result.reactionId });
    this.#log('result', { via, reactionId: s.result.reactionId, residualChange: s.result.residualChange });
    this.#emit(); return true;
  }
  skip() { return this.#finish('skip'); }
  resumeAfterBackground() { return this.#finish('background'); }
  rearrange() {
    const s = this.#s;
    if (s.phase !== 'RESULT') return false;
    s.result = null; s.slotSnapshot = null; s.beatIndex = -1;
    this.#updatePhase(); this.#log('rearrange'); this.#emit(); return true;
  }
  reset() {
    const s = this.#s;
    s.runId++; // late callbacks from the old run become inert
    s.slots = [null, null, null]; s.selectedItemId = null; s.slotSnapshot = null;
    s.phase = 'PLACE'; s.result = null; s.beatIndex = -1; s.history = [];
    s.events = []; this.#log('reset'); this.#emit(); return true;
  }
}
