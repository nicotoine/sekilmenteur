import { pickEntry, themes, ALL_THEMES } from './themes.js';
import { roster } from '../../lib/roster.svelte.js';
import { shuffle } from '../../lib/shuffle.js';
import { loadSettings, saveSettings } from '../../lib/storage.js';

const STORAGE_KEY = 'sekilmenteur:settings';
export const CLUE_ROUNDS = 2;

class Game {
  phase = $state('setup'); // setup | reveal | clues | vote | result | end
  themeId = $state(ALL_THEMES);
  liarCount = $state(1);
  hintMode = $state(true);
  timerSeconds = $state(120);

  players = $state([]); // { name, isLiar, alive }
  entry = $state({ word: '', hint: '' });

  clueRound = $state(1);
  speakerOrder = $state([]);
  startOffset = $state(0);

  accused = $state(null);
  outcome = $state(null); // 'win' | 'lose' | null

  constructor() {
    const saved = loadSettings(STORAGE_KEY);
    if (Number.isInteger(saved.liarCount)) this.liarCount = saved.liarCount;
    if (typeof saved.hintMode === 'boolean') this.hintMode = saved.hintMode;
    if (Number.isFinite(saved.timerSeconds)) this.timerSeconds = saved.timerSeconds;
  }

  get maxLiars() {
    return Math.max(1, Math.floor((roster.filled.length - 1) / 2));
  }
  get effectiveLiarCount() {
    return Math.min(this.liarCount, this.maxLiars);
  }
  get canStart() {
    return roster.isValid && themes.length > 0;
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

  start() {
    if (!this.canStart) return;
    saveSettings(STORAGE_KEY, { liarCount: this.liarCount, hintMode: this.hintMode, timerSeconds: this.timerSeconds });
    const names = roster.filled;
    const liarNames = new Set(shuffle(names).slice(0, this.effectiveLiarCount));
    this.players = names.map((name) => ({ name, isLiar: liarNames.has(name), alive: true }));
    this.entry = pickEntry(this.themeId);
    this.startOffset = Math.floor(Math.random() * this.players.length);
    this.outcome = null;
    this.phase = 'reveal';
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
}

export const game = new Game();
