const colorOrder = ["red", "yellow", "green", "blue"];
const colorNames = {
  red: "red",
  yellow: "yellow",
  green: "green",
  blue: "blue"
};

const levelTotal = 40;
const targetHeight = 4;
const columnCount = 4;
const columnCapacity = 6;
const recordKey = "tokenColumnsRecords";
const progressKey = "tokenColumnsProgress";
const state = {
  levelIndex: 0,
  board: [],
  target: [],
  selectedColumn: null,
  moves: 0,
  completed: false,
  dragFromColumn: null,
  records: loadStoredMap(recordKey),
  progress: loadStoredMap(progressKey)
};

let pointerDrag = null;
let suppressNextClick = false;

const targetGrid = document.querySelector("#targetGrid");
const slotGrid = document.querySelector("#slotGrid");
const levelGrid = document.querySelector("#levelGrid");
const levelName = document.querySelector("#levelName");
const levelCount = document.querySelector("#levelCount");
const recordTarget = document.querySelector("#recordTarget");
const bestMoves = document.querySelector("#bestMoves");
const moveCount = document.querySelector("#moveCount");
const matchedCount = document.querySelector("#matchedCount");
const statusText = document.querySelector("#statusText");
const restartBtn = document.querySelector("#restartBtn");
const newScrambleBtn = document.querySelector("#newScrambleBtn");
const nextLevelBtn = document.querySelector("#nextLevelBtn");
const clearRecordsBtn = document.querySelector("#clearRecordsBtn");
const winDialog = document.querySelector("#winDialog");
const winSummary = document.querySelector("#winSummary");
const winNextBtn = document.querySelector("#winNextBtn");
const winReplayBtn = document.querySelector("#winReplayBtn");

const levels = Array.from({ length: levelTotal }, (_, index) => createLevel(index));

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

function flatten(columns) {
  return columns.flatMap((column) => column);
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

function createTarget(random, levelIndex) {
  const bag = colorOrder.flatMap((color) => Array(targetHeight).fill(color));
  let target = toColumns(shuffle(bag, random));

  if (levelIndex < 8) {
    target = Array.from({ length: columnCount }, (_, columnIndex) => {
      const rotated = [...colorOrder.slice(columnIndex), ...colorOrder.slice(0, columnIndex)];
      return rotated;
    });
  }

  return target;
}

function createLevel(index, salt = 0) {
  const random = mulberry32(90210 + index * 177 + salt * 9973);
  const target = createTarget(random, index);
  let board = cloneColumns(target);
  const moveCountGoal = 20 + index + Math.floor(random() * 12);
  let lastMove = null;
  const scrambleMoves = [];

  for (let step = 0; step < moveCountGoal; step += 1) {
    const moves = legalMoves(board).filter((move) => {
      if (!lastMove) return true;
      return !(move.from === lastMove.to && move.to === lastMove.from);
    });
    const move = moves[Math.floor(random() * moves.length)] || legalMoves(board)[0];
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
  if (!isSolved(proofBoard, target)) {
    throw new Error(`Generated level ${index + 1} is not solvable`);
  }
  const defaultRecord = solution.length + 5 + Math.floor(random() * 6);
  return { target, board, solution, defaultRecord };
}

function legalMoves(board) {
  const moves = [];
  for (let from = 0; from < columnCount; from += 1) {
    if (board[from].length === 0) continue;
    for (let to = 0; to < columnCount; to += 1) {
      if (from !== to && board[to].length < columnCapacity) {
        moves.push({ from, to });
      }
    }
  }
  return moves;
}

function applyMove(board, fromColumn, toColumn) {
  const token = board[fromColumn].pop();
  if (token) board[toColumn].push(token);
}

function countMatches(board, target) {
  let matches = 0;
  for (let column = 0; column < columnCount; column += 1) {
    for (let row = 0; row < targetHeight; row += 1) {
      if (board[column][row] === target[column][row]) matches += 1;
    }
  }
  return matches;
}

function isSolved(board, target) {
  return board.every((column) => column.length === targetHeight) && countMatches(board, target) === columnCount * targetHeight;
}

function loadStoredMap(key) {
  try {
    const records = JSON.parse(localStorage.getItem(key) || "{}");
    return records && typeof records === "object" ? records : {};
  } catch {
    return {};
  }
}

function saveRecords() {
  localStorage.setItem(recordKey, JSON.stringify(state.records));
}

function saveProgress() {
  localStorage.setItem(progressKey, JSON.stringify(state.progress));
}

function markInProgress() {
  if (state.completed) return;
  if (state.records[state.levelIndex] === undefined && !state.progress[state.levelIndex]) {
    state.progress[state.levelIndex] = true;
    saveProgress();
    renderLevelButtons();
  }
}

function renderLevelButtons() {
  levelGrid.innerHTML = "";
  levels.forEach((_, index) => {
    const button = document.createElement("button");
    button.className = "level-button";
    button.type = "button";
    button.textContent = String(index + 1);
    button.setAttribute("aria-label", `Level ${index + 1}`);
    if (index === state.levelIndex) button.classList.add("active");
    if (state.records[index] !== undefined && state.records[index] < levels[index].defaultRecord) {
      button.classList.add("gold-record");
      button.setAttribute("title", "Default record beaten");
    } else if (state.records[index] !== undefined) {
      button.classList.add("solved");
      button.setAttribute("title", "Completed");
    } else if (state.progress[index]) {
      button.classList.add("in-progress");
      button.setAttribute("title", "In progress");
    } else {
      button.classList.add("not-attempted");
      button.setAttribute("title", "Not attempted");
    }
    button.addEventListener("click", () => loadLevel(index));
    levelGrid.append(button);
  });
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
    if (column.length < columnCapacity) columnEl.classList.add("can-receive");
    columnEl.addEventListener("click", () => selectOrMove(columnIndex));
    columnEl.addEventListener("dragover", (event) => {
      if (state.dragFromColumn !== null && state.dragFromColumn !== columnIndex && column.length < columnCapacity) {
        event.preventDefault();
      }
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
  document.querySelectorAll(".drop-target").forEach((column) => column.classList.remove("drop-target"));
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
  if (!Number.isInteger(index)) return null;
  if (index === pointerDrag?.fromColumn) return null;
  if (state.board[index].length >= columnCapacity) return null;
  return index;
}

function highlightPointerDropTarget() {
  const targetColumn = columnFromPoint(pointerDrag.x, pointerDrag.y);
  document.querySelectorAll(".play-column").forEach((column) => {
    column.classList.toggle("drop-target", Number(column.dataset.column) === targetColumn);
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
  document.querySelectorAll(".drop-target").forEach((column) => column.classList.remove("drop-target"));
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
  if (state.completed) return;
  if (fromColumn === toColumn) return;
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

  markInProgress();
  applyMove(state.board, fromColumn, toColumn);
  state.selectedColumn = null;
  state.moves += 1;
  statusText.textContent = "Good. Keep moving only the top tokens until the four shown positions match.";
  renderBoard();
  checkSolved();
}

function updateStats() {
  const matches = countMatches(state.board, state.target);
  const level = levels[state.levelIndex];
  moveCount.textContent = String(state.moves);
  matchedCount.textContent = `${matches} / ${columnCount * targetHeight}`;
  levelName.textContent = `Level ${state.levelIndex + 1}`;
  levelCount.textContent = `${state.levelIndex + 1} / ${levelTotal}`;
  const record = state.records[state.levelIndex];
  recordTarget.textContent = `${level.defaultRecord} moves`;
  bestMoves.textContent = record === undefined ? "Best --" : `Best ${record}`;
}

function checkSolved() {
  if (!isSolved(state.board, state.target)) return;
  state.completed = true;
  const previous = state.records[state.levelIndex];
  const isRecord = previous === undefined || state.moves < previous;
  if (isRecord) {
    state.records[state.levelIndex] = state.moves;
    saveRecords();
  }
  delete state.progress[state.levelIndex];
  saveProgress();
  renderLevelButtons();
  updateStats();
  const defaultRecord = levels[state.levelIndex].defaultRecord;
  const defaultMessage = state.moves < defaultRecord ? " You beat the default record." : ` Default record: ${defaultRecord} moves.`;
  winSummary.textContent = `${state.moves} moves.${isRecord ? " New personal best." : ""}${defaultMessage}`;
  winDialog.classList.remove("hidden");
}

function loadLevel(index) {
  const level = levels[index];
  state.levelIndex = index;
  state.board = cloneColumns(level.board);
  state.target = cloneColumns(level.target);
  state.selectedColumn = null;
  state.moves = 0;
  state.completed = false;
  state.dragFromColumn = null;
  winDialog.classList.add("hidden");
  statusText.textContent = "Lift the top token from a column, then drop it onto another column with room.";
  renderLevelButtons();
  renderTargets();
  renderBoard();
}

function restartLevel() {
  loadLevel(state.levelIndex);
}

function newScramble() {
  const salt = Date.now() % 100000;
  const replacement = createLevel(state.levelIndex, salt);
  levels[state.levelIndex] = replacement;
  state.board = cloneColumns(replacement.board);
  state.target = cloneColumns(replacement.target);
  state.selectedColumn = null;
  state.moves = 0;
  state.completed = false;
  winDialog.classList.add("hidden");
  statusText.textContent = "Fresh scramble loaded. It was made by legal top-token moves, so it can be solved.";
  renderTargets();
  renderBoard();
}

function nextLevel() {
  loadLevel((state.levelIndex + 1) % levelTotal);
}

function clearRecords() {
  state.records = {};
  state.progress = {};
  saveRecords();
  saveProgress();
  renderLevelButtons();
  updateStats();
  statusText.textContent = "Personal records cleared on this device.";
}

restartBtn.addEventListener("click", restartLevel);
newScrambleBtn.addEventListener("click", newScramble);
nextLevelBtn.addEventListener("click", nextLevel);
clearRecordsBtn.addEventListener("click", clearRecords);
winNextBtn.addEventListener("click", nextLevel);
winReplayBtn.addEventListener("click", restartLevel);
winDialog.addEventListener("click", (event) => {
  if (event.target === winDialog) winDialog.classList.add("hidden");
});

loadLevel(0);
