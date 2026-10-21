import { beforeEach, describe, expect, it } from 'vitest';
import { validMode } from '../src/lib/themeUtil.js';
import * as sekilmenteur from '../src/games/sekilmenteur/state.svelte.js';
import * as undercover from '../src/games/undercover/state.svelte.js';
import * as loupgarou from '../src/games/loupgarou/state.svelte.js';
import * as tabou from '../src/games/tabou/state.svelte.js';
import * as timesup from '../src/games/timesup/state.svelte.js';
import * as quisuisje from '../src/games/quisuisje/state.svelte.js';
import * as petitbac from '../src/games/petitbac/state.svelte.js';
import * as actionverite from '../src/games/actionverite/state.svelte.js';
import * as jamais from '../src/games/jamais/state.svelte.js';
import { setPlayers } from './helpers.js';

const all = { sekilmenteur, undercover, loupgarou, tabou, timesup, quisuisje, petitbac, actionverite, jamais };
const entries = Object.entries(all);

describe.each(entries)('modes de %s', (id, { game, MODES }) => {
  it('expose au moins deux modes bien formés, le premier étant le défaut', () => {
    expect(MODES.length).toBeGreaterThanOrEqual(2);
    expect(new Set(MODES.map((m) => m.id)).size).toBe(MODES.length);
    for (const m of MODES) {
      expect(m.id).toMatch(/^[a-z-]+$/);
      expect(m.name).toBeTruthy();
      expect(m.emoji).toBeTruthy();
      expect(m.description.length).toBeGreaterThan(20);
    }
    expect(validMode(MODES, 'inconnu')).toBe(MODES[0].id);
    expect(validMode(MODES, MODES[1].id)).toBe(MODES[1].id);
  });

  it('se souvient du mode choisi au lancement', () => {
    localStorage.clear();
    game.reset();
    setPlayers(6);
    if ('teamNames' in game) game.teamNames = ['', ''];
    game.mode = MODES[1].id;
    game.start();
    expect(game.currentMode.id).toBe(MODES[1].id);
    const saved = JSON.parse(localStorage.getItem(`${id}:settings`));
    expect(saved.mode).toBe(MODES[1].id);
    game.reset();
    game.mode = MODES[0].id;
  });
});

describe('les modes se combinent avec les autres réglages', () => {
  beforeEach(() => setPlayers(6));

  it('Sékilmenteur : espion + 1 tour de parole + 2 menteurs', () => {
    const { game } = sekilmenteur;
    game.reset();
    game.mode = 'espion';
    game.clueRounds = 1;
    game.liarCount = 2;
    game.start();
    game.beginClues();
    game.endClueRound();
    expect(game.phase).toBe('vote');
    expect(game.canSpyGuess).toBe(true);
    game.startSpyGuess();
    game.resolveSpyGuess(game.alivePlayers.find((p) => p.isLiar), false);
    expect(game.liarsAlive).toBe(1);
    game.continueAfterResult();
    expect(game.phase).toBe('clues');
    expect(game.clueRound).toBe(1);
    game.mode = 'classique';
    game.clueRounds = 2;
    game.liarCount = 1;
  });

  it('Undercover : dernière chance + Mr White + 2 undercovers', () => {
    const { game } = undercover;
    game.reset();
    game.mode = 'derniere-chance';
    game.mrWhite = true;
    game.undercoverCount = 2;
    setPlayers(8);
    game.start();
    expect(game.players.filter((p) => p.role === 'undercover')).toHaveLength(2);
    expect(game.players.filter((p) => p.role === 'white')).toHaveLength(1);
    game.accuse(game.alivePlayers.find((p) => p.role === 'undercover'));
    game.continueAfterResult();
    expect(game.phase).toBe('guess');
    game.resolveGuess(false);
    expect(game.phase).toBe('talk');
    game.accuse(game.alivePlayers.find((p) => p.role === 'white'));
    game.continueAfterResult();
    expect(game.phase).toBe('guess');
    game.resolveGuess(true);
    expect(game.outcome).toBe('white');
    game.mode = 'classique';
    game.mrWhite = false;
    game.undercoverCount = 1;
  });

  it('Loup-Garou : première nuit calme + chasseur + 2 loups', () => {
    const { game } = loupgarou;
    game.reset();
    setPlayers(8);
    game.mode = 'douce';
    game.wolfCount = 2;
    game.roles = { voyante: true, sorciere: true, chasseur: true };
    game.start();
    expect(game.players.filter((p) => p.role === 'loup')).toHaveLength(2);
    game.beginNight();
    while (game.phase === 'night') {
      game.uncover();
      game.nextSleeper();
    }
    expect(game.deaths).toEqual([]);
    game.afterDawn();
    game.lynch(game.alivePlayers.find((p) => p.role === 'chasseur'));
    game.afterDayResult();
    expect(game.phase).toBe('hunter');
    game.shoot(game.alivePlayers.find((p) => p.role === 'loup'));
    game.afterHunterShot();
    expect(game.phase).toBe('night');
    expect(game.wolvesAttack).toBe(true);
    game.mode = 'classique';
    game.wolfCount = 1;
  });

  it('Tabou : strict + 1 tour par équipe termine la partie', () => {
    const { game } = tabou;
    game.reset();
    game.teamNames = ['', ''];
    game.mode = 'strict';
    game.turnsPerTeam = 1;
    game.start();
    game.startTurn();
    game.answer('taboo');
    expect(game.phase).toBe('summary');
    game.nextTurn();
    game.startTurn();
    game.answer('found');
    game.endTurn();
    game.nextTurn();
    expect(game.phase).toBe('end');
    expect(game.winnerIndex).toBe(1);
    game.mode = 'classique';
    game.turnsPerTeam = 3;
  });

  it('Petit Bac : éclair sans chrono + 1 manche', () => {
    const { game } = petitbac;
    game.reset();
    game.mode = 'eclair';
    game.roundCount = 1;
    game.start();
    expect(game.currentMode.timed).toBe(false);
    game.startRound();
    game.stopRound();
    game.setScore(0, 10);
    expect(game.roundScores[0]).toBe(10);
    game.validateScores();
    expect(game.phase).toBe('end');
    game.mode = 'classique';
    game.roundCount = 3;
  });

  it('Je n\'ai jamais : dix doigts + 5 vies + thème précis', () => {
    const { game } = jamais;
    game.reset();
    game.mode = 'doigts';
    game.lives = 5;
    game.themeId = 'classique';
    game.start();
    expect(game.players.every((p) => p.lives === 5)).toBe(true);
    expect(game.deck.length + 1).toBe(jamais.game.deck.length + 1);
    game.mode = 'classique';
    game.lives = 10;
    game.themeId = 'all';
  });
});
