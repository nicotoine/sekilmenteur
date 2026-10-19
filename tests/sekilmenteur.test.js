import { beforeEach, describe, expect, it } from 'vitest';
import { game, CLUE_ROUNDS } from '../src/games/sekilmenteur/state.svelte.js';
import { setPlayers } from './helpers.js';

const liars = () => game.players.filter((p) => p.isLiar);
const innocents = () => game.alivePlayers.filter((p) => !p.isLiar);

beforeEach(() => {
  game.reset();
  game.liarCount = 1;
  game.hintMode = true;
  setPlayers(5);
});

describe('menteurs', () => {
  it.each([[3, 1], [4, 1], [5, 2], [6, 2], [7, 3], [12, 5]])('%i joueurs : %i menteur(s) maximum', (players, max) => {
    setPlayers(players);
    expect(game.maxLiars).toBe(max);
  });

  it('plafonne le nombre demandé : jamais perdu d\'avance', () => {
    game.liarCount = 5;
    game.start();
    expect(liars()).toHaveLength(2);
    expect(game.liarsAlive).toBeLessThan(game.innocentsAlive);
  });

  it('refuse de démarrer sans 3 joueurs valides', () => {
    setPlayers(2);
    game.start();
    expect(game.phase).toBe('setup');
  });
});

describe('déroulé', () => {
  it('passe de la distribution aux tours de parole', () => {
    game.start();
    expect(game.phase).toBe('reveal');
    expect(game.entry.word).toBeTruthy();
    game.beginClues();
    expect(game.phase).toBe('clues');
    expect(game.speakerOrder).toHaveLength(5);
  });

  it(`vote après ${CLUE_ROUNDS} tours de parole`, () => {
    game.start();
    game.beginClues();
    for (let i = 1; i < CLUE_ROUNDS; i++) {
      game.endClueRound();
      expect(game.phase).toBe('clues');
    }
    game.endClueRound();
    expect(game.phase).toBe('vote');
  });

  it('les honnêtes gagnent quand tous les menteurs sont démasqués', () => {
    game.liarCount = 2;
    game.start();
    game.accuse(game.alivePlayers.find((p) => p.isLiar));
    expect(game.outcome).toBeNull();
    game.continueAfterResult();
    expect(game.phase).toBe('clues');
    game.accuse(game.alivePlayers.find((p) => p.isLiar));
    expect(game.outcome).toBe('win');
    game.continueAfterResult();
    expect(game.phase).toBe('end');
  });

  it('les menteurs gagnent quand ils sont aussi nombreux que les honnêtes', () => {
    setPlayers(6);
    game.liarCount = 2;
    game.start();
    game.accuse(innocents()[0]);
    expect(game.outcome).toBeNull();
    game.accuse(innocents()[0]);
    expect(game.outcome).toBe('lose');
  });

  it('une seule erreur suffit à perdre quand le nombre de joueurs est impair et les menteurs au maximum', () => {
    game.liarCount = 2;
    game.start();
    game.accuse(innocents()[0]);
    expect(game.outcome).toBe('lose');
  });

  it('retire le joueur éliminé du tour de parole suivant', () => {
    game.liarCount = 2;
    game.start();
    const out = game.alivePlayers.find((p) => p.isLiar);
    game.accuse(out);
    game.continueAfterResult();
    expect(game.speakerOrder.map((p) => p.name)).not.toContain(out.name);
    expect(game.speakerOrder).toHaveLength(4);
  });

  it('rejouer redistribue les rôles avec les mêmes joueurs', () => {
    game.start();
    game.start();
    expect(game.players.map((p) => p.name)).toEqual(['J1', 'J2', 'J3', 'J4', 'J5']);
    expect(game.players.every((p) => p.alive)).toBe(true);
    expect(game.outcome).toBeNull();
  });
});
