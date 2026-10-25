import { ALL_THEMES } from './themeUtil.js';
import { wordThemes } from './themeBank.js';
import { shuffle } from './shuffle.js';

export const bankThemes = wordThemes;

export function pickWords(themes, themeId, count) {
  const selected = themeId === ALL_THEMES ? themes : themes.filter((t) => t.id === themeId);
  const unique = [...new Set(selected.flatMap((t) => t.words))];
  return shuffle(unique).slice(0, count);
}
