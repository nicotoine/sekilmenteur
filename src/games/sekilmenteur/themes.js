import { loadThemes, themePool, randomItem, ALL_THEMES } from '../../lib/themeUtil.js';

const modules = import.meta.glob('./themes/*.json', { eager: true, import: 'default' });

export const themes = loadThemes(modules, 'words');
export { ALL_THEMES };

export function pickEntry(themeId) {
  const entry = randomItem(themePool(themes, themeId, 'words'));
  return typeof entry === 'string' ? { word: entry, hint: '' } : entry;
}
