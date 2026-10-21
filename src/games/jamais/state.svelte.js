import { buildDeck, themes, ALL_THEMES } from './themes.js';
import { roster } from '../../lib/roster.svelte.js';
import { loadSettings, saveSettings } from '../../lib/storage.js';
import { validMode } from '../../lib/themeUtil.js';

const STORAGE_KEY = 'jamais:settings';
export const LIVES_OPTIONS = [5, 10];

export const MODES = [
  {
    id: 'classique',
    name: 'Classique',
    emoji: '🙋',
    description: 'Le téléphone lit les cartes, vous levez la main (ou buvez). Pas de score.',
    tracked: false,
  },
  {
    id: 'doigts',
    name: 'Dix doigts',
    emoji: '🖐️',
    description: 'Chacun part avec des vies. Qui l\'a déjà fait en perd une. Le premier à zéro a tout vécu.',
    tracked: true,
  },
];

class Jamais {
  phase = $state('setup'); // setup | card | end
  themeId = $state(ALL_THEMES);
  mode = $state('classique');
  lives = $state(10);

  players = $state([]); // { name, lives }
  deck = $state([]);
  card = $state('');
  index = $state(0);
  marked = $state([]); // joueurs cochés pour la carte en cours
  loser = $state(null);

  constructor() {
    const saved = loadSettings(STORAGE_KEY);
    if (LIVES_OPTIONS.includes(saved.lives)) this.lives = saved.lives;
    this.mode = validMode(MODES, saved.mode);
  }

  get currentMode() {
    return MODES.find((m) => m.id === this.mode) ?? MODES[0];
  }
  get tracked() {
    return this.currentMode.tracked;
  }
  get canStart() {
    return themes.length > 0 && (!this.tracked || roster.isValid);
  }
  get remaining() {
    return this.deck.length;
  }
  get ranking() {
    return [...this.players].sort((a, b) => b.lives - a.lives);
  }

  start() {
    if (!this.canStart) return;
    saveSettings(STORAGE_KEY, { mode: this.mode, lives: this.lives });
    this.players = this.tracked ? roster.filled.map((name) => ({ name, lives: this.lives })) : [];
    this.deck = buildDeck(this.themeId);
    this.index = 0;
    this.loser = null;
    this.draw();
    this.phase = 'card';
  }

  draw() {
    if (this.deck.length === 0) this.deck = buildDeck(this.themeId);
    this.card = this.deck.pop();
    this.index += 1;
    this.marked = [];
  }

  toggle(player) {
    if (this.phase !== 'card' || !this.tracked || player.lives <= 0) return;
    this.marked = this.marked.includes(player) ? this.marked.filter((p) => p !== player) : [...this.marked, player];
  }

  /** Carte suivante. En mode suivi, les joueurs cochés perdent une vie. */
  next() {
    if (this.phase !== 'card') return;
    if (this.tracked) {
      for (const p of this.marked) p.lives = Math.max(0, p.lives - 1);
      const out = this.marked.find((p) => p.lives === 0);
      if (out) {
        this.loser = out;
        this.phase = 'end';
        return;
      }
    }
    this.draw();
  }

  finish() {
    if (this.phase === 'card') this.phase = 'end';
  }

  reset() {
    this.phase = 'setup';
  }
}

export const game = new Jamais();
