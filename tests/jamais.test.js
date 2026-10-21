import { beforeEach, describe, expect, it } from 'vitest';
import { game, MODES, LIVES_OPTIONS } from '../src/games/jamais/state.svelte.js';
import { themes, buildDeck } from '../src/games/jamais/themes.js';
import { ALL_THEMES } from '../src/lib/themeUtil.js';
import { roster } from '../src/lib/roster.svelte.js';
import { setPlayers } from './helpers.js';

beforeEach(() => {
  game.reset();
  game.mode = 'classique';
  game.lives = 10;
  game.themeId = ALL_THEMES;
  setPlayers(3);
});

describe('je n\'ai jamais', () => {
  it('charge des thèmes dont un 18+ exclu de « Tous »', () => {
    expect(themes.length).toBeGreaterThanOrEqual(4);
    const adult = themes.find((t) => t.adult);
    expect(adult).toBeTruthy();
    expect(buildDeck(ALL_THEMES).some((s) => adult.statements.includes(s))).toBe(false);
    expect(buildDeck(ALL_THEMES).every((s) => s.startsWith('Je n’ai jamais '))).toBe(true);
  });

  it('propose deux modes et des options de vies', () => {
    expect(MODES.map((m) => [m.id, m.tracked])).toEqual([['classique', false], ['doigts', true]]);
    expect(LIVES_OPTIONS).toEqual([5, 10]);
  });

  it('classique : démarre sans joueurs et enchaîne les cartes', () => {
    roster.names = ['', '', ''];
    expect(game.canStart).toBe(true);
    game.start();
    expect(game.phase).toBe('card');
    expect(game.players).toEqual([]);
    const first = game.card;
    game.next();
    expect(game.card).not.toBe(first);
    expect(game.index).toBe(2);
    game.finish();
    expect(game.phase).toBe('end');
    expect(game.loser).toBeNull();
  });

  it('dix doigts : exige des joueurs', () => {
    game.mode = 'doigts';
    roster.names = ['', '', ''];
    expect(game.canStart).toBe(false);
    setPlayers(3);
    expect(game.canStart).toBe(true);
  });

  it('dix doigts : les coupables perdent une vie, le premier à zéro finit la partie', () => {
    game.mode = 'doigts';
    game.lives = 5;
    game.start();
    expect(game.players.map((p) => p.lives)).toEqual([5, 5, 5]);
    const [a, b] = game.players;
    game.toggle(a);
    game.toggle(b);
    game.toggle(b);
    expect(game.marked).toEqual([a]);
    game.next();
    expect(a.lives).toBe(4);
    expect(b.lives).toBe(5);
    expect(game.marked).toEqual([]);
    for (let i = 0; i < 3; i++) {
      game.toggle(a);
      game.next();
    }
    expect(a.lives).toBe(1);
    expect(game.phase).toBe('card');
    game.toggle(a);
    game.next();
    expect(a.lives).toBe(0);
    expect(game.phase).toBe('end');
    expect(game.loser).toBe(a);
    expect(game.ranking.at(-1)).toBe(a);
  });

  it('refait un paquet quand il est épuisé', () => {
    game.start();
    game.deck = ['Je n’ai jamais testé.'];
    game.next();
    expect(game.card).toBe('Je n’ai jamais testé.');
    game.next();
    expect(game.deck.length).toBeGreaterThan(50);
  });

  it('ignore le marquage en mode classique et hors phase', () => {
    game.start();
    game.toggle({ name: 'X', lives: 3 });
    expect(game.marked).toEqual([]);
    game.finish();
    game.next();
    expect(game.phase).toBe('end');
  });
});
