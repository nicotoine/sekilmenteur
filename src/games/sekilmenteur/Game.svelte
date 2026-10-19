<script>
  import { game, CLUE_ROUNDS } from './state.svelte.js';
  import { themes } from './themes.js';
  import GameShell from '../../lib/GameShell.svelte';
  import PlayerList from '../../lib/PlayerList.svelte';
  import ThemePicker from '../../lib/ThemePicker.svelte';
  import RevealSequence from '../../lib/RevealSequence.svelte';
  import Timer from '../../lib/Timer.svelte';
  import Avatar from '../../lib/Avatar.svelte';

  const timerOptions = [60, 90, 120, 180, 240, 300];

  let selected = $state(null);

  function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s ? `${m} min ${s} s` : `${m} min`;
  }

  function confirmAccusation() {
    if (!selected) return;
    const player = selected;
    selected = null;
    game.accuse(player);
  }

  const playerIndex = (player) => game.players.indexOf(player);
</script>

<GameShell title="Sékilmenteur" onExit={() => game.reset()}>


{#if game.phase === 'setup'}
  <header class="py-6 text-center">
    <h1 class="text-5xl font-extrabold">Sékilmenteur</h1>
    <p class="mt-2 text-base-content/70">Un mot secret. Un menteur parmi vous.</p>
  </header>

  <PlayerList />

  <ThemePicker {themes} bind:value={game.themeId} />

  <section class="mb-6 rounded-box bg-base-100 p-4">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-bold">Menteurs</h2>
        <p class="text-sm text-base-content/70">Toujours moins de menteurs que d'honnêtes.</p>
      </div>
      <div class="join">
        <button class="btn join-item btn-neutral h-12 w-12 text-xl" aria-label="Moins de menteurs" disabled={game.effectiveLiarCount <= 1} onclick={() => (game.liarCount = game.effectiveLiarCount - 1)}>−</button>
        <output class="join-item flex w-12 items-center justify-center bg-base-300 font-display text-xl font-bold">{game.effectiveLiarCount}</output>
        <button class="btn join-item btn-neutral h-12 w-12 text-xl" aria-label="Plus de menteurs" disabled={game.effectiveLiarCount >= game.maxLiars} onclick={() => (game.liarCount = game.effectiveLiarCount + 1)}>+</button>
      </div>
    </div>

    <div class="divider my-3"></div>

    <label class="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <span class="block text-lg font-bold">Indice pour les menteurs</span>
        <span class="block text-sm text-base-content/70">Ils voient la catégorie du mot.</span>
      </span>
      <input type="checkbox" class="toggle toggle-secondary toggle-lg" bind:checked={game.hintMode} />
    </label>

    <div class="divider my-3"></div>

    <h2 class="mb-2 text-lg font-bold">Chrono par tour</h2>
    <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Durée du chrono">
      {#each timerOptions as t}
        <button
          class="btn btn-sm h-10 {game.timerSeconds === t ? 'btn-secondary' : 'btn-outline'}"
          role="radio"
          aria-checked={game.timerSeconds === t}
          onclick={() => (game.timerSeconds = t)}>{formatDuration(t)}</button
        >
      {/each}
    </div>
  </section>

  <button class="btn btn-primary btn-block h-14 text-lg" disabled={!game.canStart} onclick={() => game.start()}>Lancer la partie</button>
{:else if game.phase === 'reveal'}
  <RevealSequence names={game.players.map((p) => p.name)} onDone={() => game.beginClues()}>
    {#snippet back(i)}
      {@const player = game.players[i]}
      {#if player.isLiar}
        <span class="text-6xl" aria-hidden="true">🤥</span>
        <h2 class="mt-3 text-3xl font-extrabold text-error">Tu es le menteur</h2>
        {#if game.hintMode}
          <p class="mt-4 text-sm text-base-content/70">Le mot est</p>
          <p class="font-display text-2xl font-bold text-secondary">{game.entry.hint || '…'}</p>
        {:else}
          <p class="mt-4 text-base-content/80">Tu ne connais pas le mot. Écoute les autres et fais comme si.</p>
        {/if}
      {:else}
        <p class="text-sm text-base-content/70">Ton mot est</p>
        <p class="font-display my-3 text-5xl font-extrabold break-words text-secondary">{game.entry.word}</p>
        <p class="text-sm text-base-content/70">Ne le dis pas à voix haute.</p>
      {/if}
    {/snippet}
  </RevealSequence>
{:else if game.phase === 'clues'}
  <header class="py-4 text-center">
    <h2 class="text-2xl font-bold">Tour {game.clueRound} sur {CLUE_ROUNDS}</h2>
    <p class="mt-1 text-base-content/70">Chacun son tour, dites un mot en rapport avec le thème.</p>
  </header>

  <div class="my-6 flex justify-center">
    {#key `${game.clueRound}-${game.alivePlayers.length}`}
      <Timer seconds={game.timerSeconds} />
    {/key}
  </div>

  <section class="mb-6 rounded-box bg-base-100 p-4">
    <h3 class="mb-3 text-sm font-semibold text-base-content/70">Ordre de parole</h3>
    <ol class="flex flex-wrap gap-2">
      {#each game.speakerOrder as player}
        <li class="flex items-center gap-2 rounded-full bg-base-300 py-1 pr-3 pl-1">
          <Avatar name={player.name} index={playerIndex(player)} size="size-7" />
          <span>{player.name}</span>
        </li>
      {/each}
    </ol>
  </section>

  <button class="btn btn-primary btn-block h-14 text-lg" onclick={() => game.endClueRound()}>
    {game.clueRound < CLUE_ROUNDS ? 'Tour suivant' : 'Passer au vote'}
  </button>
{:else if game.phase === 'vote'}
  <header class="py-4 text-center">
    <h2 class="text-3xl font-extrabold">Qui est le menteur ?</h2>
    <p class="mt-1 text-base-content/70">Discutez, puis désignez ensemble un suspect.</p>
  </header>

  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
    {#each game.alivePlayers as player}
      <button
        class="btn h-auto flex-col gap-2 py-4 {selected === player ? 'btn-primary' : 'btn-neutral'}"
        aria-pressed={selected === player}
        onclick={() => (selected = player)}
      >
        <Avatar name={player.name} index={playerIndex(player)} size="size-12" />
        <span class="max-w-full truncate text-base">{player.name}</span>
      </button>
    {/each}
  </div>

  <button class="btn btn-primary btn-block mt-6 h-14 text-lg" disabled={!selected} onclick={confirmAccusation}>
    {selected ? `Accuser ${selected.name}` : 'Choisis un suspect'}
  </button>
{:else if game.phase === 'result'}
  <section class="mt-8 rounded-box border-4 bg-base-100 p-6 text-center {game.accused.isLiar ? 'border-success' : 'border-error'}">
    <Avatar name={game.accused.name} index={playerIndex(game.accused)} size="size-16" />
    <h2 class="mt-3 text-2xl font-bold">{game.accused.name} est éliminé</h2>
    {#if game.accused.isLiar}
      <p class="mt-4 font-display text-3xl font-extrabold text-success">C'était un menteur !</p>
    {:else}
      <p class="mt-4 font-display text-3xl font-extrabold text-error">C'était un honnête…</p>
    {/if}
    <p class="mt-4 text-base-content/70">
      Il reste {game.liarsAlive} menteur{game.liarsAlive > 1 ? 's' : ''} et {game.innocentsAlive} honnête{game.innocentsAlive > 1 ? 's' : ''}.
    </p>
  </section>
  <button class="btn btn-primary btn-block mt-6 h-14 text-lg" onclick={() => game.continueAfterResult()}>
    {game.outcome ? 'Voir le résultat' : 'Deux nouveaux tours'}
  </button>
{:else if game.phase === 'end'}
  <header class="py-6 text-center">
    {#if game.outcome === 'win'}
      <h2 class="text-4xl font-extrabold text-success">Les honnêtes gagnent</h2>
      <p class="mt-2 text-base-content/70">Tous les menteurs sont démasqués.</p>
    {:else}
      <h2 class="text-4xl font-extrabold text-error">Les menteurs gagnent</h2>
      <p class="mt-2 text-base-content/70">Ils sont aussi nombreux que les honnêtes.</p>
    {/if}
  </header>

  <section class="mb-6 rounded-box bg-base-100 p-5 text-center">
    <p class="text-sm text-base-content/70">Le mot était</p>
    <p class="font-display text-4xl font-extrabold text-secondary">{game.entry.word}</p>
  </section>

  <ul class="mb-6 flex flex-col gap-2">
    {#each game.players as player, i}
      <li class="flex items-center gap-3 rounded-box bg-base-100 px-3 py-2">
        <Avatar name={player.name} index={i} muted={!player.alive} />
        <span class="grow">{player.name}</span>
        {#if player.isLiar}
          <span class="badge badge-primary">Menteur</span>
        {:else}
          <span class="badge badge-ghost">Honnête</span>
        {/if}
      </li>
    {/each}
  </ul>

  <div class="flex flex-col gap-3">
    <button class="btn btn-primary btn-block h-14 text-lg" onclick={() => game.start()}>Rejouer avec les mêmes joueurs</button>
    <button class="btn btn-outline btn-block h-12" onclick={() => game.reset()}>Changer les réglages</button>
  </div>
{/if}
</GameShell>
