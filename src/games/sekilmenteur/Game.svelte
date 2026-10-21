<script>
  import { game, MODES, CLUE_ROUND_OPTIONS } from './state.svelte.js';
  import { themes } from './themes.js';
  import GameShell from '../../lib/GameShell.svelte';
  import PlayerList from '../../lib/PlayerList.svelte';
  import ThemePicker from '../../lib/ThemePicker.svelte';
  import ModePicker from '../../lib/ModePicker.svelte';
  import Section from '../../lib/Section.svelte';
  import Choice from '../../lib/Choice.svelte';
  import HowTo from '../../lib/HowTo.svelte';
  import RevealSequence from '../../lib/RevealSequence.svelte';
  import Timer from '../../lib/Timer.svelte';
  import Avatar from '../../lib/Avatar.svelte';
  import PlayerGrid from '../../lib/PlayerGrid.svelte';

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
  const settingsSummary = $derived(
    `${game.effectiveLiarCount} menteur${game.effectiveLiarCount > 1 ? 's' : ''} · ${game.clueRounds} tour${game.clueRounds > 1 ? 's' : ''} · ${formatDuration(game.timerSeconds)}`,
  );
</script>

<GameShell title="Sékilmenteur" onExit={() => game.reset()}>
{#if game.phase === 'setup'}
  <header class="py-3 text-center">
    <h1 class="text-4xl font-extrabold">Sékilmenteur</h1>
    <p class="text-sm text-base-content/50">C'est qui le menteur ?</p>
    <p class="mt-1 text-base-content/70">Un mot secret. Un menteur parmi vous.</p>
  </header>

  <PlayerList />

  <ThemePicker {themes} bind:value={game.themeId} />
  <ModePicker modes={MODES} bind:value={game.mode} />

  <Section title="Réglages" summary={settingsSummary}>
    <div class="flex items-center justify-between gap-4">
      <div>
        <h3 class="font-bold">Menteurs</h3>
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
        <span class="block font-bold">Indice pour les menteurs</span>
        <span class="block text-sm text-base-content/70">Ils voient la catégorie du mot.</span>
      </span>
      <input type="checkbox" class="toggle toggle-secondary toggle-lg" bind:checked={game.hintMode} />
    </label>

    <div class="divider my-3"></div>

    <h3 class="mb-2 font-bold">Tours de parole avant le vote</h3>
    <Choice options={CLUE_ROUND_OPTIONS} bind:value={game.clueRounds} label="Tours de parole" />

    <div class="divider my-3"></div>

    <h3 class="mb-2 font-bold">Chrono par tour</h3>
    <Choice options={timerOptions} bind:value={game.timerSeconds} label="Durée du chrono" format={formatDuration} />
  </Section>

  <HowTo>
    <p>Tout le monde reçoit le même mot, sauf les menteurs. À tour de rôle, chacun dit un mot en rapport avec le mot secret, sans le dévoiler. Puis le groupe vote pour éliminer un suspect.</p>
  </HowTo>

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
  <header class="py-2 text-center">
    <h2 class="text-2xl font-bold">Tour {game.clueRound} sur {game.clueRounds}</h2>
    <p class="mt-1 text-base-content/70">Chacun son tour, dites un mot en rapport avec le thème.</p>
  </header>

  <div class="my-4 flex justify-center">
    {#key `${game.clueRound}-${game.alivePlayers.length}`}
      <Timer seconds={game.timerSeconds} size={12} textClass="text-5xl" />
    {/key}
  </div>

  <section class="mb-4 rounded-box bg-base-100 p-4">
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
    {game.clueRound < game.clueRounds ? 'Tour suivant' : 'Passer au vote'}
  </button>
  {#if game.canSpyGuess}
    <button class="btn btn-outline btn-block mt-3 h-12" onclick={() => game.startSpyGuess()}>🕵️ Un menteur se dévoile</button>
  {/if}
{:else if game.phase === 'vote'}
  <header class="py-4 text-center">
    <h2 class="text-3xl font-extrabold">Qui est le menteur ?</h2>
    <p class="mt-1 text-base-content/70">Discutez, puis désignez ensemble un suspect.</p>
  </header>

  <PlayerGrid players={game.alivePlayers} bind:selected index={playerIndex} />

  <button class="btn btn-primary btn-block mt-6 h-14 text-lg" disabled={!selected} onclick={confirmAccusation}>
    {selected ? `Accuser ${selected.name}` : 'Choisis un suspect'}
  </button>
  {#if game.canSpyGuess}
    <button class="btn btn-outline btn-block mt-3 h-12" onclick={() => game.startSpyGuess()}>🕵️ Un menteur se dévoile</button>
  {/if}
{:else if game.phase === 'spyGuess'}
  <header class="py-4 text-center">
    <h2 class="text-3xl font-extrabold">Qui se dévoile ?</h2>
    <p class="mt-1 text-base-content/70">Le joueur annonce le mot à voix haute. Le groupe vérifie.</p>
  </header>

  <PlayerGrid players={game.alivePlayers} bind:selected index={playerIndex} />

  <section class="mt-4 rounded-box bg-base-100 p-4 text-center">
    <p class="text-sm text-base-content/70">Le mot secret est</p>
    <p class="font-display text-3xl font-extrabold text-secondary">{game.entry.word}</p>
  </section>

  <div class="mt-4 grid grid-cols-2 gap-3">
    <button class="btn btn-success h-14 text-lg" disabled={!selected} onclick={() => { const p = selected; selected = null; game.resolveSpyGuess(p, true); }}>Il a trouvé</button>
    <button class="btn btn-error h-14 text-lg" disabled={!selected} onclick={() => { const p = selected; selected = null; game.resolveSpyGuess(p, false); }}>Raté</button>
  </div>
  <button class="btn btn-ghost btn-block mt-3" onclick={() => { selected = null; game.cancelSpyGuess(); }}>Annuler</button>
{:else if game.phase === 'result'}
  <section class="mt-6 rounded-box border-4 bg-base-100 p-6 text-center {game.accused.isLiar ? 'border-success' : 'border-error'}">
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
    {game.accusedMayGuess ? 'Dernière chance du menteur' : game.outcome ? 'Voir le résultat' : 'Nouveaux tours de parole'}
  </button>
{:else if game.phase === 'guess'}
  <section class="mt-6 rounded-box bg-base-100 p-6 text-center">
    <span class="text-6xl" aria-hidden="true">🎲</span>
    <h2 class="mt-3 text-2xl font-bold">{game.guesser.name}, quel est le mot ?</h2>
    <p class="mt-2 text-base-content/70">Dis ta réponse à voix haute. Le groupe vérifie.</p>
    <p class="mt-4 text-sm text-base-content/70">Le mot était</p>
    <p class="font-display text-3xl font-extrabold text-secondary">{game.entry.word}</p>
  </section>
  <div class="mt-6 grid grid-cols-2 gap-3">
    <button class="btn btn-success h-14 text-lg" onclick={() => game.resolveGuess(true)}>Il a trouvé</button>
    <button class="btn btn-outline h-14 text-lg" onclick={() => game.resolveGuess(false)}>Raté</button>
  </div>
{:else if game.phase === 'end'}
  <header class="py-4 text-center">
    {#if game.outcome === 'win'}
      <h2 class="text-4xl font-extrabold text-success">Les honnêtes gagnent</h2>
      <p class="mt-2 text-base-content/70">Tous les menteurs sont démasqués.</p>
    {:else}
      <h2 class="text-4xl font-extrabold text-error">Les menteurs gagnent</h2>
      <p class="mt-2 text-base-content/70">
        {game.endReason === 'guessed' ? `${game.guesser?.name ?? 'Un menteur'} a deviné le mot.` : 'Ils sont aussi nombreux que les honnêtes.'}
      </p>
    {/if}
  </header>

  <section class="mb-4 rounded-box bg-base-100 p-4 text-center">
    <p class="text-sm text-base-content/70">Le mot était</p>
    <p class="font-display text-4xl font-extrabold text-secondary">{game.entry.word}</p>
  </section>

  <ul class="mb-4 flex flex-wrap justify-center gap-2">
    {#each game.players as player, i}
      <li class="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 {player.isLiar ? 'bg-primary/30' : 'bg-base-100'}">
        <Avatar name={player.name} index={i} size="size-7" muted={!player.alive} />
        <span class:line-through={!player.alive}>{player.name}</span>
        <span class="text-xs text-base-content/70">{player.isLiar ? '🤥' : '✓'}</span>
      </li>
    {/each}
  </ul>

  <div class="flex flex-col gap-3">
    <button class="btn btn-primary btn-block h-14 text-lg" onclick={() => game.start()}>Rejouer avec les mêmes joueurs</button>
    <button class="btn btn-outline btn-block h-12" onclick={() => game.reset()}>Changer les réglages</button>
  </div>
{/if}
</GameShell>
