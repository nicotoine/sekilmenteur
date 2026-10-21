import { loadThemes, themePool, ALL_THEMES } from '../../lib/themeUtil.js';
import { shuffle } from '../../lib/shuffle.js';

const modules = import.meta.glob('./themes/*.json', { eager: true, import: 'default' });

export const themes = loadThemes(modules, 'categories');
export { ALL_THEMES };

export function pickCategories(themeId, count) {
  const unique = [...new Set(themePool(themes, themeId, 'categories'))];
  return shuffle(unique).slice(0, count);
}
