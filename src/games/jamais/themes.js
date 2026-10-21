import { loadThemes, shuffledPool, ALL_THEMES } from '../../lib/themeUtil.js';

const modules = import.meta.glob('./themes/*.json', { eager: true, import: 'default' });

export const themes = loadThemes(modules, 'statements');
export { ALL_THEMES };

export const buildDeck = (themeId) => shuffledPool(themes, themeId, 'statements');
