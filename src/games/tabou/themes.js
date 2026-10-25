import { themePool, ALL_THEMES } from '../../lib/themeUtil.js';
import { tabooThemes } from '../../lib/themeBank.js';
import { shuffle } from '../../lib/shuffle.js';

export const themes = tabooThemes;
export { ALL_THEMES };

export function buildDeck(themeId) {
  const byWord = new Map();
  for (const card of themePool(themes, themeId, 'cards')) {
    if (!byWord.has(card.word.toLowerCase())) byWord.set(card.word.toLowerCase(), card);
  }
  return shuffle([...byWord.values()]);
}
