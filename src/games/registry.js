import Sekilmenteur from './sekilmenteur/Game.svelte';
import Undercover from './undercover/Game.svelte';
import LoupGarou from './loupgarou/Game.svelte';
import Tabou from './tabou/Game.svelte';
import TimesUp from './timesup/Game.svelte';
import QuiSuisJe from './quisuisje/Game.svelte';
import PetitBac from './petitbac/Game.svelte';
import ActionVerite from './actionverite/Game.svelte';
import Jamais from './jamais/Game.svelte';

export const groups = [
  { id: 'bluff', name: 'Bluff & déduction', emoji: '🎭' },
  { id: 'deviner', name: 'Faire deviner', emoji: '💡' },
  { id: 'ambiance', name: 'Ambiance', emoji: '🎉' },
];

export const games = [
  {
    id: 'sekilmenteur',
    group: 'bluff',
    name: 'Sékilmenteur',
    aka: 'C\'est qui le menteur ?',
    emoji: '🤥',
    tagline: 'Un mot secret, un menteur parmi vous.',
    players: '3 à 12 joueurs',
    component: Sekilmenteur,
  },
  {
    id: 'undercover',
    group: 'bluff',
    name: 'Kilintru',
    aka: 'Undercover',
    emoji: '🕵️',
    tagline: 'Presque tout le monde a le même mot. Kilintru ?',
    players: '3 à 12 joueurs',
    component: Undercover,
  },
  {
    id: 'loupgarou',
    group: 'bluff',
    name: 'Loupiétu',
    aka: 'Loup-Garou',
    emoji: '🐺',
    tagline: 'Loup y es-tu ? La nuit il dévore, le jour le village vote.',
    players: '4 à 12 joueurs',
    component: LoupGarou,
  },
  {
    id: 'tabou',
    group: 'deviner',
    name: 'Dipalémo',
    aka: 'Tabou',
    emoji: '🚫',
    tagline: 'Fais deviner le mot sans dire les mots interdits.',
    players: '2 équipes',
    component: Tabou,
  },
  {
    id: 'timesup',
    group: 'deviner',
    name: 'Dépêchtoi',
    aka: 'Time\'s Up',
    emoji: '⏱️',
    tagline: 'Les mêmes cartes en plusieurs manches : parler, un mot, mimer.',
    players: '2 équipes',
    component: TimesUp,
  },
  {
    id: 'quisuisje',
    group: 'deviner',
    name: 'Surlefron',
    aka: 'Qui suis-je ?',
    emoji: '🤔',
    tagline: 'Le téléphone sur le front, les autres te font deviner.',
    players: '3 à 12 joueurs',
    component: QuiSuisJe,
  },
  {
    id: 'petitbac',
    group: 'ambiance',
    name: 'Çakomanspar',
    aka: 'Petit Bac',
    emoji: '📝',
    tagline: 'Une lettre, des catégories, du papier et un stylo.',
    players: '3 à 12 joueurs',
    component: PetitBac,
  },
  {
    id: 'actionverite',
    group: 'ambiance',
    name: 'Capoupacap',
    aka: 'Action ou Vérité',
    emoji: '🎯',
    tagline: 'Le grand classique, avec des cartes qui changent.',
    players: '3 à 12 joueurs',
    component: ActionVerite,
  },
  {
    id: 'jamais',
    group: 'ambiance',
    name: 'Jamédelavi',
    aka: 'Je n\'ai jamais',
    emoji: '🙋',
    tagline: 'Ceux qui l\'ont déjà fait se dénoncent.',
    players: '2 joueurs et plus',
    component: Jamais,
  },
];
