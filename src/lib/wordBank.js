import { loadThemes, ALL_THEMES } from './themeUtil.js';
import { shuffle } from './shuffle.js';

const modules = import.meta.glob('../games/sekilmenteur/themes/*.json', { eager: true, import: 'default' });

const toWord = (entry) => (typeof entry === 'string' ? entry : entry.word);

export const bankThemes = loadThemes(modules, 'words').filter((t) => !t.adult);

export function pickWords(themes, themeId, count) {
  const selected = themeId === ALL_THEMES ? themes : themes.filter((t) => t.id === themeId);
  const unique = [...new Set(selected.flatMap((t) => t.words.map(toWord)))];
  return shuffle(unique).slice(0, count);
}
