import { bankThemes, pickWords } from '../../lib/wordBank.js';
import { ALL_THEMES, validMode } from '../../lib/themeUtil.js';
import { shuffle } from '../../lib/shuffle.js';
import { loadSettings, saveSettings } from '../../lib/storage.js';

const STORAGE_KEY = 'timesup:settings';

const DESCRIBE = { title: 'Décris librement', rule: 'Fais deviner le mot avec toutes les phrases que tu veux, sans prononcer le mot.' };
const ONE_WORD = { title: 'Un seul mot', rule: 'Un seul mot par carte, sans répéter un mot de la carte. Tu peux le dire à nouveau.' };
const MIME = { title: 'Mime', rule: 'Aucun mot, aucun bruit. Uniquement des gestes.' };
const POSE = { title: 'Une pose', rule: 'Une seule pose figée, sans bouger ni parler. Le plus dur.' };

export const ROUNDS = [DESCRIBE, ONE_WORD, MIME];

export const MODES = [
  { id: 'classique', name: 'Classique', emoji: '🎯', description: 'Trois manches : décrire, un seul mot, mimer.', rounds: ROUNDS },
  { id: 'express', name: 'Express', emoji: '⚡', description: 'Deux manches seulement : décrire, puis mimer.', rounds: [DESCRIBE, MIME] },
  { id: 'expert', name: 'Expert', emoji: '🧠', description: 'Quatre manches : la dernière se joue avec une seule pose figée.', rounds: [DESCRIBE, ONE_WORD, MIME, POSE] },
];

class TimesUp {
  phase = $state('setup'); // setup | ready | turn | summary | roundEnd | end
  teamNames = $state(['', '']);
  themeId = $state(ALL_THEMES);
  mode = $state('classique');
  cardCount = $state(30);
  turnSeconds = $state(45);

  round = $state(1);
  cards = $state([]);
  pile = $state([]);
  teamIndex = $state(0);
  scores = $state([[0, 0, 0], [0, 0, 0]]);
  turnFound = $state([]);
  turnId = $state(0);
  roundOver = $state(false);
  carryover = $state(0);
  timeLeft = 0;

  constructor() {
    const saved = loadSettings(STORAGE_KEY);
    if (Number.isFinite(saved.cardCount)) this.cardCount = saved.cardCount;
    if (Number.isFinite(saved.turnSeconds)) this.turnSeconds = saved.turnSeconds;
    this.mode = validMode(MODES, saved.mode);
  }

  get currentMode() {
    return MODES.find((m) => m.id === this.mode) ?? MODES[0];
  }
  get rounds() {
    return this.currentMode.rounds;
  }
  get canStart() {
    return bankThemes.length > 0;
  }
  get displayNames() {
    return this.teamNames.map((n, i) => n.trim() || `Équipe ${i + 1}`);
  }
  get currentTeam() {
    return this.displayNames[this.teamIndex];
  }
  get currentRound() {
    return this.rounds[this.round - 1];
  }
  get turnDuration() {
    return this.carryover > 0 ? this.carryover : this.turnSeconds;
  }
  get currentCard() {
    return this.pile[0];
  }
  get totals() {
    return this.scores.map((rounds) => rounds.reduce((sum, n) => sum + n, 0));
  }
  get winnerIndex() {
    const [a, b] = this.totals;
    return a === b ? -1 : a > b ? 0 : 1;
  }

  start() {
    if (!this.canStart) return;
    saveSettings(STORAGE_KEY, { cardCount: this.cardCount, turnSeconds: this.turnSeconds, mode: this.mode });
    this.cards = pickWords(bankThemes, this.themeId, this.cardCount);
    this.pile = shuffle(this.cards);
    this.scores = [this.rounds.map(() => 0), this.rounds.map(() => 0)];
    this.round = 1;
    this.teamIndex = 0;
    this.carryover = 0;
    this.roundOver = false;
    this.phase = 'ready';
  }

  setTimeLeft(seconds) {
    this.timeLeft = seconds;
  }

  startTurn() {
    this.turnFound = [];
    this.turnId += 1;
    this.phase = 'turn';
  }

  found() {
    if (this.phase !== 'turn') return;
    this.turnFound.push(this.pile.shift());
    this.scores[this.teamIndex][this.round - 1] += 1;
    if (this.pile.length === 0) {
      this.roundOver = true;
      this.carryover = this.timeLeft;
      this.phase = 'summary';
    }
  }

  skip() {
    if (this.phase === 'turn' && this.pile.length > 1) this.pile.push(this.pile.shift());
  }

  endTurn() {
    if (this.phase !== 'turn') return;
    this.carryover = 0;
    this.phase = 'summary';
  }

  afterSummary() {
    if (this.roundOver) {
      this.phase = 'roundEnd';
    } else {
      this.teamIndex = 1 - this.teamIndex;
      this.phase = 'ready';
    }
  }

  nextRound() {
    if (this.round >= this.rounds.length) {
      this.phase = 'end';
      return;
    }
    this.round += 1;
    this.pile = shuffle(this.cards);
    this.roundOver = false;
    if (this.carryover <= 0) this.teamIndex = 1 - this.teamIndex;
    this.phase = 'ready';
  }

  reset() {
    this.phase = 'setup';
  }
}

export const game = new TimesUp();
