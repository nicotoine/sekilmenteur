<script>
  import { game } from './state.svelte.js';
  import { themes } from './themes.js';
  import GameShell from '../../lib/GameShell.svelte';
  import PlayerList from '../../lib/PlayerList.svelte';
  import ThemePicker from '../../lib/ThemePicker.svelte';
  import RevealSequence from '../../lib/RevealSequence.svelte';
  import Avatar from '../../lib/Avatar.svelte';

  const roleLabel = { civil: 'Civil', undercover: 'Undercover', white: 'Mr White' };

  let selected = $state(null);

  function confirmAccusation() {
    if (!selected) return;
    const player = selected;
    selected = null;
    game.accuse(player);
  }

  const playerIndex = (player) => game.players.indexOf(player);
</script>

<GameShell title="Undercover" onExit={() => game.reset()}>
  {#if game.phase === 'setup'}
    <header class="py-6 text-center">
      <h1 class="text-5xl font-extrabold">Undercover</h1>
      <p class="mt-2 text-base-content/70">Presque tout le monde a le même mot. Pas tout à fait tout le monde.</p>
    </header>

    <PlayerList />
    <ThemePicker {themes} bind:value={game.themeId} />

    <section class="mb-6 rounded-box bg-base-100 p-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold">Undercovers</h2>
          <p class="text-sm text-base-content/70">Un mot proche du vôtre, sans le savoir.</p>
        </div>
        <div class="join">
          <button class="btn join-item btn-neutral h-12 w-12 text-xl" aria-label="Moins d'undercovers" disabled={game.effectiveUndercoverCount <= game.minUndercovers} onclick={() => (game.undercoverCount = game.effectiveUndercoverCount - 1)}>−</button>
          <output class="join-item flex w-12 items-center justify-center bg-base-300 font-display text-xl font-bold">{game.effectiveUndercoverCount}</output>
          <button class="btn join-item btn-neutral h-12 w-12 text-xl" aria-label="Plus d'undercovers" disabled={game.effectiveUndercoverCount >= game.maxUndercovers} onclick={() => (game.undercoverCount = game.effectiveUndercoverCount + 1)}>+</button>
        </div>
      </div>

      <div class="divider my-3"></div>

      <label class="flex cursor-pointer items-center justify-between gap-4">
        <span>
          <span class="block text-lg font-bold">Mr White</span>
          <span class="block text-sm text-base-content/70">Un joueur n'a aucun mot. S'il est éliminé, il peut gagner en devinant celui des civils.</span>
        </span>
        <input type="checkbox" class="toggle toggle-secondary toggle-lg" bind:checked={game.mrWhite} />
      </label>
    </section>

    <button class="btn btn-primary btn-block h-14 text-lg" disabled={!game.canStart} onclick={() => game.start()}>Lancer la partie</button>
  {:else if game.phase === 'reveal'}
    <RevealSequence names={game.players.map((p) => p.name)} onDone={() => game.beginTalk()}>
      {#snippet back(i)}
        {@const player = game.players[i]}
        {#if player.role === 'white'}
          <span class="text-6xl" aria-hidden="true">🫥</span>
          <h2 class="mt-3 text-3xl font-extrabold text-error">Tu es Mr White</h2>
          <p class="mt-4 text-base-content/80">Tu n'as pas de mot. Écoute les autres et fais comme si.</p>
        {:else}
          <p class="text-sm text-base-content/70">Ton mot est</p>
          <p class="font-display my-3 text-5xl font-extrabold break-words text-secondary">
            {player.role === 'civil' ? game.words.civil : game.words.undercover}
          </p>
          <p class="text-sm text-base-content/70">Ne le dis pas à voix haute.</p>
        {/if}
      {/snippet}
    </RevealSequence>
  {:else if game.phase === 'talk'}
    <header class="py-4 text-center">
      <h2 class="text-2xl font-bold">Chacun décrit son mot</h2>
      <p class="mt-1 text-base-content/70">À tour de rôle, un seul mot ou une courte phrase. Sans citer le mot.</p>
    </header>

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

    <button class="btn btn-primary btn-block h-14 text-lg" onclick={() => game.goToVote()}>Passer au vote</button>
  {:else if game.phase === 'vote'}
    <header class="py-4 text-center">
      <h2 class="text-3xl font-extrabold">Qui est l'intrus ?</h2>
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
      {selected ? `Éliminer ${selected.name}` : 'Choisis un suspect'}
    </button>
  {:else if game.phase === 'result'}
    <section class="mt-8 rounded-box border-4 bg-base-100 p-6 text-center {game.accused.role === 'civil' ? 'border-error' : 'border-success'}">
      <Avatar name={game.accused.name} index={playerIndex(game.accused)} size="size-16" />
      <h2 class="mt-3 text-2xl font-bold">{game.accused.name} est éliminé</h2>
      <p class="mt-4 font-display text-3xl font-extrabold {game.accused.role === 'civil' ? 'text-error' : 'text-success'}">
        {game.accused.role === 'civil' ? 'C\'était un civil…' : `C'était ${game.accused.role === 'white' ? 'Mr White' : 'un undercover'} !`}
      </p>
      <p class="mt-4 text-base-content/70">
        Il reste {game.civilsAlive} civil{game.civilsAlive > 1 ? 's' : ''} et {game.intrudersAlive} intrus.
      </p>
    </section>
    <button class="btn btn-primary btn-block mt-6 h-14 text-lg" onclick={() => game.continueAfterResult()}>
      {game.accused.role === 'white' && game.outcome !== 'intruders' ? 'Dernière chance de Mr White' : game.outcome ? 'Voir le résultat' : 'Nouveau tour de parole'}
    </button>
  {:else if game.phase === 'guess'}
    <section class="mt-8 rounded-box bg-base-100 p-6 text-center">
      <span class="text-6xl" aria-hidden="true">🫥</span>
      <h2 class="mt-3 text-2xl font-bold">{game.accused.name}, quel est le mot des civils ?</h2>
      <p class="mt-2 text-base-content/70">Dis ta réponse à voix haute. Le groupe vérifie.</p>
      <p class="mt-4 text-sm text-base-content/70">Le mot des civils était</p>
      <p class="font-display text-3xl font-extrabold text-secondary">{game.words.civil}</p>
    </section>
    <div class="mt-6 flex flex-col gap-3">
      <button class="btn btn-success btn-block h-14 text-lg" onclick={() => game.resolveGuess(true)}>Il a trouvé</button>
      <button class="btn btn-outline btn-block h-12" onclick={() => game.resolveGuess(false)}>Raté</button>
    </div>
  {:else if game.phase === 'end'}
    <header class="py-6 text-center">
      {#if game.outcome === 'civils'}
        <h2 class="text-4xl font-extrabold text-success">Les civils gagnent</h2>
        <p class="mt-2 text-base-content/70">Tous les intrus sont éliminés.</p>
      {:else if game.outcome === 'white'}
        <h2 class="text-4xl font-extrabold text-error">Mr White gagne</h2>
        <p class="mt-2 text-base-content/70">Il a deviné le mot des civils.</p>
      {:else}
        <h2 class="text-4xl font-extrabold text-error">Les intrus gagnent</h2>
        <p class="mt-2 text-base-content/70">Ils sont aussi nombreux que les civils.</p>
      {/if}
    </header>

    <section class="mb-6 grid grid-cols-2 gap-3 text-center">
      <div class="rounded-box bg-base-100 p-4">
        <p class="text-sm text-base-content/70">Mot des civils</p>
        <p class="font-display text-2xl font-extrabold text-secondary">{game.words.civil}</p>
      </div>
      <div class="rounded-box bg-base-100 p-4">
        <p class="text-sm text-base-content/70">Mot des undercovers</p>
        <p class="font-display text-2xl font-extrabold text-secondary">{game.words.undercover}</p>
      </div>
    </section>

    <ul class="mb-6 flex flex-col gap-2">
      {#each game.players as player, i}
        <li class="flex items-center gap-3 rounded-box bg-base-100 px-3 py-2">
          <Avatar name={player.name} index={i} muted={!player.alive} />
          <span class="grow">{player.name}</span>
          <span class="badge {player.role === 'civil' ? 'badge-ghost' : 'badge-primary'}">{roleLabel[player.role]}</span>
        </li>
      {/each}
    </ul>

    <div class="flex flex-col gap-3">
      <button class="btn btn-primary btn-block h-14 text-lg" onclick={() => game.start()}>Rejouer avec les mêmes joueurs</button>
      <button class="btn btn-outline btn-block h-12" onclick={() => game.reset()}>Changer les réglages</button>
    </div>
  {/if}
</GameShell>
