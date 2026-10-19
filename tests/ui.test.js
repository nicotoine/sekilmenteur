import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import App from '../src/App.svelte';
import { games } from '../src/games/registry.js';
import { game as sekilmenteur } from '../src/games/sekilmenteur/state.svelte.js';
import { game as undercover } from '../src/games/undercover/state.svelte.js';
import { game as tabou } from '../src/games/tabou/state.svelte.js';
import { game as timesup } from '../src/games/timesup/state.svelte.js';
import { game as quisuisje } from '../src/games/quisuisje/state.svelte.js';
import { roster } from '../src/lib/roster.svelte.js';

const FLIP_WAIT_MS = 600;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function open(id) {
  const target = id ? `#/${id}` : '';
  if (location.hash === target) return;
  const changed = new Promise((resolve) => addEventListener('hashchange', resolve, { once: true }));
  location.hash = id ? `/${id}` : '';
  await changed;
  await sleep(0);
}

const button = (name) => screen.getByRole('button', { name });

async function typePlayers(names) {
  const fields = screen.getAllByPlaceholderText('Nom du joueur');
  for (const [i, name] of names.entries()) await fireEvent.input(fields[i], { target: { value: name } });
}

beforeEach(async () => {
  [sekilmenteur, undercover, tabou, timesup, quisuisje].forEach((g) => g.reset());
  roster.names = ['', '', ''];
  tabou.teamNames = ['', ''];
  timesup.teamNames = ['', ''];
  await open('');
});

afterEach(() => cleanup());

describe('menu', () => {
  it('liste tous les jeux avec un lien chacun', () => {
    render(App);
    for (const g of games) {
      const link = screen.getByRole('link', { name: new RegExp(g.name.replace(/[?']/g, '.')) });
      expect(link).toHaveAttribute('href', `#/${g.id}`);
    }
    expect(games.length).toBeGreaterThanOrEqual(5);
  });

  it.each(games.map((g) => [g.id, g.name]))('ouvre %s puis revient au menu', async (id) => {
    render(App);
    await open(id);
    await waitFor(() => expect(screen.getByRole('button', { name: /Jeux/ })).toBeInTheDocument());
    await fireEvent.click(screen.getByRole('button', { name: /Jeux/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Jeux de soirée' })).toBeInTheDocument());
  });
});

describe('réglages communs', () => {
  it('bloque le lancement tant qu\'il manque des joueurs', async () => {
    render(App);
    await open('sekilmenteur');
    const start = await screen.findByRole('button', { name: 'Lancer la partie' });
    expect(start).toBeDisabled();
    await typePlayers(['Alice', 'Bob', 'Chloé']);
    expect(start).toBeEnabled();
  });

  it('signale deux joueurs au même nom', async () => {
    render(App);
    await open('undercover');
    await screen.findByRole('button', { name: 'Lancer la partie' });
    await typePlayers(['Alice', 'alice', 'Bob']);
    expect(screen.getByText(/même nom/)).toBeInTheDocument();
    expect(button('Lancer la partie')).toBeDisabled();
  });

  it('partage les noms entre les jeux', async () => {
    render(App);
    await open('sekilmenteur');
    await screen.findByRole('button', { name: 'Lancer la partie' });
    await typePlayers(['Alice', 'Bob', 'Chloé']);
    cleanup();
    render(App);
    await open('undercover');
    await screen.findByRole('button', { name: 'Lancer la partie' });
    expect(screen.getAllByPlaceholderText('Nom du joueur').map((i) => i.value)).toEqual(['Alice', 'Bob', 'Chloé']);
  });

  it('limite les menteurs avec les boutons + et -', async () => {
    render(App);
    await open('sekilmenteur');
    await screen.findByRole('button', { name: 'Lancer la partie' });
    await typePlayers(['A', 'B', 'C']);
    expect(button('Plus de menteurs')).toBeDisabled();
    expect(button('Moins de menteurs')).toBeDisabled();
  });
});

describe('Sékilmenteur de bout en bout', () => {
  it('distribue les cartes puis lance les tours de parole', async () => {
    render(App);
    await open('sekilmenteur');
    await screen.findByRole('button', { name: 'Lancer la partie' });
    await typePlayers(['Alice', 'Bob', 'Chloé']);
    await fireEvent.click(button('Lancer la partie'));

    for (const name of ['Alice', 'Bob', 'Chloé']) {
      await fireEvent.click(await screen.findByText(name));
      const hide = screen.getByRole('button', { name: /Cacher/ });
      await waitFor(() => expect(hide).toBeEnabled());
      await fireEvent.click(hide);
      await sleep(FLIP_WAIT_MS);
    }

    await waitFor(() => expect(screen.getByText('Tour 1 sur 2')).toBeInTheDocument());
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    await fireEvent.click(button('Tour suivant'));
    await fireEvent.click(button('Passer au vote'));
    expect(screen.getByRole('heading', { name: 'Qui est le menteur ?' })).toBeInTheDocument();
    expect(button('Choisis un suspect')).toBeDisabled();
  });

  it('demande confirmation avant d\'éliminer et affiche le résultat', async () => {
    render(App);
    await open('sekilmenteur');
    await screen.findByRole('button', { name: 'Lancer la partie' });
    await typePlayers(['Alice', 'Bob', 'Chloé']);
    sekilmenteur.start();
    sekilmenteur.beginClues();
    sekilmenteur.endClueRound();
    sekilmenteur.endClueRound();
    await fireEvent.click(await screen.findByRole('button', { name: 'Bob' }));
    await fireEvent.click(button('Accuser Bob'));
    await waitFor(() => expect(screen.getByText('Bob est éliminé')).toBeInTheDocument());
    expect(sekilmenteur.players.find((p) => p.name === 'Bob').alive).toBe(false);
  });
});

describe('Tabou dans l\'interface', () => {
  it('affiche la carte et compte les points', async () => {
    render(App);
    await open('tabou');
    await fireEvent.click(await screen.findByRole('button', { name: 'Lancer la partie' }));
    await fireEvent.click(await screen.findByRole('button', { name: /Démarrer le chrono/ }));

    const word = tabou.card.word;
    expect(screen.getByText(word)).toBeInTheDocument();
    for (const forbidden of tabou.card.forbidden) expect(screen.getByText(forbidden)).toBeInTheDocument();

    await fireEvent.click(button(/^Trouvé/));
    await fireEvent.click(button(/^Tabou/));
    await fireEvent.click(button(/Terminer le tour/));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Équipe 1 : 0' })).toBeInTheDocument());
    expect(screen.getByText('Trouvé')).toBeInTheDocument();
  });
});

describe('Time\'s Up dans l\'interface', () => {
  it('fait trouver des cartes et affiche le résumé du tour', async () => {
    render(App);
    await open('timesup');
    await fireEvent.click(await screen.findByRole('button', { name: 'Lancer la partie' }));
    expect(screen.getByRole('heading', { name: 'Décris librement' })).toBeInTheDocument();
    await fireEvent.click(await screen.findByRole('button', { name: /Démarrer le chrono/ }));

    await fireEvent.click(button('Trouvé'));
    await fireEvent.click(button('Trouvé'));
    await fireEvent.click(button('Terminer le tour'));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Équipe 1 : +2' })).toBeInTheDocument());
    await fireEvent.click(button('Équipe suivante'));
    expect(screen.getByText('Au tour de').nextElementSibling).toHaveTextContent('Équipe 2');
  });
});

describe('Qui suis-je dans l\'interface', () => {
  it('lance un compte à rebours puis affiche un mot', async () => {
    render(App);
    await open('quisuisje');
    await screen.findByRole('button', { name: 'Lancer la partie' });
    await typePlayers(['Alice', 'Bob', 'Chloé']);
    await fireEvent.click(button('Lancer la partie'));
    await fireEvent.click(await screen.findByRole('button', { name: 'Je suis prêt' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Trouvé' })).toBeInTheDocument(), { timeout: 4500 });
    expect(screen.getByText(quisuisje.card)).toBeInTheDocument();
    await fireEvent.click(button('Trouvé'));
    await fireEvent.click(button('Terminer le tour'));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Alice : +1' })).toBeInTheDocument());
  });
});

describe('Undercover dans l\'interface', () => {
  it('donne un mot à chacun puis passe à la description', async () => {
    render(App);
    await open('undercover');
    await screen.findByRole('button', { name: 'Lancer la partie' });
    await typePlayers(['Alice', 'Bob', 'Chloé']);
    await fireEvent.click(button('Lancer la partie'));
    for (const name of ['Alice', 'Bob', 'Chloé']) {
      await fireEvent.click(await screen.findByText(name));
      const hide = screen.getByRole('button', { name: /Cacher/ });
      await waitFor(() => expect(hide).toBeEnabled());
      await fireEvent.click(hide);
      await sleep(FLIP_WAIT_MS);
    }
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Chacun décrit son mot' })).toBeInTheDocument());
  });
});
