import { buildTruths, buildDares, themes, ALL_THEMES } from './themes.js';
import { roster } from '../../lib/roster.svelte.js';
import { loadSettings, saveSettings } from '../../lib/storage.js';
import { validMode } from '../../lib/themeUtil.js';

const STORAGE_KEY = 'actionverite:settings';

export const MODES = [
  { id: 'classique', name: 'Classique', emoji: '🎯', description: 'À ton tour, tu choisis : action ou vérité.', choices: ['truth', 'dare'], random: false },
  { id: 'roulette', name: 'Roulette', emoji: '🎰', description: 'Le téléphone choisit pour toi. Pas de négociation.', choices: ['truth', 'dare'], random: true },
  { id: 'actions', name: 'Que des actions', emoji: '🔥', description: 'Pas de vérité possible : uniquement des gages.', choices: ['dare'], random: false },
];

export const KIND = {
  truth: { name: 'Vérité', emoji: '💬' },
  dare: { name: 'Action', emoji: '🔥' },
};

class ActionVerite {
  phase = $state('setup'); // setup | pick | card | end
  themeId = $state(ALL_THEMES);
  mode = $state('classique');

  players = $state([]); // { name, done, chickened }
  turnIndex = $state(0);
  truths = $state([]);
  dares = $state([]);
  kind = $state(null); // 'truth' | 'dare'
  card = $state('');

  constructor() {
    const saved = loadSettings(STORAGE_KEY);
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
  get choices() {
    return this.currentMode.choices;
  }
  get ranking() {
    return [...this.players].sort((a, b) => b.done - a.done || a.chickened - b.chickened);
  }
  get biggestChicken() {
    const worst = [...this.players].sort((a, b) => b.chickened - a.chickened)[0];
    return worst?.chickened > 0 ? worst : null;
  }

  start() {
    if (!this.canStart) return;
    saveSettings(STORAGE_KEY, { mode: this.mode });
    this.players = roster.filled.map((name) => ({ name, done: 0, chickened: 0 }));
    this.turnIndex = 0;
    this.truths = buildTruths(this.themeId);
    this.dares = buildDares(this.themeId);
    this.kind = null;
    this.phase = 'pick';
  }

  draw(kind) {
    const pile = kind === 'truth' ? this.truths : this.dares;
    if (pile.length === 0) {
      const fresh = kind === 'truth' ? buildTruths(this.themeId) : buildDares(this.themeId);
      pile.push(...fresh);
    }
    return pile.pop();
  }

  /** Le joueur choisit (ou le téléphone tire au sort en mode roulette). */
  choose(kind) {
    if (this.phase !== 'pick') return;
    if (this.currentMode.random) kind = this.choices[Math.floor(Math.random() * this.choices.length)];
    if (!this.choices.includes(kind)) return;
    this.kind = kind;
    this.card = this.draw(kind);
    this.phase = 'card';
  }

  resolve(done) {
    if (this.phase !== 'card') return;
    if (done) this.currentPlayer.done += 1;
    else this.currentPlayer.chickened += 1;
    this.turnIndex += 1;
    this.kind = null;
    this.phase = 'pick';
  }

  finish() {
    if (this.phase === 'pick' || this.phase === 'card') this.phase = 'end';
  }

  reset() {
    this.phase = 'setup';
  }
}

export const game = new ActionVerite();
