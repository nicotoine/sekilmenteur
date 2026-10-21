import { beforeEach, describe, expect, it } from 'vitest';
import { game, MODES, ROLES, OPTIONAL_ROLES, MIN_PLAYERS } from '../src/games/loupgarou/state.svelte.js';
import { setPlayers } from './helpers.js';

const byRole = (role) => game.players.filter((p) => p.role === role);
const alive = (role) => game.alivePlayers.find((p) => p.role === role);
const count = (role) => byRole(role).length;

/** Force une distribution de rôles pour rendre les scénarios déterministes. */
function assign(roles) {
  game.players.forEach((p, i) => (p.role = roles[i] ?? 'villageois'));
}

/** Fait passer la nuit en appliquant une action par rôle. */
function runNight({ victim, heal = false, poison = null, peek = null } = {}) {
  while (game.phase === 'night') {
    game.uncover();
    const current = game.nightPlayer;
    if (current.role === 'loup' && victim && game.wolvesAttack) game.chooseVictim(victim);
    if (current.role === 'voyante' && peek) game.peek(peek);
    if (current.role === 'sorciere') {
      if (heal) game.toggleHeal();
      if (poison) game.poison(poison);
    }
    game.nextSleeper();
  }
}

beforeEach(() => {
  game.reset();
  game.mode = 'classique';
  game.wolfCount = 1;
  game.roles = { voyante: true, sorciere: true, chasseur: false };
  setPlayers(6);
});

describe('réglages', () => {
  it(`exige ${MIN_PLAYERS} joueurs`, () => {
    setPlayers(3);
    expect(game.canStart).toBe(false);
    game.start();
    expect(game.phase).toBe('setup');
    setPlayers(4);
    expect(game.canStart).toBe(true);
  });

  it.each([[4, 1], [6, 1], [7, 2], [10, 3], [12, 3]])('%i joueurs : %i loup(s) maximum', (players, max) => {
    setPlayers(players);
    expect(game.maxWolves).toBe(max);
    game.wolfCount = 9;
    expect(game.effectiveWolfCount).toBe(max);
  });

  it('refuse plus de rôles que de joueurs', () => {
    setPlayers(4);
    game.roles = { voyante: true, sorciere: true, chasseur: true };
    expect(game.canStart).toBe(true);
    game.wolfCount = 2;
    expect(game.effectiveWolfCount).toBe(1);
    setPlayers(7);
    game.wolfCount = 2;
    expect(game.effectiveWolfCount + game.specialRoles.length).toBeLessThanOrEqual(7);
  });

  it('décrit chaque rôle et trois modes', () => {
    for (const role of Object.values(ROLES)) expect(role.name && role.emoji && role.description && role.team).toBeTruthy();
    expect(OPTIONAL_ROLES.every((id) => ROLES[id])).toBe(true);
    expect(MODES.map((m) => m.id)).toEqual(['classique', 'douce', 'mystere']);
  });
});

describe('distribution', () => {
  it('distribue les loups, les rôles choisis et complète avec des villageois', () => {
    game.start();
    expect(game.phase).toBe('reveal');
    expect(count('loup')).toBe(1);
    expect(count('voyante')).toBe(1);
    expect(count('sorciere')).toBe(1);
    expect(count('chasseur')).toBe(0);
    expect(count('villageois')).toBe(3);
    expect(game.players.every((p) => p.alive)).toBe(true);
    expect(game.potions).toEqual({ heal: true, poison: true });
  });

  it('les loups connaissent leurs complices', () => {
    setPlayers(8);
    game.wolfCount = 2;
    game.start();
    const [a, b] = byRole('loup');
    expect(game.accomplices(a)).toEqual([b]);
    expect(game.accomplices(b)).toEqual([a]);
    expect(game.accomplices(alive('voyante'))).toHaveLength(2);
  });
});

describe('nuit', () => {
  it('fait passer tous les vivants, la sorcière toujours après les loups', () => {
    setPlayers(9);
    game.wolfCount = 2;
    for (let i = 0; i < 30; i++) {
      game.start();
      game.beginNight();
      const order = game.night.order;
      expect(order).toHaveLength(9);
      expect(new Set(order).size).toBe(9);
      const lastWolf = Math.max(...order.map((p, idx) => (p.role === 'loup' ? idx : -1)));
      expect(order.findIndex((p) => p.role === 'sorciere')).toBeGreaterThan(lastWolf);
    }
  });

  it('les loups dévorent leur victime', () => {
    game.start();
    game.beginNight();
    expect(game.nightNumber).toBe(1);
    const victim = game.alivePlayers.find((p) => p.role === 'villageois');
    runNight({ victim });
    expect(game.phase).toBe('dawn');
    expect(game.deaths).toEqual([victim]);
    expect(victim.alive).toBe(false);
  });

  it('les loups ne peuvent pas se rendormir sans choisir de victime', () => {
    game.start();
    game.beginNight();
    while (game.nightPlayer.role !== 'loup') {
      game.uncover();
      game.nextSleeper();
    }
    const index = game.night.index;
    game.uncover();
    game.nextSleeper();
    expect(game.night.index).toBe(index);
    game.chooseVictim(alive('loup'));
    expect(game.night.victim).toBeNull();
  });

  it('la voyante découvre un rôle, une seule fois par nuit', () => {
    game.start();
    game.beginNight();
    const wolf = alive('loup');
    const villager = game.alivePlayers.find((p) => p.role === 'villageois');
    runNight({ victim: villager, peek: wolf });
    expect(game.night.seen).toBe(wolf);
    expect(game.roleOf(wolf).name).toBe('Loup-Garou');
  });

  it('la sorcière sauve la victime, puis n\'a plus de potion de vie', () => {
    game.start();
    game.beginNight();
    const victim = game.alivePlayers.find((p) => p.role === 'villageois');
    runNight({ victim, heal: true });
    expect(game.deaths).toEqual([]);
    expect(victim.alive).toBe(true);
    expect(game.potions.heal).toBe(false);
    game.afterDawn();
    expect(game.phase).toBe('day');
    game.lynch(game.alivePlayers.find((p) => p.role === 'villageois'));
    game.afterDayResult();
    expect(game.phase).toBe('night');
    const victim2 = game.alivePlayers.find((p) => p.role === 'villageois');
    runNight({ victim: victim2, heal: true });
    expect(victim2.alive).toBe(false);
  });

  it('la sorcière empoisonne un joueur, une seule fois', () => {
    game.start();
    game.beginNight();
    const [v1, v2] = game.alivePlayers.filter((p) => p.role === 'villageois');
    const wolf = alive('loup');
    runNight({ victim: v1, poison: wolf });
    expect(game.deaths).toEqual([v1, wolf]);
    expect(game.potions.poison).toBe(false);
    expect(wolf.alive).toBe(false);
    game.afterDawn();
    expect(game.outcome).toBe('village');
    expect(game.phase).toBe('end');
    expect(v2.alive).toBe(true);
  });

  it('empoisonner la victime des loups ne la compte qu\'une fois', () => {
    game.start();
    game.beginNight();
    const victim = game.alivePlayers.find((p) => p.role === 'villageois');
    runNight({ victim, poison: victim });
    expect(game.deaths).toEqual([victim]);
  });

  it('ignore les actions d\'un rôle qui n\'est pas celui du joueur courant', () => {
    game.start();
    game.beginNight();
    while (game.nightPlayer.role !== 'villageois') {
      game.uncover();
      game.nextSleeper();
    }
    const villager = game.alivePlayers.find((p) => p.role === 'villageois' && p !== game.nightPlayer);
    game.chooseVictim(villager);
    game.peek(villager);
    game.poison(villager);
    game.toggleHeal();
    expect(game.night.victim).toBeNull();
    expect(game.night.seen).toBeNull();
    expect(game.night.poisoned).toBeNull();
    expect(game.night.healed).toBe(false);
  });
});

describe('jour et fin de partie', () => {
  it('le village gagne en éliminant le dernier loup', () => {
    game.start();
    game.beginNight();
    runNight({ victim: game.alivePlayers.find((p) => p.role === 'villageois') });
    game.afterDawn();
    expect(game.phase).toBe('day');
    game.lynch(alive('loup'));
    expect(game.phase).toBe('dayResult');
    expect(game.lynched.role).toBe('loup');
    game.afterDayResult();
    expect(game.outcome).toBe('village');
    expect(game.phase).toBe('end');
  });

  it('les loups gagnent dès qu\'ils égalent les autres', () => {
    setPlayers(4);
    game.start();
    game.beginNight();
    runNight({ victim: game.alivePlayers.find((p) => p.role === 'villageois') });
    game.afterDawn();
    expect(game.phase).toBe('day');
    game.lynch(game.alivePlayers.find((p) => p.role !== 'loup'));
    game.afterDayResult();
    expect(game.outcome).toBe('loups');
    expect(game.phase).toBe('end');
  });

  it('enchaîne les nuits tant que personne ne gagne', () => {
    setPlayers(8);
    game.start();
    game.beginNight();
    runNight({ victim: game.alivePlayers.find((p) => p.role === 'villageois') });
    game.afterDawn();
    game.lynch(game.alivePlayers.find((p) => p.role === 'villageois'));
    game.afterDayResult();
    expect(game.phase).toBe('night');
    expect(game.nightNumber).toBe(2);
    expect(game.night.order).toHaveLength(6);
  });

  it('ne peut pas éliminer un mort ni voter hors journée', () => {
    game.start();
    game.beginNight();
    const victim = game.alivePlayers.find((p) => p.role === 'villageois');
    runNight({ victim });
    game.lynch(alive('loup'));
    expect(game.phase).toBe('dawn');
    game.afterDawn();
    game.lynch(victim);
    expect(game.phase).toBe('day');
  });
});

describe('chasseur', () => {
  beforeEach(() => {
    setPlayers(7);
    game.roles = { voyante: false, sorciere: false, chasseur: true };
  });

  it('tué la nuit, il emporte un joueur avant le jour', () => {
    game.start();
    game.beginNight();
    const hunter = alive('chasseur');
    runNight({ victim: hunter });
    game.afterDawn();
    expect(game.phase).toBe('hunter');
    expect(game.hunterPending).toBe(hunter);
    game.shoot(hunter);
    expect(game.hunterTarget).toBeNull();
    const target = game.alivePlayers.find((p) => p.role === 'villageois');
    game.shoot(target);
    expect(target.alive).toBe(false);
    game.shoot(game.alivePlayers[0]);
    expect(game.alivePlayers).toHaveLength(5);
    game.afterHunterShot();
    expect(game.phase).toBe('day');
  });

  it('éliminé par le vote, il tire puis la nuit tombe', () => {
    game.start();
    game.beginNight();
    runNight({ victim: game.alivePlayers.find((p) => p.role === 'villageois') });
    game.afterDawn();
    game.lynch(alive('chasseur'));
    game.afterDayResult();
    expect(game.phase).toBe('hunter');
    game.shoot(game.alivePlayers.find((p) => p.role === 'villageois'));
    game.afterHunterShot();
    expect(game.phase).toBe('night');
  });

  it('son tir peut faire gagner le village', () => {
    game.start();
    game.beginNight();
    runNight({ victim: alive('chasseur') });
    game.afterDawn();
    game.shoot(alive('loup'));
    game.afterHunterShot();
    expect(game.outcome).toBe('village');
    expect(game.phase).toBe('end');
  });
});

describe('modes', () => {
  it('première nuit calme : les loups n\'attaquent pas la première nuit', () => {
    game.mode = 'douce';
    game.start();
    game.beginNight();
    expect(game.wolvesAttack).toBe(false);
    runNight({ victim: game.alivePlayers.find((p) => p.role === 'villageois') });
    expect(game.deaths).toEqual([]);
    game.afterDawn();
    game.lynch(game.alivePlayers.find((p) => p.role === 'villageois'));
    game.afterDayResult();
    expect(game.wolvesAttack).toBe(true);
    const victim = game.alivePlayers.find((p) => p.role === 'villageois');
    runNight({ victim });
    expect(game.deaths).toEqual([victim]);
  });

  it('mystère : les rôles des morts restent cachés', () => {
    game.mode = 'mystere';
    expect(game.revealRoles).toBe(false);
    game.mode = 'classique';
    expect(game.revealRoles).toBe(true);
  });

  it('rejouer redistribue les rôles et remet les potions', () => {
    game.start();
    game.beginNight();
    runNight({ victim: game.alivePlayers.find((p) => p.role === 'villageois'), heal: true });
    expect(game.potions.heal).toBe(false);
    game.start();
    expect(game.phase).toBe('reveal');
    expect(game.potions.heal).toBe(true);
    expect(game.players.every((p) => p.alive)).toBe(true);
    expect(game.nightNumber).toBe(0);
  });
});

describe('narrateur', () => {
  it('se tait sur les écrans secrets : cartes de rôle et actions de nuit', () => {
    expect(game.announcement).toBeNull();
    game.start();
    expect(game.announcement).toBeNull();
    game.beginNight();
    expect(game.announcement).toBe(`Nuit 1. Le village s'endort. Passe le téléphone à ${game.nightPlayer.name}.`);
    game.uncover();
    expect(game.announcement).toBeNull();
    game.chooseVictim(game.alivePlayers.find((p) => p.role === 'villageois'));
    game.nextSleeper();
    expect(game.announcement).toBe(`Passe le téléphone à ${game.nightPlayer.name}.`);
  });

  it('annonce l\'aube, le débat, l\'élimination et la fin avec les rôles révélés', () => {
    game.start();
    game.beginNight();
    const victim = game.alivePlayers.find((p) => p.role === 'villageois');
    runNight({ victim });
    expect(game.announcement).toBe(`Le village se réveille. Cette nuit, ${victim.name}, qui était Villageois, est mort.`);
    game.afterDawn();
    expect(game.announcement).toBe('Le village débat. Désignez ensemble un joueur à éliminer.');
    const wolf = alive('loup');
    game.lynch(wolf);
    expect(game.announcement).toBe(`${wolf.name}, qui était Loup-Garou, est éliminé. La nuit tombe.`);
    game.afterDayResult();
    expect(game.announcement).toBe('Tous les loups-garous sont éliminés. Le village gagne.');
  });

  it('annonce une nuit sans mort, et deux morts', () => {
    game.start();
    game.beginNight();
    runNight({ victim: game.alivePlayers.find((p) => p.role === 'villageois'), heal: true });
    expect(game.announcement).toBe('Le village se réveille. Personne n\'est mort cette nuit.');
    game.afterDawn();
    game.lynch(game.alivePlayers.find((p) => p.role === 'villageois'));
    game.afterDayResult();
    const [v1, v2] = game.alivePlayers.filter((p) => p.role === 'villageois');
    runNight({ victim: v1, poison: v2 });
    expect(game.announcement).toMatch(/Cette nuit, .+ et .+ sont morts\./);
  });

  it('mystère : les annonces ne citent jamais les rôles', () => {
    game.mode = 'mystere';
    game.start();
    game.beginNight();
    const victim = game.alivePlayers.find((p) => p.role === 'villageois');
    runNight({ victim });
    expect(game.announcement).toBe(`Le village se réveille. Cette nuit, ${victim.name} est mort.`);
    game.afterDawn();
    const wolf = alive('loup');
    game.lynch(wolf);
    expect(game.announcement).toBe(`${wolf.name} est éliminé. La nuit tombe.`);
    expect(game.announcement).not.toMatch(/Loup-Garou/);
  });

  it('annonce le chasseur et sa cible, puis la victoire des loups', () => {
    setPlayers(4);
    game.roles = { voyante: false, sorciere: false, chasseur: true };
    game.start();
    game.beginNight();
    const hunter = alive('chasseur');
    runNight({ victim: hunter });
    game.afterDawn();
    expect(game.announcement).toBe(`${hunter.name} était le chasseur. Dans un dernier souffle, il tire sur un joueur.`);
    const target = game.alivePlayers.find((p) => p.role === 'villageois');
    game.shoot(target);
    expect(game.announcement).toBe(`${target.name}, qui était Villageois, est mort.`);
    game.afterHunterShot();
    expect(game.phase).toBe('end');
    expect(game.announcement).toBe('Les loups-garous sont aussi nombreux que les villageois. Les loups-garous gagnent.');
  });

  it('mémorise le narrateur et la voix avec les réglages', () => {
    localStorage.clear();
    game.narrator = true;
    game.voiceURI = 'fr1';
    game.start();
    expect(JSON.parse(localStorage.getItem('loupgarou:settings'))).toMatchObject({ narrator: true, voiceURI: 'fr1' });
    game.narrator = false;
    game.voiceURI = '';
  });
});
