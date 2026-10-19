import { pickPair, themes, ALL_THEMES } from './themes.js';
import { roster } from '../../lib/roster.svelte.js';
import { shuffle } from '../../lib/shuffle.js';
import { loadSettings, saveSettings } from '../../lib/storage.js';

const STORAGE_KEY = 'undercover:settings';

class Undercover {
  phase = $state('setup'); // setup | reveal | talk | vote | result | guess | end
  themeId = $state(ALL_THEMES);
  undercoverCount = $state(1);
  mrWhite = $state(false);

  players = $state([]); // { name, role: 'civil' | 'undercover' | 'white', alive }
  words = $state({ civil: '', undercover: '' });

  speakerOrder = $state([]);
  startOffset = $state(0);

  accused = $state(null);
  outcome = $state(null); // 'civils' | 'intruders' | 'white' | null

  constructor() {
    const saved = loadSettings(STORAGE_KEY);
    if (Number.isInteger(saved.undercoverCount)) this.undercoverCount = saved.undercoverCount;
    if (typeof saved.mrWhite === 'boolean') this.mrWhite = saved.mrWhite;
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

  start() {
    if (!this.canStart) return;
    saveSettings(STORAGE_KEY, { undercoverCount: this.undercoverCount, mrWhite: this.mrWhite });
    const names = shuffle(roster.filled);
    const undercovers = this.effectiveUndercoverCount;
    const roles = names.map((_, i) => (i < undercovers ? 'undercover' : i === undercovers && this.mrWhite ? 'white' : 'civil'));
    const byName = new Map(names.map((name, i) => [name, roles[i]]));
    this.players = roster.filled.map((name) => ({ name, role: byName.get(name), alive: true }));
    this.words = pickPair(this.themeId);
    const starters = this.players.map((p, i) => (p.role === 'white' ? -1 : i)).filter((i) => i >= 0);
    this.startOffset = starters[Math.floor(Math.random() * starters.length)];
    this.outcome = null;
    this.phase = 'reveal';
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
    if (this.intrudersAlive === 0) this.outcome = 'civils';
    else if (this.intrudersAlive >= this.civilsAlive) this.outcome = 'intruders';
  }

  continueAfterResult() {
    if (this.accused.role === 'white' && this.outcome !== 'intruders') {
      this.phase = 'guess';
      return;
    }
    this.next();
  }
  resolveGuess(found) {
    if (found) this.outcome = 'white';
    this.next();
  }
  next() {
    if (this.outcome) {
      this.phase = 'end';
      return;
    }
    this.startOffset += 1;
    this.beginRound();
    this.phase = 'talk';
  }

  reset() {
    this.phase = 'setup';
  }
}

export const game = new Undercover();
