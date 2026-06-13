import "./styles.css";

const STORAGE_KEY = "sudoku-game-state-v1";
const SIZE = 9;
const BOX = 3;
const CELL_COUNT = SIZE * SIZE;

const LEVELS = {
  easy: { label: "Easy", clues: 46, accent: "green" },
  medium: { label: "Medium", clues: 38, accent: "gold" },
  hard: { label: "Hard", clues: 32, accent: "orange" },
  expert: { label: "Expert", clues: 28, accent: "red" }
};

const LEVEL_ORDER = ["easy", "medium", "hard", "expert"];
const DAILY_LEVELS = ["medium", "hard", "easy", "expert"];
const PEERS = Array.from({ length: CELL_COUNT }, (_, index) => createPeers(index));

const THEME_OPTIONS = {
  warm: "Warm",
  charcoal: "Charcoal",
  ocean: "Ocean",
  forest: "Forest",
  graphite: "Graphite",
  berry: "Berry"
};

const MODE_OPTIONS = {
  light: "Light",
  dark: "Dark"
};

const FONT_OPTIONS = {
  system: "System",
  lexend: "Lexend",
  nunito: "Nunito Sans",
  robotoMono: "Roboto Mono",
  serif: "Serif",
  mono: "Mono",
  rounded: "Rounded"
};

const FONT_FACES = {
  lexend: {
    family: "Lexend",
    files: [
      { weight: "400 900", src: "/fonts/lexend-latin.woff2", format: "woff2" }
    ]
  },
  nunito: {
    family: "Nunito Sans",
    files: [
      { weight: "400 900", src: "/fonts/nunito-sans-latin.woff2", format: "woff2" }
    ]
  },
  robotoMono: {
    family: "Roboto Mono",
    files: [
      { weight: "400 700", src: "/fonts/roboto-mono-latin.woff2", format: "woff2" }
    ]
  }
};

const ICONS = {
  grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4zM4 9h16M4 15h16M9 4v16M15 4v16"/></svg>',
  calendar:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v4M17 3v4M4 8h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  note: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h9l3 3v13H6zM14 4v4h4M8 12h8M8 16h6"/></svg>',
  undo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7H4v5M5 12a8 8 0 1 0 2-5"/></svg>',
  erase: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16 8-8 6 6-6 6H7zM9 20h11M13 7l4-4 4 4-4 4"/></svg>',
  hint: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 4H9c0-2 0-3-1-4z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  settings:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3-.2-.1a1.7 1.7 0 0 0-2 .1 1.7 1.7 0 0 0-.8 1.7V22h-3.6v-.3a1.7 1.7 0 0 0-.8-1.7 1.7 1.7 0 0 0-2-.1l-.2.1-2-3 .1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-3 .2.1a1.7 1.7 0 0 0 2-.1 1.7 1.7 0 0 0 .8-1.7V2h3.6v.3a1.7 1.7 0 0 0 .8 1.7 1.7 1.7 0 0 0 2 .1l.2-.1 2 3-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  trophy:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v4a4 4 0 0 1-8 0zM8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 12v5M8 20h8M10 17h4"/></svg>'
};

let store = loadStore();
let refs = {};
let loadedFonts = new Set();
let enginePromise = null;
let generationToken = 0;
let isGenerating = false;
let replacingKey = null;

applyThemeSettings();
mountLayout();
bindEvents();
render();
prepareInitialGame();
loadPwaRegistration();
warmEngineChunk();

setInterval(renderClock, 500);

function mountLayout() {
  document.querySelector("#app").innerHTML = `
    <main class="app-shell">
      <header class="app-header">
        <div>
          <p class="eyebrow">Vanilla Sudoku</p>
          <h1>Sudoku</h1>
        </div>
        <div class="header-status">
          <span id="networkStatus" class="status-pill"></span>
          <span id="saveStatus" class="status-pill status-pill-muted">Saved</span>
        </div>
      </header>

      <section class="control-band" aria-label="Game controls">
        <div class="segmented" id="modeTabs">
          <button type="button" data-mode="classic">${ICONS.grid}<span>Classic</span></button>
          <button type="button" data-mode="daily">${ICONS.calendar}<span>Daily</span></button>
        </div>
        <div class="difficulty-row" id="difficultyRow"></div>
      </section>

      <section class="play-area">
        <div class="board-panel">
          <div class="board-meta">
            <div>
              <p id="gameLabel" class="meta-label"></p>
              <h2 id="gameTitle"></h2>
            </div>
            <div class="timer" id="timer">00:00</div>
          </div>

          <div class="board-shell">
            <div id="board" class="sudoku-board" role="grid" aria-label="Sudoku board"></div>
            <div id="pauseOverlay" class="pause-overlay" hidden>
              ${ICONS.pause}
              <span>Paused</span>
            </div>
          </div>

          <div id="message" class="message" role="status"></div>
        </div>

        <aside class="side-panel" aria-label="Game tools">
          <div class="quick-stats">
            <div>
              <span>Mistakes</span>
              <strong id="mistakeCount">0</strong>
            </div>
            <div>
              <span>Hints</span>
              <strong id="hintCount">0</strong>
            </div>
            <div>
              <span>Clues</span>
              <strong id="clueCount">0</strong>
            </div>
          </div>

          <div id="keypad" class="keypad" aria-label="Number pad"></div>

          <div class="tool-grid">
            <button type="button" data-action="new">${ICONS.plus}<span id="newLabel">New</span></button>
            <button type="button" data-action="notes">${ICONS.note}<span>Notes</span></button>
            <button type="button" data-action="undo">${ICONS.undo}<span>Undo</span></button>
            <button type="button" data-action="erase">${ICONS.erase}<span>Erase</span></button>
            <button type="button" data-action="hint">${ICONS.hint}<span>Hint</span></button>
            <button type="button" data-action="pause">${ICONS.pause}<span id="pauseLabel">Pause</span></button>
          </div>

          <div class="settings-panel" id="settingsPanel">
            <div class="panel-title">${ICONS.settings}<span>Settings</span></div>
            <div class="settings-controls">
              <label class="toggle-row">
                <span>Line selection</span>
                <input id="highlightLines" type="checkbox" data-setting="highlightLines" />
              </label>
              <label class="toggle-row">
                <span>Number selection</span>
                <input id="highlightNumbers" type="checkbox" data-setting="highlightNumbers" />
              </label>
              <label class="setting-row">
                <span><i class="scheme-swatch" id="themeSwatch"></i>Color</span>
                <select id="themeSelect" data-setting="theme">
                  ${optionMarkup(THEME_OPTIONS)}
                </select>
              </label>
              <label class="setting-row">
                <span>Mode</span>
                <select id="modeSelect" data-setting="mode">
                  ${optionMarkup(MODE_OPTIONS)}
                </select>
              </label>
              <label class="setting-row">
                <span>Font</span>
                <select id="fontSelect" data-setting="font">
                  ${optionMarkup(FONT_OPTIONS)}
                </select>
              </label>
              <label class="toggle-row">
                <span>Highlight wrong entries</span>
                <input id="showWrongEntries" type="checkbox" data-setting="showWrongEntries" />
              </label>
              <label class="toggle-row">
                <span>Show exhausted numbers</span>
                <input id="showExhaustedNumbers" type="checkbox" data-setting="showExhaustedNumbers" />
              </label>
            </div>
          </div>

          <div class="stats-panel">
            <div class="panel-title">${ICONS.trophy}<span>Stats</span></div>
            <div id="statsContent" class="stats-content"></div>
          </div>
        </aside>
      </section>
    </main>
  `;

  refs = {
    board: document.querySelector("#board"),
    keypad: document.querySelector("#keypad"),
    modeTabs: document.querySelector("#modeTabs"),
    difficultyRow: document.querySelector("#difficultyRow"),
    networkStatus: document.querySelector("#networkStatus"),
    saveStatus: document.querySelector("#saveStatus"),
    timer: document.querySelector("#timer"),
    gameLabel: document.querySelector("#gameLabel"),
    gameTitle: document.querySelector("#gameTitle"),
    pauseOverlay: document.querySelector("#pauseOverlay"),
    message: document.querySelector("#message"),
    mistakeCount: document.querySelector("#mistakeCount"),
    hintCount: document.querySelector("#hintCount"),
    clueCount: document.querySelector("#clueCount"),
    newLabel: document.querySelector("#newLabel"),
    pauseLabel: document.querySelector("#pauseLabel"),
    settingsPanel: document.querySelector("#settingsPanel"),
    highlightLines: document.querySelector("#highlightLines"),
    highlightNumbers: document.querySelector("#highlightNumbers"),
    themeSelect: document.querySelector("#themeSelect"),
    themeSwatch: document.querySelector("#themeSwatch"),
    modeSelect: document.querySelector("#modeSelect"),
    fontSelect: document.querySelector("#fontSelect"),
    showWrongEntries: document.querySelector("#showWrongEntries"),
    showExhaustedNumbers: document.querySelector("#showExhaustedNumbers"),
    statsContent: document.querySelector("#statsContent")
  };

  mountDifficultyControls();
  mountBoardCells();
  mountKeypadButtons();
}

function mountDifficultyControls() {
  refs.difficultyRow.textContent = "";
  refs.difficultyButtons = {};

  for (const level of LEVEL_ORDER) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.level = level;
    button.innerHTML = `<span class="difficulty-dot ${LEVELS[level].accent}"></span><span>${LEVELS[level].label}</span>`;
    refs.difficultyRow.append(button);
    refs.difficultyButtons[level] = button;
  }
}

function mountBoardCells() {
  refs.board.textContent = "";
  refs.cells = [];
  refs.cellValues = [];
  refs.cellNotes = [];

  for (let index = 0; index < CELL_COUNT; index += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cell";
    button.dataset.cell = String(index);
    button.setAttribute("role", "gridcell");

    const value = document.createElement("span");
    value.className = "cell-value";

    const notes = document.createElement("span");
    notes.className = "notes-grid";
    notes.setAttribute("aria-hidden", "true");
    for (let number = 1; number <= SIZE; number += 1) {
      notes.append(document.createElement("span"));
    }

    button.append(value, notes);
    refs.board.append(button);
    refs.cells.push(button);
    refs.cellValues.push(value);
    refs.cellNotes.push([...notes.children]);
  }
}

function mountKeypadButtons() {
  refs.keypad.textContent = "";
  refs.keyButtons = [];
  refs.keyRemaining = [];

  for (let number = 1; number <= SIZE; number += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.number = String(number);

    const value = document.createElement("span");
    value.textContent = String(number);
    const remaining = document.createElement("small");

    button.append(value, remaining);
    refs.keypad.append(button);
    refs.keyButtons[number] = button;
    refs.keyRemaining[number] = remaining;
  }
}

function bindEvents() {
  refs.modeTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mode]");
    if (!button) return;

    if (button.dataset.mode === "daily") {
      activateDaily();
    } else {
      const current = getActiveGame();
      activateClassic(current && current.mode === "classic" ? current.level : "easy");
    }
  });

  refs.difficultyRow.addEventListener("click", (event) => {
    const button = event.target.closest("[data-level]");
    if (!button) return;
    activateClassic(button.dataset.level);
  });

  refs.board.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cell]");
    if (!button) return;
    selectCell(Number(button.dataset.cell));
  });

  refs.keypad.addEventListener("click", (event) => {
    const button = event.target.closest("[data-number]");
    if (!button) return;
    setNumber(Number(button.dataset.number));
  });

  refs.settingsPanel.addEventListener("change", handleSettingsChange);

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    if (action === "new") newCurrentGame();
    if (action === "notes") toggleNotes();
    if (action === "undo") undoMove();
    if (action === "erase") eraseCell();
    if (action === "hint") hintCell();
    if (action === "pause") togglePause();
  });

  window.addEventListener("keydown", handleKeyboard);
  window.addEventListener("online", renderNetworkStatus);
  window.addEventListener("offline", renderNetworkStatus);
  window.addEventListener("beforeunload", saveStore);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      saveStore();
      return;
    }

    const game = getActiveGame();
    if (game && game.status === "playing" && !game.paused) {
      game.startedAt = Date.now();
    }
    renderClock();
  });
}

function render() {
  const game = isGenerating && replacingKey === store.activeKey ? null : getActiveGame();

  renderNetworkStatus();
  renderModeControls(game);
  renderSettings();

  if (!game) {
    renderLoadingState();
    return;
  }

  renderBoard(game);
  renderKeypad(game);
  renderSummary(game);
  renderStats(game);
  renderClock();
}

function renderModeControls(game) {
  const activeMode = game ? game.mode : store.activeKey && store.activeKey.startsWith("daily:") ? "daily" : "classic";
  const activeLevel = game ? game.level : store.activeKey && store.activeKey.startsWith("classic:") ? store.activeKey.split(":")[1] : "";

  refs.modeTabs.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === activeMode);
  });

  for (const level of LEVEL_ORDER) {
    refs.difficultyButtons[level].classList.toggle(
      "is-active",
      activeMode === "classic" && activeLevel === level
    );
  }
}

function renderBoard(game) {
  const selected = game.selected;
  const selectedValue = selected == null ? 0 : getDisplayCellValue(game, selected);
  const paused = game.paused && game.status === "playing";

  refs.board.classList.toggle("is-paused", paused);
  refs.board.classList.remove("is-loading");
  refs.pauseOverlay.hidden = !paused;

  for (let index = 0; index < CELL_COUNT; index += 1) {
    const value = getDisplayCellValue(game, index);
    const row = Math.floor(index / SIZE);
    const col = index % SIZE;
    const isGiven = game.puzzle[index] !== 0;
    const isSelected = selected === index;
    const isPeer = store.settings.highlightLines && selected != null && isRelated(index, selected);
    const isSame = store.settings.highlightNumbers && selectedValue !== 0 && value === selectedValue;
    const isWrong =
      store.settings.showWrongEntries &&
      game.entries[index] !== 0 &&
      game.entries[index] !== game.solution[index];
    const hasConflict =
      store.settings.showWrongEntries && value !== 0 && hasDuplicateConflict(game, index);
    const cell = refs.cells[index];

    cell.className = [
      "cell",
      value ? "has-value" : "",
      isGiven ? "is-given" : "",
      isSelected ? "is-selected" : "",
      isPeer ? "is-peer" : "",
      isSame ? "is-same" : "",
      isWrong ? "is-wrong" : "",
      hasConflict ? "has-conflict" : ""
    ]
      .filter(Boolean)
      .join(" ");
    cell.disabled = false;
    cell.tabIndex = paused ? -1 : 0;
    cell.setAttribute("aria-label", `Row ${row + 1}, column ${col + 1}${value ? `, ${value}` : ""}`);
    refs.cellValues[index].textContent = value ? String(value) : "";

    const noteMask = game.notes[index];
    for (let number = 1; number <= SIZE; number += 1) {
      refs.cellNotes[index][number - 1].textContent = !value && noteMask & (1 << number) ? String(number) : "";
    }
  }
}

function renderKeypad(game) {
  const counts = Array(SIZE + 1).fill(0);
  for (let index = 0; index < CELL_COUNT; index += 1) {
    const value = getDisplayCellValue(game, index);
    if (value) counts[value] += 1;
  }

  for (let number = 1; number <= SIZE; number += 1) {
    const done = store.settings.showExhaustedNumbers && counts[number] >= SIZE;
    const remaining = Math.max(0, SIZE - counts[number]);
    const button = refs.keyButtons[number];
    button.className = done ? "is-done" : "";
    button.disabled = game.paused || game.status === "complete";
    refs.keyRemaining[number].hidden = !store.settings.showExhaustedNumbers;
    refs.keyRemaining[number].textContent = String(remaining);
  }
}

function renderLoadingState() {
  refs.board.classList.remove("is-paused");
  refs.board.classList.toggle("is-loading", isGenerating);
  refs.pauseOverlay.hidden = true;
  refs.gameLabel.textContent = "Generating puzzle";
  refs.gameTitle.textContent = "Preparing Sudoku";
  refs.timer.textContent = "00:00";
  refs.message.textContent = isGenerating ? "Building a unique puzzle." : "Loading puzzle.";
  refs.mistakeCount.textContent = "0";
  refs.hintCount.textContent = "0";
  refs.clueCount.textContent = "0";
  refs.newLabel.textContent = "New";
  refs.statsContent.innerHTML = "";

  for (let index = 0; index < CELL_COUNT; index += 1) {
    refs.cells[index].className = "cell is-loading";
    refs.cells[index].disabled = true;
    refs.cells[index].setAttribute("aria-label", "Loading cell");
    refs.cellValues[index].textContent = "";
    for (const note of refs.cellNotes[index]) note.textContent = "";
  }

  for (let number = 1; number <= SIZE; number += 1) {
    refs.keyButtons[number].className = "";
    refs.keyButtons[number].disabled = true;
    refs.keyRemaining[number].hidden = true;
  }
}

function renderSummary(game) {
  const level = LEVELS[game.level];
  refs.gameLabel.textContent =
    game.mode === "daily" ? `${formatDisplayDate(game.dateKey)} daily` : "Classic puzzle";
  refs.gameTitle.textContent = `${level.label} Sudoku`;
  refs.mistakeCount.textContent = String(game.mistakes);
  refs.hintCount.textContent = String(game.hints);
  refs.clueCount.textContent = String(game.clues);
  refs.newLabel.textContent = game.mode === "daily" ? "Restart" : "New";
  refs.pauseLabel.textContent = game.paused ? "Resume" : "Pause";

  const notesButton = document.querySelector('[data-action="notes"]');
  const undoButton = document.querySelector('[data-action="undo"]');
  const eraseButton = document.querySelector('[data-action="erase"]');
  const hintButton = document.querySelector('[data-action="hint"]');
  const pauseButton = document.querySelector('[data-action="pause"]');

  notesButton.classList.toggle("is-active", store.settings.noteMode);
  notesButton.disabled = game.status === "complete" || game.paused;
  undoButton.disabled = game.undo.length === 0 || game.paused || game.status === "complete";
  eraseButton.disabled = !canEditSelected(game) || game.paused || game.status === "complete";
  hintButton.disabled = game.paused || game.status === "complete";
  pauseButton.innerHTML = `${game.paused ? ICONS.play : ICONS.pause}<span id="pauseLabel">${
    game.paused ? "Resume" : "Pause"
  }</span>`;
  refs.pauseLabel = document.querySelector("#pauseLabel");

  if (game.status === "complete") {
    refs.message.textContent = `Complete in ${formatTime(game.elapsed)}.`;
  } else if (game.paused) {
    refs.message.textContent = "Game paused.";
  } else if (store.settings.noteMode) {
    refs.message.textContent = "Notes mode.";
  } else if (game.selected != null) {
    const row = Math.floor(game.selected / SIZE) + 1;
    const col = (game.selected % SIZE) + 1;
    refs.message.textContent = `Row ${row}, column ${col}.`;
  } else {
    refs.message.textContent = "Select a cell.";
  }
}

function renderStats(game) {
  const levelStats = store.stats.levels[game.level];
  const daily = store.stats.daily;
  const avg =
    levelStats.completed > 0 ? formatTime(Math.round(levelStats.totalTime / levelStats.completed)) : "--";
  const best = levelStats.bestTime ? formatTime(levelStats.bestTime) : "--";
  const dailyBest = daily.bestTime ? formatTime(daily.bestTime) : "--";

  refs.statsContent.innerHTML = `
    <dl>
      <div><dt>${LEVELS[game.level].label} wins</dt><dd>${levelStats.completed}/${levelStats.started}</dd></div>
      <div><dt>Best time</dt><dd>${best}</dd></div>
      <div><dt>Avg win</dt><dd>${avg}</dd></div>
      <div><dt>Daily streak</dt><dd>${daily.streak}</dd></div>
      <div><dt>Daily best</dt><dd>${dailyBest}</dd></div>
    </dl>
  `;
}

function renderSettings() {
  refs.highlightLines.checked = store.settings.highlightLines;
  refs.highlightNumbers.checked = store.settings.highlightNumbers;
  refs.themeSelect.value = store.settings.theme;
  refs.themeSwatch.dataset.theme = store.settings.theme;
  refs.modeSelect.value = store.settings.mode;
  refs.fontSelect.value = store.settings.font;
  refs.showWrongEntries.checked = store.settings.showWrongEntries;
  refs.showExhaustedNumbers.checked = store.settings.showExhaustedNumbers;
}

function handleSettingsChange(event) {
  const input = event.target.closest("[data-setting]");
  if (!input) return;

  const key = input.dataset.setting;
  if (
    key === "highlightLines" ||
    key === "highlightNumbers" ||
    key === "showWrongEntries" ||
    key === "showExhaustedNumbers"
  ) {
    store.settings[key] = input.checked;
  }

  if (key === "theme" && THEME_OPTIONS[input.value]) {
    store.settings.theme = input.value;
    applyThemeSettings();
  }

  if (key === "mode" && MODE_OPTIONS[input.value]) {
    store.settings.mode = input.value;
    applyThemeSettings();
  }

  if (key === "font" && FONT_OPTIONS[input.value]) {
    store.settings.font = input.value;
    applyThemeSettings();
  }

  saveStore();
  render();
}

function renderClock() {
  const game = getActiveGame();
  if (!game) return;
  refs.timer.textContent = formatTime(getElapsed(game));
}

function renderNetworkStatus() {
  const online = navigator.onLine;
  refs.networkStatus.textContent = online ? "Online" : "Offline";
  refs.networkStatus.classList.toggle("is-offline", !online);
}

function activateClassic(level) {
  if (store.activeKey !== classicKey(level)) pauseActiveGame();
  store.activeKey = classicKey(level);
  ensureActiveGame();
  saveStore();
  render();
}

function activateDaily() {
  if (store.activeKey !== dailyKey()) pauseActiveGame();
  store.activeKey = dailyKey();
  ensureActiveGame();
  saveStore();
  render();
}

async function prepareInitialGame() {
  await ensureActiveGame();
  saveStore();
  render();
}

async function ensureActiveGame() {
  if (!store.activeKey) store.activeKey = classicKey("easy");
  if (store.activeKey.startsWith("daily:") && store.activeKey !== dailyKey()) {
    store.activeKey = dailyKey();
  }

  if (!store.games[store.activeKey]) {
    await generateGameForKey(store.activeKey, true);
  }
}

async function newCurrentGame() {
  const game = getActiveGame();
  if (!game) return;

  await generateGameForKey(store.activeKey, true);
}

async function generateGameForKey(key, replace) {
  const token = ++generationToken;
  isGenerating = true;
  replacingKey = replace ? key : null;
  render();

  const game = key.startsWith("daily:")
    ? await buildDailyGame(key.split(":")[1] || localDateKey())
    : await buildClassicGame(key.split(":")[1] || "easy");

  if (token !== generationToken || store.activeKey !== key || (!replace && store.games[key])) {
    if (token === generationToken) {
      isGenerating = false;
      replacingKey = null;
      render();
    }
    return null;
  }

  store.games[key] = game;
  incrementStarted(game.level);
  if (game.mode === "daily") store.stats.daily.started += 1;
  isGenerating = false;
  replacingKey = null;
  saveStore();
  render();
  return game;
}

async function buildClassicGame(level) {
  return buildGame({
    mode: "classic",
    level,
    seed: `classic:${level}:${Date.now()}:${Math.floor(Math.random() * 1_000_000_000)}`,
    dateKey: null
  });
}

async function buildDailyGame(dateKeyValue) {
  const level = dailyLevel(dateKeyValue);
  return buildGame({
    mode: "daily",
    level,
    seed: `daily:${dateKeyValue}`,
    dateKey: dateKeyValue
  });
}

async function buildGame({ mode, level, seed, dateKey }) {
  const { generatePuzzle } = await loadEngine();
  const generated = generatePuzzle(LEVELS[level].clues, seed);
  return {
    id: `${mode}:${seed}`,
    mode,
    level,
    seed,
    dateKey,
    puzzle: generated.puzzle,
    solution: generated.solution,
    clues: generated.clues,
    entries: Array(CELL_COUNT).fill(0),
    notes: Array(CELL_COUNT).fill(0),
    selected: generated.puzzle.findIndex((value) => value === 0),
    mistakes: 0,
    hints: 0,
    undo: [],
    status: "playing",
    paused: false,
    elapsed: 0,
    startedAt: Date.now(),
    completedAt: null,
    recordedComplete: false
  };
}

function loadEngine() {
  enginePromise ||= import("./sudoku-engine.js");
  return enginePromise;
}

function warmEngineChunk() {
  const load = () => {
    if (!navigator.onLine) return;
    loadEngine().catch(() => {});
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(load, { timeout: 3000 });
  } else {
    window.setTimeout(load, 1500);
  }
}

function selectCell(index) {
  const game = getActiveGame();
  if (!game || game.paused) return;
  game.selected = index;
  saveStore();
  render();
}

function setNumber(number) {
  const game = getActiveGame();
  if (!canEditSelected(game)) return;

  const index = game.selected;
  pushUndo(game, index);

  if (store.settings.noteMode) {
    game.notes[index] ^= 1 << number;
  } else if (game.entries[index] !== number) {
    game.notes[index] = 0;
    if (number !== game.solution[index]) {
      game.mistakes += 1;
      game.entries[index] = number;
    } else {
      game.entries[index] = number;
    }
  }

  checkComplete(game);
  saveStore();
  render();
}

function eraseCell() {
  const game = getActiveGame();
  if (!canEditSelected(game)) return;

  const index = game.selected;
  if (game.entries[index] === 0 && game.notes[index] === 0) return;

  pushUndo(game, index);
  game.entries[index] = 0;
  game.notes[index] = 0;
  saveStore();
  render();
}

function hintCell() {
  const game = getActiveGame();
  if (!game || game.paused || game.status === "complete") return;

  let index = canEditSelected(game) ? game.selected : -1;
  if (index !== -1 && game.entries[index] === game.solution[index]) index = -1;
  if (index === -1) {
    index = game.puzzle.findIndex(
      (given, cellIndex) => given === 0 && game.entries[cellIndex] !== game.solution[cellIndex]
    );
  }
  if (index === -1) return;

  game.selected = index;
  pushUndo(game, index);
  game.entries[index] = game.solution[index];
  game.notes[index] = 0;
  game.hints += 1;
  checkComplete(game);
  saveStore();
  render();
}

function undoMove() {
  const game = getActiveGame();
  if (!game || game.paused || game.status === "complete" || game.undo.length === 0) return;

  const last = game.undo.pop();
  game.selected = last.index;
  game.entries[last.index] = last.entry;
  game.notes[last.index] = last.notes;
  game.mistakes = last.mistakes;
  saveStore();
  render();
}

function toggleNotes() {
  const game = getActiveGame();
  if (!game || game.paused || game.status === "complete") return;

  store.settings.noteMode = !store.settings.noteMode;
  saveStore();
  render();
}

function applyThemeSettings() {
  document.documentElement.dataset.theme = store.settings.theme;
  document.documentElement.dataset.mode = store.settings.mode;
  document.documentElement.dataset.font = store.settings.font;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", store.settings.mode === "dark" ? "#17191c" : "#f7efe3");
  ensureFontLoaded(store.settings.font);
}

function ensureFontLoaded(fontKey) {
  const config = FONT_FACES[fontKey];
  if (!config || loadedFonts.has(fontKey) || !("FontFace" in window)) return;

  Promise.all(
    config.files.map((file) => {
      const face = new FontFace(config.family, `url("${file.src}") format("${file.format}")`, {
        display: "swap",
        style: "normal",
        weight: file.weight
      });
      document.fonts.add(face);
      return face.load();
    })
  )
    .then(() => {
      loadedFonts.add(fontKey);
      document.documentElement.dataset.fontReady = fontKey;
    })
    .catch(() => {
      if (refs.saveStatus) refs.saveStatus.textContent = "Font offline";
    });
}

function pauseActiveGame() {
  const game = getActiveGame();
  if (!game || game.status !== "playing" || game.paused) return;

  game.elapsed = getElapsed(game);
  game.paused = true;
}

function togglePause() {
  const game = getActiveGame();
  if (!game || game.status === "complete") return;

  if (game.paused) {
    game.paused = false;
    game.startedAt = Date.now();
  } else {
    game.elapsed = getElapsed(game);
    game.paused = true;
  }

  saveStore();
  render();
}

function handleKeyboard(event) {
  const game = getActiveGame();
  if (!game) return;

  if (event.key >= "1" && event.key <= "9") {
    event.preventDefault();
    setNumber(Number(event.key));
    return;
  }

  if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
    event.preventDefault();
    eraseCell();
    return;
  }

  if (event.key.toLowerCase() === "n") {
    event.preventDefault();
    toggleNotes();
    return;
  }

  if (event.key.toLowerCase() === "h") {
    event.preventDefault();
    hintCell();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    undoMove();
    return;
  }

  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  moveSelection(event.key);
}

function moveSelection(key) {
  const game = getActiveGame();
  if (!game || game.paused) return;

  const selected = game.selected == null ? 0 : game.selected;
  const row = Math.floor(selected / SIZE);
  const col = selected % SIZE;
  let nextRow = row;
  let nextCol = col;

  if (key === "ArrowUp") nextRow = (row + SIZE - 1) % SIZE;
  if (key === "ArrowDown") nextRow = (row + 1) % SIZE;
  if (key === "ArrowLeft") nextCol = (col + SIZE - 1) % SIZE;
  if (key === "ArrowRight") nextCol = (col + 1) % SIZE;

  game.selected = nextRow * SIZE + nextCol;
  saveStore();
  render();
}

function canEditSelected(game) {
  return (
    game &&
    game.selected != null &&
    game.status === "playing" &&
    !game.paused &&
    game.puzzle[game.selected] === 0
  );
}

function pushUndo(game, index) {
  game.undo.push({
    index,
    entry: game.entries[index],
    notes: game.notes[index],
    mistakes: game.mistakes
  });
  if (game.undo.length > 200) game.undo.shift();
}

function checkComplete(game) {
  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (getCellValue(game, index) !== game.solution[index]) return;
  }

  game.status = "complete";
  game.elapsed = getElapsed(game);
  game.paused = false;
  game.completedAt = Date.now();
  recordComplete(game);
}

function recordComplete(game) {
  if (game.recordedComplete) return;

  const elapsed = game.elapsed;
  const levelStats = store.stats.levels[game.level];
  levelStats.completed += 1;
  levelStats.totalTime += elapsed;
  levelStats.bestTime = levelStats.bestTime ? Math.min(levelStats.bestTime, elapsed) : elapsed;

  if (game.mode === "daily") {
    const oldEntry = store.stats.daily.dates[game.dateKey];
    if (!oldEntry) {
      store.stats.daily.completed += 1;
      store.stats.daily.totalTime += elapsed;
    } else if (elapsed < oldEntry.elapsed) {
      store.stats.daily.totalTime += elapsed - oldEntry.elapsed;
    }

    store.stats.daily.dates[game.dateKey] = {
      elapsed: oldEntry ? Math.min(oldEntry.elapsed, elapsed) : elapsed,
      level: game.level
    };
    store.stats.daily.bestTime = store.stats.daily.bestTime
      ? Math.min(store.stats.daily.bestTime, elapsed)
      : elapsed;
    store.stats.daily.streak = calculateDailyStreak(store.stats.daily.dates);
  }

  game.recordedComplete = true;
}

function getActiveGame() {
  return store.games[store.activeKey] || null;
}

function getCellValue(game, index) {
  return game.puzzle[index] || game.entries[index] || 0;
}

function getDisplayCellValue(game, index) {
  return getCellValue(game, index);
}

function hasDuplicateConflict(game, index) {
  const value = getDisplayCellValue(game, index);
  if (!value) return false;

  for (const peer of getPeers(index)) {
    if (getDisplayCellValue(game, peer) === value) return true;
  }
  return false;
}

function isRelated(a, b) {
  if (a === b) return false;
  const ar = Math.floor(a / SIZE);
  const ac = a % SIZE;
  const br = Math.floor(b / SIZE);
  const bc = b % SIZE;
  return ar === br || ac === bc || (Math.floor(ar / BOX) === Math.floor(br / BOX) && Math.floor(ac / BOX) === Math.floor(bc / BOX));
}

function getPeers(index) {
  return PEERS[index];
}

function createPeers(index) {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  const peers = new Set();

  for (let i = 0; i < SIZE; i += 1) {
    peers.add(row * SIZE + i);
    peers.add(i * SIZE + col);
  }

  const boxRow = Math.floor(row / BOX) * BOX;
  const boxCol = Math.floor(col / BOX) * BOX;
  for (let r = boxRow; r < boxRow + BOX; r += 1) {
    for (let c = boxCol; c < boxCol + BOX; c += 1) {
      peers.add(r * SIZE + c);
    }
  }

  peers.delete(index);
  return Array.from(peers);
}

function loadStore() {
  const fallback = createDefaultStore();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return normalizeStore(parsed);
  } catch {
    return fallback;
  }
}

function normalizeStore(value) {
  const fallback = createDefaultStore();
  const normalized = {
    activeKey: typeof value.activeKey === "string" ? value.activeKey : fallback.activeKey,
    games: value.games && typeof value.games === "object" ? value.games : {},
    settings: normalizeSettings(value.settings),
    stats: normalizeStats(value.stats)
  };

  for (const game of Object.values(normalized.games)) {
    if (game.status === "playing" && !game.paused) game.startedAt = Date.now();
  }

  return normalized;
}

function createDefaultStore() {
  return {
    activeKey: classicKey("easy"),
    games: {},
    settings: createDefaultSettings(),
    stats: createDefaultStats()
  };
}

function createDefaultSettings() {
  return {
    noteMode: false,
    highlightLines: true,
    highlightNumbers: true,
    showWrongEntries: true,
    showExhaustedNumbers: true,
    theme: "warm",
    mode: "light",
    font: "system"
  };
}

function normalizeSettings(settings) {
  const normalized = {
    ...createDefaultSettings(),
    ...(settings && typeof settings === "object" ? settings : {})
  };

  normalized.noteMode = Boolean(normalized.noteMode);
  normalized.highlightLines = normalized.highlightLines !== false;
  normalized.highlightNumbers = normalized.highlightNumbers !== false;
  normalized.showWrongEntries = normalized.showWrongEntries !== false;
  normalized.showExhaustedNumbers = normalized.showExhaustedNumbers !== false;
  normalized.theme = THEME_OPTIONS[normalized.theme] ? normalized.theme : "warm";
  normalized.mode = MODE_OPTIONS[normalized.mode] ? normalized.mode : "light";
  normalized.font = FONT_OPTIONS[normalized.font] ? normalized.font : "system";
  return normalized;
}

function createDefaultStats() {
  return {
    levels: Object.fromEntries(
      LEVEL_ORDER.map((level) => [
        level,
        { started: 0, completed: 0, bestTime: 0, totalTime: 0 }
      ])
    ),
    daily: {
      started: 0,
      completed: 0,
      streak: 0,
      bestTime: 0,
      totalTime: 0,
      dates: {}
    }
  };
}

function normalizeStats(stats) {
  const fallback = createDefaultStats();
  if (!stats || typeof stats !== "object") return fallback;

  for (const level of LEVEL_ORDER) {
    fallback.levels[level] = {
      ...fallback.levels[level],
      ...(stats.levels && stats.levels[level] ? stats.levels[level] : {})
    };
  }

  fallback.daily = {
    ...fallback.daily,
    ...(stats.daily || {}),
    dates: stats.daily && stats.daily.dates ? stats.daily.dates : {}
  };
  fallback.daily.streak = calculateDailyStreak(fallback.daily.dates);
  return fallback;
}

function saveStore() {
  const game = getActiveGame();
  if (game && game.status === "playing" && !game.paused) {
    game.elapsed = getElapsed(game);
    game.startedAt = Date.now();
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  refs.saveStatus.textContent = "Saved";
}

function incrementStarted(level) {
  store.stats.levels[level].started += 1;
}

function classicKey(level) {
  return `classic:${level}`;
}

function optionMarkup(options) {
  return Object.entries(options)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join("");
}

function dailyKey() {
  return `daily:${localDateKey()}`;
}

function dailyLevel(dateKeyValue) {
  const day = daysSinceEpoch(dateKeyValue);
  return DAILY_LEVELS[day % DAILY_LEVELS.length];
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(dateKeyValue) {
  const [year, month, day] = dateKeyValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateToKey(date) {
  return localDateKey(date);
}

function addDays(date, delta) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + delta);
  return copy;
}

function daysSinceEpoch(dateKeyValue) {
  const [year, month, day] = dateKeyValue.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function calculateDailyStreak(dates) {
  let cursor = dateFromKey(localDateKey());
  if (!dates[dateToKey(cursor)]) cursor = addDays(cursor, -1);

  let streak = 0;
  while (dates[dateToKey(cursor)]) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function formatDisplayDate(dateKeyValue) {
  const [year, month, day] = dateKeyValue.split("-");
  return `${day}.${month}.${year}`;
}

function getElapsed(game) {
  if (game.status === "complete" || game.paused) return game.elapsed;
  return game.elapsed + Date.now() - game.startedAt;
}

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

async function loadPwaRegistration() {
  if (!import.meta.env.PROD) return;
  const { registerServiceWorker } = await import("./pwa.js");
  registerServiceWorker(refs.saveStatus);
}
