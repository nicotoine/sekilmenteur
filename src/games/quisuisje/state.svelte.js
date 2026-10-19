import { bankThemes, pickWords } from '../../lib/wordBank.js';
import { ALL_THEMES } from '../../lib/themeUtil.js';
import { roster } from '../../lib/roster.svelte.js';
import { loadSettings, saveSettings } from '../../lib/storage.js';

const STORAGE_KEY = 'quisuisje:settings';
const PERSON_THEME_IDS = ['celebrites', 'manga', 'pop-culture', 'films', 'series', 'dessins-animes', 'jeux-video', 'animaux', 'metiers', 'sport'];
const DECK_SIZE = 200;

export const themes = bankThemes.filter((t) => PERSON_THEME_IDS.includes(t.id));

class QuiSuisJe {
  phase = $state('setup'); // setup | ready | countdown | turn | summary | end
  themeId = $state(ALL_THEMES);
  turnSeconds = $state(60);
  laps = $state(1);

  players = $state([]); // { name, score }
  turnIndex = $state(0);
  deck = $state([]);
  card = $state('');
  found = $state([]);
  passed = $state([]);
  turnId = $state(0);

  constructor() {
    const saved = loadSettings(STORAGE_KEY);
    if (Number.isFinite(saved.turnSeconds)) this.turnSeconds = saved.turnSeconds;
    if (Number.isInteger(saved.laps)) this.laps = saved.laps;
  }

  get canStart() {
    return roster.isValid && themes.length > 0;
  }
  get currentPlayer() {
    return this.players[this.turnIndex % this.players.length];
  }
  get totalTurns() {
    return this.laps * this.players.length;
  }
  get ranking() {
    return [...this.players].sort((a, b) => b.score - a.score);
  }

  start() {
    if (!this.canStart) return;
    saveSettings(STORAGE_KEY, { turnSeconds: this.turnSeconds, laps: this.laps });
    this.players = roster.filled.map((name) => ({ name, score: 0 }));
    this.deck = pickWords(themes, this.themeId, DECK_SIZE);
    this.turnIndex = 0;
    this.phase = 'ready';
  }

  draw() {
    if (this.deck.length === 0) this.deck = pickWords(themes, this.themeId, DECK_SIZE);
    this.card = this.deck.pop();
  }

  beginCountdown() {
    this.phase = 'countdown';
  }

  startTurn() {
    this.found = [];
    this.passed = [];
    this.turnId += 1;
    this.draw();
    this.phase = 'turn';
  }

  answer(isFound) {
    if (this.phase !== 'turn') return;
    (isFound ? this.found : this.passed).push(this.card);
    this.draw();
  }

  endTurn() {
    if (this.phase !== 'turn') return;
    this.currentPlayer.score += this.found.length;
    this.phase = 'summary';
  }

  nextTurn() {
    this.turnIndex += 1;
    this.phase = this.turnIndex >= this.totalTurns ? 'end' : 'ready';
  }

  reset() {
    this.phase = 'setup';
  }
}

export const game = new QuiSuisJe();
