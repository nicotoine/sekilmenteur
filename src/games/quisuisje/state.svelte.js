import { bankThemes, pickWords } from '../../lib/wordBank.js';
import { ALL_THEMES, validMode } from '../../lib/themeUtil.js';
import { roster } from '../../lib/roster.svelte.js';
import { loadSettings, saveSettings } from '../../lib/storage.js';

const STORAGE_KEY = 'quisuisje:settings';
const PERSON_THEME_IDS = ['celebrites', 'manga', 'pop-culture', 'films', 'series', 'dessins-animes', 'jeux-video', 'animaux', 'metiers', 'sport', 'histoire', 'superheros'];
const DECK_SIZE = 200;

export const themes = bankThemes.filter((t) => PERSON_THEME_IDS.includes(t.id));

export const MODES = [
  {
    id: 'classique',
    name: 'Indices',
    emoji: '💬',
    description: 'Les autres te donnent des indices librement, sans dire le mot.',
    skipCost: 0,
  },
  {
    id: 'questions',
    name: 'Questions',
    emoji: '❓',
    description: 'Tu poses des questions, les autres ne répondent que par oui ou non.',
    skipCost: 0,
  },
  {
    id: 'malus',
    name: 'Sans pitié',
    emoji: '💀',
    description: 'Indices libres, mais chaque carte passée coûte un point.',
    skipCost: 1,
  },
];

class QuiSuisJe {
  phase = $state('setup'); // setup | ready | countdown | turn | summary | end
  themeId = $state(ALL_THEMES);
  mode = $state('classique');
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
    this.mode = validMode(MODES, saved.mode);
  }

  get currentMode() {
    return MODES.find((m) => m.id === this.mode) ?? MODES[0];
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
  /** Points du tour en cours : les trouvés, moins les passes en mode sans pitié, jamais négatif. */
  get turnPoints() {
    return Math.max(0, this.found.length - this.passed.length * this.currentMode.skipCost);
  }

  start() {
    if (!this.canStart) return;
    saveSettings(STORAGE_KEY, { turnSeconds: this.turnSeconds, laps: this.laps, mode: this.mode });
    this.players = roster.filled.map((name) => ({ name, score: 0 }));
    this.deck = pickWords(themes, this.themeId, DECK_SIZE);
    this.turnIndex = 0;
    this.found = [];
    this.passed = [];
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
    this.currentPlayer.score += this.turnPoints;
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
