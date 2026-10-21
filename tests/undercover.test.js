import { beforeEach, describe, expect, it } from 'vitest';
import { game, MODES } from '../src/games/undercover/state.svelte.js';
import { setPlayers } from './helpers.js';

const count = (role) => game.players.filter((p) => p.role === role).length;
const alive = (role) => game.alivePlayers.find((p) => p.role === role);

beforeEach(() => {
  game.reset();
  game.undercoverCount = 1;
  game.mrWhite = false;
  game.mode = 'classique';
  setPlayers(5);
});

describe('réglages', () => {
  it('impose au moins 1 intrus et moins d\'intrus que de civils', () => {
    setPlayers(4);
    game.undercoverCount = 9;
    expect(game.effectiveUndercoverCount).toBe(1);
    setPlayers(7);
    expect(game.effectiveUndercoverCount).toBe(3);
  });

  it('avec Mr White, l\'undercover devient facultatif et le total d\'intrus reste borné', () => {
    game.mrWhite = true;
    setPlayers(3);
    expect(game.minUndercovers).toBe(0);
    expect(game.maxUndercovers).toBe(0);
    setPlayers(5);
    game.undercoverCount = 5;
    expect(game.effectiveUndercoverCount).toBe(1);
  });
});

describe('distribution', () => {
  it('répartit les rôles demandés', () => {
    game.start();
    expect(count('undercover')).toBe(1);
    expect(count('white')).toBe(0);
    expect(count('civil')).toBe(4);
  });

  it('ajoute Mr White', () => {
    game.mrWhite = true;
    game.undercoverCount = 1;
    game.start();
    expect(count('undercover')).toBe(1);
    expect(count('white')).toBe(1);
    expect(count('civil')).toBe(3);
  });

  it('donne deux mots proches mais différents', () => {
    game.start();
    expect(game.words.civil).toBeTruthy();
    expect(game.words.undercover).toBeTruthy();
    expect(game.words.civil).not.toBe(game.words.undercover);
  });

  it('ne fait jamais commencer Mr White', () => {
    game.mrWhite = true;
    for (let i = 0; i < 40; i++) {
      game.start();
      expect(game.players[game.startOffset].role).not.toBe('white');
    }
  });
});

describe('déroulé', () => {
  it('les civils gagnent quand tous les intrus sont éliminés', () => {
    game.start();
    game.accuse(alive('undercover'));
    expect(game.outcome).toBe('civils');
    game.continueAfterResult();
    expect(game.phase).toBe('end');
  });

  it('les intrus gagnent à égalité avec les civils', () => {
    game.start();
    for (let i = 0; i < 2; i++) {
      game.accuse(alive('civil'));
      expect(game.outcome).toBeNull();
      game.continueAfterResult();
    }
    game.accuse(alive('civil'));
    expect(game.outcome).toBe('intruders');
  });

  it('Mr White éliminé a une dernière chance', () => {
    game.mrWhite = true;
    game.start();
    game.accuse(alive('white'));
    game.continueAfterResult();
    expect(game.phase).toBe('guess');
    game.resolveGuess(false);
    expect(game.phase).toBe('talk');
    expect(game.outcome).toBeNull();
  });

  it('Mr White gagne s\'il devine le mot', () => {
    game.mrWhite = true;
    game.start();
    game.accuse(alive('white'));
    game.continueAfterResult();
    game.resolveGuess(true);
    expect(game.outcome).toBe('white');
    expect(game.phase).toBe('end');
  });

  it('Mr White peut encore gagner même si les civils viennent de gagner', () => {
    game.mrWhite = true;
    game.undercoverCount = 0;
    game.start();
    game.accuse(alive('white'));
    expect(game.outcome).toBe('civils');
    game.continueAfterResult();
    expect(game.phase).toBe('guess');
    game.resolveGuess(true);
    expect(game.outcome).toBe('white');
  });

  it('pas de dernière chance quand les intrus ont déjà gagné', () => {
    game.mrWhite = true;
    setPlayers(3);
    game.start();
    game.accuse(alive('civil'));
    expect(game.outcome).toBe('intruders');
    game.continueAfterResult();
    expect(game.phase).toBe('end');
  });
});

describe('mode classique', () => {
  it('un undercover éliminé ne devine pas', () => {
    game.undercoverCount = 2;
    game.start();
    game.accuse(alive('undercover'));
    expect(game.accusedMayGuess).toBe(false);
    game.continueAfterResult();
    expect(game.phase).toBe('talk');
  });
});

describe('mode dernière chance', () => {
  beforeEach(() => {
    game.mode = 'derniere-chance';
  });

  it('un undercover éliminé tente de deviner le mot des civils', () => {
    game.start();
    game.accuse(alive('undercover'));
    expect(game.outcome).toBe('civils');
    expect(game.accusedMayGuess).toBe(true);
    game.continueAfterResult();
    expect(game.phase).toBe('guess');
  });

  it('les intrus gagnent si l\'undercover trouve', () => {
    game.start();
    game.accuse(alive('undercover'));
    game.continueAfterResult();
    game.resolveGuess(true);
    expect(game.outcome).toBe('intruders');
    expect(game.endReason).toBe('guessed');
    expect(game.phase).toBe('end');
  });

  it('les civils gagnent si le dernier undercover se trompe', () => {
    game.start();
    game.accuse(alive('undercover'));
    game.continueAfterResult();
    game.resolveGuess(false);
    expect(game.outcome).toBe('civils');
    expect(game.phase).toBe('end');
  });

  it('Mr White garde sa dernière chance et gagne seul', () => {
    game.mrWhite = true;
    game.start();
    game.accuse(alive('white'));
    game.continueAfterResult();
    expect(game.phase).toBe('guess');
    game.resolveGuess(true);
    expect(game.outcome).toBe('white');
  });

  it('un civil éliminé ne devine rien', () => {
    game.start();
    game.accuse(alive('civil'));
    expect(game.accusedMayGuess).toBe(false);
  });

  it('pas de dernière chance si les intrus ont déjà gagné', () => {
    setPlayers(7);
    game.undercoverCount = 2;
    game.start();
    for (let i = 0; i < 2; i++) {
      game.accuse(alive('civil'));
      expect(game.outcome).toBeNull();
      game.continueAfterResult();
      expect(game.phase).toBe('talk');
    }
    game.accuse(alive('civil'));
    expect(game.outcome).toBe('intruders');
    expect(game.accusedMayGuess).toBe(false);
    game.continueAfterResult();
    expect(game.phase).toBe('end');
  });
});

describe('mode sans pitié', () => {
  beforeEach(() => {
    game.mode = 'sans-pitie';
    game.mrWhite = true;
  });

  it('Mr White éliminé ne devine pas', () => {
    game.start();
    game.accuse(alive('white'));
    expect(game.accusedMayGuess).toBe(false);
    game.continueAfterResult();
    expect(game.phase).toBe('talk');
    expect(game.outcome).toBeNull();
  });

  it('un undercover éliminé ne devine pas non plus', () => {
    game.start();
    game.accuse(alive('undercover'));
    expect(game.accusedMayGuess).toBe(false);
  });
});

describe('modes', () => {
  it('propose trois modes aux identifiants uniques', () => {
    expect(MODES.map((m) => m.id)).toEqual(['classique', 'derniere-chance', 'sans-pitie']);
  });

  it('ignore une réponse hors phase de devinette', () => {
    game.start();
    game.resolveGuess(true);
    expect(game.outcome).toBeNull();
    expect(game.phase).toBe('reveal');
  });
});
