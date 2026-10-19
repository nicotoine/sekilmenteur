import { loadThemes, themePool, randomItem, ALL_THEMES } from '../../lib/themeUtil.js';

const modules = import.meta.glob('./themes/*.json', { eager: true, import: 'default' });

export const themes = loadThemes(modules, 'pairs');
export { ALL_THEMES };

export function pickPair(themeId) {
  const { civil, undercover } = randomItem(themePool(themes, themeId, 'pairs'));
  return Math.random() < 0.5 ? { civil, undercover } : { civil: undercover, undercover: civil };
}
