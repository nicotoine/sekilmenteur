import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import App from '../src/App.svelte';
import { games, groups } from '../src/games/registry.js';
import { game as sekilmenteur } from '../src/games/sekilmenteur/state.svelte.js';
import { game as undercover } from '../src/games/undercover/state.svelte.js';
import { game as loupgarou } from '../src/games/loupgarou/state.svelte.js';
import { game as tabou } from '../src/games/tabou/state.svelte.js';
import { game as timesup } from '../src/games/timesup/state.svelte.js';
import { game as quisuisje } from '../src/games/quisuisje/state.svelte.js';
import { game as petitbac } from '../src/games/petitbac/state.svelte.js';
import { game as actionverite } from '../src/games/actionverite/state.svelte.js';
import { game as jamais } from '../src/games/jamais/state.svelte.js';
import { roster } from '../src/lib/roster.svelte.js';
import Section from '../src/lib/Section.svelte';

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

const allGames = [sekilmenteur, undercover, loupgarou, tabou, timesup, quisuisje, petitbac, actionverite, jamais];

beforeEach(async () => {
  allGames.forEach((g) => {
    g.reset();
    g.mode = 'classique';
  });
  roster.names = ['', '', ''];
  tabou.teamNames = ['', ''];
  timesup.teamNames = ['', ''];
  localStorage.clear();
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
    expect(games.length).toBeGreaterThanOrEqual(9);
  });

  it('affiche le nom rigolo et le nom classique de chaque jeu', () => {
    render(App);
    for (const g of games) {
      expect(g.aka).toBeTruthy();
      expect(g.name).not.toBe(g.aka);
      expect(screen.getByText(g.aka)).toBeInTheDocument();
    }
    expect(games.map((g) => g.name)).toContain('Kilintru');
  });

  it('range les jeux dans des groupes dépliants, repliables et mémorisés', async () => {
    render(App);
    const sections = document.querySelectorAll('details');
    expect(sections).toHaveLength(groups.length);
    for (const section of sections) expect(section.open).toBe(true);
    for (const g of games) expect(groups.some((gr) => gr.id === g.group)).toBe(true);

    const first = sections[0];
    first.open = false;
    first.dispatchEvent(new Event('toggle'));
    await waitFor(() => expect(JSON.parse(localStorage.getItem('menu:collapsed'))[groups[0].id]).toBe(true));

    cleanup();
    render(App);
    const again = document.querySelectorAll('details');
    expect(again[0].open).toBe(false);
    expect(again[1].open).toBe(true);
  });

  it.each(games.map((g) => [g.id, g.name]))('ouvre %s puis revient au menu', async (id) => {
    render(App);
    await open(id);
    await waitFor(() => expect(screen.getByRole('button', { name: /Jeux/ })).toBeInTheDocument());
    await fireEvent.click(screen.getByRole('button', { name: /Jeux/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Jeux de soirée' })).toBeInTheDocument());
  });
});

describe('sections dépliantes', () => {
  it('se replient en affichant un résumé', async () => {
    render(Section, { title: 'Thème', summary: '🎲 Tous', open: false, children: (() => {}) });
    const details = document.querySelector('details');
    expect(details.open).toBe(false);
    expect(screen.getByText('Thème')).toBeInTheDocument();
    expect(screen.getByText('🎲 Tous')).toBeInTheDocument();
    await fireEvent.click(document.querySelector('summary'));
    await waitFor(() => expect(details.open).toBe(true));
  });

  it('replie thème, mode et réglages sur l\'écran de préparation', async () => {
    render(App);
    await open('sekilmenteur');
    await screen.findByRole('button', { name: 'Lancer la partie' });
    const titles = [...document.querySelectorAll('details > summary')].map((s) => s.textContent.trim().split(/\s{2,}|\n/)[0]);
    expect(titles.join(' ')).toMatch(/Thème/);
    expect(titles.join(' ')).toMatch(/Mode/);
    expect(titles.join(' ')).toMatch(/Réglages/);
    expect(titles.join(' ')).toMatch(/Comment jouer/);
    for (const d of document.querySelectorAll('details')) expect(d.open).toBe(false);
  });

  it('change de mode depuis le sélecteur', async () => {
    render(App);
    await open('undercover');
    await screen.findByRole('button', { name: 'Lancer la partie' });
    expect(screen.getByText('🎯 Classique')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('radio', { name: /Sans pitié/ }));
    expect(undercover.mode).toBe('sans-pitie');
    expect(screen.getByText('💀 Sans pitié')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Sans pitié/ })).toHaveAttribute('aria-checked', 'true');
  });

  it('résume le thème choisi', async () => {
    render(App);
    await open('tabou');
    await screen.findByRole('button', { name: 'Lancer la partie' });
    await fireEvent.click(screen.getByRole('radio', { name: /Animaux/ }));
    expect(tabou.themeId).toBe('animaux');
    expect(screen.getAllByText('🦁 Animaux').length).toBeGreaterThanOrEqual(2);
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
    await fireEvent.click(button('Terminer'));
    await waitFor(() => expect(screen.getByRole('heading', { name: `${tabou.currentTeam} : 0` })).toBeInTheDocument());
    expect(screen.getByText('Trouvé')).toBeInTheDocument();
  });
});

describe('Time\'s Up dans l\'interface', () => {
  it('demande confirmation avant de terminer le tour', async () => {
    render(App);
    await open('timesup');
    await fireEvent.click(await screen.findByRole('button', { name: 'Lancer la partie' }));
    await fireEvent.click(await screen.findByRole('button', { name: /Démarrer le chrono/ }));

    await fireEvent.click(button('Terminer le tour'));
    expect(screen.getByRole('dialog', { name: 'Terminer le tour ?' })).toBeInTheDocument();
    await fireEvent.click(screen.getAllByRole('button', { name: 'Annuler' })[0]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(timesup.phase).toBe('turn');

    await fireEvent.click(button('Terminer le tour'));
    await fireEvent.click(button('Terminer'));
    expect(timesup.phase).toBe('summary');
  });

  it('fait trouver des cartes et affiche le résumé du tour', async () => {
    render(App);
    await open('timesup');
    await fireEvent.click(await screen.findByRole('button', { name: 'Lancer la partie' }));
    expect(screen.getByRole('heading', { name: 'Décris librement' })).toBeInTheDocument();
    await fireEvent.click(await screen.findByRole('button', { name: /Démarrer le chrono/ }));

    await fireEvent.click(button('Trouvé'));
    await fireEvent.click(button('Trouvé'));
    await fireEvent.click(button('Terminer le tour'));
    await fireEvent.click(button('Terminer'));
    const [first, second] = timesup.teamIndex === 0 ? ['Équipe 1', 'Équipe 2'] : ['Équipe 2', 'Équipe 1'];
    await waitFor(() => expect(screen.getByRole('heading', { name: `${first} : +2` })).toBeInTheDocument());
    await fireEvent.click(button('Équipe suivante'));
    expect(screen.getByText('Au tour de').nextElementSibling).toHaveTextContent(second);
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
    await fireEvent.click(button('Terminer'));
    await waitFor(() => expect(screen.getByRole('heading', { name: `${quisuisje.currentPlayer.name} : +1` })).toBeInTheDocument());
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

describe('mode espion dans l\'interface', () => {
  it('permet à un menteur de se dévoiler et affiche le mot au groupe', async () => {
    render(App);
    await open('sekilmenteur');
    await screen.findByRole('button', { name: 'Lancer la partie' });
    await typePlayers(['Alice', 'Bob', 'Chloé']);
    await fireEvent.click(screen.getByRole('radio', { name: /Espion/ }));
    sekilmenteur.start();
    sekilmenteur.beginClues();
    await fireEvent.click(await screen.findByRole('button', { name: /Un menteur se dévoile/ }));
    expect(screen.getByRole('heading', { name: 'Qui se dévoile ?' })).toBeInTheDocument();
    expect(screen.getByText(sekilmenteur.entry.word)).toBeInTheDocument();
    const liar = sekilmenteur.players.find((p) => p.isLiar);
    await fireEvent.click(screen.getByRole('button', { name: liar.name }));
    await fireEvent.click(button('Il a trouvé'));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Les menteurs gagnent' })).toBeInTheDocument());
    expect(screen.getByText(`${liar.name} a deviné le mot.`)).toBeInTheDocument();
  });
});

describe('Loup-Garou dans l\'interface', () => {
  it('exige 4 joueurs puis distribue les rôles et lance la nuit', async () => {
    render(App);
    await open('loupgarou');
    const start = await screen.findByRole('button', { name: 'Lancer la partie' });
    await typePlayers(['Alice', 'Bob', 'Chloé']);
    expect(start).toBeDisabled();
    expect(screen.getByText(/au moins 4 joueurs/)).toBeInTheDocument();
    await fireEvent.click(button('Ajouter un joueur'));
    await typePlayers(['Alice', 'Bob', 'Chloé', 'Dan']);
    expect(start).toBeEnabled();
    await fireEvent.click(start);

    for (const name of ['Alice', 'Bob', 'Chloé', 'Dan']) {
      await fireEvent.click(await screen.findByText(name));
      expect(screen.getByText(/Tu es /)).toBeInTheDocument();
      const hide = screen.getByRole('button', { name: /Cacher/ });
      await waitFor(() => expect(hide).toBeEnabled());
      await fireEvent.click(hide);
      await sleep(FLIP_WAIT_MS);
    }

    await waitFor(() => expect(screen.getByText('Passe le téléphone à')).toBeInTheDocument());
    const first = loupgarou.nightPlayer;
    await fireEvent.click(button(`Je suis ${first.name}`));
    if (first.role === 'loup') {
      expect(screen.getByText(/Les loups se réveillent/)).toBeInTheDocument();
      expect(button('Je me rendors')).toBeDisabled();
    } else if (first.role === 'villageois') {
      expect(screen.getByText('Tu dors paisiblement')).toBeInTheDocument();
    }
  });

  it('affiche les morts à l\'aube puis le vote du village', async () => {
    render(App);
    await open('loupgarou');
    await screen.findByRole('button', { name: 'Lancer la partie' });
    roster.names = ['Alice', 'Bob', 'Chloé', 'Dan', 'Eve', 'Fred'];
    loupgarou.roles = { voyante: false, sorciere: false, chasseur: false };
    loupgarou.start();
    loupgarou.beginNight();
    const victim = loupgarou.alivePlayers.find((p) => p.role === 'villageois');
    while (loupgarou.phase === 'night') {
      loupgarou.uncover();
      if (loupgarou.nightPlayer.role === 'loup') loupgarou.chooseVictim(victim);
      loupgarou.nextSleeper();
    }
    await waitFor(() => expect(screen.getByRole('heading', { name: /Le village se réveille/ })).toBeInTheDocument());
    expect(screen.getByText(victim.name)).toBeInTheDocument();
    expect(screen.getByText('🧑‍🌾 Villageois')).toBeInTheDocument();
    await fireEvent.click(button('Continuer'));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Le village débat' })).toBeInTheDocument());
    const wolf = loupgarou.alivePlayers.find((p) => p.role === 'loup');
    await fireEvent.click(screen.getByRole('button', { name: wolf.name }));
    await fireEvent.click(button(`Éliminer ${wolf.name}`));
    await waitFor(() => expect(screen.getByText(`${wolf.name} est éliminé`)).toBeInTheDocument());
    await fireEvent.click(button('La nuit tombe'));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Le village gagne' })).toBeInTheDocument());
  });
});

describe('Petit Bac dans l\'interface', () => {
  it('tire une lettre, affiche les catégories et saisit les points', async () => {
    render(App);
    await open('petitbac');
    await screen.findByRole('button', { name: 'Lancer la partie' });
    await typePlayers(['Alice', 'Bob', 'Chloé']);
    petitbac.roundCount = 1;
    await fireEvent.click(button('Lancer la partie'));
    await fireEvent.click(await screen.findByRole('button', { name: 'Tirer la lettre' }));
    expect(screen.getByLabelText(`Lettre ${petitbac.letter}`)).toBeInTheDocument();
    for (const c of petitbac.categories) expect(screen.getByText(c)).toBeInTheDocument();
    await fireEvent.click(button('Stop !'));
    await screen.findByRole('heading', { name: `Lettre ${petitbac.letter} : les points` });
    await fireEvent.click(button('Plus pour Alice'));
    await fireEvent.click(button('Plus pour Alice'));
    await fireEvent.click(button('Plus pour Bob'));
    expect(petitbac.roundScores).toEqual([2, 1, 0]);
    await fireEvent.click(button('Voir le résultat'));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Alice gagne' })).toBeInTheDocument());
  });
});

describe('Action ou Vérité dans l\'interface', () => {
  it('propose le choix, affiche la carte et passe au joueur suivant', async () => {
    render(App);
    await open('actionverite');
    await screen.findByRole('button', { name: 'Lancer la partie' });
    await typePlayers(['Alice', 'Bob', 'Chloé']);
    await fireEvent.click(button('Lancer la partie'));
    expect(screen.getByText('Alice')).toBeInTheDocument();
    await fireEvent.click(await screen.findByRole('button', { name: /Vérité/ }));
    expect(screen.getByText(actionverite.card)).toBeInTheDocument();
    await fireEvent.click(button('Fait !'));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Bob' })).toBeInTheDocument());
    await fireEvent.click(button(/Action/));
    await fireEvent.click(button(/Dégonflé/));
    await fireEvent.click(await screen.findByRole('button', { name: 'Terminer la partie' }));
    await fireEvent.click(button('Terminer'));
    await waitFor(() => expect(screen.getByText(/Bob s'est dégonflé 1 fois/)).toBeInTheDocument());
  });

  it('en mode roulette, un seul bouton tire au sort', async () => {
    render(App);
    await open('actionverite');
    await screen.findByRole('button', { name: 'Lancer la partie' });
    await typePlayers(['Alice', 'Bob', 'Chloé']);
    await fireEvent.click(screen.getByRole('radio', { name: /Roulette/ }));
    await fireEvent.click(button('Lancer la partie'));
    expect(screen.queryByRole('button', { name: /Vérité/ })).toBeNull();
    await fireEvent.click(await screen.findByRole('button', { name: /Tourner la roue/ }));
    expect(['truth', 'dare']).toContain(actionverite.kind);
  });
});

describe('Je n\'ai jamais dans l\'interface', () => {
  it('se lance sans joueurs en mode classique et enchaîne les cartes', async () => {
    render(App);
    await open('jamais');
    const start = await screen.findByRole('button', { name: 'Lancer la partie' });
    expect(screen.queryByPlaceholderText('Nom du joueur')).toBeNull();
    expect(start).toBeEnabled();
    await fireEvent.click(start);
    expect(await screen.findByText(jamais.card)).toBeInTheDocument();
    const first = jamais.card;
    await fireEvent.click(button('Carte suivante'));
    await waitFor(() => expect(screen.getByText(jamais.card)).toBeInTheDocument());
    expect(jamais.card).not.toBe(first);
  });

  it('en mode dix doigts, demande les joueurs et compte les vies', async () => {
    render(App);
    await open('jamais');
    await screen.findByRole('button', { name: 'Lancer la partie' });
    await fireEvent.click(screen.getByRole('radio', { name: /Dix doigts/ }));
    const start = button('Lancer la partie');
    expect(start).toBeDisabled();
    await typePlayers(['Alice', 'Bob', 'Chloé']);
    expect(start).toBeEnabled();
    await fireEvent.click(start);
    await fireEvent.click(await screen.findByRole('button', { name: /Alice/ }));
    await fireEvent.click(button(/Carte suivante \(1 coupable\)/));
    await waitFor(() => expect(jamais.players[0].lives).toBe(9));
  });
});

describe('narrateur de Loupiétu', () => {
  function installSpeech() {
    const synth = { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [{ name: 'Amélie', lang: 'fr-FR', voiceURI: 'fr1' }], addEventListener: vi.fn(), removeEventListener: vi.fn() };
    globalThis.speechSynthesis = synth;
    globalThis.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
      }
    };
    return synth;
  }
  const spoken = (synth) => synth.speak.mock.calls.map((c) => c[0].text);

  afterEach(() => {
    loupgarou.narrator = false;
    delete globalThis.speechSynthesis;
    delete globalThis.SpeechSynthesisUtterance;
  });

  async function prepare() {
    render(App);
    await open('loupgarou');
    await screen.findByRole('button', { name: 'Lancer la partie' });
    roster.names = ['Alice', 'Bob', 'Chloé', 'Dan', 'Eve', 'Fred'];
    loupgarou.roles = { voyante: false, sorciere: false, chasseur: false };
  }

  it('est désactivé sans synthèse vocale', async () => {
    await prepare();
    expect(screen.getByText('🔇 Désactivé')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Narrateur vocal/ })).toBeDisabled();
    expect(screen.getByText(/n'est pas disponible/)).toBeInTheDocument();
  });

  it('raconte les écrans publics et se tait sur les écrans secrets', async () => {
    const synth = installSpeech();
    await prepare();
    await fireEvent.click(screen.getByRole('checkbox', { name: /Narrateur vocal/ }));
    expect(loupgarou.narrator).toBe(true);
    expect(screen.getByText('🔊 Activé')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Amélie' })).toBeInTheDocument();
    await fireEvent.click(button('Tester la voix'));
    expect(spoken(synth).at(-1)).toMatch(/Passe le téléphone à ton voisin/);
    synth.speak.mockClear();

    loupgarou.start();
    loupgarou.beginNight();
    await waitFor(() => expect(spoken(synth).at(-1)).toBe(`Nuit 1. Le village s'endort. Passe le téléphone à ${loupgarou.nightPlayer.name}.`));

    const victim = loupgarou.alivePlayers.find((p) => p.role === 'villageois');
    while (loupgarou.phase === 'night') {
      loupgarou.uncover();
      await sleep(0);
      const before = synth.speak.mock.calls.length;
      if (loupgarou.nightPlayer.role === 'loup') loupgarou.chooseVictim(victim);
      await sleep(0);
      expect(synth.speak.mock.calls.length).toBe(before);
      loupgarou.nextSleeper();
      await sleep(0);
    }
    expect(spoken(synth).some((t) => /loup/i.test(t))).toBe(false);
    await waitFor(() => expect(spoken(synth).at(-1)).toBe(`Le village se réveille. Cette nuit, ${victim.name}, qui était Villageois, est mort.`));
    await fireEvent.click(button('Continuer'));
    await waitFor(() => expect(spoken(synth).at(-1)).toMatch(/Le village débat/));
  });

  it('ne parle jamais quand le narrateur est désactivé', async () => {
    const synth = installSpeech();
    await prepare();
    loupgarou.start();
    loupgarou.beginNight();
    await sleep(0);
    expect(synth.speak).not.toHaveBeenCalled();
  });
});
