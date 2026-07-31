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
const state = {
  levelIndex: 0,
  board: [],
  target: [],
  selectedColumn: null,
  moves: 0,
  startTime: null,
  elapsedBeforeStart: 0,
  timerId: null,
  completed: false,
  dragFromColumn: null,
  records: loadRecords()
};

const targetGrid = document.querySelector("#targetGrid");
const slotGrid = document.querySelector("#slotGrid");
const levelGrid = document.querySelector("#levelGrid");
const levelName = document.querySelector("#levelName");
const levelCount = document.querySelector("#levelCount");
const timer = document.querySelector("#timer");
const bestTime = document.querySelector("#bestTime");
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
  return { target, board, solution };
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

function loadRecords() {
  try {
    const records = JSON.parse(localStorage.getItem(recordKey) || "{}");
    return records && typeof records === "object" ? records : {};
  } catch {
    return {};
  }
}

function saveRecords() {
  localStorage.setItem(recordKey, JSON.stringify(state.records));
}

function formatTime(milliseconds) {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const tenths = Math.floor((milliseconds % 1000) / 100);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function currentElapsed() {
  if (!state.startTime) return state.elapsedBeforeStart;
  return state.elapsedBeforeStart + performance.now() - state.startTime;
}

function startTimer() {
  if (state.startTime || state.completed) return;
  state.startTime = performance.now();
  state.timerId = window.setInterval(updateTimer, 100);
  updateTimer();
}

function stopTimer() {
  if (state.timerId) window.clearInterval(state.timerId);
  state.timerId = null;
  state.elapsedBeforeStart = currentElapsed();
  state.startTime = null;
  updateTimer();
}

function resetTimer() {
  if (state.timerId) window.clearInterval(state.timerId);
  state.timerId = null;
  state.startTime = null;
  state.elapsedBeforeStart = 0;
  updateTimer();
}

function updateTimer() {
  timer.textContent = formatTime(currentElapsed());
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
    if (state.records[index] !== undefined) button.classList.add("solved");
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
    }

    slotGrid.append(columnEl);
  });

  updateStats();
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
  startTimer();
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
  if (state.completed) return;
  if (state.selectedColumn === null) {
    if (state.board[columnIndex].length === 0) {
      statusText.textContent = "That column is empty. Choose a column with a top token.";
      return;
    }
    startTimer();
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

  startTimer();
  applyMove(state.board, fromColumn, toColumn);
  state.selectedColumn = null;
  state.moves += 1;
  statusText.textContent = "Good. Keep moving only the top tokens until the four shown positions match.";
  renderBoard();
  checkSolved();
}

function updateStats() {
  const matches = countMatches(state.board, state.target);
  moveCount.textContent = String(state.moves);
  matchedCount.textContent = `${matches} / ${columnCount * targetHeight}`;
  levelName.textContent = `Level ${state.levelIndex + 1}`;
  levelCount.textContent = `${state.levelIndex + 1} / ${levelTotal}`;
  const record = state.records[state.levelIndex];
  bestTime.textContent = record === undefined ? "Best --" : `Best ${formatTime(record)}`;
}

function checkSolved() {
  if (!isSolved(state.board, state.target)) return;
  state.completed = true;
  stopTimer();
  const elapsed = Math.round(currentElapsed());
  const previous = state.records[state.levelIndex];
  const isRecord = previous === undefined || elapsed < previous;
  if (isRecord) {
    state.records[state.levelIndex] = elapsed;
    saveRecords();
  }
  renderLevelButtons();
  updateStats();
  winSummary.textContent = `${formatTime(elapsed)} in ${state.moves} moves.${isRecord ? " New personal record." : ""}`;
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
  resetTimer();
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
  resetTimer();
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
  saveRecords();
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
