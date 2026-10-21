import { beforeEach, describe, expect, it } from 'vitest';
import { game, CLUE_ROUNDS, MODES } from '../src/games/sekilmenteur/state.svelte.js';
import { setPlayers } from './helpers.js';

const liars = () => game.players.filter((p) => p.isLiar);
const innocents = () => game.alivePlayers.filter((p) => !p.isLiar);

beforeEach(() => {
  game.reset();
  game.liarCount = 1;
  game.hintMode = true;
  game.mode = 'classique';
  game.clueRounds = CLUE_ROUNDS;
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

describe('tours de parole réglables', () => {
  it.each([1, 2, 3])('vote après %i tour(s)', (rounds) => {
    game.clueRounds = rounds;
    game.start();
    game.beginClues();
    for (let i = 1; i < rounds; i++) {
      game.endClueRound();
      expect(game.phase).toBe('clues');
    }
    game.endClueRound();
    expect(game.phase).toBe('vote');
  });

  it('repart du tour 1 après une élimination', () => {
    setPlayers(7);
    game.clueRounds = 3;
    game.liarCount = 2;
    game.start();
    game.beginClues();
    game.endClueRound();
    game.endClueRound();
    game.endClueRound();
    game.accuse(innocents()[0]);
    game.continueAfterResult();
    expect(game.clueRound).toBe(1);
  });
});

describe('mode classique', () => {
  it('ne donne aucune seconde chance au menteur démasqué', () => {
    game.liarCount = 2;
    game.start();
    game.accuse(liars()[0]);
    expect(game.accusedMayGuess).toBe(false);
    game.continueAfterResult();
    expect(game.phase).toBe('clues');
  });

  it('ne permet pas de se dévoiler', () => {
    game.start();
    game.beginClues();
    expect(game.canSpyGuess).toBe(false);
    game.startSpyGuess();
    expect(game.phase).toBe('clues');
  });
});

describe('mode dernière chance', () => {
  beforeEach(() => {
    game.mode = 'derniere-chance';
  });

  it('propose au menteur démasqué de deviner le mot', () => {
    game.start();
    game.accuse(liars()[0]);
    expect(game.outcome).toBe('win');
    expect(game.accusedMayGuess).toBe(true);
    game.continueAfterResult();
    expect(game.phase).toBe('guess');
    expect(game.guesser).toBe(game.accused);
  });

  it('les menteurs gagnent si le mot est deviné', () => {
    game.start();
    game.accuse(liars()[0]);
    game.continueAfterResult();
    game.resolveGuess(true);
    expect(game.outcome).toBe('lose');
    expect(game.endReason).toBe('guessed');
    expect(game.phase).toBe('end');
  });

  it('la partie reprend son cours si le menteur se trompe', () => {
    game.liarCount = 2;
    game.start();
    game.accuse(liars()[0]);
    game.continueAfterResult();
    game.resolveGuess(false);
    expect(game.outcome).toBeNull();
    expect(game.phase).toBe('clues');
    expect(game.alivePlayers).toHaveLength(4);
  });

  it('les honnêtes gagnent si le dernier menteur se trompe', () => {
    game.start();
    game.accuse(liars()[0]);
    game.continueAfterResult();
    game.resolveGuess(false);
    expect(game.outcome).toBe('win');
    expect(game.phase).toBe('end');
  });

  it('un honnête éliminé ne devine rien', () => {
    game.liarCount = 2;
    setPlayers(7);
    game.start();
    game.accuse(innocents()[0]);
    expect(game.accusedMayGuess).toBe(false);
    game.continueAfterResult();
    expect(game.phase).toBe('clues');
  });

  it('pas de dernière chance quand les menteurs ont déjà gagné', () => {
    game.liarCount = 2;
    game.start();
    game.accuse(innocents()[0]);
    expect(game.outcome).toBe('lose');
    expect(game.accusedMayGuess).toBe(false);
    game.continueAfterResult();
    expect(game.phase).toBe('end');
  });

  it('ignore une réponse hors phase de devinette', () => {
    game.start();
    game.resolveGuess(true);
    expect(game.phase).toBe('reveal');
    expect(game.outcome).toBeNull();
  });
});

describe('mode espion', () => {
  beforeEach(() => {
    game.mode = 'espion';
  });

  it('permet de se dévoiler pendant les tours de parole et le vote', () => {
    game.start();
    expect(game.canSpyGuess).toBe(false);
    game.beginClues();
    expect(game.canSpyGuess).toBe(true);
    game.endClueRound();
    game.endClueRound();
    expect(game.phase).toBe('vote');
    expect(game.canSpyGuess).toBe(true);
  });

  it('les menteurs gagnent si le menteur dévoilé trouve le mot', () => {
    game.start();
    game.beginClues();
    game.startSpyGuess();
    expect(game.phase).toBe('spyGuess');
    game.resolveSpyGuess(liars()[0], true);
    expect(game.outcome).toBe('lose');
    expect(game.endReason).toBe('guessed');
    expect(game.guesser).toBe(liars()[0]);
    expect(game.phase).toBe('end');
  });

  it('un menteur qui se trompe est éliminé', () => {
    game.liarCount = 2;
    game.start();
    game.beginClues();
    game.startSpyGuess();
    const spy = liars()[0];
    game.resolveSpyGuess(spy, false);
    expect(spy.alive).toBe(false);
    expect(game.phase).toBe('result');
    expect(game.outcome).toBeNull();
    game.continueAfterResult();
    expect(game.phase).toBe('clues');
  });

  it('le dernier menteur qui se trompe fait gagner les honnêtes', () => {
    game.start();
    game.beginClues();
    game.startSpyGuess();
    game.resolveSpyGuess(liars()[0], false);
    expect(game.outcome).toBe('win');
  });

  it('un honnête qui bluffe est éliminé, même s\'il connaît le mot', () => {
    game.liarCount = 2;
    setPlayers(7);
    game.start();
    game.beginClues();
    game.startSpyGuess();
    const bluffer = innocents()[0];
    game.resolveSpyGuess(bluffer, true);
    expect(bluffer.alive).toBe(false);
    expect(game.outcome).toBeNull();
    expect(game.phase).toBe('result');
  });

  it('annuler revient à la phase en cours', () => {
    game.start();
    game.beginClues();
    game.startSpyGuess();
    game.cancelSpyGuess();
    expect(game.phase).toBe('clues');
    game.endClueRound();
    game.endClueRound();
    game.startSpyGuess();
    game.cancelSpyGuess();
    expect(game.phase).toBe('vote');
  });

  it('le menteur démasqué par vote n\'a pas de seconde chance', () => {
    game.liarCount = 2;
    game.start();
    game.accuse(liars()[0]);
    expect(game.accusedMayGuess).toBe(false);
  });
});

describe('modes', () => {
  it('propose trois modes aux identifiants uniques', () => {
    expect(MODES.map((m) => m.id)).toEqual(['classique', 'derniere-chance', 'espion']);
    expect(game.currentMode.id).toBe('classique');
  });
});
