import { buildDeck, themes, ALL_THEMES } from './themes.js';
import { randomIndex } from '../../lib/shuffle.js';
import { loadSettings, saveSettings } from '../../lib/storage.js';
import { validMode } from '../../lib/themeUtil.js';

const STORAGE_KEY = 'tabou:settings';
export const POINTS = { found: 1, taboo: -1, skip: 0 };

export const MODES = [
  {
    id: 'classique',
    name: 'Classique',
    emoji: '🎯',
    description: 'Trouvé +1, mot interdit −1, passer 0.',
    points: POINTS,
    tabooEndsTurn: false,
  },
  {
    id: 'strict',
    name: 'Strict',
    emoji: '🚨',
    description: 'Un mot interdit coûte 1 point et met fin au tour immédiatement.',
    points: POINTS,
    tabooEndsTurn: true,
  },
  {
    id: 'doux',
    name: 'Doux',
    emoji: '🧸',
    description: 'Aucun malus : un mot interdit fait simplement passer la carte.',
    points: { found: 1, taboo: 0, skip: 0 },
    tabooEndsTurn: false,
  },
];

class Tabou {
  phase = $state('setup'); // setup | ready | turn | summary | end
  teamNames = $state(['', '']);
  themeId = $state(ALL_THEMES);
  mode = $state('classique');
  turnSeconds = $state(60);
  turnsPerTeam = $state(3);

  scores = $state([0, 0]);
  turnIndex = $state(0);
  firstTeam = $state(0);
  deck = $state([]);
  card = $state(null);
  turnLog = $state([]); // { word, result: 'found' | 'taboo' | 'skip' }

  constructor() {
    const saved = loadSettings(STORAGE_KEY);
    if (Number.isFinite(saved.turnSeconds)) this.turnSeconds = saved.turnSeconds;
    if (Number.isInteger(saved.turnsPerTeam)) this.turnsPerTeam = saved.turnsPerTeam;
    this.mode = validMode(MODES, saved.mode);
  }

  get currentMode() {
    return MODES.find((m) => m.id === this.mode) ?? MODES[0];
  }
  get points() {
    return this.currentMode.points;
  }
  get canStart() {
    return themes.length > 0;
  }
  get displayNames() {
    return this.teamNames.map((n, i) => n.trim() || `Équipe ${i + 1}`);
  }
  get teamIndex() {
    return (this.firstTeam + this.turnIndex) % 2;
  }
  get currentTeam() {
    return this.displayNames[this.teamIndex];
  }
  get opponentTeam() {
    return this.displayNames[1 - this.teamIndex];
  }
  get totalTurns() {
    return this.turnsPerTeam * 2;
  }
  get turnPoints() {
    return this.turnLog.reduce((sum, entry) => sum + this.points[entry.result], 0);
  }
  get winnerIndex() {
    if (this.scores[0] === this.scores[1]) return -1;
    return this.scores[0] > this.scores[1] ? 0 : 1;
  }

  start() {
    if (!this.canStart) return;
    saveSettings(STORAGE_KEY, { turnSeconds: this.turnSeconds, turnsPerTeam: this.turnsPerTeam, mode: this.mode });
    this.scores = [0, 0];
    this.turnIndex = 0;
    this.firstTeam = randomIndex(2);
    this.deck = buildDeck(this.themeId);
    this.turnLog = [];
    this.phase = 'ready';
  }

  drawCard() {
    if (this.deck.length === 0) this.deck = buildDeck(this.themeId);
    this.card = this.deck.pop();
  }

  startTurn() {
    this.turnLog = [];
    this.drawCard();
    this.phase = 'turn';
  }

  answer(result) {
    if (this.phase !== 'turn') return;
    this.turnLog.push({ word: this.card.word, result });
    if (result === 'taboo' && this.currentMode.tabooEndsTurn) {
      this.endTurn();
      return;
    }
    this.drawCard();
  }

  endTurn() {
    if (this.phase !== 'turn') return;
    this.scores[this.teamIndex] += this.turnPoints;
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

export const game = new Tabou();
