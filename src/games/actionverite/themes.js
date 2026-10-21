import { loadThemes, shuffledPool, ALL_THEMES } from '../../lib/themeUtil.js';

const modules = import.meta.glob('./themes/*.json', { eager: true, import: 'default' });

export const themes = loadThemes(modules, 'truths').filter((t) => Array.isArray(t.dares) && t.dares.length > 0);
export { ALL_THEMES };

export const buildTruths = (themeId) => shuffledPool(themes, themeId, 'truths');
export const buildDares = (themeId) => shuffledPool(themes, themeId, 'dares');
