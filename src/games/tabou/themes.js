import { loadThemes, themePool, ALL_THEMES } from '../../lib/themeUtil.js';
import { shuffle } from '../../lib/shuffle.js';

const modules = import.meta.glob('./themes/*.json', { eager: true, import: 'default' });

export const themes = loadThemes(modules, 'cards');
export { ALL_THEMES };

export function buildDeck(themeId) {
  const byWord = new Map();
  for (const card of themePool(themes, themeId, 'cards')) {
    if (!byWord.has(card.word.toLowerCase())) byWord.set(card.word.toLowerCase(), card);
  }
  return shuffle([...byWord.values()]);
}
