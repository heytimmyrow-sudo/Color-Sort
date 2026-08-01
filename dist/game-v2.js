const colorOrder = ["red", "yellow", "green", "blue"];
const colorNames = { red: "red", yellow: "yellow", green: "green", blue: "blue" };
const colorSymbols = { red: "R", yellow: "Y", green: "G", blue: "B" };
const targetHeight = 4;
const columnCount = 4;
const columnCapacity = 6;
const recordsKey = "tokenColumnsRecordsV3";
const progressKey = "tokenColumnsProgressV3";
const savesKey = "tokenColumnsSavesV3";
const prefsKey = "tokenColumnsPrefsV2";
const packKey = "tokenColumnsPackV2";
const tutorialKey = "tokenColumnsTutorialSeenV1";
const starsKey = "tokenColumnsStarsV1";
const unlocksKey = "tokenColumnsUnlocksV1";
const liveUrl = window.location.origin;

const packDefs = [
  { id: "classic", name: "Classic", total: 40, seed: 90210, extra: 0 },
  { id: "starter", name: "Starter", total: 30, seed: 74011, extra: -10 },
  { id: "challenge", name: "Challenge", total: 45, seed: 120303, extra: 12 },
  { id: "expert", name: "Expert", total: 50, seed: 421337, extra: 25 },
  { id: "daily", name: "Daily", total: 1, seed: dailySeed(), extra: 16 }
];
const handAuthoredScrambles = [
  [{ from: 0, to: 1 }],
  [{ from: 0, to: 1 }, { from: 2, to: 3 }],
  [{ from: 0, to: 1 }, { from: 2, to: 3 }, { from: 1, to: 2 }],
  [{ from: 0, to: 1 }, { from: 2, to: 3 }, { from: 3, to: 0 }, { from: 1, to: 2 }],
  [{ from: 0, to: 1 }, { from: 2, to: 3 }, { from: 1, to: 2 }, { from: 3, to: 0 }, { from: 2, to: 3 }],
  [{ from: 1, to: 0 }, { from: 2, to: 3 }, { from: 0, to: 2 }, { from: 3, to: 1 }, { from: 2, to: 3 }, { from: 1, to: 0 }],
  [{ from: 0, to: 2 }, { from: 1, to: 3 }, { from: 2, to: 1 }, { from: 3, to: 0 }, { from: 1, to: 2 }, { from: 0, to: 3 }, { from: 2, to: 1 }],
  [{ from: 3, to: 2 }, { from: 0, to: 1 }, { from: 2, to: 0 }, { from: 1, to: 3 }, { from: 0, to: 2 }, { from: 3, to: 1 }, { from: 2, to: 0 }, { from: 1, to: 3 }],
  [{ from: 0, to: 1 }, { from: 2, to: 3 }, { from: 1, to: 2 }, { from: 3, to: 0 }, { from: 2, to: 3 }, { from: 0, to: 1 }, { from: 3, to: 2 }, { from: 1, to: 0 }, { from: 2, to: 3 }],
  [{ from: 1, to: 2 }, { from: 3, to: 0 }, { from: 2, to: 3 }, { from: 0, to: 1 }, { from: 3, to: 2 }, { from: 1, to: 0 }, { from: 2, to: 1 }, { from: 0, to: 3 }, { from: 1, to: 2 }, { from: 3, to: 0 }]
];

const levelCache = new Map();
const state = {
  packId: localStorage.getItem(packKey) || "classic",
  levelIndex: 0,
  board: [],
  target: [],
  history: [],
  moveLog: [],
  selectedColumn: null,
  lastMove: null,
  moves: 0,
  completed: false,
  dragFromColumn: null,
  records: loadStoredMap(recordsKey),
  progress: loadStoredMap(progressKey),
  saves: loadStoredMap(savesKey),
  stars: loadStoredMap(starsKey),
  unlocks: { classic: 0, starter: 0, challenge: 0, expert: 0, daily: 0, ...loadStoredMap(unlocksKey) },
  prefs: { muted: false, symbols: false, theme: "toy", ...loadStoredMap(prefsKey) }
};

let pointerDrag = null;
let suppressNextClick = false;
let deferredInstallPrompt = null;
let audioContext = null;
let pokiGameplayStarted = false;

const targetGrid = document.querySelector("#targetGrid");
const slotGrid = document.querySelector("#slotGrid");
const levelGrid = document.querySelector("#levelGrid");
const levelName = document.querySelector("#levelName");
const levelCount = document.querySelector("#levelCount");
const difficultyText = document.querySelector("#difficultyText");
const minimumMoves = document.querySelector("#minimumMoves");
const recordTarget = document.querySelector("#recordTarget");
const bestMoves = document.querySelector("#bestMoves");
const moveCount = document.querySelector("#moveCount");
const matchedCount = document.querySelector("#matchedCount");
const matchMeterFill = document.querySelector("#matchMeterFill");
const statusText = document.querySelector("#statusText");
const packSelect = document.querySelector("#packSelect");
const restartBtn = document.querySelector("#restartBtn");
const undoBtn = document.querySelector("#undoBtn");
const tutorialBtn = document.querySelector("#tutorialBtn");
const hintBtn = document.querySelector("#hintBtn");
const newScrambleBtn = document.querySelector("#newScrambleBtn");
const nextLevelBtn = document.querySelector("#nextLevelBtn");
const shareBtn = document.querySelector("#shareBtn");
const clearRecordsBtn = document.querySelector("#clearRecordsBtn");
const muteBtn = document.querySelector("#muteBtn");
const symbolsBtn = document.querySelector("#symbolsBtn");
const themeSelect = document.querySelector("#themeSelect");
const moveHistoryList = document.querySelector("#moveHistoryList");
const installBtn = document.querySelector("#installBtn");
const installText = document.querySelector("#installText");
const shareAppBtn = document.querySelector("#shareAppBtn");
const mobileUndoBtn = document.querySelector("#mobileUndoBtn");
const mobileRestartBtn = document.querySelector("#mobileRestartBtn");
const mobileHintBtn = document.querySelector("#mobileHintBtn");
const mobileShareBtn = document.querySelector("#mobileShareBtn");
const winDialog = document.querySelector("#winDialog");
const winSummary = document.querySelector("#winSummary");
const winNextBtn = document.querySelector("#winNextBtn");
const winReplayBtn = document.querySelector("#winReplayBtn");
const tutorialDialog = document.querySelector("#tutorialDialog");
const tutorialStartBtn = document.querySelector("#tutorialStartBtn");
const tutorialHintBtn = document.querySelector("#tutorialHintBtn");

function dailySeed() {
  const now = new Date();
  return Number(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`);
}

function mulberry32(seed) {
  return function next() {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function cloneColumns(columns) {
  return columns.map((column) => [...column]);
}

function toColumns(items, height = targetHeight) {
  return Array.from({ length: columnCount }, (_, column) => items.slice(column * height, column * height + height));
}

function shuffle(items, random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function activePack() {
  return packDefs.find((pack) => pack.id === state.packId) || packDefs[0];
}

function levelsForPack(pack = activePack()) {
  if (!levelCache.has(pack.id)) {
    levelCache.set(pack.id, Array.from({ length: pack.total }, (_, index) => createLevel(index, pack)));
  }
  return levelCache.get(pack.id);
}

function levelKey(index = state.levelIndex) {
  return `${state.packId}:${index}`;
}

function unlockedIndex(packId = state.packId) {
  return Math.max(0, Number(state.unlocks[packId] || 0));
}

function isUnlocked(index, packId = state.packId) {
  return index <= unlockedIndex(packId);
}

function saveUnlocks() {
  saveJson(unlocksKey, state.unlocks);
}

function hydrateUnlocksFromRecords() {
  for (const pack of packDefs) {
    let unlocked = unlockedIndex(pack.id);
    const levels = levelsForPack(pack);
    for (let index = 0; index < pack.total; index += 1) {
      const key = `${pack.id}:${index}`;
      const record = state.records[key];
      if (record !== undefined) {
        unlocked = Math.max(unlocked, index + 1);
        if (!state.stars[key]) state.stars[key] = starsForMoves(record, levels[index]);
      }
    }
    state.unlocks[pack.id] = Math.min(unlocked, pack.total - 1);
  }
  saveJson(starsKey, state.stars);
  saveUnlocks();
}

function starsForMoves(moves, level) {
  if (moves < level.defaultRecord) return 3;
  if (moves <= level.defaultRecord + 8) return 2;
  return 1;
}

function starText(count) {
  return count > 0 ? "*".repeat(count) : "";
}

function createTarget(random, levelIndex, pack) {
  const bag = colorOrder.flatMap((color) => Array(targetHeight).fill(color));
  let target = toColumns(shuffle(bag, random));
  if (pack.id === "starter" || (pack.id === "classic" && levelIndex < 8)) {
    target = Array.from({ length: columnCount }, (_, columnIndex) => {
      return [...colorOrder.slice(columnIndex), ...colorOrder.slice(0, columnIndex)];
    });
  }
  return target;
}

function starterTarget() {
  return Array.from({ length: columnCount }, (_, columnIndex) => {
    return [...colorOrder.slice(columnIndex), ...colorOrder.slice(0, columnIndex)];
  });
}

function createHandAuthoredLevel(index) {
  const target = starterTarget();
  const board = target.map((column) => [...column].reverse());
  const scrambleMoves = handAuthoredScrambles[index];
  scrambleMoves.forEach((move) => applyMove(board, move.from, move.to));
  const solution = [...scrambleMoves].reverse().map((move) => ({ from: move.to, to: move.from }));
  const proofBoard = cloneColumns(board);
  solution.forEach((move) => applyMove(proofBoard, move.from, move.to));
  if (!isSolved(proofBoard, target)) throw new Error(`Hand-authored level ${index + 1} is not solvable`);
  return {
    target,
    board,
    solution,
    defaultRecord: solution.length + 5,
    difficulty: difficultyFor(solution.length)
  };
}

function createLevel(index, pack, salt = 0) {
  if (salt === 0 && (pack.id === "classic" || pack.id === "starter") && index < handAuthoredScrambles.length) {
    return createHandAuthoredLevel(index);
  }
  const random = mulberry32(pack.seed + index * 177 + salt * 9973);
  const target = createTarget(random, index, pack);
  let board = target.map((column) => [...column].reverse());
  const moveCountGoal = Math.max(12, 20 + index + pack.extra + Math.floor(random() * 12));
  let lastMove = null;
  const scrambleMoves = [];

  for (let step = 0; step < moveCountGoal; step += 1) {
    const choices = legalMoves(board).filter((move) => !lastMove || !(move.from === lastMove.to && move.to === lastMove.from));
    const move = choices[Math.floor(random() * choices.length)] || legalMoves(board)[0];
    applyMove(board, move.from, move.to);
    scrambleMoves.push(move);
    lastMove = move;
  }

  if (isSolved(board, target)) {
    const move = legalMoves(board)[0];
    applyMove(board, move.from, move.to);
    scrambleMoves.push(move);
  }

  const solution = scrambleMoves.reverse().map((move) => ({ from: move.to, to: move.from }));
  const proofBoard = cloneColumns(board);
  solution.forEach((move) => applyMove(proofBoard, move.from, move.to));
  if (!isSolved(proofBoard, target)) throw new Error(`Generated ${pack.name} level ${index + 1} is not solvable`);
  return {
    target,
    board,
    solution,
    defaultRecord: solution.length + 5 + Math.floor(random() * 6),
    difficulty: difficultyFor(solution.length)
  };
}

function pokiCall(method) {
  try {
    const api = window.PokiSDK;
    if (api && typeof api[method] === "function") api[method]();
  } catch {
    // Poki is optional on the public web build.
  }
}

function startGameplaySession() {
  if (pokiGameplayStarted) return;
  pokiGameplayStarted = true;
  pokiCall("gameplayStart");
}

function stopGameplaySession() {
  if (!pokiGameplayStarted) return;
  pokiGameplayStarted = false;
  pokiCall("gameplayStop");
}

function legalMoves(board) {
  const moves = [];
  for (let from = 0; from < columnCount; from += 1) {
    if (board[from].length === 0) continue;
    for (let to = 0; to < columnCount; to += 1) {
      if (from !== to && board[to].length < columnCapacity) moves.push({ from, to });
    }
  }
  return moves;
}

function applyMove(board, fromColumn, toColumn) {
  const token = board[fromColumn].pop();
  if (token) board[toColumn].push(token);
  return token;
}

function countMatches(board, target) {
  let matches = 0;
  for (let column = 0; column < columnCount; column += 1) {
    for (let row = 0; row < targetHeight; row += 1) {
      const boardIndex = targetHeight - 1 - row;
      if (board[column][boardIndex] === target[column][row]) matches += 1;
    }
  }
  return matches;
}

function isSolved(board, target) {
  return board.every((column) => column.length === targetHeight) && countMatches(board, target) === columnCount * targetHeight;
}

function difficultyFor(solutionLength) {
  if (solutionLength <= 24) return "Easy";
  if (solutionLength <= 38) return "Medium";
  if (solutionLength <= 55) return "Hard";
  return "Expert";
}

function loadStoredMap(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function savePrefs() {
  saveJson(prefsKey, state.prefs);
}

function markInProgress() {
  if (state.completed) return;
  const key = levelKey();
  if (state.records[key] === undefined && !state.progress[key]) {
    state.progress[key] = true;
    saveJson(progressKey, state.progress);
    renderLevelButtons();
  }
}

function saveCurrentBoard() {
  if (state.completed) return;
  state.saves[levelKey()] = {
    board: cloneColumns(state.board),
    moves: state.moves,
    history: state.history,
    moveLog: state.moveLog
  };
  saveJson(savesKey, state.saves);
}

function clearCurrentSave(index = state.levelIndex) {
  delete state.saves[`${state.packId}:${index}`];
  saveJson(savesKey, state.saves);
}

function renderLevelButtons() {
  const levels = levelsForPack();
  levelGrid.innerHTML = "";
  levels.forEach((level, index) => {
    const key = levelKey(index);
    const unlocked = isUnlocked(index);
    const starCount = Number(state.stars[key] || 0);
    const button = document.createElement("button");
    button.className = "level-button";
    button.type = "button";
    button.disabled = !unlocked;
    const number = document.createElement("span");
    number.className = "level-number";
    number.textContent = String(index + 1);
    const stars = document.createElement("span");
    stars.className = "level-stars";
    stars.textContent = unlocked ? starText(starCount) : "LOCK";
    button.append(number, stars);
    button.setAttribute("aria-label", `${activePack().name} level ${index + 1}, ${level.difficulty}`);
    if (index === state.levelIndex) button.classList.add("active");
    if (!unlocked) {
      button.classList.add("locked");
      button.title = "Locked";
    } else if (starCount >= 3 || (state.records[key] !== undefined && state.records[key] < level.defaultRecord)) {
      button.classList.add("gold-record");
      button.title = "3-star clear";
    } else if (state.records[key] !== undefined) {
      button.classList.add("solved");
      button.title = starCount === 1 ? "Completed with 1 star" : "Completed with 2 stars";
    } else if (state.progress[key]) {
      button.classList.add("in-progress");
      button.title = "In progress";
    } else {
      button.classList.add("not-attempted");
      button.title = "Not attempted";
    }
    button.addEventListener("click", () => loadLevel(index));
    levelGrid.append(button);
  });
}

function tokenText(color) {
  return state.prefs.symbols ? colorSymbols[color] : "";
}

function renderTargets() {
  targetGrid.innerHTML = "";
  state.target.forEach((column, columnIndex) => {
    const columnEl = document.createElement("div");
    columnEl.className = "target-column";
    columnEl.setAttribute("aria-label", `Target column ${columnIndex + 1}`);
    column.forEach((color) => {
      const token = document.createElement("span");
      token.className = `target-token ${color}`;
      token.title = colorNames[color];
      token.textContent = tokenText(color);
      columnEl.append(token);
    });
    targetGrid.append(columnEl);
  });
}

function renderBoard() {
  slotGrid.innerHTML = "";
  state.board.forEach((column, columnIndex) => {
    const columnEl = document.createElement("button");
    columnEl.className = "play-column";
    columnEl.type = "button";
    columnEl.dataset.column = columnIndex;
    columnEl.setAttribute("aria-label", columnLabel(columnIndex));
    if (state.selectedColumn === columnIndex) columnEl.classList.add("selected-column");
    if (state.lastMove?.from === columnIndex) columnEl.classList.add("last-source");
    if (state.lastMove?.to === columnIndex) columnEl.classList.add("last-target");
    if (column.length < columnCapacity) columnEl.classList.add("can-receive");
    columnEl.addEventListener("click", () => selectOrMove(columnIndex));
    columnEl.addEventListener("dragover", (event) => {
      if (state.dragFromColumn !== null && state.dragFromColumn !== columnIndex && column.length < columnCapacity) event.preventDefault();
    });
    columnEl.addEventListener("dragenter", () => columnEl.classList.add("drop-target"));
    columnEl.addEventListener("dragleave", () => columnEl.classList.remove("drop-target"));
    columnEl.addEventListener("drop", (event) => handleDrop(event, columnIndex));

    for (let visualRow = 0; visualRow < columnCapacity; visualRow += 1) {
      const stackIndex = columnCapacity - 1 - visualRow;
      const color = column[stackIndex];
      const slot = document.createElement("span");
      slot.className = "slot";
      slot.dataset.column = columnIndex;
      slot.dataset.stackIndex = stackIndex;
      if (color) {
        const token = document.createElement("span");
        token.className = `token ${color}`;
        token.title = `${colorNames[color]} token`;
        token.textContent = tokenText(color);
        if (state.lastMove?.to === columnIndex && stackIndex === column.length - 1) token.classList.add("landed");
        slot.append(token);
      }
      columnEl.append(slot);
    }

    const topIndex = column.length - 1;
    if (topIndex >= 0) {
      const topSlot = columnEl.querySelector(`[data-stack-index="${topIndex}"]`);
      topSlot?.classList.add("top-token-slot");
      topSlot?.setAttribute("draggable", "true");
      topSlot?.addEventListener("dragstart", (event) => handleDragStart(event, columnIndex));
      topSlot?.addEventListener("dragend", clearDragState);
      topSlot?.addEventListener("pointerdown", (event) => handlePointerDown(event, columnIndex));
    }
    slotGrid.append(columnEl);
  });
  updateStats();
  renderHistory();
}

function renderHistory() {
  moveHistoryList.innerHTML = "";
  const recent = state.moveLog.slice(-8);
  if (recent.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No moves yet";
    moveHistoryList.append(item);
    return;
  }
  recent.forEach((move, offset) => {
    const item = document.createElement("li");
    const moveNumber = state.moveLog.length - recent.length + offset + 1;
    item.textContent = `${moveNumber}. ${colorNames[move.color]} ${move.from + 1} to ${move.to + 1}`;
    moveHistoryList.append(item);
  });
}

function handlePointerDown(event, columnIndex) {
  if (state.completed || state.board[columnIndex].length === 0 || event.button > 0) return;
  const topColor = state.board[columnIndex][state.board[columnIndex].length - 1];
  pointerDrag = {
    fromColumn: columnIndex,
    startX: event.clientX,
    startY: event.clientY,
    x: event.clientX,
    y: event.clientY,
    color: topColor,
    active: false,
    ghost: null,
    target: event.currentTarget
  };
  event.currentTarget.setPointerCapture?.(event.pointerId);
  event.currentTarget.addEventListener("pointermove", handlePointerMove);
  event.currentTarget.addEventListener("pointerup", handlePointerUp);
  event.currentTarget.addEventListener("pointercancel", cancelPointerDrag);
}

function handlePointerMove(event) {
  if (!pointerDrag) return;
  pointerDrag.x = event.clientX;
  pointerDrag.y = event.clientY;
  const distance = Math.hypot(pointerDrag.x - pointerDrag.startX, pointerDrag.y - pointerDrag.startY);
  if (!pointerDrag.active && distance > 8) {
    markInProgress();
    pointerDrag.active = true;
    suppressNextClick = true;
    document.body.classList.add("pointer-dragging");
    document.querySelector(`.play-column[data-column="${pointerDrag.fromColumn}"]`)?.classList.add("dragging-column");
    pointerDrag.ghost = document.createElement("span");
    pointerDrag.ghost.className = `drag-ghost ${pointerDrag.color}`;
    pointerDrag.ghost.textContent = tokenText(pointerDrag.color);
    document.body.append(pointerDrag.ghost);
  }
  if (!pointerDrag.active) return;
  event.preventDefault();
  movePointerGhost();
  highlightPointerDropTarget();
}

function handlePointerUp(event) {
  if (!pointerDrag) return;
  const drag = pointerDrag;
  const wasActive = drag.active;
  const dropColumn = wasActive ? columnFromPoint(event.clientX, event.clientY) : null;
  cancelPointerDrag();
  if (wasActive) {
    if (dropColumn !== null) moveTopToken(drag.fromColumn, dropColumn);
    else statusText.textContent = "Drop the token onto a column with open space.";
  }
}

function cancelPointerDrag() {
  pointerDrag?.target?.removeEventListener("pointermove", handlePointerMove);
  pointerDrag?.target?.removeEventListener("pointerup", handlePointerUp);
  pointerDrag?.target?.removeEventListener("pointercancel", cancelPointerDrag);
  if (pointerDrag?.ghost) pointerDrag.ghost.remove();
  pointerDrag = null;
  document.body.classList.remove("pointer-dragging");
  clearHighlights();
  document.querySelectorAll(".dragging-column").forEach((column) => column.classList.remove("dragging-column"));
}

function movePointerGhost() {
  if (!pointerDrag?.ghost) return;
  pointerDrag.ghost.style.left = `${pointerDrag.x}px`;
  pointerDrag.ghost.style.top = `${pointerDrag.y}px`;
}

function columnFromPoint(x, y) {
  const element = document.elementFromPoint(x, y);
  const column = element?.closest?.(".play-column");
  if (!column) return null;
  const index = Number(column.dataset.column);
  if (!Number.isInteger(index) || index === pointerDrag?.fromColumn || state.board[index].length >= columnCapacity) return null;
  return index;
}

function highlightPointerDropTarget() {
  const targetColumn = columnFromPoint(pointerDrag.x, pointerDrag.y);
  document.querySelectorAll(".play-column").forEach((column) => {
    column.classList.toggle("drop-target", Number(column.dataset.column) === targetColumn);
  });
}

function clearHighlights() {
  document.querySelectorAll(".drop-target,.hint-source,.hint-target").forEach((column) => {
    column.classList.remove("drop-target", "hint-source", "hint-target");
  });
}

function columnLabel(columnIndex) {
  const column = state.board[columnIndex];
  if (column.length === 0) return `Column ${columnIndex + 1}, empty`;
  const topColor = column[column.length - 1];
  return `Column ${columnIndex + 1}, ${column.length} tokens, top token is ${colorNames[topColor]}`;
}

function handleDragStart(event, columnIndex) {
  if (state.board[columnIndex].length === 0 || state.completed) {
    event.preventDefault();
    return;
  }
  markInProgress();
  state.dragFromColumn = columnIndex;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", String(columnIndex));
  document.querySelector(`[data-column="${columnIndex}"]`)?.classList.add("dragging-column");
}

function clearDragState() {
  state.dragFromColumn = null;
  clearHighlights();
  document.querySelectorAll(".dragging-column").forEach((column) => column.classList.remove("dragging-column"));
}

function handleDrop(event, toColumn) {
  event.preventDefault();
  const fromColumn = state.dragFromColumn;
  clearDragState();
  if (fromColumn === null) return;
  moveTopToken(fromColumn, toColumn);
}

function selectOrMove(columnIndex) {
  if (suppressNextClick) {
    suppressNextClick = false;
    return;
  }
  if (state.completed) return;
  clearHighlights();
  if (state.selectedColumn === null) {
    if (state.board[columnIndex].length === 0) {
      statusText.textContent = "That column is empty. Choose a column with a top token.";
      return;
    }
    markInProgress();
    state.selectedColumn = columnIndex;
    statusText.textContent = "Now choose the column where that top token should drop.";
    renderBoard();
    return;
  }
  if (state.selectedColumn === columnIndex) {
    state.selectedColumn = null;
    statusText.textContent = "Selection cleared. Choose the top token from any column.";
    renderBoard();
    return;
  }
  moveTopToken(state.selectedColumn, columnIndex);
}

function moveTopToken(fromColumn, toColumn) {
  if (state.completed || fromColumn === toColumn) return;
  startGameplaySession();
  clearHighlights();
  if (state.board[fromColumn].length === 0) {
    state.selectedColumn = null;
    statusText.textContent = "That column has no token to move.";
    renderBoard();
    return;
  }
  if (state.board[toColumn].length >= columnCapacity) {
    state.selectedColumn = null;
    statusText.textContent = "That column is full. Choose a column with open space.";
    renderBoard();
    return;
  }
  const movedColor = state.board[fromColumn][state.board[fromColumn].length - 1];
  markInProgress();
  state.history.push({ board: cloneColumns(state.board), moves: state.moves, moveLog: [...state.moveLog] });
  applyMove(state.board, fromColumn, toColumn);
  state.moveLog.push({ from: fromColumn, to: toColumn, color: movedColor });
  state.selectedColumn = null;
  state.moves += 1;
  state.lastMove = { from: fromColumn, to: toColumn };
  statusText.textContent = "Good. Keep moving only the top tokens until the four shown positions match.";
  playTone(392, 0.06);
  saveCurrentBoard();
  renderBoard();
  window.setTimeout(() => {
    if (state.lastMove?.from === fromColumn && state.lastMove?.to === toColumn) {
      state.lastMove = null;
      renderBoard();
    }
  }, 420);
  checkSolved();
}

function updateStats() {
  const levels = levelsForPack();
  const level = levels[state.levelIndex];
  const key = levelKey();
  const record = state.records[key];
  const matches = countMatches(state.board, state.target);
  moveCount.textContent = String(state.moves);
  matchedCount.textContent = `${matches} / ${columnCount * targetHeight}`;
  matchMeterFill.style.width = `${Math.round(matches / (columnCount * targetHeight) * 100)}%`;
  levelName.textContent = `${activePack().name} ${state.levelIndex + 1}`;
  levelCount.textContent = `${state.levelIndex + 1} / ${levels.length}`;
  difficultyText.textContent = level.difficulty;
  recordTarget.textContent = `${level.defaultRecord} moves`;
  bestMoves.textContent = record === undefined ? "Best --" : `Best ${record}`;
  undoBtn.disabled = state.history.length === 0 || state.completed;
  mobileUndoBtn.disabled = undoBtn.disabled;
  nextLevelBtn.disabled = levels.length === 1 || !isUnlocked((state.levelIndex + 1) % levels.length);
}

function updateMinimumDisplay() {
  const level = levelsForPack()[state.levelIndex];
  minimumMoves.textContent = "Minimum checking";
  window.setTimeout(() => {
    const answer = findShortestSolution(level.board, level.target, 160000);
    level.minimumMoves = answer ? answer.length : level.solution.length;
    minimumMoves.textContent = `Minimum ${level.minimumMoves}`;
  }, 20);
}

function checkSolved() {
  if (!isSolved(state.board, state.target)) return;
  state.completed = true;
  stopGameplaySession();
  const key = levelKey();
  const previous = state.records[key];
  const isRecord = previous === undefined || state.moves < previous;
  const level = levelsForPack()[state.levelIndex];
  const earnedStars = starsForMoves(state.moves, level);
  if (isRecord) {
    state.records[key] = state.moves;
    saveJson(recordsKey, state.records);
  }
  state.stars[key] = Math.max(Number(state.stars[key] || 0), earnedStars);
  saveJson(starsKey, state.stars);
  if (state.levelIndex < levelsForPack().length - 1 && unlockedIndex() <= state.levelIndex) {
    state.unlocks[state.packId] = state.levelIndex + 1;
    saveUnlocks();
  }
  delete state.progress[key];
  delete state.saves[key];
  saveJson(progressKey, state.progress);
  saveJson(savesKey, state.saves);
  renderLevelButtons();
  updateStats();
  playTone(659, 0.08);
  window.setTimeout(() => playTone(880, 0.12), 90);
  document.querySelector(".wood-board")?.classList.add("celebrate");
  window.setTimeout(() => document.querySelector(".wood-board")?.classList.remove("celebrate"), 700);
  const defaultRecord = level.defaultRecord;
  const recordWord = state.moves < defaultRecord ? "Gold record beaten." : `Default record: ${defaultRecord} moves.`;
  const paceWord = state.moves < defaultRecord ? " Great route." : "";
  const unlockWord = state.levelIndex < levelsForPack().length - 1 ? ` Level ${state.levelIndex + 2} unlocked.` : " Pack complete.";
  winSummary.textContent = `${earnedStars} stars. ${state.moves} moves.${paceWord}${isRecord ? " New personal best." : ""} ${recordWord}${unlockWord}`;
  winDialog.classList.remove("hidden");
}

function loadLevel(index) {
  const levels = levelsForPack();
  if (!isUnlocked(index)) {
    statusText.textContent = `Level ${index + 1} is locked. Clear level ${unlockedIndex() + 1} to keep going.`;
    renderLevelButtons();
    return;
  }
  stopGameplaySession();
  const level = levels[index] || levels[0];
  state.levelIndex = Math.min(index, levels.length - 1);
  const saved = state.saves[levelKey(state.levelIndex)];
  state.board = saved?.board ? cloneColumns(saved.board) : cloneColumns(level.board);
  state.target = cloneColumns(level.target);
  state.history = saved?.history || [];
  state.moveLog = saved?.moveLog || [];
  state.selectedColumn = null;
  state.lastMove = null;
  state.moves = saved?.moves || 0;
  state.completed = false;
  state.dragFromColumn = null;
  winDialog.classList.add("hidden");
  statusText.textContent = saved ? "Your exact board was restored. Continue from where you left off." : "Lift the top token from a column, then drop it onto another column with room.";
  renderLevelButtons();
  renderTargets();
  renderBoard();
  updateMinimumDisplay();
}

function restartLevel() {
  stopGameplaySession();
  clearCurrentSave();
  loadLevel(state.levelIndex);
  statusText.textContent = "Level restarted from the original scramble.";
}

function undoMove() {
  if (state.completed || state.history.length === 0) return;
  const previous = state.history.pop();
  state.board = cloneColumns(previous.board);
  state.moves = previous.moves;
  state.moveLog = previous.moveLog || [];
  state.selectedColumn = null;
  state.lastMove = null;
  state.dragFromColumn = null;
  winDialog.classList.add("hidden");
  statusText.textContent = "Move undone. Choose the top token from any column.";
  playTone(220, 0.05);
  saveCurrentBoard();
  renderBoard();
}

function newScramble() {
  stopGameplaySession();
  const pack = activePack();
  const salt = Date.now() % 100000;
  const replacement = createLevel(state.levelIndex, pack, salt);
  levelsForPack()[state.levelIndex] = replacement;
  clearCurrentSave();
  state.board = cloneColumns(replacement.board);
  state.target = cloneColumns(replacement.target);
  state.history = [];
  state.moveLog = [];
  state.selectedColumn = null;
  state.lastMove = null;
  state.moves = 0;
  state.completed = false;
  winDialog.classList.add("hidden");
  statusText.textContent = "Fresh scramble loaded. It was made by legal top-token moves, so it can be solved.";
  renderTargets();
  renderBoard();
  updateMinimumDisplay();
}

function nextLevel() {
  const levels = levelsForPack();
  const nextIndex = (state.levelIndex + 1) % levels.length;
  if (!isUnlocked(nextIndex)) {
    statusText.textContent = "Finish this level to unlock the next one.";
    return;
  }
  loadLevel(nextIndex);
}

function clearRecords() {
  state.records = {};
  state.progress = {};
  state.saves = {};
  state.stars = {};
  state.unlocks = { classic: 0, starter: 0, challenge: 0, expert: 0, daily: 0 };
  saveJson(recordsKey, state.records);
  saveJson(progressKey, state.progress);
  saveJson(savesKey, state.saves);
  saveJson(starsKey, state.stars);
  saveUnlocks();
  renderLevelButtons();
  updateStats();
  statusText.textContent = "Personal records and saved boards cleared on this device.";
}

function showHint() {
  if (state.completed) return;
  clearHighlights();
  const answer = findShortestSolution(state.board, state.target, 140000);
  const move = answer?.[0] || bestLocalMove();
  if (!move) {
    statusText.textContent = "No hint found from this board. Restarting will always give a solvable setup.";
    return;
  }
  document.querySelector(`.play-column[data-column="${move.from}"]`)?.classList.add("hint-source");
  document.querySelector(`.play-column[data-column="${move.to}"]`)?.classList.add("hint-target");
  statusText.textContent = `Hint: move the top token from column ${move.from + 1} to column ${move.to + 1}.`;
}

function showTutorial() {
  tutorialDialog.classList.remove("hidden");
  tutorialStartBtn.focus();
}

function hideTutorial() {
  localStorage.setItem(tutorialKey, "true");
  tutorialDialog.classList.add("hidden");
}

function bestLocalMove() {
  const before = countMatches(state.board, state.target);
  return legalMoves(state.board).sort((a, b) => {
    const boardA = cloneColumns(state.board);
    const boardB = cloneColumns(state.board);
    applyMove(boardA, a.from, a.to);
    applyMove(boardB, b.from, b.to);
    return countMatches(boardB, state.target) - countMatches(boardA, state.target);
  }).find((move) => {
    const board = cloneColumns(state.board);
    applyMove(board, move.from, move.to);
    return countMatches(board, state.target) >= before;
  }) || legalMoves(state.board)[0];
}

function boardKey(board) {
  return board.map((column) => column.join("")).join("|");
}

function findShortestSolution(startBoard, target, maxStates = 120000) {
  if (isSolved(startBoard, target)) return [];
  const startKey = boardKey(startBoard);
  const seen = new Set([startKey]);
  const queue = [{ board: cloneColumns(startBoard), path: [] }];
  let cursor = 0;
  while (cursor < queue.length && seen.size < maxStates) {
    const current = queue[cursor];
    cursor += 1;
    for (const move of legalMoves(current.board)) {
      const nextBoard = cloneColumns(current.board);
      applyMove(nextBoard, move.from, move.to);
      const key = boardKey(nextBoard);
      if (seen.has(key)) continue;
      const path = [...current.path, move];
      if (isSolved(nextBoard, target)) return path;
      seen.add(key);
      queue.push({ board: nextBoard, path });
    }
  }
  return null;
}

async function shareResult() {
  const level = levelsForPack()[state.levelIndex];
  const record = state.records[levelKey()];
  const text = `I played Token Columns ${activePack().name} ${state.levelIndex + 1}: ${state.moves} moves. Default record: ${level.defaultRecord}. Best: ${record ?? "--"}. ${liveUrl}`;
  try {
    if (navigator.share) await navigator.share({ title: "Token Columns", text, url: liveUrl });
    else {
      await navigator.clipboard.writeText(text);
      statusText.textContent = "Result copied to the clipboard.";
    }
  } catch {
    statusText.textContent = "Share was canceled.";
  }
}

async function shareApp() {
  const text = `Play Token Columns: ${liveUrl}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: "Token Columns", text: "Play Token Columns.", url: liveUrl });
    } else {
      installText.textContent = "Copying the app link...";
      await navigator.clipboard.writeText(text);
      installText.textContent = "App link copied. Send it to anyone you want to play with.";
    }
  } catch {
    installText.textContent = "Share was canceled.";
  }
}

function playTone(frequency, duration) {
  if (state.prefs.muted) return;
  try {
    audioContext ||= new AudioContext();
    audioContext.resume?.();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.035;
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    state.prefs.muted = true;
    savePrefs();
  }
}

function applyPrefs() {
  document.body.dataset.theme = state.prefs.theme;
  document.body.classList.toggle("symbols-on", state.prefs.symbols);
  muteBtn.textContent = state.prefs.muted ? "Sound Off" : "Sound On";
  symbolsBtn.textContent = state.prefs.symbols ? "Symbols On" : "Symbols Off";
  themeSelect.value = state.prefs.theme;
}

async function installApp() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installText.textContent = "Shortcut prompt handled. You can launch Token Columns from your home screen if it was accepted.";
    return;
  }
  installText.textContent = "On iPhone or iPad, tap Share, then Add to Home Screen. On Android, use the browser menu or install prompt.";
}

function setPack(packId) {
  state.packId = packDefs.some((pack) => pack.id === packId) ? packId : "classic";
  localStorage.setItem(packKey, state.packId);
  packSelect.value = state.packId;
  loadLevel(Math.min(unlockedIndex(), levelsForPack().length - 1));
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopGameplaySession();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installText.textContent = "This device can add Token Columns as a home-screen app shortcut.";
});

packSelect.addEventListener("change", () => setPack(packSelect.value));
restartBtn.addEventListener("click", restartLevel);
mobileRestartBtn.addEventListener("click", restartLevel);
undoBtn.addEventListener("click", undoMove);
mobileUndoBtn.addEventListener("click", undoMove);
tutorialBtn.addEventListener("click", showTutorial);
hintBtn.addEventListener("click", showHint);
mobileHintBtn.addEventListener("click", showHint);
newScrambleBtn.addEventListener("click", newScramble);
nextLevelBtn.addEventListener("click", nextLevel);
shareBtn.addEventListener("click", shareResult);
mobileShareBtn.addEventListener("click", shareResult);
clearRecordsBtn.addEventListener("click", clearRecords);
muteBtn.addEventListener("click", () => {
  state.prefs.muted = !state.prefs.muted;
  savePrefs();
  applyPrefs();
});
symbolsBtn.addEventListener("click", () => {
  state.prefs.symbols = !state.prefs.symbols;
  savePrefs();
  applyPrefs();
  renderTargets();
  renderBoard();
});
themeSelect.addEventListener("change", () => {
  state.prefs.theme = themeSelect.value;
  savePrefs();
  applyPrefs();
});
installBtn.addEventListener("click", installApp);
shareAppBtn.addEventListener("click", shareApp);
winNextBtn.addEventListener("click", nextLevel);
winReplayBtn.addEventListener("click", restartLevel);
winDialog.addEventListener("click", (event) => {
  if (event.target === winDialog) winDialog.classList.add("hidden");
});
tutorialStartBtn.addEventListener("click", hideTutorial);
tutorialHintBtn.addEventListener("click", () => {
  hideTutorial();
  showHint();
});
tutorialDialog.addEventListener("click", (event) => {
  if (event.target === tutorialDialog) hideTutorial();
});

if (!packDefs.some((pack) => pack.id === state.packId)) state.packId = "classic";
packSelect.value = state.packId;
applyPrefs();
pokiCall("gameLoadingStart");
hydrateUnlocksFromRecords();
loadLevel(0);
pokiCall("gameLoadingFinished");
if (localStorage.getItem(tutorialKey) !== "true") window.setTimeout(showTutorial, 350);
