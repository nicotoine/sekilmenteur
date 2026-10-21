import { shuffle } from './shuffle.js';

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

/** Pioche mélangée, sans doublon, des éléments (chaînes) d'un thème. */
export function shuffledPool(themes, themeId, itemsKey) {
  return shuffle([...new Set(themePool(themes, themeId, itemsKey))]);
}

export const randomItem = (list) => list[Math.floor(Math.random() * list.length)];

/** Retourne l'identifiant s'il figure dans la liste de modes, sinon le premier mode. */
export function validMode(modes, id) {
  return modes.some((m) => m.id === id) ? id : modes[0].id;
}
