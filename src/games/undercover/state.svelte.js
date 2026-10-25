import { pickPair, themes, ALL_THEMES } from './themes.js';
import { roster } from '../../lib/roster.svelte.js';
import { randomIndex, shuffle } from '../../lib/shuffle.js';
import { loadSettings, saveSettings } from '../../lib/storage.js';
import { validMode } from '../../lib/themeUtil.js';

const STORAGE_KEY = 'undercover:settings';

export const MODES = [
  {
    id: 'classique',
    name: 'Classique',
    emoji: '🎯',
    description: 'Seul Mr White, s\'il est éliminé, peut tenter de deviner le mot des civils.',
  },
  {
    id: 'derniere-chance',
    name: 'Dernière chance',
    emoji: '🎲',
    description: 'Tout intrus éliminé tente de deviner le mot des civils. S\'il trouve, les intrus gagnent.',
  },
  {
    id: 'sans-pitie',
    name: 'Sans pitié',
    emoji: '💀',
    description: 'Aucune seconde chance : un intrus éliminé est éliminé pour de bon.',
  },
];

class Undercover {
  phase = $state('setup'); // setup | reveal | talk | vote | result | guess | end
  themeId = $state(ALL_THEMES);
  mode = $state('classique');
  undercoverCount = $state(1);
  mrWhite = $state(false);

  players = $state([]); // { name, role: 'civil' | 'undercover' | 'white', alive }
  words = $state({ civil: '', undercover: '' });

  speakerOrder = $state([]);
  startOffset = $state(0);

  accused = $state(null);
  outcome = $state(null); // 'civils' | 'intruders' | 'white' | null
  endReason = $state(null); // 'eliminated' | 'majority' | 'guessed'

  constructor() {
    const saved = loadSettings(STORAGE_KEY);
    if (Number.isInteger(saved.undercoverCount)) this.undercoverCount = saved.undercoverCount;
    if (typeof saved.mrWhite === 'boolean') this.mrWhite = saved.mrWhite;
    this.mode = validMode(MODES, saved.mode);
  }

  get currentMode() {
    return MODES.find((m) => m.id === this.mode) ?? MODES[0];
  }
  get maxIntruders() {
    return Math.max(1, Math.floor((roster.filled.length - 1) / 2));
  }
  get minUndercovers() {
    return this.mrWhite ? 0 : 1;
  }
  get maxUndercovers() {
    return this.maxIntruders - (this.mrWhite ? 1 : 0);
  }
  get effectiveUndercoverCount() {
    return Math.min(Math.max(this.undercoverCount, this.minUndercovers), this.maxUndercovers);
  }
  get canStart() {
    return roster.isValid && themes.length > 0;
  }

  get alivePlayers() {
    return this.players.filter((p) => p.alive);
  }
  get civilsAlive() {
    return this.alivePlayers.filter((p) => p.role === 'civil').length;
  }
  get intrudersAlive() {
    return this.alivePlayers.filter((p) => p.role !== 'civil').length;
  }
  /** L'intrus qui vient d'être éliminé a-t-il droit à une tentative ? */
  get accusedMayGuess() {
    if (!this.accused || this.outcome === 'intruders') return false;
    if (this.accused.role === 'white') return this.mode !== 'sans-pitie';
    if (this.accused.role === 'undercover') return this.mode === 'derniere-chance';
    return false;
  }

  start() {
    if (!this.canStart) return;
    saveSettings(STORAGE_KEY, { undercoverCount: this.undercoverCount, mrWhite: this.mrWhite, mode: this.mode });
    const names = shuffle(roster.filled);
    const undercovers = this.effectiveUndercoverCount;
    const roles = names.map((_, i) => (i < undercovers ? 'undercover' : i === undercovers && this.mrWhite ? 'white' : 'civil'));
    const byName = new Map(names.map((name, i) => [name, roles[i]]));
    this.players = roster.filled.map((name) => ({ name, role: byName.get(name), alive: true }));
    this.words = pickPair(this.themeId);
    this.pickStarter();
    this.outcome = null;
    this.endReason = null;
    this.accused = null;
    this.phase = 'reveal';
  }

  pickStarter() {
    const starters = this.alivePlayers.map((p, i) => (p.role === 'white' ? -1 : i)).filter((i) => i >= 0);
    this.startOffset = starters[randomIndex(starters.length)];
  }
  beginTalk() {
    this.beginRound();
    this.phase = 'talk';
  }
  beginRound() {
    const alive = this.alivePlayers;
    const offset = this.startOffset % alive.length;
    this.speakerOrder = [...alive.slice(offset), ...alive.slice(0, offset)];
  }
  goToVote() {
    this.phase = 'vote';
  }

  accuse(player) {
    player.alive = false;
    this.accused = player;
    this.phase = 'result';
    this.evaluate();
  }

  evaluate() {
    if (this.intrudersAlive === 0) {
      this.outcome = 'civils';
      this.endReason = 'eliminated';
    } else if (this.intrudersAlive >= this.civilsAlive) {
      this.outcome = 'intruders';
      this.endReason = 'majority';
    }
  }

  continueAfterResult() {
    if (this.accusedMayGuess) {
      this.phase = 'guess';
      return;
    }
    this.next();
  }
  resolveGuess(found) {
    if (this.phase !== 'guess') return;
    if (found) {
      this.outcome = this.accused.role === 'white' ? 'white' : 'intruders';
      this.endReason = 'guessed';
    }
    this.next();
  }
  next() {
    if (this.outcome) {
      this.phase = 'end';
      return;
    }
    this.pickStarter();
    this.beginRound();
    this.phase = 'talk';
  }

  reset() {
    this.phase = 'setup';
  }
}

export const game = new Undercover();
