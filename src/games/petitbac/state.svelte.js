import { pickCategories, themes, ALL_THEMES } from './themes.js';
import { roster } from '../../lib/roster.svelte.js';
import { shuffle } from '../../lib/shuffle.js';
import { loadSettings, saveSettings } from '../../lib/storage.js';
import { validMode } from '../../lib/themeUtil.js';

const STORAGE_KEY = 'petitbac:settings';
export const EASY_LETTERS = [...'ABCDEFGHIJLMNOPRSTUV'];
export const HARD_LETTERS = [...'KQWXYZ'];

export const MODES = [
  {
    id: 'classique',
    name: 'Classique',
    emoji: '⏱️',
    description: 'Six catégories et un chrono. Un point par réponse valable, deux si personne d\'autre ne l\'a.',
    categoryCount: 6,
    timed: true,
    hardLetters: false,
  },
  {
    id: 'eclair',
    name: 'Éclair',
    emoji: '⚡',
    description: 'Cinq catégories, pas de chrono : le premier qui a tout rempli crie « Stop » et arrête la manche.',
    categoryCount: 5,
    timed: false,
    hardLetters: false,
  },
  {
    id: 'expert',
    name: 'Expert',
    emoji: '🧠',
    description: 'Huit catégories, et les lettres difficiles (K, Q, W, X, Y, Z) peuvent sortir.',
    categoryCount: 8,
    timed: true,
    hardLetters: true,
  },
];

class PetitBac {
  phase = $state('setup'); // setup | ready | turn | score | end
  themeId = $state(ALL_THEMES);
  mode = $state('classique');
  roundCount = $state(3);
  turnSeconds = $state(90);

  players = $state([]); // { name, score }
  round = $state(0);
  letter = $state('');
  categories = $state([]);
  usedLetters = $state([]);
  roundScores = $state([]);
  turnId = $state(0);

  constructor() {
    const saved = loadSettings(STORAGE_KEY);
    if (Number.isInteger(saved.roundCount)) this.roundCount = saved.roundCount;
    if (Number.isFinite(saved.turnSeconds)) this.turnSeconds = saved.turnSeconds;
    this.mode = validMode(MODES, saved.mode);
  }

  get currentMode() {
    return MODES.find((m) => m.id === this.mode) ?? MODES[0];
  }
  get canStart() {
    return roster.isValid && themes.length > 0;
  }
  get letters() {
    return this.currentMode.hardLetters ? [...EASY_LETTERS, ...HARD_LETTERS] : EASY_LETTERS;
  }
  /** Score maximal d'une manche : deux points par catégorie (réponse unique). */
  get maxRoundScore() {
    return this.categories.length * 2;
  }
  get ranking() {
    return [...this.players].sort((a, b) => b.score - a.score);
  }

  start() {
    if (!this.canStart) return;
    saveSettings(STORAGE_KEY, { roundCount: this.roundCount, turnSeconds: this.turnSeconds, mode: this.mode });
    this.players = roster.filled.map((name) => ({ name, score: 0 }));
    this.round = 0;
    this.usedLetters = [];
    this.prepareRound();
  }

  drawLetter() {
    const remaining = this.letters.filter((l) => !this.usedLetters.includes(l));
    const pool = remaining.length > 0 ? remaining : this.letters;
    const letter = shuffle(pool)[0];
    this.usedLetters.push(letter);
    return letter;
  }

  prepareRound() {
    this.round += 1;
    this.letter = this.drawLetter();
    this.categories = pickCategories(this.themeId, this.currentMode.categoryCount);
    this.roundScores = this.players.map(() => 0);
    this.phase = 'ready';
  }

  startRound() {
    if (this.phase !== 'ready') return;
    this.turnId += 1;
    this.phase = 'turn';
  }

  stopRound() {
    if (this.phase !== 'turn') return;
    this.phase = 'score';
  }

  setScore(index, value) {
    if (this.phase !== 'score') return;
    this.roundScores[index] = Math.min(this.maxRoundScore, Math.max(0, value));
  }

  validateScores() {
    if (this.phase !== 'score') return;
    this.players.forEach((p, i) => (p.score += this.roundScores[i]));
    if (this.round >= this.roundCount) this.phase = 'end';
    else this.prepareRound();
  }

  reset() {
    this.phase = 'setup';
  }
}

export const game = new PetitBac();
