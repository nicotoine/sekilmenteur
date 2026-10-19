import { describe, expect, it } from 'vitest';

const load = (glob) => Object.entries(glob).map(([path, theme]) => ({ path, theme }));

const sekilmenteur = load(import.meta.glob('../src/games/sekilmenteur/themes/*.json', { eager: true, import: 'default' }));
const undercover = load(import.meta.glob('../src/games/undercover/themes/*.json', { eager: true, import: 'default' }));
const tabou = load(import.meta.glob('../src/games/tabou/themes/*.json', { eager: true, import: 'default' }));

const lower = (s) => s.trim().toLowerCase();

describe.each([
  ['sekilmenteur', sekilmenteur, 'words'],
  ['undercover', undercover, 'pairs'],
  ['tabou', tabou, 'cards'],
])('thèmes %s', (_game, themes, key) => {
  it('contient des thèmes', () => {
    expect(themes.length).toBeGreaterThan(0);
  });

  it('a des identifiants uniques', () => {
    const ids = themes.map((t) => t.theme.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(themes.map((t) => [t.path, t.theme]))('%s a la bonne forme', (_path, theme) => {
    expect(theme.id).toMatch(/^[a-z0-9-]+$/);
    expect(theme.name).toBeTruthy();
    expect(theme.emoji).toBeTruthy();
    expect(theme[key].length).toBeGreaterThanOrEqual(30);
    if ('adult' in theme) expect(theme.adult).toBe(true);
  });
});

describe('thèmes sekilmenteur', () => {
  it.each(sekilmenteur.map((t) => [t.theme.id, t.theme]))('%s : mots et indices sans doublon', (_id, theme) => {
    for (const entry of theme.words) {
      expect(entry.word.trim()).not.toBe('');
      expect(entry.hint.trim()).not.toBe('');
    }
    const words = theme.words.map((e) => lower(e.word));
    expect(new Set(words).size).toBe(words.length);
  });
});

describe('thèmes undercover', () => {
  it.each(undercover.map((t) => [t.theme.id, t.theme]))('%s : paires distinctes', (_id, theme) => {
    for (const { civil, undercover: other } of theme.pairs) {
      expect(civil.trim()).not.toBe('');
      expect(other.trim()).not.toBe('');
      expect(lower(civil)).not.toBe(lower(other));
    }
  });
});

describe('thèmes tabou', () => {
  it.each(tabou.map((t) => [t.theme.id, t.theme]))('%s : 5 interdits distincts par carte', (_id, theme) => {
    for (const card of theme.cards) {
      expect(card.forbidden).toHaveLength(5);
      expect(new Set(card.forbidden.map(lower)).size).toBe(5);
      expect(card.forbidden.map(lower)).not.toContain(lower(card.word));
    }
    const words = theme.cards.map((c) => lower(c.word));
    expect(new Set(words).size).toBe(words.length);
  });
});
