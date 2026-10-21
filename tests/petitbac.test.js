import { beforeEach, describe, expect, it } from 'vitest';
import { game, MODES, EASY_LETTERS, HARD_LETTERS } from '../src/games/petitbac/state.svelte.js';
import { themes, pickCategories } from '../src/games/petitbac/themes.js';
import { ALL_THEMES } from '../src/lib/themeUtil.js';
import { setPlayers } from './helpers.js';

beforeEach(() => {
  game.reset();
  game.mode = 'classique';
  game.roundCount = 2;
  game.themeId = ALL_THEMES;
  setPlayers(3);
});

describe('petit bac', () => {
  it('a des thèmes avec au moins 10 catégories chacun', () => {
    expect(themes.length).toBeGreaterThanOrEqual(4);
    for (const t of themes) expect(t.categories.length).toBeGreaterThanOrEqual(10);
  });

  it('tire des catégories uniques', () => {
    const cats = pickCategories(ALL_THEMES, 8);
    expect(cats).toHaveLength(8);
    expect(new Set(cats).size).toBe(8);
  });

  it('propose trois modes', () => {
    expect(MODES.map((m) => [m.id, m.categoryCount, m.timed])).toEqual([['classique', 6, true], ['eclair', 5, false], ['expert', 8, true]]);
  });

  it('refuse de démarrer sans joueurs valides', () => {
    setPlayers(2);
    game.start();
    expect(game.phase).toBe('setup');
  });

  it('prépare une manche avec une lettre et 6 catégories en classique', () => {
    game.start();
    expect(game.phase).toBe('ready');
    expect(game.round).toBe(1);
    expect(EASY_LETTERS).toContain(game.letter);
    expect(game.categories).toHaveLength(6);
    expect(game.maxRoundScore).toBe(12);
    expect(game.players.map((p) => p.score)).toEqual([0, 0, 0]);
  });

  it.each([['eclair', 5], ['expert', 8]])('%s tire %i catégories', (mode, n) => {
    game.mode = mode;
    game.start();
    expect(game.categories).toHaveLength(n);
  });

  it('ne tire les lettres difficiles qu\'en expert', () => {
    game.roundCount = 8;
    for (let i = 0; i < 10; i++) {
      game.start();
      expect(HARD_LETTERS).not.toContain(game.letter);
    }
    game.mode = 'expert';
    expect(game.letters).toEqual([...EASY_LETTERS, ...HARD_LETTERS]);
  });

  it('ne retire pas une lettre déjà jouée', () => {
    game.roundCount = 8;
    game.start();
    const letters = [game.letter];
    for (let i = 1; i < 8; i++) {
      game.startRound();
      game.stopRound();
      game.validateScores();
      letters.push(game.letter);
    }
    expect(new Set(letters).size).toBe(8);
  });

  it('borne les points d\'une manche entre 0 et le maximum', () => {
    game.start();
    game.startRound();
    expect(game.phase).toBe('turn');
    game.setScore(0, 5);
    expect(game.roundScores[0]).toBe(0);
    game.stopRound();
    game.setScore(0, 50);
    game.setScore(1, -3);
    game.setScore(2, 4);
    expect(game.roundScores).toEqual([12, 0, 4]);
  });

  it('additionne les manches puis classe les joueurs', () => {
    game.start();
    game.startRound();
    game.stopRound();
    game.setScore(0, 3);
    game.setScore(1, 5);
    game.validateScores();
    expect(game.phase).toBe('ready');
    expect(game.round).toBe(2);
    game.startRound();
    game.stopRound();
    game.setScore(0, 4);
    game.setScore(2, 1);
    game.validateScores();
    expect(game.phase).toBe('end');
    expect(game.ranking.map((p) => [p.name, p.score])).toEqual([['J1', 7], ['J2', 5], ['J3', 1]]);
  });

  it('ignore les actions hors phase', () => {
    game.start();
    game.stopRound();
    expect(game.phase).toBe('ready');
    game.validateScores();
    expect(game.phase).toBe('ready');
  });
});
