export const ALL_THEMES = 'all';

export function loadThemes(modules, itemsKey) {
  return Object.values(modules)
    .filter((t) => t?.id && t?.name && Array.isArray(t[itemsKey]) && t[itemsKey].length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export function themePool(themes, themeId, itemsKey) {
  const selected = themeId === ALL_THEMES ? themes.filter((t) => !t.adult) : themes.filter((t) => t.id === themeId);
  return selected.flatMap((t) => t[itemsKey]);
}

export const randomItem = (list) => list[Math.floor(Math.random() * list.length)];
