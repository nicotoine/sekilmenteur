import Sekilmenteur from './sekilmenteur/Game.svelte';
import Undercover from './undercover/Game.svelte';
import Tabou from './tabou/Game.svelte';

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
];
