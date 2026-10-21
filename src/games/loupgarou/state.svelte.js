import { roster } from '../../lib/roster.svelte.js';
import { shuffle } from '../../lib/shuffle.js';
import { loadSettings, saveSettings } from '../../lib/storage.js';
import { validMode } from '../../lib/themeUtil.js';

const STORAGE_KEY = 'loupgarou:settings';
export const MIN_PLAYERS = 4;

export const ROLES = {
  loup: { name: 'Loup-Garou', emoji: '🐺', description: 'Chaque nuit, dévore un villageois avec tes complices.', team: 'loups' },
  voyante: { name: 'Voyante', emoji: '🔮', description: 'Chaque nuit, découvre le vrai rôle d\'un joueur.', team: 'village' },
  sorciere: { name: 'Sorcière', emoji: '🧪', description: 'Une potion de vie et une potion de mort, utilisables une seule fois chacune.', team: 'village' },
  chasseur: { name: 'Chasseur', emoji: '🏹', description: 'Si tu meurs, tu emportes un joueur de ton choix avec toi.', team: 'village' },
  villageois: { name: 'Villageois', emoji: '🧑‍🌾', description: 'Trouve les loups et vote pour les éliminer.', team: 'village' },
};

export const OPTIONAL_ROLES = ['voyante', 'sorciere', 'chasseur'];

export const MODES = [
  {
    id: 'classique',
    name: 'Classique',
    emoji: '🌕',
    description: 'Les loups attaquent dès la première nuit. Le rôle des morts est révélé.',
    firstNightSafe: false,
    revealRoles: true,
  },
  {
    id: 'douce',
    name: 'Première nuit calme',
    emoji: '🌙',
    description: 'La première nuit, les loups se rencontrent sans attaquer. Idéal pour découvrir le jeu.',
    firstNightSafe: true,
    revealRoles: true,
  },
  {
    id: 'mystere',
    name: 'Mystère',
    emoji: '🎭',
    description: 'Le rôle des morts reste secret jusqu\'à la fin. Beaucoup plus de bluff.',
    firstNightSafe: false,
    revealRoles: false,
  },
];

class LoupGarou {
  phase = $state('setup'); // setup | reveal | night | dawn | hunter | day | dayResult | end
  mode = $state('classique');
  wolfCount = $state(1);
  roles = $state({ voyante: true, sorciere: true, chasseur: false });
  narrator = $state(false);
  voiceURI = $state('');

  players = $state([]); // { name, role, alive }
  nightNumber = $state(0);
  night = $state(null); // { order, index, uncovered, victim, seen, healed, poisoned, attack }
  potions = $state({ heal: true, poison: true });
  deaths = $state([]); // joueurs morts lors de la dernière nuit ou du dernier vote
  lynched = $state(null);
  hunterPending = $state(null); // chasseur qui doit tirer
  hunterTarget = $state(null);
  afterHunter = $state('day'); // 'day' | 'night'
  outcome = $state(null); // 'village' | 'loups' | null

  constructor() {
    const saved = loadSettings(STORAGE_KEY);
    if (Number.isInteger(saved.wolfCount)) this.wolfCount = saved.wolfCount;
    if (saved.roles && typeof saved.roles === 'object') {
      for (const id of OPTIONAL_ROLES) if (typeof saved.roles[id] === 'boolean') this.roles[id] = saved.roles[id];
    }
    if (typeof saved.narrator === 'boolean') this.narrator = saved.narrator;
    if (typeof saved.voiceURI === 'string') this.voiceURI = saved.voiceURI;
    this.mode = validMode(MODES, saved.mode);
  }

  get currentMode() {
    return MODES.find((m) => m.id === this.mode) ?? MODES[0];
  }
  get playerCount() {
    return roster.filled.length;
  }
  get maxWolves() {
    return Math.max(1, Math.floor((this.playerCount - 1) / 3));
  }
  get effectiveWolfCount() {
    return Math.min(Math.max(1, this.wolfCount), this.maxWolves);
  }
  get specialRoles() {
    return OPTIONAL_ROLES.filter((id) => this.roles[id]);
  }
  get canStart() {
    return roster.isValid && this.playerCount >= MIN_PLAYERS && this.effectiveWolfCount + this.specialRoles.length <= this.playerCount;
  }

  get alivePlayers() {
    return this.players.filter((p) => p.alive);
  }
  get wolvesAlive() {
    return this.alivePlayers.filter((p) => p.role === 'loup');
  }
  get villagersAlive() {
    return this.alivePlayers.filter((p) => p.role !== 'loup');
  }
  get nightPlayer() {
    return this.night?.order[this.night.index] ?? null;
  }
  get nightStep() {
    return this.night ? this.night.index + 1 : 0;
  }
  /** Les loups attaquent-ils cette nuit ? */
  get wolvesAttack() {
    return !(this.currentMode.firstNightSafe && this.nightNumber === 1);
  }
  get revealRoles() {
    return this.currentMode.revealRoles;
  }
  /** Cibles possibles pour les loups : les vivants qui ne sont pas des loups. */
  get wolfTargets() {
    return this.villagersAlive;
  }
  roleOf(player) {
    return ROLES[player.role];
  }
  /** « Bob, qui était Villageois » si les rôles sont révélés, sinon juste le nom. */
  named(player) {
    return this.revealRoles ? `${player.name}, qui était ${this.roleOf(player).name},` : player.name;
  }

  /**
   * Texte que le narrateur lit pour l'écran en cours. Toujours null sur les
   * écrans secrets (cartes de rôle, actions de nuit) : la voix ne révèle rien.
   */
  get announcement() {
    switch (this.phase) {
      case 'night': {
        if (!this.night || this.night.uncovered) return null;
        const intro = this.night.index === 0 ? `Nuit ${this.nightNumber}. Le village s'endort. ` : '';
        return `${intro}Passe le téléphone à ${this.nightPlayer.name}.`;
      }
      case 'dawn': {
        if (this.deaths.length === 0) return 'Le village se réveille. Personne n\'est mort cette nuit.';
        const list = this.deaths.map((p) => this.named(p));
        return `Le village se réveille. Cette nuit, ${list.join(' et ')} ${this.deaths.length > 1 ? 'sont morts' : 'est mort'}.`;
      }
      case 'hunter':
        if (this.hunterTarget) return `${this.named(this.hunterTarget)} est mort.`;
        return `${this.hunterPending.name} était le chasseur. Dans un dernier souffle, il tire sur un joueur.`;
      case 'day':
        return 'Le village débat. Désignez ensemble un joueur à éliminer.';
      case 'dayResult':
        return `${this.named(this.lynched)} est éliminé. La nuit tombe.`;
      case 'end':
        return this.outcome === 'village' ? 'Tous les loups-garous sont éliminés. Le village gagne.' : 'Les loups-garous sont aussi nombreux que les villageois. Les loups-garous gagnent.';
      default:
        return null;
    }
  }
  accomplices(player) {
    return this.players.filter((p) => p.role === 'loup' && p !== player);
  }

  start() {
    if (!this.canStart) return;
    saveSettings(STORAGE_KEY, { wolfCount: this.wolfCount, roles: { ...this.roles }, mode: this.mode, narrator: this.narrator, voiceURI: this.voiceURI });
    const names = roster.filled;
    const deck = [...Array(this.effectiveWolfCount).fill('loup'), ...this.specialRoles];
    while (deck.length < names.length) deck.push('villageois');
    const shuffled = shuffle(deck);
    this.players = names.map((name, i) => ({ name, role: shuffled[i], alive: true }));
    this.potions = { heal: true, poison: true };
    this.nightNumber = 0;
    this.deaths = [];
    this.lynched = null;
    this.hunterPending = null;
    this.hunterTarget = null;
    this.outcome = null;
    this.night = null;
    this.phase = 'reveal';
  }

  /** Ordre de passage nocturne : aléatoire, mais la sorcière passe toujours après les loups. */
  buildNightOrder() {
    const alive = this.alivePlayers;
    const witch = alive.find((p) => p.role === 'sorciere');
    let order = shuffle(alive.filter((p) => p !== witch));
    if (witch) {
      const lastWolf = order.reduce((last, p, i) => (p.role === 'loup' ? i : last), -1);
      const at = lastWolf + 1 + Math.floor(Math.random() * (order.length - lastWolf));
      order = [...order.slice(0, at), witch, ...order.slice(at)];
    }
    return order;
  }

  beginNight() {
    this.nightNumber += 1;
    this.deaths = [];
    this.lynched = null;
    this.night = {
      order: this.buildNightOrder(),
      index: 0,
      uncovered: false,
      victim: null,
      seen: null,
      healed: false,
      poisoned: null,
    };
    this.phase = 'night';
  }

  uncover() {
    if (this.phase === 'night') this.night.uncovered = true;
  }

  chooseVictim(player) {
    if (this.phase !== 'night' || this.nightPlayer?.role !== 'loup' || !this.wolvesAttack) return;
    if (player.role === 'loup' || !player.alive) return;
    this.night.victim = player;
  }
  peek(player) {
    if (this.phase !== 'night' || this.nightPlayer?.role !== 'voyante' || this.night.seen) return;
    if (player === this.nightPlayer || !player.alive) return;
    this.night.seen = player;
  }
  toggleHeal() {
    if (this.phase !== 'night' || this.nightPlayer?.role !== 'sorciere' || !this.potions.heal || !this.night.victim) return;
    this.night.healed = !this.night.healed;
  }
  poison(player) {
    if (this.phase !== 'night' || this.nightPlayer?.role !== 'sorciere' || !this.potions.poison) return;
    if (!player || player === this.nightPlayer || !player.alive) {
      this.night.poisoned = null;
      return;
    }
    this.night.poisoned = this.night.poisoned === player ? null : player;
  }

  /** Le joueur courant a fini : on passe au suivant, ou l'aube se lève. */
  nextSleeper() {
    if (this.phase !== 'night') return;
    const current = this.nightPlayer;
    if (current.role === 'loup' && this.wolvesAttack && !this.night.victim) return;
    if (this.night.index + 1 < this.night.order.length) {
      this.night.index += 1;
      this.night.uncovered = false;
    } else {
      this.endNight();
    }
  }

  endNight() {
    const { victim, healed, poisoned } = this.night;
    if (healed) this.potions.heal = false;
    if (poisoned) this.potions.poison = false;
    const dead = [];
    if (victim && !healed) dead.push(victim);
    if (poisoned && !dead.includes(poisoned)) dead.push(poisoned);
    for (const p of dead) p.alive = false;
    this.deaths = dead;
    this.phase = 'dawn';
  }

  evaluate() {
    if (this.wolvesAlive.length === 0) this.outcome = 'village';
    else if (this.wolvesAlive.length >= this.villagersAlive.length) this.outcome = 'loups';
    return this.outcome;
  }

  /** Après l'aube : le chasseur tire, ou la journée commence, ou la partie se termine. */
  afterDawn() {
    if (this.phase !== 'dawn') return;
    this.proceed(this.deaths, 'day');
  }

  proceed(dead, nextPhase) {
    const hunter = dead.find((p) => p.role === 'chasseur');
    if (hunter) {
      this.hunterPending = hunter;
      this.hunterTarget = null;
      this.afterHunter = nextPhase;
      this.phase = 'hunter';
      return;
    }
    this.advance(nextPhase);
  }

  advance(nextPhase) {
    if (this.evaluate()) {
      this.phase = 'end';
      return;
    }
    if (nextPhase === 'day') this.phase = 'day';
    else this.beginNight();
  }

  /** Le chasseur mourant désigne sa cible. */
  shoot(player) {
    if (this.phase !== 'hunter' || this.hunterTarget || !player.alive || player === this.hunterPending) return;
    player.alive = false;
    this.hunterTarget = player;
  }

  /** Une fois le tir du chasseur affiché, la partie reprend son cours. */
  afterHunterShot() {
    if (this.phase !== 'hunter' || !this.hunterTarget) return;
    this.hunterPending = null;
    this.advance(this.afterHunter);
  }

  lynch(player) {
    if (this.phase !== 'day' || !player.alive) return;
    player.alive = false;
    this.lynched = player;
    this.phase = 'dayResult';
  }

  afterDayResult() {
    if (this.phase !== 'dayResult') return;
    this.proceed([this.lynched], 'night');
  }

  reset() {
    this.phase = 'setup';
  }
}

export const game = new LoupGarou();
