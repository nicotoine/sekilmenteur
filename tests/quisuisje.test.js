import { beforeEach, describe, expect, it } from 'vitest';
import { game, themes, MODES } from '../src/games/quisuisje/state.svelte.js';
import { setPlayers } from './helpers.js';

beforeEach(() => {
  game.reset();
  game.laps = 1;
  game.mode = 'classique';
  setPlayers(3);
});

describe('qui suis-je', () => {
  it('tire au sort le premier joueur puis suit l\'ordre des joueurs', () => {
    const firsts = new Set();
    for (let i = 0; i < 60; i++) {
      game.start();
      const first = game.currentIndex;
      firsts.add(first);
      game.nextTurn();
      expect(game.currentIndex).toBe((first + 1) % 3);
    }
    expect(firsts.size).toBe(3);
  });

  it('ne propose que des thèmes de personnes ou de personnages', () => {
    const ids = themes.map((t) => t.id);
    expect(ids).toContain('celebrites');
    expect(ids).toContain('histoire');
    expect(ids).toContain('superheros');
    expect(ids).not.toContain('lieux');
    expect(ids).not.toContain('transports');
    expect(themes.every((t) => !t.adult)).toBe(true);
  });

  it('démarre avec les joueurs saisis, à zéro point', () => {
    game.start();
    expect(game.players.map((p) => p.name)).toEqual(['J1', 'J2', 'J3']);
    expect(game.players.every((p) => p.score === 0)).toBe(true);
    expect(game.totalTurns).toBe(3);
  });

  it('refuse de démarrer sans joueurs valides', () => {
    setPlayers(2);
    game.start();
    expect(game.phase).toBe('setup');
  });

  it('compte les mots trouvés, pas les passés', () => {
    game.start();
    game.startTurn();
    game.answer(true);
    game.answer(false);
    game.answer(true);
    game.endTurn();
    expect(game.found).toHaveLength(2);
    expect(game.passed).toHaveLength(1);
    expect(game.currentPlayer.score).toBe(2);
  });

  it('tire une nouvelle carte à chaque réponse', () => {
    game.start();
    game.startTurn();
    const first = game.card;
    game.answer(false);
    expect(game.card).not.toBe(first);
  });

  it('refait un paquet quand il est épuisé', () => {
    game.start();
    game.deck = ['dernier'];
    game.startTurn();
    expect(game.card).toBe('dernier');
    game.answer(true);
    expect(game.card).toBeTruthy();
    expect(game.deck.length).toBeGreaterThan(100);
  });

  it('fait jouer chacun puis affiche le classement', () => {
    game.laps = 2;
    game.start();
    game.firstIndex = 0;
    const scores = [3, 1, 2, 1, 1, 1];
    for (const n of scores) {
      game.beginCountdown();
      game.startTurn();
      for (let i = 0; i < n; i++) game.answer(true);
      game.endTurn();
      game.nextTurn();
    }
    expect(game.phase).toBe('end');
    expect(game.ranking.map((p) => p.score)).toEqual([4, 3, 2]);
    expect(game.ranking[0].name).toBe('J1');
  });

  it('ignore les réponses hors tour', () => {
    game.start();
    game.answer(true);
    expect(game.found).toHaveLength(0);
  });
});

describe('modes qui suis-je', () => {
  it('propose trois modes', () => {
    expect(MODES.map((m) => m.id)).toEqual(['classique', 'questions', 'malus']);
  });

  it('questions : même décompte que le classique', () => {
    game.mode = 'questions';
    game.start();
    game.startTurn();
    game.answer(true);
    game.answer(false);
    game.endTurn();
    expect(game.currentPlayer.score).toBe(1);
  });

  it('sans pitié : chaque carte passée coûte un point, sans descendre sous zéro', () => {
    game.mode = 'malus';
    game.start();
    game.startTurn();
    game.answer(true);
    game.answer(true);
    game.answer(true);
    game.answer(false);
    expect(game.turnPoints).toBe(2);
    game.endTurn();
    expect(game.currentPlayer.score).toBe(2);
    game.nextTurn();
    game.startTurn();
    game.answer(false);
    game.answer(false);
    game.endTurn();
    expect(game.currentPlayer.score).toBe(0);
  });
});
