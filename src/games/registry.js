import Sekilmenteur from './sekilmenteur/Game.svelte';
import Undercover from './undercover/Game.svelte';
import Tabou from './tabou/Game.svelte';
import TimesUp from './timesup/Game.svelte';
import QuiSuisJe from './quisuisje/Game.svelte';

export const games = [
  {
    id: 'sekilmenteur',
    name: 'Sékilmenteur',
    emoji: '🤥',
    tagline: 'Un mot secret, un menteur parmi vous.',
    players: '3 à 12 joueurs · 1 téléphone',
    component: Sekilmenteur,
  },
  {
    id: 'undercover',
    name: 'Undercover',
    emoji: '🕵️',
    tagline: 'Presque tout le monde a le même mot. Trouve l\'intrus.',
    players: '3 à 12 joueurs · 1 téléphone',
    component: Undercover,
  },
  {
    id: 'tabou',
    name: 'Tabou',
    emoji: '🚫',
    tagline: 'Fais deviner le mot sans dire les mots interdits.',
    players: '2 équipes · 1 téléphone',
    component: Tabou,
  },
  {
    id: 'timesup',
    name: 'Time\'s Up',
    emoji: '⏱️',
    tagline: 'Les mêmes cartes en trois manches : parler, un mot, mimer.',
    players: '2 équipes · 1 téléphone',
    component: TimesUp,
  },
  {
    id: 'quisuisje',
    name: 'Qui suis-je ?',
    emoji: '🤔',
    tagline: 'Le téléphone sur le front, les autres te font deviner.',
    players: '3 à 12 joueurs · 1 téléphone',
    component: QuiSuisJe,
  },
];
