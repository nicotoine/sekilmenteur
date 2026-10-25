import { themePool, randomItem, ALL_THEMES } from '../../lib/themeUtil.js';
import { pairThemes } from '../../lib/themeBank.js';

export const themes = pairThemes;
export { ALL_THEMES };

export function pickPair(themeId) {
  const { civil, undercover } = randomItem(themePool(themes, themeId, 'pairs'));
  return Math.random() < 0.5 ? { civil, undercover } : { civil: undercover, undercover: civil };
}
