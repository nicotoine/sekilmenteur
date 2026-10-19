import { loadThemes, themePool, ALL_THEMES } from '../../lib/themeUtil.js';
import { shuffle } from '../../lib/shuffle.js';

const modules = import.meta.glob('./themes/*.json', { eager: true, import: 'default' });

export const themes = loadThemes(modules, 'cards');
export { ALL_THEMES };

export const buildDeck = (themeId) => shuffle(themePool(themes, themeId, 'cards'));
