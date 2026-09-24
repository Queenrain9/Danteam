import { Game, ITEMS } from './engine.mjs';

const $ = id => document.getElementById(id);
const game = new Game(render);
const el = { shelf: $('shelf'), tray: $('tray'), scene: document.querySelector('.scene'), visitor: $('visitor'),
  guest: $('hidden-guest'), doorhole: $('doorhole'), doorplate: document.querySelector('.doorplate'),
  residue: $('residue'), primary: $('primary'), skip: $('skip'), title: $('message-title'),
  detail: $('message-detail'), icon: $('message-icon'), count: $('count'), note: $('selection-note'), counter: $('counter') };
const LABEL = { H: '벽 뒤의 낯선 손님', R1: '작은 반사광', R2: '공기를 타고 번지는 파문',
  R3: '먼지 아래의 오래된 흔적', R0: '손님은 잠시 살피다 떠났습니다' };
const PRESENTATION = {
  R1: {
    CUE: '촛불이 아주 작게 흔들립니다.', GAZE: '손님이 거울 쪽을 바라봅니다.',
    ACTION: '손님이 거울에서 번진 빛을 손으로 가립니다.', RESIDUE: '작은 둥근 반사 흔적이 남았습니다.',
  },
  R2: {
    CUE: '종의 테두리가 살짝 떨립니다.', GAZE: '손님이 촛불을 바라봅니다.',
    ACTION: '손님이 종 근처로 손을 내밀자 파문이 번집니다.', RESIDUE: '종 아래에 가느다란 파문이 남았습니다.',
  },
  R3: {
    CUE: '열쇠가 아주 짧게 떨립니다.', GAZE: '종이 짧게 흔들리고 손님의 시선이 옮겨갑니다.',
    ACTION: '손님이 기존 문에 달린 먼지 낀 잠금판을 한 번 닦습니다.',
    RESIDUE: '먼지 아래 있던 열쇠구멍 윤곽이 드러났습니다.',
  },
  H: {
    CUE: '가운데 촛불의 그림자가 길어집니다.', GAZE: '손님이 선반 뒤의 벽을 바라봅니다.',
    ACTION: '벽에 작은 종이 손님의 실루엣이 나타납니다.', RESIDUE: '종이 손님의 모습이 한동안 머뭅니다.',
  },
  R0: {
    CUE: '손님이 선반을 천천히 살핍니다.', GAZE: '손님은 선반을 두루 바라봅니다.',
    ACTION: '손님이 잠시 망설이다 빈손으로 떠납니다.', RESIDUE: '선반에 얇은 먼지선만 남았습니다.',
  },
};
const SYMBOL = { M: '▣', C: '♨', B: '♟', K: '⚿' };
let timer = null;
let pointing = null;
let suppressClickUntil = 0;
let backgroundProcessed = false;

function clearAnimation() { if (timer !== null) clearTimeout(timer); timer = null; }
function schedule() {
  clearAnimation();
  const s = game.state;
  if (s.phase !== 'REACT' || document.hidden) return;
  const runId = s.runId;
  timer = setTimeout(() => {
    timer = null;
    if (game.advance(runId) && game.state.phase === 'REACT') schedule();
  }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 180 : 575);
}
function setMessage(title, detail, icon = '✦') { el.title.textContent = title; el.detail.textContent = detail; el.icon.textContent = icon; }
function render(s) {
  const editing = s.canEdit;
  const clue = s.phase === 'REACT' && s.animationStep === 'CUE' ? s.result?.visibleClueSlots : [];
  el.scene.dataset.reaction = s.result?.reactionId ?? '';
  el.scene.dataset.phase = s.phase;
  el.count.textContent = `${s.slots.filter(Boolean).length} / 3`;
  el.shelf.querySelectorAll('[data-slot]').forEach(button => {
    const idx = Number(button.dataset.slot), item = s.slots[idx], content = button.querySelector('.slot-content');
    button.disabled = !editing;
    button.classList.toggle('filled', !!item);
    button.classList.toggle('selected', editing && !!item && s.selectedItemId === item);
    button.classList.toggle('clue', clue?.includes(idx) ?? false);
    button.classList.toggle('secondary-cue', s.phase === 'REACT' && s.animationStep === 'GAZE' && s.result?.reactionId === 'R3' && item === 'B');
    button.classList.toggle('mirror-glint', s.phase === 'REACT' && s.animationStep === 'ACTION' && s.result?.reactionId === 'R1' && item === 'M');
    content.replaceChildren(document.createTextNode(item ? `${SYMBOL[item]} ` : '＋'));
    if (item) { const name = document.createElement('span'); name.className = 'item-mini'; name.textContent = ITEMS[item]; content.append(name); }
    button.setAttribute('aria-label', `${['왼쪽', '가운데', '오른쪽'][idx]} 칸, ${item ? ITEMS[item] : '비어 있음'}${s.selectedItemId ? `, 선택 물건 ${ITEMS[s.selectedItemId]} 배치하기` : ''}`);
    button.dataset.item = item || '';
  });
  el.tray.querySelectorAll('[data-item]').forEach(button => {
    const item = button.dataset.item, placed = s.slots.includes(item);
    button.disabled = !editing || placed;
    button.classList.toggle('placed', placed);
    button.classList.toggle('selected', s.selectedItemId === item);
    button.setAttribute('aria-pressed', String(s.selectedItemId === item));
    button.setAttribute('aria-label', `${ITEMS[item]}${placed ? ' (선반에 놓임)' : ' 선택'}`);
  });
  el.visitor.dataset.beat = s.phase === 'REACT' ? s.animationStep : '';
  el.visitor.dataset.reaction = s.result?.reactionId ?? '';
  const gazeTarget = s.result?.reactionId === 'H' ? 1
    : s.result?.reactionId === 'R1' ? s.slotSnapshot.indexOf('M')
    : s.result?.reactionId === 'R2' ? s.slotSnapshot.indexOf('C')
    : s.result?.reactionId === 'R3' ? s.slotSnapshot.indexOf('B') : 1;
  el.visitor.style.setProperty('--gaze-shift', `${(gazeTarget - 1) * 18}px`);
  // The hand moves from the visitor to the fixed doorplate, scaled to the actual scene width.
  // This visual-only measure does not affect placement, evaluation, or the immutable slot snapshot.
  if (s.result?.reactionId === 'R3' && s.phase === 'REACT' && s.animationStep === 'ACTION') {
    const plate = el.doorplate.getBoundingClientRect(), person = el.visitor.getBoundingClientRect();
    const reachX = plate.left + plate.width / 2 - (person.left + person.width + 1);
    const reachY = plate.top + plate.height / 2 - (person.top + 79);
    el.visitor.style.setProperty('--wipe-x', `${reachX}px`);
    el.visitor.style.setProperty('--wipe-y', `${reachY}px`);
  }
  // The hand touches the ACTUAL mirror/bell item, independent of its slot index.
  if (s.phase === 'REACT' && s.animationStep === 'ACTION' && ['R1','R2'].includes(s.result?.reactionId)) {
    const targetItem = s.result.reactionId === 'R1' ? 'M' : 'B';
    const targetSlot = s.slotSnapshot.indexOf(targetItem);
    const icon = el.shelf.querySelector(`[data-slot="${targetSlot}"] .slot-content`).getBoundingClientRect();
    const visitor = el.visitor.getBoundingClientRect();
    const dx = (icon.left + icon.width / 2) - (visitor.right + 1);
    const dy = (icon.top + icon.height / 2) - (visitor.top + 79);
    el.visitor.style.setProperty('--target-dx', `${dx}px`);
    el.visitor.style.setProperty('--target-dy', `${dy}px`);
    el.visitor.style.setProperty('--reach-length', `${Math.hypot(dx,dy)}px`);
    el.visitor.style.setProperty('--reach-angle', `${Math.atan2(-dy,-dx)*180/Math.PI}deg`);
  }
  const residueShown = s.phase === 'RESULT' || (s.phase === 'REACT' && s.animationStep === 'RESIDUE');
  el.residue.classList.toggle('active', residueShown);
  el.residue.classList.toggle('action-ripple', s.phase === 'REACT' && s.animationStep === 'ACTION' && s.result?.reactionId === 'R2');
  el.doorplate.classList.toggle('revealed', residueShown && s.result?.reactionId === 'R3');
  el.doorplate.classList.toggle('wiping', s.phase === 'REACT' && s.animationStep === 'ACTION' && s.result?.reactionId === 'R3');
  // The visible residue tracks the *actual* mirror/bell slot, not an assumed middle slot.
  const markItem = s.result?.reactionId === 'R1' ? 'M' : s.result?.reactionId === 'R2' ? 'B' : null;
  const markSlot = markItem ? s.slotSnapshot.indexOf(markItem) : -1;
  el.residue.style.setProperty('--residue-left', `${markSlot < 0 ? 50 : (markSlot + .5) / 3 * 100}%`);
  el.guest.classList.toggle('active', (s.phase === 'REACT' && ['ACTION', 'RESIDUE'].includes(s.animationStep) || residueShown) && s.result?.reactionId === 'H');
  el.primary.hidden = s.phase === 'REACT';
  el.skip.hidden = s.phase !== 'REACT';
  el.note.textContent = editing && s.selectedItemId ? `선택: ${ITEMS[s.selectedItemId]} → 칸 누르기` : '물건 선택 → 선반 칸 선택';
  el.counter.textContent = `방문 기록 ${s.history.length}회`;
  if (s.phase === 'PLACE') {
    el.primary.disabled = true;
    el.primary.textContent = `문 열기 · 물건 ${3 - s.slots.filter(Boolean).length}개 더 필요`;
    setMessage('무엇을 올려놓을까요?', s.selectedItemId ? '어느 칸에 놓을지 선택해 주세요.' : '물건을 골라 선반 칸을 누르세요.', '✦');
  } else if (s.phase === 'READY') {
    el.primary.disabled = false; el.primary.textContent = '문 열기';
    setMessage('준비되었습니다', '문을 열면 손님이 이 배치를 살펴봅니다.', '◈');
  } else if (s.phase === 'REACT') {
    setMessage('손님이 들어왔습니다', PRESENTATION[s.result.reactionId][s.animationStep], '◌');
  } else if (s.phase === 'RESULT') {
    el.primary.disabled = false; el.primary.textContent = '다시 배치';
    setMessage(LABEL[s.result.reactionId], PRESENTATION[s.result.reactionId].RESIDUE, '✧');
  }
}

el.tray.addEventListener('click', e => {
  if (performance.now() < suppressClickUntil) return;
  const card = e.target.closest('[data-item]'); if (card) game.select(card.dataset.item);
});
el.shelf.addEventListener('click', e => {
  if (performance.now() < suppressClickUntil) return;
  const button = e.target.closest('[data-slot]'); if (!button || !game.state.canEdit) return;
  if (game.state.selectedItemId) game.placeSelected(Number(button.dataset.slot));
  else if (button.dataset.item) game.select(button.dataset.item);
});
el.primary.addEventListener('click', () => {
  if (game.state.phase === 'READY') { if (game.open()) schedule(); }
  else if (game.state.phase === 'RESULT') game.rearrange();
});
el.skip.addEventListener('click', () => { clearAnimation(); game.skip(); });
$('reset').addEventListener('click', () => { clearAnimation(); game.reset(); });

// Optional HTML drag-and-drop (desktop), routed to the same place command as taps.
document.addEventListener('dragstart', e => {
  const item = e.target.closest('[data-item]');
  if (!item || !game.state.canEdit) { e.preventDefault(); return; }
  e.dataTransfer.setData('text/plain', item.dataset.item); e.dataTransfer.effectAllowed = 'move';
});
el.shelf.addEventListener('dragover', e => {
  if (!game.state.canEdit) return;
  const slot = e.target.closest('[data-slot]'); if (!slot) return;
  e.preventDefault(); slot.classList.add('drop-target');
});
el.shelf.addEventListener('dragleave', e => { const slot = e.target.closest('[data-slot]'); if (slot) slot.classList.remove('drop-target'); });
el.shelf.addEventListener('drop', e => {
  const slot = e.target.closest('[data-slot]'); if (!slot) return;
  e.preventDefault(); el.shelf.querySelectorAll('.slot').forEach(x => x.classList.remove('drop-target'));
  game.place(e.dataTransfer.getData('text/plain'), Number(slot.dataset.slot), 'drag');
});
// Touch/pointer dragging: do not intercept taps. Only a moved pointer creates a drop.
document.addEventListener('pointerdown', e => {
  if (!game.state.canEdit || e.button !== 0) return;
  const item = e.target.closest('[data-item]');
  if (!item) return;
  pointing = { id: e.pointerId, item: item.dataset.item, x: e.clientX, y: e.clientY, moved: false };
});
document.addEventListener('pointermove', e => {
  if (!pointing || e.pointerId !== pointing.id) return;
  if (Math.hypot(e.clientX - pointing.x, e.clientY - pointing.y) > 12) pointing.moved = true;
  if (pointing.moved) {
    el.shelf.querySelectorAll('.slot').forEach(x => x.classList.remove('drop-target'));
    document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-slot]')?.classList.add('drop-target');
  }
});
document.addEventListener('pointerup', e => {
  if (!pointing || e.pointerId !== pointing.id) return;
  if (pointing.moved) {
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-slot]');
    if (target) game.place(pointing.item, Number(target.dataset.slot), 'drag');
    // Prevent the pointer gesture from becoming a second tap action.
    suppressClickUntil = performance.now() + 120;
  }
  pointing = null;
  el.shelf.querySelectorAll('.slot').forEach(x => x.classList.remove('drop-target'));
});
document.addEventListener('pointercancel', () => {
  pointing = null;
  el.shelf.querySelectorAll('.slot').forEach(x => x.classList.remove('drop-target'));
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearAnimation(); backgroundProcessed = game.state.phase === 'REACT';
  } else if (backgroundProcessed) {
    backgroundProcessed = false; clearAnimation(); game.resumeAfterBackground();
  }
});
// QA access in devtools only, never rendered to players or sent to a server.
window.__KAI_QA__ = Object.freeze({ get state() { return game.state; }, get events() { return game.debugEvents; } });
render(game.state);
