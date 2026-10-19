const modules = import.meta.glob('./themes/*.json', { eager: true, import: 'default' });

export const themes = Object.values(modules)
  .filter((t) => t?.id && t?.name && Array.isArray(t.words) && t.words.length > 0)
  .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

export const ALL_THEMES = 'all';

export function pickEntry(themeId) {
  const pool = themeId === ALL_THEMES ? themes.filter((t) => !t.adult).flatMap((t) => t.words) : (themes.find((t) => t.id === themeId)?.words ?? []);
  const entry = pool[Math.floor(Math.random() * pool.length)];
  return typeof entry === 'string' ? { word: entry, hint: '' } : entry;
}
