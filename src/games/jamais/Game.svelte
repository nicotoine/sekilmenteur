<script>
  import { game, MODES, LIVES_OPTIONS } from './state.svelte.js';
  import { themes } from './themes.js';
  import GameShell from '../../lib/GameShell.svelte';
  import PlayerList from '../../lib/PlayerList.svelte';
  import ThemePicker from '../../lib/ThemePicker.svelte';
  import ModePicker from '../../lib/ModePicker.svelte';
  import Section from '../../lib/Section.svelte';
  import Choice from '../../lib/Choice.svelte';
  import HowTo from '../../lib/HowTo.svelte';
  import Avatar from '../../lib/Avatar.svelte';
  import ConfirmButton from '../../lib/ConfirmButton.svelte';

  const playerIndex = (player) => game.players.indexOf(player);
</script>

<GameShell title="Jamédelavi" onExit={() => game.reset()}>
  {#if game.phase === 'setup'}
    <header class="py-3 text-center">
      <h1 class="text-4xl font-extrabold">Jamédelavi</h1>
      <p class="text-sm text-base-content/50">Je n'ai jamais</p>
      <p class="mt-1 text-base-content/70">Ceux qui l'ont déjà fait se dénoncent.</p>
    </header>

    <ModePicker modes={MODES} bind:value={game.mode} open={true} />
    {#if game.tracked}
      <PlayerList />
      <Section title="Vies" summary="{game.lives} vies par joueur">
        <Choice options={LIVES_OPTIONS} bind:value={game.lives} label="Vies par joueur" />
      </Section>
    {/if}
    <ThemePicker {themes} bind:value={game.themeId} />

    <HowTo>
      <p>Le téléphone affiche une phrase qui commence par « Je n'ai jamais ». Tous ceux qui l'ont déjà fait lèvent la main. Les anecdotes font le reste.</p>
    </HowTo>

    <button class="btn btn-primary btn-block h-14 text-lg" disabled={!game.canStart} onclick={() => game.start()}>Lancer la partie</button>
  {:else if game.phase === 'card'}
    <p class="py-2 text-center text-sm text-base-content/70">Carte {game.index}</p>

    <section class="flex min-h-44 items-center justify-center rounded-box border-4 border-secondary bg-base-100 p-6 text-center">
      <p class="font-display text-2xl font-bold">{game.card}</p>
    </section>

    {#if game.tracked}
      <p class="mt-4 text-center text-sm text-base-content/70">Qui l'a déjà fait ? Touche les coupables.</p>
      <div class="mt-2 flex flex-wrap justify-center gap-2">
        {#each game.players as player}
          <button
            class="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 transition-colors {game.marked.includes(player) ? 'bg-error text-error-content' : 'bg-base-100'}"
            aria-pressed={game.marked.includes(player)}
            disabled={player.lives <= 0}
            onclick={() => game.toggle(player)}
          >
            <Avatar name={player.name} index={playerIndex(player)} size="size-7" muted={player.lives <= 0} />
            <span>{player.name}</span>
            <span class="badge badge-sm {game.marked.includes(player) ? 'badge-neutral' : 'badge-ghost'}">{player.lives}</span>
          </button>
        {/each}
      </div>
    {/if}

    <div class="mt-6 flex flex-col gap-3">
      <button class="btn btn-primary btn-block h-14 text-lg" onclick={() => game.next()}>
        {game.tracked && game.marked.length > 0 ? `Carte suivante (${game.marked.length} coupable${game.marked.length > 1 ? 's' : ''})` : 'Carte suivante'}
      </button>
      <ConfirmButton class="btn btn-ghost btn-sm" question="Terminer la partie ?" detail="On passe directement au bilan." confirmLabel="Terminer" onConfirm={() => game.finish()}>Terminer la partie</ConfirmButton>
    </div>
  {:else if game.phase === 'end'}
    <header class="py-4 text-center">
      {#if game.loser}
        <h2 class="text-3xl font-extrabold text-error">{game.loser.name} a tout vécu</h2>
        <p class="mt-2 text-base-content/70">Plus aucune vie. Respect.</p>
      {:else}
        <h2 class="text-3xl font-extrabold">Fin de partie</h2>
        <p class="mt-2 text-base-content/70">{game.index} carte{game.index > 1 ? 's' : ''} lue{game.index > 1 ? 's' : ''}.</p>
      {/if}
    </header>

    {#if game.tracked}
      <ul class="mb-6 flex flex-col gap-2">
        {#each game.ranking as player}
          <li class="flex items-center justify-between rounded-box bg-base-100 px-4 py-3">
            <span class="text-lg font-bold">{player.name}</span>
            <span class="font-display text-2xl font-extrabold">{player.lives} <span class="text-sm font-normal text-base-content/70">vie{player.lives > 1 ? 's' : ''}</span></span>
          </li>
        {/each}
      </ul>
    {/if}

    <div class="flex flex-col gap-3">
      <button class="btn btn-primary btn-block h-14 text-lg" onclick={() => game.start()}>Rejouer</button>
      <button class="btn btn-outline btn-block h-12" onclick={() => game.reset()}>Changer les réglages</button>
    </div>
  {/if}
</GameShell>
