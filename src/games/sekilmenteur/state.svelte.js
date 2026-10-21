import { pickEntry, themes, ALL_THEMES } from './themes.js';
import { roster } from '../../lib/roster.svelte.js';
import { shuffle } from '../../lib/shuffle.js';
import { loadSettings, saveSettings } from '../../lib/storage.js';
import { validMode } from '../../lib/themeUtil.js';

const STORAGE_KEY = 'sekilmenteur:settings';
export const CLUE_ROUNDS = 2;
export const CLUE_ROUND_OPTIONS = [1, 2, 3];

export const MODES = [
  {
    id: 'classique',
    name: 'Classique',
    emoji: '🎯',
    description: 'Démasquez tous les menteurs avant qu\'ils ne soient aussi nombreux que vous.',
  },
  {
    id: 'derniere-chance',
    name: 'Dernière chance',
    emoji: '🎲',
    description: 'Un menteur démasqué tente de deviner le mot. S\'il le trouve, les menteurs gagnent.',
  },
  {
    id: 'espion',
    name: 'Espion',
    emoji: '🕵️',
    description: 'À tout moment, un menteur peut se dévoiler et annoncer le mot. Juste : les menteurs gagnent. Faux : il est éliminé.',
  },
];

class Game {
  phase = $state('setup'); // setup | reveal | clues | vote | result | guess | spyGuess | end
  themeId = $state(ALL_THEMES);
  mode = $state('classique');
  liarCount = $state(1);
  hintMode = $state(true);
  timerSeconds = $state(120);
  clueRounds = $state(CLUE_ROUNDS);

  players = $state([]); // { name, isLiar, alive }
  entry = $state({ word: '', hint: '' });

  clueRound = $state(1);
  speakerOrder = $state([]);
  startOffset = $state(0);

  accused = $state(null);
  guesser = $state(null);
  spyFrom = 'clues'; // phase d'où un espion s'est dévoilé, pour pouvoir annuler
  outcome = $state(null); // 'win' | 'lose' | null (du point de vue des honnêtes)
  endReason = $state(null); // 'unmasked' | 'majority' | 'guessed'

  constructor() {
    const saved = loadSettings(STORAGE_KEY);
    if (Number.isInteger(saved.liarCount)) this.liarCount = saved.liarCount;
    if (typeof saved.hintMode === 'boolean') this.hintMode = saved.hintMode;
    if (Number.isFinite(saved.timerSeconds)) this.timerSeconds = saved.timerSeconds;
    if (CLUE_ROUND_OPTIONS.includes(saved.clueRounds)) this.clueRounds = saved.clueRounds;
    this.mode = validMode(MODES, saved.mode);
  }

  get currentMode() {
    return MODES.find((m) => m.id === this.mode) ?? MODES[0];
  }
  get maxLiars() {
    return Math.max(1, Math.floor((roster.filled.length - 1) / 2));
  }
  get effectiveLiarCount() {
    return Math.min(this.liarCount, this.maxLiars);
  }
  get canStart() {
    return roster.isValid && themes.length > 0;
  }

  get alivePlayers() {
    return this.players.filter((p) => p.alive);
  }
  get liarsAlive() {
    return this.alivePlayers.filter((p) => p.isLiar).length;
  }
  get innocentsAlive() {
    return this.alivePlayers.filter((p) => !p.isLiar).length;
  }
  /** En mode Espion, un menteur peut se dévoiler pendant les tours de parole ou le vote. */
  get canSpyGuess() {
    return this.mode === 'espion' && (this.phase === 'clues' || this.phase === 'vote');
  }
  /** Le menteur démasqué a-t-il droit à une tentative ? */
  get accusedMayGuess() {
    return this.mode === 'derniere-chance' && this.accused?.isLiar && this.outcome !== 'lose';
  }

  start() {
    if (!this.canStart) return;
    saveSettings(STORAGE_KEY, {
      liarCount: this.liarCount,
      hintMode: this.hintMode,
      timerSeconds: this.timerSeconds,
      clueRounds: this.clueRounds,
      mode: this.mode,
    });
    const names = roster.filled;
    const liarNames = new Set(shuffle(names).slice(0, this.effectiveLiarCount));
    this.players = names.map((name) => ({ name, isLiar: liarNames.has(name), alive: true }));
    this.entry = pickEntry(this.themeId);
    this.startOffset = Math.floor(Math.random() * this.players.length);
    this.outcome = null;
    this.endReason = null;
    this.accused = null;
    this.guesser = null;
    this.phase = 'reveal';
  }

  beginClues() {
    this.clueRound = 1;
    this.beginSpeakingRound();
    this.phase = 'clues';
  }
  beginSpeakingRound() {
    const alive = this.alivePlayers;
    const offset = this.startOffset % alive.length;
    this.speakerOrder = [...alive.slice(offset), ...alive.slice(0, offset)];
  }
  endClueRound() {
    if (this.clueRound < this.clueRounds) {
      this.clueRound += 1;
      this.beginSpeakingRound();
    } else {
      this.accused = null;
      this.phase = 'vote';
    }
  }

  evaluate() {
    if (this.liarsAlive === 0) {
      this.outcome = 'win';
      this.endReason = 'unmasked';
    } else if (this.liarsAlive >= this.innocentsAlive) {
      this.outcome = 'lose';
      this.endReason = 'majority';
    }
  }

  accuse(player) {
    player.alive = false;
    this.accused = player;
    this.evaluate();
    this.phase = 'result';
  }

  continueAfterResult() {
    if (this.accusedMayGuess) {
      this.guesser = this.accused;
      this.phase = 'guess';
      return;
    }
    this.next();
  }

  /** Dernière chance : le menteur démasqué a-t-il trouvé le mot ? */
  resolveGuess(found) {
    if (this.phase !== 'guess') return;
    if (found) {
      this.outcome = 'lose';
      this.endReason = 'guessed';
    }
    this.next();
  }

  /** Mode Espion : un joueur se dévoile et annonce le mot. */
  startSpyGuess() {
    if (!this.canSpyGuess) return;
    this.guesser = null;
    this.spyFrom = this.phase;
    this.phase = 'spyGuess';
  }
  cancelSpyGuess() {
    if (this.phase !== 'spyGuess') return;
    this.guesser = null;
    this.phase = this.spyFrom;
  }
  resolveSpyGuess(player, found) {
    if (this.phase !== 'spyGuess') return;
    this.guesser = player;
    if (found && player.isLiar) {
      this.outcome = 'lose';
      this.endReason = 'guessed';
      this.phase = 'end';
      return;
    }
    // Raté, ou un honnête qui bluffe : il est éliminé.
    this.accuse(player);
  }

  next() {
    if (this.outcome) {
      this.phase = 'end';
      return;
    }
    this.startOffset += 1;
    this.clueRound = 1;
    this.beginSpeakingRound();
    this.phase = 'clues';
  }

  reset() {
    this.phase = 'setup';
  }
}

export const game = new Game();
