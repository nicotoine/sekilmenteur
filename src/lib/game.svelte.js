import { pickEntry, themes, ALL_THEMES } from './themes.js';

const STORAGE_KEY = 'sekilmenteur:settings';
export const CLUE_ROUNDS = 2;
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

class Game {
  phase = $state('setup'); // setup | reveal | clues | vote | result | end
  names = $state(['', '', '']);
  themeId = $state(ALL_THEMES);
  liarCount = $state(1);
  hintMode = $state(true);
  timerSeconds = $state(120);

  players = $state([]); // { name, isLiar, alive }
  entry = $state({ word: '', hint: '' });
  revealIndex = $state(0);
  revealShown = $state(false);

  clueRound = $state(1);
  speakerOrder = $state([]);
  speakerIndex = $state(0);
  startOffset = $state(0);

  accused = $state(null);
  outcome = $state(null); // 'win' | 'lose' | null

  constructor() {
    const saved = loadSettings();
    if (Number.isInteger(saved.liarCount)) this.liarCount = saved.liarCount;
    if (typeof saved.hintMode === 'boolean') this.hintMode = saved.hintMode;
    if (Number.isFinite(saved.timerSeconds)) this.timerSeconds = saved.timerSeconds;
  }

  get filledNames() {
    return this.names.map((n) => n.trim()).filter(Boolean);
  }
  get maxLiars() {
    return Math.max(1, Math.floor((this.filledNames.length - 1) / 2));
  }
  get effectiveLiarCount() {
    return Math.min(this.liarCount, this.maxLiars);
  }
  get hasDuplicateNames() {
    const lower = this.filledNames.map((n) => n.toLowerCase());
    return new Set(lower).size !== lower.length;
  }
  get canStart() {
    return this.filledNames.length >= MIN_PLAYERS && !this.hasDuplicateNames && themes.length > 0;
  }

  get alivePlayers() {
    return this.players.filter((p) => p.alive);
  }
  get liarsAlive() {
    return this.alivePlayers.filter((p) => p.isLiar).length;
  }
  get innocentsAlive() {
    return this.alivePlayers.filter((p) => !p.isLiar).length;
  }
  get currentRevealPlayer() {
    return this.players[this.revealIndex];
  }
  get currentSpeaker() {
    return this.speakerOrder[this.speakerIndex];
  }

  saveSettings() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          liarCount: this.liarCount,
          hintMode: this.hintMode,
          timerSeconds: this.timerSeconds,
        }),
      );
    } catch {
      // stockage indisponible (navigation privée) : on ignore
    }
  }

  addPlayer() {
    if (this.names.length < MAX_PLAYERS) this.names.push('');
  }
  removePlayer(index) {
    if (this.names.length > MIN_PLAYERS) this.names.splice(index, 1);
  }

  start() {
    if (!this.canStart) return;
    this.saveSettings();
    const liarCount = this.effectiveLiarCount;
    const liarNames = new Set(shuffle(this.filledNames).slice(0, liarCount));
    this.players = this.filledNames.map((name) => ({ name, isLiar: liarNames.has(name), alive: true }));
    this.entry = pickEntry(this.themeId);
    this.revealIndex = 0;
    this.revealShown = false;
    this.startOffset = Math.floor(Math.random() * this.players.length);
    this.outcome = null;
    this.phase = 'reveal';
  }

  showReveal() {
    this.revealShown = true;
  }
  nextReveal() {
    this.revealShown = false;
    if (this.revealIndex + 1 < this.players.length) {
      this.revealIndex += 1;
    } else {
      this.beginClues();
    }
  }

  beginClues() {
    this.clueRound = 1;
    this.beginSpeakingRound();
    this.phase = 'clues';
  }
  beginSpeakingRound() {
    const alive = this.alivePlayers;
    const offset = this.startOffset % alive.length;
    this.speakerOrder = [...alive.slice(offset), ...alive.slice(0, offset)];
    this.speakerIndex = 0;
  }
  nextSpeaker() {
    if (this.speakerIndex + 1 < this.speakerOrder.length) {
      this.speakerIndex += 1;
    }
  }
  get roundDone() {
    return this.speakerIndex + 1 >= this.speakerOrder.length;
  }
  endClueRound() {
    if (this.clueRound < CLUE_ROUNDS) {
      this.clueRound += 1;
      this.beginSpeakingRound();
    } else {
      this.accused = null;
      this.phase = 'vote';
    }
  }

  accuse(player) {
    player.alive = false;
    this.accused = player;
    if (this.liarsAlive === 0) this.outcome = 'win';
    else if (this.liarsAlive >= this.innocentsAlive) this.outcome = 'lose';
    this.phase = 'result';
  }

  continueAfterResult() {
    if (this.outcome) {
      this.phase = 'end';
      return;
    }
    this.startOffset += 1;
    this.clueRound = 1;
    this.beginSpeakingRound();
    this.phase = 'clues';
  }

  reset() {
    this.phase = 'setup';
  }
  replaySamePlayers() {
    this.start();
  }
}

export const game = new Game();
