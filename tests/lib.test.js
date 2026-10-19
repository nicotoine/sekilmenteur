import { beforeEach, describe, expect, it } from 'vitest';
import { roster } from '../src/lib/roster.svelte.js';
import { shuffle } from '../src/lib/shuffle.js';
import { ALL_THEMES, loadThemes, themePool } from '../src/lib/themeUtil.js';
import { bankThemes, pickWords } from '../src/lib/wordBank.js';

describe('roster', () => {
  beforeEach(() => {
    roster.names = ['', '', ''];
  });

  it('est invalide sous 3 joueurs nommés', () => {
    roster.names = ['A', 'B', ''];
    expect(roster.isValid).toBe(false);
  });

  it('détecte les doublons sans tenir compte de la casse', () => {
    roster.names = ['Alice', 'alice', 'Bob'];
    expect(roster.hasDuplicates).toBe(true);
    expect(roster.isValid).toBe(false);
  });

  it('accepte 3 joueurs distincts', () => {
    roster.names = ['A', 'B', 'C'];
    expect(roster.isValid).toBe(true);
  });

  it('plafonne à 12 joueurs et garde au moins 3 champs', () => {
    for (let i = 0; i < 20; i++) roster.add();
    expect(roster.names).toHaveLength(12);
    for (let i = 0; i < 20; i++) roster.remove(0);
    expect(roster.names).toHaveLength(3);
  });
});

describe('shuffle', () => {
  it('garde les mêmes éléments sans modifier la liste d\'origine', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const output = shuffle(input);
    expect(output).not.toBe(input);
    expect([...output].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('themeUtil', () => {
  const themes = [
    { id: 'a', name: 'A', words: ['a1', 'a2'] },
    { id: 'b', name: 'B', words: ['b1'], adult: true },
  ];

  it('exclut les thèmes adultes de « Tous »', () => {
    expect(themePool(themes, ALL_THEMES, 'words')).toEqual(['a1', 'a2']);
  });

  it('permet de choisir un thème adulte explicitement', () => {
    expect(themePool(themes, 'b', 'words')).toEqual(['b1']);
  });

  it('ignore les thèmes mal formés', () => {
    expect(loadThemes({ x: { id: 'x' }, y: { id: 'y', name: 'Y', words: [] }, z: themes[0] }, 'words')).toEqual([themes[0]]);
  });
});

describe('wordBank', () => {
  it('n\'expose aucun thème adulte', () => {
    expect(bankThemes.length).toBeGreaterThan(0);
    expect(bankThemes.every((t) => !t.adult)).toBe(true);
  });

  it('tire des mots uniques en respectant le nombre demandé', () => {
    const words = pickWords(bankThemes, ALL_THEMES, 40);
    expect(words).toHaveLength(40);
    expect(new Set(words).size).toBe(40);
    expect(words.every((w) => typeof w === 'string')).toBe(true);
  });
});
