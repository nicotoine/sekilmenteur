import { beforeEach, describe, expect, it } from 'vitest';
import { game, ROUNDS, MODES } from '../src/games/timesup/state.svelte.js';

beforeEach(() => {
  game.reset();
  game.teamNames = ['', ''];
  game.cardCount = 20;
  game.turnSeconds = 45;
  game.mode = 'classique';
});

const start = () => {
  game.start();
  game.teamIndex = 0;
};

const clearPile = (timeLeft) => {
  game.startTurn();
  game.setTimeLeft(timeLeft);
  while (game.phase === 'turn') game.found();
};

describe('time\'s up', () => {
  it('tire au sort l\'équipe qui commence', () => {
    const firsts = new Set();
    for (let i = 0; i < 50; i++) {
      game.start();
      firsts.add(game.teamIndex);
    }
    expect([...firsts].sort()).toEqual([0, 1]);
  });

  it('prépare le nombre de cartes demandé, sans doublon', () => {
    start();
    expect(game.cards).toHaveLength(20);
    expect(new Set(game.cards).size).toBe(20);
    expect(game.pile).toHaveLength(20);
    expect(ROUNDS).toHaveLength(3);
  });

  it('marque un point par carte trouvée pour l\'équipe et la manche en cours', () => {
    start();
    game.startTurn();
    game.found();
    game.found();
    expect(game.scores[0]).toEqual([2, 0, 0]);
    expect(game.turnFound).toHaveLength(2);
  });

  it('passer remet la carte en bas de la pile sans perdre de carte', () => {
    start();
    game.startTurn();
    const first = game.currentCard;
    game.skip();
    expect(game.currentCard).not.toBe(first);
    expect(game.pile).toHaveLength(20);
    expect(game.pile.at(-1)).toBe(first);
  });

  it('ne peut pas passer la dernière carte', () => {
    game.cardCount = 20;
    start();
    game.startTurn();
    game.setTimeLeft(10);
    while (game.pile.length > 1) game.found();
    const last = game.currentCard;
    game.skip();
    expect(game.currentCard).toBe(last);
  });

  it('change d\'équipe à la fin d\'un tour sans finir la pile', () => {
    start();
    game.startTurn();
    game.found();
    game.endTurn();
    expect(game.carryover).toBe(0);
    game.afterSummary();
    expect(game.teamIndex).toBe(1);
    expect(game.phase).toBe('ready');
  });

  it('reporte le temps restant : la même équipe commence la manche suivante', () => {
    start();
    clearPile(12);
    expect(game.roundOver).toBe(true);
    expect(game.carryover).toBe(12);
    game.afterSummary();
    expect(game.phase).toBe('roundEnd');
    game.nextRound();
    expect(game.round).toBe(2);
    expect(game.teamIndex).toBe(0);
    expect(game.turnDuration).toBe(12);
    expect(game.pile).toHaveLength(20);
  });

  it('rejoue les mêmes cartes à chaque manche et finit après la manche 3', () => {
    start();
    for (let round = 1; round <= 3; round++) {
      expect([...game.pile].sort()).toEqual([...game.cards].sort());
      clearPile(10);
      game.afterSummary();
      game.nextRound();
    }
    expect(game.phase).toBe('end');
    expect(game.totals).toEqual([60, 0]);
    expect(game.winnerIndex).toBe(0);
  });

  it('change d\'équipe à la manche suivante quand il ne reste aucun temps', () => {
    start();
    clearPile(0);
    game.afterSummary();
    game.nextRound();
    expect(game.teamIndex).toBe(1);
    expect(game.turnDuration).toBe(45);
  });

  it('ignore trouvé hors tour', () => {
    start();
    game.found();
    expect(game.scores[0]).toEqual([0, 0, 0]);
  });
});

describe('modes time\'s up', () => {
  it('propose trois modes avec un nombre de manches différent', () => {
    expect(MODES.map((m) => [m.id, m.rounds.length])).toEqual([['classique', 3], ['express', 2], ['expert', 4]]);
    expect(MODES.every((m) => m.rounds.every((r) => r.title && r.rule))).toBe(true);
  });

  it('express : la partie finit après deux manches, les scores ont deux colonnes', () => {
    game.mode = 'express';
    game.start();
    expect(game.scores).toEqual([[0, 0], [0, 0]]);
    expect(game.rounds.map((r) => r.title)).toEqual(['Décris librement', 'Mime']);
    for (let round = 1; round <= 2; round++) {
      clearPile(5);
      game.afterSummary();
      game.nextRound();
    }
    expect(game.phase).toBe('end');
    expect(game.totals).toEqual([40, 0]);
  });

  it('expert : quatre manches, la dernière est une pose', () => {
    game.mode = 'expert';
    game.start();
    expect(game.scores[0]).toHaveLength(4);
    expect(game.rounds.at(-1).title).toBe('Une pose');
    for (let round = 1; round <= 3; round++) {
      clearPile(5);
      game.afterSummary();
      game.nextRound();
    }
    expect(game.phase).toBe('ready');
    expect(game.round).toBe(4);
    clearPile(5);
    game.afterSummary();
    game.nextRound();
    expect(game.phase).toBe('end');
  });
});
