import { themePool, randomItem, ALL_THEMES } from '../../lib/themeUtil.js';
import { liarThemes } from '../../lib/themeBank.js';

export const themes = liarThemes;
export { ALL_THEMES };

export function pickEntry(themeId) {
  return randomItem(themePool(themes, themeId, 'words'));
}
