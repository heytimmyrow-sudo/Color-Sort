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
const profileRegistryKey = "tokenColumnsProfilesV1";
const activeProfileKey = "tokenColumnsActiveProfileV1";
const legacyMigrationKey = "tokenColumnsProfilesMigratedV1";
const liveUrl = window.location.origin;
const tutorialLevelCount = 5;
const defaultProfileId = "player-1";
const campaignPackIds = ["classic", "starter", "challenge", "expert"];
const skipCoinCost = 50;

const packDefs = [
  { id: "classic", name: "Classic", total: 40, seed: 90210, extra: 0 },
  { id: "starter", name: "Starter", total: 30, seed: 74011, extra: -10 },
  { id: "challenge", name: "Challenge", total: 45, seed: 120303, extra: 12 },
  { id: "expert", name: "Expert", total: 50, seed: 421337, extra: 25 },
  { id: "hardcore", name: "Hardcore", total: 50, seed: 8675309, extra: 42 },
  { id: "daily", name: "Daily", total: 1, seed: dailySeed(), extra: 16 }
];

const achievementDefs = [
  { id: "firstMove", name: "First Lift", text: "Make your first move.", coins: 10, test: () => state.stats.totalMoves >= 1 },
  { id: "firstWin", name: "First Match", text: "Complete any level.", coins: 25, test: () => completedCount() >= 1 },
  { id: "tutorialDone", name: "Training Board", text: "Complete all five Classic tutorial levels.", coins: 40, test: () => rangeComplete("classic", 0, tutorialLevelCount) },
  { id: "fiveWins", name: "Getting Smooth", text: "Complete 5 levels.", coins: 50, test: () => completedCount() >= 5 },
  { id: "twentyWins", name: "Column Climber", text: "Complete 20 levels.", coins: 85, test: () => completedCount() >= 20 },
  { id: "firstGold", name: "Gold Breaker", text: "Beat one default record.", coins: 45, test: () => goldCount() >= 1 },
  { id: "tenGold", name: "Sharp Hands", text: "Earn 10 gold records.", coins: 120, test: () => goldCount() >= 10 },
  { id: "classicClear", name: "Classic Clear", text: "Complete the Classic pack.", coins: 150, test: () => packComplete("classic") },
  { id: "starterClear", name: "Starter Sweep", text: "Complete the Starter pack.", coins: 120, test: () => packComplete("starter") },
  { id: "challengeClear", name: "Challenge Clear", text: "Complete the Challenge pack.", coins: 200, test: () => packComplete("challenge") },
  { id: "expertClear", name: "Expert Clear", text: "Complete the Expert pack.", coins: 300, test: () => packComplete("expert") },
  { id: "hardcoreUnlock", name: "Hardcore Open", text: "Unlock Hardcore mode.", coins: 250, test: () => hardcoreUnlocked() },
  { id: "hardcoreFirst", name: "No Training Wheels", text: "Complete one Hardcore level.", coins: 200, test: () => completedCount("hardcore") >= 1 },
  { id: "dailyDone", name: "Daily Drop", text: "Complete today's Daily level.", coins: 40, test: () => state.records[recordKey("daily", 0)] !== undefined },
  { id: "dailyStreak3", name: "Three-Day Run", text: "Complete Daily levels 3 days in a row.", coins: 100, test: () => state.stats.dailyStreak >= 3 },
  { id: "dailyStreak7", name: "Daily Regular", text: "Complete Daily levels 7 days in a row.", coins: 250, test: () => state.stats.dailyStreak >= 7 },
  { id: "hundredMoves", name: "Hands Warm", text: "Make 100 total moves.", coins: 65, test: () => state.stats.totalMoves >= 100 },
  { id: "shopper", name: "Fresh Look", text: "Buy one shop item.", coins: 35, test: () => state.stats.shopPurchases >= 1 }
];

const shopItems = [
  { id: "token-rings", kind: "tokenStyle", value: "rings", name: "Ring Tokens", cost: 80 },
  { id: "token-glossy", kind: "tokenStyle", value: "glossy", name: "Glossy Tokens", cost: 120 },
  { id: "token-neon", kind: "tokenStyle", value: "neon", name: "Neon Tokens", cost: 180 },
  { id: "bg-ocean", kind: "boardStyle", value: "ocean", name: "Ocean Board", cost: 110 },
  { id: "bg-garden", kind: "boardStyle", value: "garden", name: "Garden Board", cost: 110 },
  { id: "bg-space", kind: "boardStyle", value: "space", name: "Space Board", cost: 160 }
];

const defaultProfileState = {
  packId: "classic",
  records: {},
  progress: {},
  saves: {},
  stars: {},
  unlocks: { classic: 0, starter: 0, challenge: 0, expert: 0, hardcore: 0, daily: 0 },
  prefs: { muted: false, symbols: false, theme: "toy" },
  coins: 0,
  achievements: {},
  unlockedCosmetics: { "token-classic": true, "board-maple": true },
  cosmetics: { tokenStyle: "classic", boardStyle: "maple" },
  stats: { totalMoves: 0, totalWins: 0, shopPurchases: 0, dailyStreak: 0, bestDailyStreak: 0, lastDailyDate: "" }
};

const tutorialMessages = [
  "Tutorial 1 of 5: drag or tap the top red token into column 1.",
  "Tutorial 2 of 5: solve two easy top-token moves.",
  "Tutorial 3 of 5: use the target card and fix one column at a time.",
  "Tutorial 4 of 5: columns can hold extra tokens while you sort.",
  "Tutorial 5 of 5: finish the warmup, then the real packs open up."
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

ensureLegacyProfile();
const levelCache = new Map();
const state = {
  profileId: loadActiveProfileId(),
  profileName: profileName(loadActiveProfileId()),
  levelIndex: 0,
  board: [],
  target: [],
  history: [],
  moveLog: [],
  selectedColumn: null,
  lastMove: null,
  hintPath: [],
  moves: 0,
  completed: false,
  dragFromColumn: null,
  ...loadProfileState(loadActiveProfileId())
};

let pointerDrag = null;
let suppressNextClick = false;
let deferredInstallPrompt = null;
let audioContext = null;
let pokiGameplayStarted = false;
let pokiInitialized = false;
let pokiInitPromise = null;

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
const profileSelect = document.querySelector("#profileSelect");
const newProfileBtn = document.querySelector("#newProfileBtn");
const exportProfileBtn = document.querySelector("#exportProfileBtn");
const importProfileBtn = document.querySelector("#importProfileBtn");
const importProfileInput = document.querySelector("#importProfileInput");
const profileText = document.querySelector("#profileText");
const restartBtn = document.querySelector("#restartBtn");
const undoBtn = document.querySelector("#undoBtn");
const tutorialBtn = document.querySelector("#tutorialBtn");
const hintBtn = document.querySelector("#hintBtn");
const newScrambleBtn = document.querySelector("#newScrambleBtn");
const nextLevelBtn = document.querySelector("#nextLevelBtn");
const skipAdBtn = document.querySelector("#skipAdBtn");
const skipCoinsBtn = document.querySelector("#skipCoinsBtn");
const shareBtn = document.querySelector("#shareBtn");
const clearRecordsBtn = document.querySelector("#clearRecordsBtn");
const muteBtn = document.querySelector("#muteBtn");
const symbolsBtn = document.querySelector("#symbolsBtn");
const themeSelect = document.querySelector("#themeSelect");
const coinCount = document.querySelector("#coinCount");
const hardcoreStatus = document.querySelector("#hardcoreStatus");
const achievementGrid = document.querySelector("#achievementGrid");
const shopGrid = document.querySelector("#shopGrid");
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
const winStars = document.querySelector("#winStars");
const winMoves = document.querySelector("#winMoves");
const winCoins = document.querySelector("#winCoins");
const winRecord = document.querySelector("#winRecord");
const winNextBtn = document.querySelector("#winNextBtn");
const winReplayBtn = document.querySelector("#winReplayBtn");
const tutorialDialog = document.querySelector("#tutorialDialog");
const tutorialStartBtn = document.querySelector("#tutorialStartBtn");
const tutorialHintBtn = document.querySelector("#tutorialHintBtn");

function dailySeed() {
  return hashSeed(`daily:${dailyId()}:token-columns`);
}

function dailyId(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function mulberry32(seed) {
  return function next() {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function hashSeed(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
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

function packById(packId) {
  return packDefs.find((pack) => pack.id === packId) || packDefs[0];
}

function levelsForPack(pack = activePack()) {
  const cacheKey = pack.id === "daily" ? `${pack.id}:${dailyId()}` : pack.id;
  if (!levelCache.has(cacheKey)) {
    levelCache.set(cacheKey, Array.from({ length: pack.total }, (_, index) => createLevel(index, pack)));
  }
  return levelCache.get(cacheKey);
}

function levelKey(index = state.levelIndex) {
  if (state.packId === "daily") return `daily:${dailyId()}:${index}`;
  return `${state.packId}:${index}`;
}

function recordKey(packId, index) {
  return packId === "daily" ? `daily:${dailyId()}:${index}` : `${packId}:${index}`;
}

function unlockedIndex(packId = state.packId) {
  return Math.max(0, Number(state.unlocks[packId] || 0));
}

function isUnlocked(index, packId = state.packId) {
  return index <= unlockedIndex(packId);
}

function packComplete(packId) {
  const pack = packById(packId);
  return Array.from({ length: pack.total }, (_, index) => `${packId}:${index}`).every((key) => state.records[key] !== undefined);
}

function rangeComplete(packId, start, end) {
  return Array.from({ length: end - start }, (_, offset) => `${packId}:${start + offset}`).every((key) => state.records[key] !== undefined);
}

function completedCount(packId = null) {
  return Object.keys(state.records).filter((key) => !packId || key.startsWith(`${packId}:`)).length;
}

function goldCount() {
  return Object.entries(state.stars).filter(([, stars]) => Number(stars) >= 3).length;
}

function hardcoreUnlocked() {
  return campaignPackIds.every(packComplete);
}

function packAvailable(packId) {
  return packId !== "hardcore" || hardcoreUnlocked();
}

function updateDailyStreak() {
  const today = dailyId();
  if (state.stats.lastDailyDate === today) return null;
  const yesterday = dailyId(-1);
  const nextStreak = state.stats.lastDailyDate === yesterday ? Number(state.stats.dailyStreak || 0) + 1 : 1;
  state.stats.dailyStreak = nextStreak;
  state.stats.bestDailyStreak = Math.max(Number(state.stats.bestDailyStreak || 0), nextStreak);
  state.stats.lastDailyDate = today;
  const reward = 25 + Math.min(nextStreak, 7) * 5;
  state.coins += reward;
  return { streak: nextStreak, reward };
}

function saveUnlocks() {
  saveProfileState();
}

function hydrateUnlocksFromRecords() {
  for (const pack of packDefs) {
    let unlocked = unlockedIndex(pack.id);
    const levels = levelsForPack(pack);
    for (let index = 0; index < pack.total; index += 1) {
      const key = recordKey(pack.id, index);
      const record = state.records[key];
      if (record !== undefined) {
        unlocked = Math.max(unlocked, index + 1);
        if (!state.stars[key]) state.stars[key] = starsForMoves(record, levels[index]);
      }
    }
    state.unlocks[pack.id] = Math.min(unlocked, pack.total - 1);
  }
  if (!hardcoreUnlocked()) state.unlocks.hardcore = 0;
  saveProfileState();
  saveUnlocks();
}

function evaluateAchievements() {
  const newlyEarned = [];
  for (const achievement of achievementDefs) {
    if (state.achievements[achievement.id]?.earned) continue;
    if (!achievement.test()) continue;
    state.achievements[achievement.id] = { earned: true, earnedAt: Date.now() };
    state.coins += achievement.coins;
    newlyEarned.push(achievement);
  }
  if (newlyEarned.length > 0) {
    saveProfileState();
    renderAchievements();
    renderShop();
    const names = newlyEarned.map((achievement) => achievement.name).join(", ");
    statusText.textContent = `Achievement unlocked: ${names}. Coins added.`;
  }
  return newlyEarned;
}

function starsForMoves(moves, level) {
  if (moves < level.defaultRecord) return 3;
  if (moves <= level.defaultRecord + 8) return 2;
  return 1;
}

function starText(count) {
  return count > 0 ? "*".repeat(count) : "";
}

function isTutorialLevel(index = state.levelIndex, packId = state.packId) {
  return (packId === "classic" || packId === "starter") && index < tutorialLevelCount;
}

function tutorialStatus(index = state.levelIndex) {
  return tutorialMessages[index] || `Tutorial ${index + 1} of ${tutorialLevelCount}: move only the top circle, then match the card.`;
}

function createTarget(random, levelIndex, pack) {
  const bag = colorOrder.flatMap((color) => Array(targetHeight).fill(color));
  let target = toColumns(shuffle(bag, random));
  if (pack.id === "daily") target = dailyTarget(target, pack.seed);
  if ((pack.id === "starter" || pack.id === "classic") && levelIndex < tutorialLevelCount) {
    target = Array.from({ length: columnCount }, (_, columnIndex) => {
      return [...colorOrder.slice(columnIndex), ...colorOrder.slice(0, columnIndex)];
    });
  }
  return target;
}

function dailyTarget(target, seed) {
  const random = mulberry32(seed ^ 0x9E3779B9);
  const copy = cloneColumns(target);
  const twists = 3 + (seed % 6);
  for (let twist = 0; twist < twists; twist += 1) {
    const fromColumn = Math.floor(random() * columnCount);
    const toColumn = Math.floor(random() * columnCount);
    const fromRow = Math.floor(random() * targetHeight);
    const toRow = Math.floor(random() * targetHeight);
    [copy[fromColumn][fromRow], copy[toColumn][toRow]] = [copy[toColumn][toRow], copy[fromColumn][fromRow]];
  }
  return copy;
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
  const fallbackSolution = [...scrambleMoves].reverse().map((move) => ({ from: move.to, to: move.from }));
  const solution = findShortestSolution(board, target, 90000) || fallbackSolution;
  const proofBoard = cloneColumns(board);
  solution.forEach((move) => applyMove(proofBoard, move.from, move.to));
  if (!isSolved(proofBoard, target)) throw new Error(`Hand-authored level ${index + 1} is not solvable`);
  return {
    target,
    board,
    solution,
    capacities: Array(columnCount).fill(columnCapacity),
    defaultRecord: solution.length + 3 + (index % 3),
    difficulty: index < tutorialLevelCount ? "Tutorial" : difficultyFor(solution.length)
  };
}

function createBridgeLevel(index, pack) {
  const random = mulberry32(pack.seed + index * 577 + 4109);
  const target = starterTarget();
  const capacities = Array(columnCount).fill(columnCapacity);
  const board = target.map((column) => [...column].reverse());
  const moveCountGoal = 10 + (index - tutorialLevelCount) * 3;
  const scrambleMoves = [];
  let lastMove = null;
  for (let step = 0; step < moveCountGoal; step += 1) {
    const legal = legalMoves(board, capacities);
    const choices = legal.filter((move) => !lastMove || !(move.from === lastMove.to && move.to === lastMove.from));
    const move = chooseScrambleMove(board, target, choices.length ? choices : legal, random, step, moveCountGoal);
    applyMove(board, move.from, move.to);
    scrambleMoves.push(move);
    lastMove = move;
  }
  const fallbackSolution = [...scrambleMoves].reverse().map((move) => ({ from: move.to, to: move.from }));
  const solution = findShortestSolution(board, target, 90000, capacities) || fallbackSolution;
  const proofBoard = cloneColumns(board);
  solution.forEach((move) => applyMove(proofBoard, move.from, move.to));
  if (!isSolved(proofBoard, target)) throw new Error(`Bridge ${pack.name} level ${index + 1} is not solvable`);
  return {
    target,
    board,
    solution,
    capacities,
    defaultRecord: solution.length + 3 + (index % 3),
    difficulty: difficultyFor(solution.length)
  };
}

function createLevel(index, pack, salt = 0) {
  if (salt === 0 && (pack.id === "classic" || pack.id === "starter") && index < tutorialLevelCount) {
    return createHandAuthoredLevel(index);
  }
  if (salt === 0 && pack.id === "classic" && index < tutorialLevelCount + 5) {
    return createBridgeLevel(index, pack);
  }
  const random = mulberry32(pack.seed + index * 177 + salt * 9973);
  const target = createTarget(random, index, pack);
  const capacities = capacitiesForLevel(index, pack);
  let board = target.map((column) => [...column].reverse());
  const moveCountGoal = Math.max(8, minimumSolutionLength(index, pack) + dailyMoveBonus(pack, random) + 6 + Math.floor(random() * 8));
  let lastMove = null;
  const scrambleMoves = [];

  for (let step = 0; step < moveCountGoal; step += 1) {
    const legal = legalMoves(board, capacities);
    const choices = legal.filter((move) => !lastMove || !(move.from === lastMove.to && move.to === lastMove.from));
    const move = chooseScrambleMove(board, target, choices.length ? choices : legal, random, step, moveCountGoal);
    applyMove(board, move.from, move.to);
    scrambleMoves.push(move);
    lastMove = move;
  }

  if (isSolved(board, target)) {
    const move = legalMoves(board, capacities)[0];
    applyMove(board, move.from, move.to);
    scrambleMoves.push(move);
  }

  let extraStep = 0;
  while (countMatches(board, target) > maxStartingMatches(index, pack) && extraStep < 70) {
    const legal = legalMoves(board, capacities);
    const choices = legal.filter((move) => !lastMove || !(move.from === lastMove.to && move.to === lastMove.from));
    const move = chooseScrambleMove(board, target, choices.length ? choices : legal, random, 0, 1);
    applyMove(board, move.from, move.to);
    scrambleMoves.push(move);
    lastMove = move;
    extraStep += 1;
  }

  const solution = scrambleMoves.reverse().map((move) => ({ from: move.to, to: move.from }));
  const proofBoard = cloneColumns(board);
  solution.forEach((move) => applyMove(proofBoard, move.from, move.to));
  if (!isSolved(proofBoard, target)) throw new Error(`Generated ${pack.name} level ${index + 1} is not solvable`);
  return {
    target,
    board,
    solution,
    capacities,
    defaultRecord: solution.length + 3 + Math.floor(random() * 3),
    difficulty: difficultyFor(solution.length)
  };
}

function chooseScrambleMove(board, target, choices, random, step, moveCountGoal) {
  const currentMatches = countMatches(board, target);
  const scored = choices.map((move) => {
    const nextBoard = cloneColumns(board);
    applyMove(nextBoard, move.from, move.to);
    return { move, matches: countMatches(nextBoard, target) };
  }).sort((a, b) => a.matches - b.matches);
  const awayMoves = scored.filter((item) => item.matches <= currentMatches);
  const pool = step < moveCountGoal * 0.76 && awayMoves.length ? awayMoves : scored;
  const spread = Math.max(1, Math.ceil(pool.length * 0.56));
  return pool[Math.floor(random() * spread)].move;
}

function maxStartingMatches(index, pack) {
  if (pack.id === "classic" && index < tutorialLevelCount) return 15;
  if (pack.id === "starter" && index < tutorialLevelCount) return 15;
  if (pack.id === "starter") return index < 12 ? 9 : index < 22 ? 7 : 5;
  if (pack.id === "classic") return index < 12 ? 8 : index < 26 ? 6 : 4;
  if (pack.id === "challenge") return index < 12 ? 7 : index < 30 ? 5 : 3;
  if (pack.id === "expert") return index < 15 ? 6 : index < 34 ? 4 : 2;
  if (pack.id === "hardcore") return index < 16 ? 4 : 2;
  if (pack.id === "daily") return 5;
  return 5;
}

function minimumSolutionLength(index, pack) {
  if (pack.id === "classic") return index < tutorialLevelCount ? index + 1 : Math.min(10 + Math.floor((index - tutorialLevelCount) * 0.95), 42);
  if (pack.id === "starter") return index < tutorialLevelCount ? index + 1 : Math.min(8 + Math.floor((index - tutorialLevelCount) * 0.7), 26);
  if (pack.id === "challenge") return Math.min(20 + Math.floor(index * 0.75), 52);
  if (pack.id === "expert") return Math.min(32 + Math.floor(index * 0.8), 70);
  if (pack.id === "hardcore") return Math.min(48 + Math.floor(index * 0.85), 90);
  if (pack.id === "daily") return 20 + (pack.seed % 13);
  return 16;
}

function capacitiesForLevel(index, pack) {
  if (pack.id === "classic" && index < tutorialLevelCount) return [6, 6, 6, 6];
  if (pack.id === "starter" && index < tutorialLevelCount) return [6, 6, 6, 6];
  if (pack.id === "starter") return index < 16 ? [6, 6, 6, 6] : [5, 6, 6, 6];
  if (pack.id === "classic") return index < 12 ? [6, 6, 6, 6] : index < 28 ? [5, 6, 6, 6] : [5, 5, 5, 6];
  if (pack.id === "challenge") return index < 15 ? [5, 6, 6, 6] : [5, 5, 5, 6];
  if (pack.id === "expert") return index < 18 ? [5, 5, 5, 6] : [5, 5, 5, 5];
  if (pack.id === "hardcore") return [5, 5, 5, 5];
  if (pack.id === "daily") return dailyCapacities(pack.seed);
  return [6, 6, 6, 6];
}

function dailyMoveBonus(pack, random) {
  if (pack.id !== "daily") return 0;
  return Math.floor(random() * 10) + (pack.seed % 7);
}

function dailyCapacities(seed) {
  const patterns = [
    [6, 6, 5, 5],
    [6, 5, 6, 5],
    [5, 6, 5, 6],
    [6, 5, 5, 6],
    [5, 5, 6, 6],
    [5, 6, 6, 5],
    [5, 5, 5, 6],
    [5, 5, 6, 5]
  ];
  return [...patterns[seed % patterns.length]];
}

function pokiCall(method) {
  try {
    const api = window.PokiSDK;
    if (api && typeof api[method] === "function") api[method]();
  } catch {
    // Poki is optional on the public web build.
  }
}

function waitForPokiSdk(timeout = 900) {
  if (window.PokiSDK) return Promise.resolve(window.PokiSDK);
  return new Promise((resolve) => {
    const started = performance.now();
    const timer = window.setInterval(() => {
      if (window.PokiSDK) {
        window.clearInterval(timer);
        resolve(window.PokiSDK);
        return;
      }
      if (performance.now() - started >= timeout) {
        window.clearInterval(timer);
        resolve(null);
      }
    }, 50);
  });
}

function initPoki() {
  if (pokiInitPromise) return pokiInitPromise;
  pokiInitPromise = waitForPokiSdk().then((api) => {
    if (!api) return false;
    if (typeof api.init !== "function") {
      pokiInitialized = true;
      return true;
    }
    return api.init().then(() => {
      pokiInitialized = true;
      return true;
    }).catch(() => {
      pokiInitialized = false;
      return false;
    });
  });
  return pokiInitPromise;
}

function rewardedAdsAvailable() {
  return pokiInitialized && typeof window.PokiSDK?.rewardedBreak === "function";
}

async function showRewardedAd() {
  try {
    await initPoki();
    if (!rewardedAdsAvailable()) return false;
    stopGameplaySession();
    const result = await window.PokiSDK.rewardedBreak({
      size: "medium",
      onStart: () => stopGameplaySession()
    });
    startGameplaySession();
    return result === true || result?.success === true;
  } catch {
    startGameplaySession();
    return false;
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

function currentCapacities() {
  return levelsForPack()[state.levelIndex]?.capacities || Array(columnCount).fill(columnCapacity);
}

function legalMoves(board, capacities = Array(columnCount).fill(columnCapacity)) {
  const moves = [];
  for (let from = 0; from < columnCount; from += 1) {
    if (board[from].length === 0) continue;
    for (let to = 0; to < columnCount; to += 1) {
      if (from !== to && board[to].length < capacities[to]) moves.push({ from, to });
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

function mergeDefaults(value, defaults) {
  const result = Array.isArray(defaults) ? [] : {};
  Object.keys(defaults).forEach((key) => {
    if (defaults[key] && typeof defaults[key] === "object" && !Array.isArray(defaults[key])) {
      result[key] = mergeDefaults(value?.[key], defaults[key]);
    } else {
      result[key] = value?.[key] ?? defaults[key];
    }
  });
  Object.keys(value || {}).forEach((key) => {
    if (result[key] === undefined) result[key] = value[key];
  });
  return result;
}

function profileStorageKey(profileId) {
  return `tokenColumnsProfile:${profileId}`;
}

function readProfiles() {
  const profiles = loadStoredMap(profileRegistryKey);
  if (!profiles[defaultProfileId]) profiles[defaultProfileId] = { id: defaultProfileId, name: "Player 1", createdAt: Date.now() };
  saveJson(profileRegistryKey, profiles);
  return profiles;
}

function profileName(profileId) {
  return readProfiles()[profileId]?.name || "Player";
}

function loadActiveProfileId() {
  const profiles = readProfiles();
  const stored = localStorage.getItem(activeProfileKey);
  return profiles[stored] ? stored : defaultProfileId;
}

function ensureLegacyProfile() {
  const profiles = readProfiles();
  if (localStorage.getItem(legacyMigrationKey) === "true") return;
  const legacy = {
    ...defaultProfileState,
    packId: localStorage.getItem(packKey) || "classic",
    records: loadStoredMap(recordsKey),
    progress: loadStoredMap(progressKey),
    saves: loadStoredMap(savesKey),
    stars: loadStoredMap(starsKey),
    unlocks: { ...defaultProfileState.unlocks, ...loadStoredMap(unlocksKey) },
    prefs: { ...defaultProfileState.prefs, ...loadStoredMap(prefsKey) }
  };
  saveJson(profileStorageKey(defaultProfileId), legacy);
  profiles[defaultProfileId] = profiles[defaultProfileId] || { id: defaultProfileId, name: "Player 1", createdAt: Date.now() };
  saveJson(profileRegistryKey, profiles);
  localStorage.setItem(activeProfileKey, defaultProfileId);
  localStorage.setItem(legacyMigrationKey, "true");
}

function loadProfileState(profileId) {
  return mergeDefaults(loadStoredMap(profileStorageKey(profileId)), defaultProfileState);
}

function serializableProfileState() {
  return {
    packId: state.packId,
    records: state.records,
    progress: state.progress,
    saves: state.saves,
    stars: state.stars,
    unlocks: state.unlocks,
    prefs: state.prefs,
    coins: state.coins,
    achievements: state.achievements,
    unlockedCosmetics: state.unlockedCosmetics,
    cosmetics: state.cosmetics,
    stats: state.stats
  };
}

function saveProfileState() {
  saveJson(profileStorageKey(state.profileId), serializableProfileState());
}

function renderProfiles() {
  const profiles = readProfiles();
  profileSelect.innerHTML = "";
  Object.values(profiles).forEach((profile) => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.name;
    profileSelect.append(option);
  });
  profileSelect.value = state.profileId;
  profileText.textContent = `${state.profileName}: auto-saving to this profile. Export makes a backup file.`;
}

function switchProfile(profileId) {
  const profiles = readProfiles();
  if (!profiles[profileId]) return;
  stopGameplaySession();
  Object.assign(state, loadProfileState(profileId), {
    profileId,
    profileName: profiles[profileId].name,
    levelIndex: 0,
    board: [],
    target: [],
    history: [],
    moveLog: [],
    selectedColumn: null,
    lastMove: null,
    moves: 0,
    completed: false,
    dragFromColumn: null
  });
  localStorage.setItem(activeProfileKey, profileId);
  hydrateUnlocksFromRecords();
  applyPrefs();
  renderProfiles();
  renderAchievements();
  renderShop();
  setPack(state.packId, true);
  evaluateAchievements();
}

function createProfile() {
  const profiles = readProfiles();
  const number = Object.keys(profiles).length + 1;
  const id = `player-${Date.now().toString(36)}`;
  profiles[id] = { id, name: `Player ${number}`, createdAt: Date.now() };
  saveJson(profileRegistryKey, profiles);
  saveJson(profileStorageKey(id), defaultProfileState);
  switchProfile(id);
}

function exportProfile() {
  const payload = {
    app: "Token Columns",
    version: 1,
    profile: { id: state.profileId, name: state.profileName },
    savedAt: new Date().toISOString(),
    data: serializableProfileState()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${state.profileName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "token-columns"}-save.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  profileText.textContent = "Save file exported.";
}

async function importProfileFile(file) {
  try {
    const payload = JSON.parse(await file.text());
    const imported = mergeDefaults(payload.data || payload, defaultProfileState);
    const profiles = readProfiles();
    const id = `player-${Date.now().toString(36)}`;
    const nameBase = payload.profile?.name || file.name.replace(/\.json$/i, "") || "Imported Player";
    profiles[id] = { id, name: `${nameBase} Import`, createdAt: Date.now() };
    saveJson(profileRegistryKey, profiles);
    saveJson(profileStorageKey(id), imported);
    switchProfile(id);
    profileText.textContent = "Save file imported as a new player.";
  } catch {
    profileText.textContent = "That save file could not be imported.";
  } finally {
    importProfileInput.value = "";
  }
}

function savePrefs() {
  saveProfileState();
}

function markInProgress() {
  if (state.completed) return;
  const key = levelKey();
  if (state.records[key] === undefined && !state.progress[key]) {
    state.progress[key] = true;
    saveProfileState();
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
  saveProfileState();
}

function clearCurrentSave(index = state.levelIndex) {
  delete state.saves[levelKey(index)];
  saveProfileState();
}

function renderLevelButtons() {
  renderPackOptions();
  coinCount.textContent = String(state.coins);
  const streakText = state.stats.dailyStreak ? ` Daily streak: ${state.stats.dailyStreak}.` : "";
  hardcoreStatus.textContent = `${hardcoreUnlocked() ? "Hardcore unlocked" : "Hardcore unlocks after all main packs."}${streakText}`;
  updateSkipControls();
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
    stars.textContent = unlocked ? (starCount ? starText(starCount) : (isTutorialLevel(index) ? "TUT" : "")) : "LOCK";
    button.append(number, stars);
    button.setAttribute("aria-label", `${activePack().name} level ${index + 1}, ${level.difficulty}${isTutorialLevel(index) ? ", tutorial" : ""}`);
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
      button.title = isTutorialLevel(index) ? "Tutorial level" : "Not attempted";
    }
    button.addEventListener("click", () => loadLevel(index));
    levelGrid.append(button);
  });
}

function updateSkipControls() {
  const levels = levelsForPack();
  const canSkip = levels.length > 1 && state.levelIndex < levels.length - 1 && !state.completed;
  skipAdBtn.disabled = !canSkip || !rewardedAdsAvailable();
  skipCoinsBtn.disabled = !canSkip || state.coins < skipCoinCost;
  skipAdBtn.title = rewardedAdsAvailable() ? "Watch a rewarded ad to unlock the next level." : "Ads are not available in this version yet.";
  skipCoinsBtn.title = state.coins >= skipCoinCost ? "Spend 50 coins to unlock the next level." : `You need ${skipCoinCost} coins to skip.`;
}

function renderPackOptions() {
  Array.from(packSelect.options).forEach((option) => {
    option.disabled = !packAvailable(option.value);
    if (option.value === "hardcore") option.textContent = hardcoreUnlocked() ? "Hardcore" : "Hardcore (locked)";
  });
}

function renderAchievements() {
  achievementGrid.innerHTML = "";
  achievementDefs.forEach((achievement) => {
    const earned = Boolean(state.achievements[achievement.id]?.earned);
    const card = document.createElement("article");
    card.className = `achievement-card${earned ? " earned" : ""}`;
    const title = document.createElement("strong");
    title.textContent = achievement.name;
    const text = document.createElement("span");
    text.textContent = achievement.text;
    const reward = document.createElement("em");
    reward.textContent = earned ? "Claimed" : `${achievement.coins} coins`;
    card.append(title, text, reward);
    achievementGrid.append(card);
  });
  coinCount.textContent = String(state.coins);
}

function renderShop() {
  shopGrid.innerHTML = "";
  coinCount.textContent = String(state.coins);
  shopItems.forEach((item) => {
    const owned = Boolean(state.unlockedCosmetics[item.id]);
    const equipped = state.cosmetics[item.kind] === item.value;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `shop-item${equipped ? " equipped" : ""}`;
    button.innerHTML = `<span>${item.name}</span><strong>${equipped ? "Equipped" : owned ? "Use" : `${item.cost} coins`}</strong>`;
    button.disabled = !owned && state.coins < item.cost;
    button.addEventListener("click", () => buyOrEquip(item));
    shopGrid.append(button);
  });
}

function buyOrEquip(item) {
  const owned = Boolean(state.unlockedCosmetics[item.id]);
  if (!owned) {
    if (state.coins < item.cost) return;
    state.coins -= item.cost;
    state.unlockedCosmetics[item.id] = true;
    state.stats.shopPurchases += 1;
  }
  state.cosmetics[item.kind] = item.value;
  saveProfileState();
  applyPrefs();
  renderShop();
  evaluateAchievements();
  statusText.textContent = `${item.name} equipped.`;
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
  const capacities = currentCapacities();
  state.board.forEach((column, columnIndex) => {
    const capacity = capacities[columnIndex] || columnCapacity;
    const columnEl = document.createElement("button");
    columnEl.className = "play-column";
    columnEl.type = "button";
    columnEl.dataset.column = columnIndex;
    columnEl.dataset.capacity = capacity;
    columnEl.setAttribute("aria-label", columnLabel(columnIndex));
    if (state.selectedColumn === columnIndex) columnEl.classList.add("selected-column");
    if (state.lastMove?.from === columnIndex) columnEl.classList.add("last-source");
    if (state.lastMove?.to === columnIndex) columnEl.classList.add("last-target");
    if (column.length < capacity) columnEl.classList.add("can-receive");
    columnEl.addEventListener("click", () => selectOrMove(columnIndex));

    for (let visualRow = 0; visualRow < columnCapacity; visualRow += 1) {
      const stackIndex = columnCapacity - 1 - visualRow;
      const color = column[stackIndex];
      const slot = document.createElement("span");
      slot.className = "slot";
      slot.dataset.column = columnIndex;
      slot.dataset.stackIndex = stackIndex;
      if (stackIndex >= capacity) slot.classList.add("blocked-slot");
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
  if (event.pointerType === "touch" || event.pointerType === "pen") event.preventDefault();
  clearHighlights();
  const topColor = state.board[columnIndex][state.board[columnIndex].length - 1];
  pointerDrag = {
    fromColumn: columnIndex,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    x: event.clientX,
    y: event.clientY,
    color: topColor,
    active: false,
    dropColumn: null,
    ghost: null,
    target: event.currentTarget
  };
  event.currentTarget.setPointerCapture?.(event.pointerId);
  window.addEventListener("pointermove", handlePointerMove, { passive: false });
  window.addEventListener("pointerup", handlePointerUp, { passive: false });
  window.addEventListener("pointercancel", handlePointerCancel, { passive: false });
  window.addEventListener("blur", handlePointerCancel);
}

function handlePointerMove(event) {
  if (!pointerDrag) return;
  if (event.pointerId !== pointerDrag.pointerId) return;
  if (event.cancelable) event.preventDefault();
  pointerDrag.x = event.clientX;
  pointerDrag.y = event.clientY;
  const distance = Math.hypot(pointerDrag.x - pointerDrag.startX, pointerDrag.y - pointerDrag.startY);
  if (!pointerDrag.active && distance > 4) startPointerDrag();
  if (!pointerDrag.active) return;
  event.preventDefault();
  movePointerGhost();
  highlightPointerDropTarget();
}

function handlePointerUp(event) {
  if (!pointerDrag) return;
  if (event.pointerId !== pointerDrag.pointerId) return;
  if (event.cancelable) event.preventDefault();
  const drag = pointerDrag;
  const wasActive = drag.active;
  const dropColumn = wasActive ? nearestDropColumn(event.clientX, event.clientY) : null;
  const canDrop = dropColumn !== null && canMoveToColumn(drag.fromColumn, dropColumn);
  cancelPointerDrag();
  if (wasActive) {
    if (canDrop) moveTopToken(drag.fromColumn, dropColumn);
    else returnTokenToSource("That column cannot hold this token. It snapped back.");
  }
}

function handlePointerCancel(event) {
  if (!pointerDrag) return;
  if (event?.pointerId !== undefined && event.pointerId !== pointerDrag.pointerId) return;
  cancelPointerDrag();
  returnTokenToSource("Drag canceled. The token returned to its column.");
}

function startPointerDrag() {
  if (!pointerDrag || pointerDrag.active) return;
  markInProgress();
  pointerDrag.active = true;
  suppressNextClick = true;
  document.body.classList.add("pointer-dragging");
  const sourceColumn = document.querySelector(`.play-column[data-column="${pointerDrag.fromColumn}"]`);
  sourceColumn?.classList.add("dragging-column");
  sourceColumn?.classList.add("lift-source");
  pointerDrag.ghost = document.createElement("span");
  pointerDrag.ghost.className = `drag-ghost ${pointerDrag.color}`;
  pointerDrag.ghost.textContent = tokenText(pointerDrag.color);
  pointerDrag.ghost.setAttribute("aria-hidden", "true");
  document.body.append(pointerDrag.ghost);
  movePointerGhost();
}

function cancelPointerDrag() {
  if (pointerDrag?.pointerId !== undefined) {
    try {
      pointerDrag.target?.releasePointerCapture?.(pointerDrag.pointerId);
    } catch {
      // Some browsers release capture automatically on pointerup.
    }
  }
  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerup", handlePointerUp);
  window.removeEventListener("pointercancel", handlePointerCancel);
  window.removeEventListener("blur", handlePointerCancel);
  if (pointerDrag?.ghost) pointerDrag.ghost.remove();
  pointerDrag = null;
  document.body.classList.remove("pointer-dragging");
  clearHighlights();
  document.querySelectorAll(".dragging-column,.lift-source,.invalid-drop").forEach((column) => {
    column.classList.remove("dragging-column", "lift-source", "invalid-drop");
  });
  window.setTimeout(() => {
    suppressNextClick = false;
  }, 80);
}

function returnTokenToSource(message) {
  state.selectedColumn = null;
  clearHighlights();
  renderBoard();
  statusText.textContent = message;
}

function movePointerGhost() {
  if (!pointerDrag?.ghost) return;
  pointerDrag.ghost.style.left = `${pointerDrag.x}px`;
  pointerDrag.ghost.style.top = `${pointerDrag.y}px`;
}

function nearestDropColumn(x, y) {
  if (!pointerDrag) return null;
  const capacities = currentCapacities();
  const columns = [...document.querySelectorAll(".play-column")].map((element) => {
    const rect = element.getBoundingClientRect();
    const index = Number(element.dataset.column);
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return { element, rect, index, distance: Math.hypot(x - centerX, y - centerY) };
  }).filter((column) => {
    if (!Number.isInteger(column.index) || column.index === pointerDrag.fromColumn) return false;
    if (!canMoveToColumn(pointerDrag.fromColumn, column.index, capacities)) return false;
    const verticalPad = Math.max(44, column.rect.height * 0.12);
    return y >= column.rect.top - verticalPad && y <= column.rect.bottom + verticalPad;
  });
  if (columns.length === 0) return null;
  columns.sort((a, b) => a.distance - b.distance);
  const closest = columns[0];
  const horizontalReach = Math.max(closest.rect.width * 0.78, 86);
  return Math.abs(x - (closest.rect.left + closest.rect.width / 2)) <= horizontalReach ? closest.index : null;
}

function canMoveToColumn(fromColumn, toColumn, capacities = currentCapacities()) {
  return Number.isInteger(fromColumn)
    && Number.isInteger(toColumn)
    && fromColumn !== toColumn
    && state.board[fromColumn]?.length > 0
    && state.board[toColumn]?.length < capacities[toColumn];
}

function highlightPointerDropTarget() {
  const targetColumn = nearestDropColumn(pointerDrag.x, pointerDrag.y);
  pointerDrag.dropColumn = targetColumn;
  document.querySelectorAll(".play-column").forEach((column) => {
    const isTarget = Number(column.dataset.column) === targetColumn;
    column.classList.toggle("drop-target", isTarget);
    column.classList.toggle("invalid-drop", targetColumn === null && !column.classList.contains("dragging-column"));
  });
  statusText.textContent = targetColumn === null ? "Drag over a column with open space." : `Release to drop in column ${targetColumn + 1}.`;
}

function clearHighlights() {
  document.querySelectorAll(".drop-target,.hint-source,.hint-target,.invalid-drop").forEach((column) => {
    column.classList.remove("drop-target", "hint-source", "hint-target", "invalid-drop");
  });
}

function columnLabel(columnIndex) {
  const column = state.board[columnIndex];
  const capacity = currentCapacities()[columnIndex] || columnCapacity;
  if (column.length === 0) return `Column ${columnIndex + 1}, empty, holds ${capacity}`;
  const topColor = column[column.length - 1];
  return `Column ${columnIndex + 1}, ${column.length} of ${capacity} tokens, top token is ${colorNames[topColor]}`;
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
  if (!canMoveToColumn(fromColumn, toColumn)) {
    state.selectedColumn = null;
    statusText.textContent = "That column is full. The token returned to its original column.";
    renderBoard();
    return;
  }
  const movedColor = state.board[fromColumn][state.board[fromColumn].length - 1];
  markInProgress();
  state.history.push({ board: cloneColumns(state.board), moves: state.moves, moveLog: [...state.moveLog], hintPath: state.hintPath ? [...state.hintPath] : [] });
  applyMove(state.board, fromColumn, toColumn);
  if (state.hintPath?.length && state.hintPath[0].from === fromColumn && state.hintPath[0].to === toColumn) {
    state.hintPath.shift();
  } else {
    state.hintPath = [];
  }
  state.moveLog.push({ from: fromColumn, to: toColumn, color: movedColor });
  state.selectedColumn = null;
  state.moves += 1;
  state.stats.totalMoves += 1;
  state.lastMove = { from: fromColumn, to: toColumn };
  statusText.textContent = "Good. Keep moving only the top tokens until the four shown positions match.";
  playTone(392, 0.06);
  haptic([10]);
  saveCurrentBoard();
  evaluateAchievements();
  renderBoard();
  window.setTimeout(() => {
    if (state.lastMove?.from === fromColumn && state.lastMove?.to === toColumn) {
      state.lastMove = null;
      renderBoard();
    }
  }, 420);
  checkSolved();
}

function coinRewardFromAchievements(achievements) {
  return achievements.reduce((total, achievement) => total + achievement.coins, 0);
}

function renderWinRewards({ stars, moves, isRecord, defaultRecord, coinReward }) {
  winStars.innerHTML = "";
  for (let index = 0; index < 3; index += 1) {
    const star = document.createElement("span");
    star.textContent = "*";
    star.className = index < stars ? "earned" : "";
    winStars.append(star);
  }
  winMoves.textContent = String(moves);
  winCoins.textContent = coinReward > 0 ? `+${coinReward}` : "+0";
  winRecord.textContent = moves < defaultRecord ? "Gold" : (isRecord ? "Best" : "Set");
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
  const levels = levelsForPack();
  let level = levels[state.levelIndex];
  const pack = activePack();
  const index = state.levelIndex;
  minimumMoves.textContent = "Minimum checking";
  window.setTimeout(() => {
    let answer = findShortestSolution(level.board, level.target, 160000, level.capacities);
    const floor = minimumAcceptableMoves(index, pack);
    if (!isTutorialLevel(index, pack.id) && state.moves === 0 && answer && answer.length < floor) {
      for (let salt = 1; salt <= 10; salt += 1) {
        const replacement = createLevel(index, pack, salt + 1000);
        const replacementAnswer = findShortestSolution(replacement.board, replacement.target, 160000, replacement.capacities);
        if (!replacementAnswer || replacementAnswer.length >= floor) {
          level = replacement;
          answer = replacementAnswer;
          levels[index] = replacement;
          clearCurrentSave(index);
          state.board = cloneColumns(replacement.board);
          state.target = cloneColumns(replacement.target);
          state.history = [];
          state.moveLog = [];
          state.hintPath = [...replacement.solution];
          state.selectedColumn = null;
          state.lastMove = null;
          renderTargets();
          renderBoard();
          statusText.textContent = "This level was sharpened into a tougher scramble.";
          break;
        }
      }
    }
    level.minimumMoves = answer ? answer.length : level.solution.length;
    if (answer) {
      level.defaultRecord = answer.length + 3 + (index % 3);
      level.difficulty = isTutorialLevel(index, pack.id) ? "Tutorial" : difficultyFor(answer.length);
      updateStats();
      renderLevelButtons();
    }
    minimumMoves.textContent = `Minimum ${level.minimumMoves}`;
  }, 20);
}

function minimumAcceptableMoves(index, pack) {
  if (pack.id === "starter") return index < tutorialLevelCount ? 0 : Math.min(7 + Math.floor((index - tutorialLevelCount) * 0.45), 18);
  if (pack.id === "classic") return index < tutorialLevelCount ? 0 : Math.min(9 + Math.floor((index - tutorialLevelCount) * 0.65), 30);
  if (pack.id === "challenge") return Math.min(18 + Math.floor(index * 0.45), 34);
  if (pack.id === "expert") return Math.min(26 + Math.floor(index * 0.55), 48);
  if (pack.id === "hardcore") return Math.min(42 + Math.floor(index * 0.6), 62);
  if (pack.id === "daily") return 22;
  return 10;
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
  const dailyReward = state.packId === "daily" && previous === undefined ? updateDailyStreak() : null;
  state.stats.totalWins += 1;
  if (isRecord) {
    state.records[key] = state.moves;
  }
  state.stars[key] = Math.max(Number(state.stars[key] || 0), earnedStars);
  if (state.levelIndex < levelsForPack().length - 1 && unlockedIndex() <= state.levelIndex) {
    state.unlocks[state.packId] = state.levelIndex + 1;
    saveUnlocks();
  }
  delete state.progress[key];
  delete state.saves[key];
  const earnedAchievements = evaluateAchievements();
  const coinReward = coinRewardFromAchievements(earnedAchievements) + (dailyReward?.reward || 0);
  saveProfileState();
  renderLevelButtons();
  renderAchievements();
  renderShop();
  updateStats();
  haptic([22, 35, 38]);
  playWinJingle();
  document.querySelector(".wood-board")?.classList.add("celebrate");
  window.setTimeout(() => document.querySelector(".wood-board")?.classList.remove("celebrate"), 950);
  const defaultRecord = level.defaultRecord;
  renderWinRewards({ stars: earnedStars, moves: state.moves, isRecord, defaultRecord, coinReward });
  const recordWord = state.moves < defaultRecord ? "Gold record beaten." : `Default record: ${defaultRecord} moves.`;
  const paceWord = state.moves < defaultRecord ? " Great route." : "";
  const unlockWord = state.levelIndex < levelsForPack().length - 1 ? ` Level ${state.levelIndex + 2} unlocked.` : " Pack complete.";
  const tutorialWord = isTutorialLevel() ? ` Tutorial ${state.levelIndex + 1} complete.` : "";
  const dailyWord = dailyReward ? ` Daily streak: ${dailyReward.streak}. Bonus: ${dailyReward.reward} coins.` : "";
  const achievementWord = earnedAchievements.length ? ` Achievements: ${earnedAchievements.map((achievement) => achievement.name).join(", ")}.` : "";
  const hardcoreWord = hardcoreUnlocked() ? " Hardcore mode is open." : "";
  winSummary.textContent = `${earnedStars} stars. ${state.moves} moves.${paceWord}${isRecord ? " New personal best." : ""} ${recordWord}${tutorialWord}${dailyWord}${unlockWord}${hardcoreWord}${achievementWord}`;
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
  const canRestoreSave = saved?.board && boardFitsCapacities(saved.board, level.capacities);
  state.board = canRestoreSave ? cloneColumns(saved.board) : cloneColumns(level.board);
  state.target = cloneColumns(level.target);
  state.history = canRestoreSave ? saved?.history || [] : [];
  state.moveLog = canRestoreSave ? saved?.moveLog || [] : [];
  state.hintPath = canRestoreSave ? [] : [...level.solution];
  state.selectedColumn = null;
  state.lastMove = null;
  state.moves = canRestoreSave ? saved?.moves || 0 : 0;
  state.completed = false;
  state.dragFromColumn = null;
  winDialog.classList.add("hidden");
  statusText.textContent = canRestoreSave ? "Your exact board was restored. Continue from where you left off." : (isTutorialLevel() ? tutorialStatus() : "Lift the top token from a column, then drop it onto another column with room.");
  renderLevelButtons();
  renderTargets();
  renderBoard();
  updateMinimumDisplay();
}

function boardFitsCapacities(board, capacities = Array(columnCount).fill(columnCapacity)) {
  return board.every((column, index) => column.length <= capacities[index]);
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
  state.hintPath = previous.hintPath || [];
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
  state.hintPath = [...replacement.solution];
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

function unlockNextForSkip() {
  const levels = levelsForPack();
  if (levels.length <= 1 || state.levelIndex >= levels.length - 1) {
    statusText.textContent = "There is no next level to skip to in this pack.";
    return false;
  }
  const key = levelKey();
  state.progress[key] = "skipped";
  delete state.saves[key];
  if (unlockedIndex() <= state.levelIndex) {
    state.unlocks[state.packId] = state.levelIndex + 1;
  }
  state.selectedColumn = null;
  state.completed = false;
  state.history = [];
  state.moveLog = [];
  saveProfileState();
  renderLevelButtons();
  return true;
}

function finishSkip(method) {
  if (!unlockNextForSkip()) return;
  const nextIndex = state.levelIndex + 1;
  loadLevel(nextIndex);
  statusText.textContent = method === "ad" ? "Ad watched. Level skipped, but it does not count as completed." : `${skipCoinCost} coins spent. Level skipped, but it does not count as completed.`;
}

async function skipWithAd() {
  if (state.completed) return;
  if (!rewardedAdsAvailable()) {
    statusText.textContent = "Ads are not available here yet. You can skip with 50 coins.";
    updateSkipControls();
    return;
  }
  statusText.textContent = "Opening rewarded ad...";
  const watched = await showRewardedAd();
  if (!watched) {
    statusText.textContent = "Ad was not completed. The level was not skipped.";
    updateSkipControls();
    return;
  }
  finishSkip("ad");
}

function skipWithCoins() {
  if (state.completed) return;
  if (state.coins < skipCoinCost) {
    statusText.textContent = `You need ${skipCoinCost} coins to skip this level.`;
    updateSkipControls();
    return;
  }
  state.coins -= skipCoinCost;
  saveProfileState();
  renderAchievements();
  renderShop();
  finishSkip("coins");
}

function clearRecords() {
  state.records = {};
  state.progress = {};
  state.saves = {};
  state.stars = {};
  state.unlocks = { ...defaultProfileState.unlocks };
  state.coins = 0;
  state.achievements = {};
  state.unlockedCosmetics = { ...defaultProfileState.unlockedCosmetics };
  state.cosmetics = { ...defaultProfileState.cosmetics };
  state.stats = { ...defaultProfileState.stats };
  saveProfileState();
  renderLevelButtons();
  renderAchievements();
  renderShop();
  applyPrefs();
  loadLevel(0);
  statusText.textContent = `${state.profileName}'s records, coins, achievements, and saved boards were cleared.`;
}

function showHint() {
  if (state.completed) return;
  clearHighlights();
  const answer = state.hintPath?.length ? state.hintPath : findShortestSolution(state.board, state.target, 220000, currentCapacities());
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
  const capacities = currentCapacities();
  return legalMoves(state.board, capacities).sort((a, b) => {
    const boardA = cloneColumns(state.board);
    const boardB = cloneColumns(state.board);
    applyMove(boardA, a.from, a.to);
    applyMove(boardB, b.from, b.to);
    return countMatches(boardB, state.target) - countMatches(boardA, state.target);
  }).find((move) => {
    const board = cloneColumns(state.board);
    applyMove(board, move.from, move.to);
    return countMatches(board, state.target) >= before;
  }) || legalMoves(state.board, capacities)[0];
}

function boardKey(board) {
  return board.map((column) => column.join("")).join("|");
}

function findShortestSolution(startBoard, target, maxStates = 120000, capacities = Array(columnCount).fill(columnCapacity)) {
  if (isSolved(startBoard, target)) return [];
  const startKey = boardKey(startBoard);
  const seen = new Set([startKey]);
  const queue = [{ board: cloneColumns(startBoard), path: [] }];
  let cursor = 0;
  while (cursor < queue.length && seen.size < maxStates) {
    const current = queue[cursor];
    cursor += 1;
    for (const move of legalMoves(current.board, capacities)) {
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

function playWinJingle() {
  playTone(523, 0.07);
  window.setTimeout(() => playTone(659, 0.08), 75);
  window.setTimeout(() => playTone(784, 0.1), 155);
  window.setTimeout(() => playTone(1047, 0.13), 250);
}

function haptic(pattern) {
  try {
    if (navigator.vibrate && !state.prefs.muted) navigator.vibrate(pattern);
  } catch {
    // Vibration is optional and not available on every device.
  }
}

function applyPrefs() {
  document.body.dataset.theme = state.prefs.theme;
  document.body.dataset.tokenStyle = state.cosmetics.tokenStyle;
  document.body.dataset.boardStyle = state.cosmetics.boardStyle;
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

function setPack(packId, fromProfileSwitch = false) {
  if (!packAvailable(packId)) {
    state.packId = "classic";
    packSelect.value = state.packId;
    statusText.textContent = "Hardcore unlocks after every Classic, Starter, Challenge, and Expert level is completed.";
    return;
  }
  state.packId = packDefs.some((pack) => pack.id === packId) ? packId : "classic";
  saveProfileState();
  packSelect.value = state.packId;
  loadLevel(Math.min(unlockedIndex(), levelsForPack().length - 1));
  if (!fromProfileSwitch && state.packId === "hardcore") statusText.textContent = "Hardcore mode: tougher scrambles, same top-token rules.";
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopGameplaySession();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installText.textContent = "This device can add Token Columns as a home-screen app shortcut.";
});

profileSelect.addEventListener("change", () => switchProfile(profileSelect.value));
newProfileBtn.addEventListener("click", createProfile);
exportProfileBtn.addEventListener("click", exportProfile);
importProfileBtn.addEventListener("click", () => importProfileInput.click());
importProfileInput.addEventListener("change", () => {
  const file = importProfileInput.files?.[0];
  if (file) importProfileFile(file);
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
skipAdBtn.addEventListener("click", skipWithAd);
skipCoinsBtn.addEventListener("click", skipWithCoins);
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

async function startApp() {
  if (!packDefs.some((pack) => pack.id === state.packId)) state.packId = "classic";
  if (!packAvailable(state.packId)) state.packId = "classic";
  packSelect.value = state.packId;
  applyPrefs();
  await initPoki();
  pokiCall("gameLoadingStart");
  hydrateUnlocksFromRecords();
  renderProfiles();
  renderAchievements();
  renderShop();
  loadLevel(0);
  evaluateAchievements();
  updateSkipControls();
  pokiCall("gameLoadingFinished");
  if (localStorage.getItem(tutorialKey) !== "true") window.setTimeout(showTutorial, 350);
}

startApp();
