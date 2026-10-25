<script>
  import { game, MODES } from './state.svelte.js';
  import { bankThemes } from '../../lib/wordBank.js';
  import GameShell from '../../lib/GameShell.svelte';
  import ThemePicker from '../../lib/ThemePicker.svelte';
  import ModePicker from '../../lib/ModePicker.svelte';
  import Section from '../../lib/Section.svelte';
  import Choice from '../../lib/Choice.svelte';
  import HowTo from '../../lib/HowTo.svelte';
  import TeamNames from '../../lib/TeamNames.svelte';
  import Scoreboard from '../../lib/Scoreboard.svelte';
  import Timer from '../../lib/Timer.svelte';
  import ConfirmButton from '../../lib/ConfirmButton.svelte';

  const cardCounts = [20, 30, 40, 50];
  const durations = [30, 45, 60, 90];
  const label = (n, one, many) => `${n} ${n > 1 ? many : one}`;
  const scoreEntries = $derived(game.displayNames.map((name, i) => ({ name, score: game.totals[i] })));
</script>

<GameShell title="Dépêchtoi" onExit={() => game.reset()}>
  {#if game.phase === 'setup'}
    <header class="py-3 text-center">
      <h1 class="text-4xl font-extrabold">Dépêchtoi</h1>
      <p class="text-sm text-base-content/50">Time's Up</p>
      <p class="mt-1 text-base-content/70">Les mêmes cartes, plusieurs façons de les faire deviner.</p>
    </header>

    <TeamNames bind:names={game.teamNames} />
    <ThemePicker themes={bankThemes} bind:value={game.themeId} />
    <ModePicker modes={MODES} bind:value={game.mode} />

    <Section title="Réglages" summary="{game.cardCount} cartes · {game.turnSeconds} s">
      <h3 class="mb-2 font-bold">Nombre de cartes</h3>
      <Choice options={cardCounts} bind:value={game.cardCount} label="Nombre de cartes" />
      <div class="divider my-3"></div>
      <h3 class="mb-2 font-bold">Durée d'un tour</h3>
      <Choice options={durations} bind:value={game.turnSeconds} label="Durée d'un tour" format={(d) => `${d} s`} />
    </Section>

    <HowTo>
      <p class="mb-2">Un joueur tient le téléphone et fait deviner les cartes à son équipe. Chaque mot trouvé rapporte 1 point. Quand toutes les cartes sont trouvées, on rejoue les mêmes avec une règle plus dure :</p>
      <ol class="list-inside list-decimal">
        {#each game.rounds as round}
          <li>{round.title}</li>
        {/each}
      </ol>
    </HowTo>

    <button class="btn btn-primary btn-block h-14 text-lg" disabled={!game.canStart} onclick={() => game.start()}>Lancer la partie</button>
  {:else if game.phase === 'ready'}
    <header class="py-4 text-center">
      <p class="text-sm text-base-content/70">Manche {game.round} sur {game.rounds.length}</p>
      <h2 class="text-2xl font-bold">{game.currentRound.title}</h2>
    </header>

    <section class="rounded-box bg-base-100 p-6 text-center">
      <p class="text-base-content/70">Au tour de</p>
      <p class="my-2 text-4xl font-extrabold text-secondary">{game.currentTeam}</p>
      <p class="mt-4">{game.currentRound.rule}</p>
      <p class="mt-4 text-base-content/70">Un joueur prend le téléphone et le garde caché des devineurs.</p>
      {#if game.carryover > 0}
        <p class="mt-4 font-semibold text-secondary">Il reste {game.carryover} s de la manche précédente.</p>
      {/if}
    </section>

    <div class="mt-4"><Scoreboard entries={scoreEntries} /></div>

    <button class="btn btn-primary btn-block mt-6 h-14 text-lg" onclick={() => game.startTurn()}>Démarrer le chrono ({game.turnDuration} s)</button>
  {:else if game.phase === 'turn'}
    <div class="my-2 flex justify-center">
      {#key game.turnId}
        <Timer seconds={game.turnDuration} onTick={(s) => game.setTimeLeft(s)} onEnd={() => game.endTurn()} size={9} textClass="text-3xl" />
      {/key}
    </div>

    <p class="text-center text-sm text-base-content/70">{game.currentRound.title} · {label(game.pile.length, 'carte restante', 'cartes restantes')}</p>

    <section class="mt-2 flex min-h-48 items-center justify-center rounded-box border-4 border-secondary bg-base-100 p-5 text-center">
      <p class="font-display text-5xl font-extrabold break-words text-secondary">{game.currentCard}</p>
    </section>

    <div class="mt-4 flex flex-col gap-3">
      <button class="btn btn-success btn-block h-16 text-xl" onclick={() => game.found()}>Trouvé</button>
      <button class="btn btn-neutral btn-block h-14 text-lg" disabled={game.pile.length < 2} onclick={() => game.skip()}>Passer</button>
      <ConfirmButton class="btn btn-ghost btn-sm" question="Terminer le tour ?" detail="Le chrono s'arrête et on passe au résumé du tour." confirmLabel="Terminer" onConfirm={() => game.endTurn()}>Terminer le tour</ConfirmButton>
    </div>
  {:else if game.phase === 'summary'}
    <header class="py-4 text-center">
      <h2 class="text-3xl font-extrabold">{game.currentTeam} : +{game.turnFound.length}</h2>
      <p class="mt-1 text-base-content/70">{label(game.turnFound.length, 'mot trouvé', 'mots trouvés')}</p>
    </header>

    {#if game.turnFound.length > 0}
      <ul class="mb-6 flex flex-wrap justify-center gap-2">
        {#each game.turnFound as word}
          <li class="badge badge-success badge-lg h-auto px-3 py-2 text-base">{word}</li>
        {/each}
      </ul>
    {/if}

    {#if game.roundOver}
      <p class="mb-6 text-center font-semibold text-secondary">Toutes les cartes sont trouvées.</p>
    {/if}

    <button class="btn btn-primary btn-block h-14 text-lg" onclick={() => game.afterSummary()}>
      {game.roundOver ? 'Voir les scores de la manche' : 'Équipe suivante'}
    </button>
  {:else if game.phase === 'roundEnd'}
    <header class="py-4 text-center">
      <h2 class="text-3xl font-extrabold">Manche {game.round} terminée</h2>
    </header>

    <ul class="mb-6 flex flex-col gap-2">
      {#each game.displayNames as name, i}
        <li class="flex items-center justify-between rounded-box bg-base-100 px-4 py-3">
          <span class="text-lg font-bold">{name}</span>
          <span class="text-base-content/70">+{game.scores[i][game.round - 1]}</span>
          <span class="font-display text-3xl font-extrabold">{game.totals[i]}</span>
        </li>
      {/each}
    </ul>

    {#if game.round < game.rounds.length}
      <section class="mb-6 rounded-box bg-base-100 p-4 text-center">
        <p class="text-sm text-base-content/70">Manche suivante</p>
        <p class="text-xl font-bold text-secondary">{game.rounds[game.round].title}</p>
        <p class="mt-2 text-base-content/80">{game.rounds[game.round].rule}</p>
      </section>
    {/if}

    <button class="btn btn-primary btn-block h-14 text-lg" onclick={() => game.nextRound()}>
      {game.round < game.rounds.length ? 'Manche suivante' : 'Voir le résultat'}
    </button>
  {:else if game.phase === 'end'}
    <header class="py-6 text-center">
      {#if game.winnerIndex === -1}
        <h2 class="text-4xl font-extrabold text-secondary">Égalité</h2>
      {:else}
        <h2 class="text-4xl font-extrabold text-success">{game.displayNames[game.winnerIndex]} gagne</h2>
      {/if}
    </header>

    <ul class="mb-6 flex flex-col gap-2">
      {#each game.displayNames as name, i}
        <li class="rounded-box bg-base-100 px-4 py-3 {game.winnerIndex === i ? 'border-2 border-success' : ''}">
          <div class="flex items-center justify-between">
            <span class="text-lg font-bold">{name}</span>
            <span class="font-display text-3xl font-extrabold">{game.totals[i]}</span>
          </div>
          <p class="mt-1 text-sm text-base-content/70">{game.scores[i].map((n, r) => `${game.rounds[r].title} ${n}`).join(' · ')}</p>
        </li>
      {/each}
    </ul>

    <div class="flex flex-col gap-3">
      <button class="btn btn-primary btn-block h-14 text-lg" onclick={() => game.start()}>Rejouer</button>
      <button class="btn btn-outline btn-block h-12" onclick={() => game.reset()}>Changer les réglages</button>
    </div>
  {/if}
</GameShell>
