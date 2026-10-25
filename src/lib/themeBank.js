import { loadThemes } from './themeUtil.js';

/**
 * Banque de thèmes commune. Chaque mot porte un indice (Sékilmenteur) et/ou
 * cinq mots interdits (Tabou) ; chaque thème peut aussi porter des paires
 * (Undercover). Chaque jeu ne garde que ce qu'il sait utiliser, si bien
 * qu'un mot ajouté sert à tous les jeux qui en ont l'usage.
 */
const modules = import.meta.glob('../themes/*.json', { eager: true, import: 'default' });

const all = Object.values(modules);
const safe = all.filter((t) => !t.adult);

const derive = (themes, key, select) => loadThemes(themes.map((t) => ({ ...t, [key]: select(t) })), key);

/** Sékilmenteur : mots avec indice, thèmes adultes compris. */
export const liarThemes = derive(all, 'words', (t) => t.words.filter((w) => w.hint).map(({ word, hint }) => ({ word, hint })));

/** Tabou : mots avec leurs cinq interdits. */
export const tabooThemes = derive(safe, 'cards', (t) => t.words.filter((w) => w.forbidden?.length === 5).map(({ word, forbidden }) => ({ word, forbidden })));

/** Undercover : paires de mots proches. */
export const pairThemes = derive(safe, 'pairs', (t) => t.pairs ?? []);

/** Time's Up, Qui suis-je : tous les mots, quel que soit leur usage ailleurs. */
export const wordThemes = derive(safe, 'words', (t) => t.words.map((w) => w.word));
