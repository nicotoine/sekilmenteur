import { buildDeck, themes, ALL_THEMES } from './themes.js';
import { loadSettings, saveSettings } from '../../lib/storage.js';

const STORAGE_KEY = 'tabou:settings';
export const POINTS = { found: 1, taboo: -1, skip: 0 };

class Tabou {
  phase = $state('setup'); // setup | ready | turn | summary | end
  teamNames = $state(['', '']);
  themeId = $state(ALL_THEMES);
  turnSeconds = $state(60);
  turnsPerTeam = $state(3);

  scores = $state([0, 0]);
  turnIndex = $state(0);
  deck = $state([]);
  card = $state(null);
  turnLog = $state([]); // { word, result: 'found' | 'taboo' | 'skip' }

  constructor() {
    const saved = loadSettings(STORAGE_KEY);
    if (Number.isFinite(saved.turnSeconds)) this.turnSeconds = saved.turnSeconds;
    if (Number.isInteger(saved.turnsPerTeam)) this.turnsPerTeam = saved.turnsPerTeam;
  }

  get canStart() {
    return themes.length > 0;
  }
  get displayNames() {
    return this.teamNames.map((n, i) => n.trim() || `Équipe ${i + 1}`);
  }
  get teamIndex() {
    return this.turnIndex % 2;
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
    return this.turnLog.reduce((sum, entry) => sum + POINTS[entry.result], 0);
  }
  get winnerIndex() {
    if (this.scores[0] === this.scores[1]) return -1;
    return this.scores[0] > this.scores[1] ? 0 : 1;
  }

  start() {
    if (!this.canStart) return;
    saveSettings(STORAGE_KEY, { turnSeconds: this.turnSeconds, turnsPerTeam: this.turnsPerTeam });
    this.scores = [0, 0];
    this.turnIndex = 0;
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
