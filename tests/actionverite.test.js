import { beforeEach, describe, expect, it } from 'vitest';
import { game, MODES, KIND } from '../src/games/actionverite/state.svelte.js';
import { themes, buildTruths, buildDares } from '../src/games/actionverite/themes.js';
import { ALL_THEMES } from '../src/lib/themeUtil.js';
import { setPlayers } from './helpers.js';

beforeEach(() => {
  game.reset();
  game.mode = 'classique';
  game.themeId = ALL_THEMES;
  setPlayers(3);
});

describe('action ou vérité', () => {
  it('charge des thèmes avec vérités et actions, le thème soirée en 18+', () => {
    expect(themes.length).toBeGreaterThanOrEqual(3);
    expect(themes.find((t) => t.id === 'soiree').adult).toBe(true);
    expect(buildTruths(ALL_THEMES).length).toBeGreaterThanOrEqual(60);
    expect(buildDares(ALL_THEMES).length).toBeGreaterThanOrEqual(60);
  });

  it('« Tous » exclut le thème 18+', () => {
    const adult = themes.find((t) => t.id === 'soiree');
    const all = buildTruths(ALL_THEMES);
    expect(all.some((q) => adult.truths.includes(q))).toBe(false);
    expect(buildTruths('soiree').every((q) => adult.truths.includes(q))).toBe(true);
  });

  it('propose trois modes', () => {
    expect(MODES.map((m) => m.id)).toEqual(['classique', 'roulette', 'actions']);
    expect(KIND.truth.name).toBe('Vérité');
  });

  it('refuse de démarrer sans joueurs valides', () => {
    setPlayers(2);
    game.start();
    expect(game.phase).toBe('setup');
  });

  it('classique : chacun choisit, puis le tour passe', () => {
    game.start();
    expect(game.phase).toBe('pick');
    expect(game.currentPlayer.name).toBe('J1');
    game.choose('truth');
    expect(game.phase).toBe('card');
    expect(game.kind).toBe('truth');
    expect(game.card.endsWith('?')).toBe(true);
    game.resolve(true);
    expect(game.currentPlayer.name).toBe('J2');
    expect(game.players[0].done).toBe(1);
    game.choose('dare');
    expect(game.card.endsWith('?')).toBe(false);
    game.resolve(false);
    expect(game.players[1].chickened).toBe(1);
    expect(game.currentPlayer.name).toBe('J3');
  });

  it('roulette : le téléphone choisit', () => {
    game.mode = 'roulette';
    game.start();
    const kinds = new Set();
    for (let i = 0; i < 40; i++) {
      game.choose();
      kinds.add(game.kind);
      game.resolve(true);
    }
    expect(kinds).toEqual(new Set(['truth', 'dare']));
  });

  it('que des actions : la vérité est refusée', () => {
    game.mode = 'actions';
    game.start();
    expect(game.choices).toEqual(['dare']);
    game.choose('truth');
    expect(game.phase).toBe('pick');
    game.choose('dare');
    expect(game.kind).toBe('dare');
  });

  it('ne repioche jamais la même carte avant d\'épuiser la pile', () => {
    game.start();
    const total = game.dares.length;
    const seen = new Set();
    for (let i = 0; i < total; i++) {
      game.choose('dare');
      expect(seen.has(game.card)).toBe(false);
      seen.add(game.card);
      game.resolve(true);
    }
    game.choose('dare');
    expect(game.card).toBeTruthy();
    expect(game.dares.length).toBe(total - 1);
  });

  it('termine la partie avec un classement et le plus dégonflé', () => {
    game.start();
    expect(game.biggestChicken).toBeNull();
    game.choose('dare');
    game.resolve(false);
    game.choose('dare');
    game.resolve(true);
    game.finish();
    expect(game.phase).toBe('end');
    expect(game.biggestChicken.name).toBe('J1');
    expect(game.ranking[0].name).toBe('J2');
  });

  it('ignore les actions hors phase', () => {
    game.start();
    game.resolve(true);
    expect(game.players[0].done).toBe(0);
    game.choose('truth');
    game.choose('dare');
    expect(game.kind).toBe('truth');
  });
});
