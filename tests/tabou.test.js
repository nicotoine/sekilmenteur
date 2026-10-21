import { beforeEach, describe, expect, it } from 'vitest';
import { game, MODES } from '../src/games/tabou/state.svelte.js';

beforeEach(() => {
  game.reset();
  game.teamNames = ['', ''];
  game.turnsPerTeam = 2;
  game.mode = 'classique';
});

const playTurn = (...answers) => {
  game.startTurn();
  answers.forEach((a) => game.answer(a));
  game.endTurn();
};

describe('tabou', () => {
  it('donne un nom par défaut aux équipes sans nom', () => {
    game.teamNames = ['Chats', ''];
    expect(game.displayNames).toEqual(['Chats', 'Équipe 2']);
  });

  it('alterne les équipes et compte les tours', () => {
    game.start();
    expect(game.totalTurns).toBe(4);
    expect(game.teamIndex).toBe(0);
    playTurn();
    game.nextTurn();
    expect(game.teamIndex).toBe(1);
    expect(game.phase).toBe('ready');
  });

  it('marque +1 par mot trouvé, -1 par tabou, 0 pour un passé', () => {
    game.start();
    playTurn('found', 'found', 'taboo', 'skip', 'found');
    expect(game.turnPoints).toBe(2);
    expect(game.scores).toEqual([2, 0]);
    expect(game.turnLog).toHaveLength(5);
  });

  it('autorise un score négatif', () => {
    game.start();
    playTurn('taboo', 'taboo');
    expect(game.scores[0]).toBe(-2);
  });

  it('ne reprend pas deux fois la même carte avant d\'épuiser le paquet', () => {
    game.start();
    game.startTurn();
    const seen = new Set([game.card.word]);
    for (let i = 0; i < 30; i++) {
      game.answer('skip');
      expect(seen.has(game.card.word)).toBe(false);
      seen.add(game.card.word);
    }
  });

  it('chaque carte a 5 mots interdits', () => {
    game.start();
    game.startTurn();
    expect(game.card.forbidden).toHaveLength(5);
  });

  it('ignore les réponses hors tour', () => {
    game.start();
    game.answer('found');
    game.endTurn();
    expect(game.scores).toEqual([0, 0]);
  });

  it('termine la partie et désigne le gagnant ou l\'égalité', () => {
    game.turnsPerTeam = 1;
    game.start();
    playTurn('found', 'found');
    game.nextTurn();
    playTurn('found');
    game.nextTurn();
    expect(game.phase).toBe('end');
    expect(game.winnerIndex).toBe(0);

    game.start();
    playTurn('found');
    game.nextTurn();
    playTurn('found');
    game.nextTurn();
    expect(game.winnerIndex).toBe(-1);
  });
});

describe('modes tabou', () => {
  it('propose trois modes', () => {
    expect(MODES.map((m) => m.id)).toEqual(['classique', 'strict', 'doux']);
  });

  it('strict : un tabou coûte 1 point et termine le tour', () => {
    game.mode = 'strict';
    game.start();
    game.startTurn();
    game.answer('found');
    game.answer('taboo');
    expect(game.phase).toBe('summary');
    expect(game.turnPoints).toBe(0);
    expect(game.scores).toEqual([0, 0]);
    game.answer('found');
    expect(game.turnLog).toHaveLength(2);
  });

  it('doux : un tabou ne coûte rien et le tour continue', () => {
    game.mode = 'doux';
    game.start();
    game.startTurn();
    const first = game.card.word;
    game.answer('taboo');
    expect(game.phase).toBe('turn');
    expect(game.card.word).not.toBe(first);
    game.answer('found');
    game.endTurn();
    expect(game.turnPoints).toBe(1);
    expect(game.scores).toEqual([1, 0]);
    expect(game.points.taboo).toBe(0);
  });

  it('classique : un tabou coûte 1 point sans arrêter le tour', () => {
    game.start();
    playTurn('taboo', 'found');
    expect(game.scores).toEqual([0, 0]);
    expect(game.currentMode.tabooEndsTurn).toBe(false);
  });
});
