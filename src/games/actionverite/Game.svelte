<script>
  import { game, MODES, KIND } from './state.svelte.js';
  import { themes } from './themes.js';
  import GameShell from '../../lib/GameShell.svelte';
  import PlayerList from '../../lib/PlayerList.svelte';
  import ThemePicker from '../../lib/ThemePicker.svelte';
  import ModePicker from '../../lib/ModePicker.svelte';
  import HowTo from '../../lib/HowTo.svelte';
  import Avatar from '../../lib/Avatar.svelte';
  import ConfirmButton from '../../lib/ConfirmButton.svelte';

  const playerIndex = () => game.turnIndex % game.players.length;
</script>

<GameShell title="Capoupacap" onExit={() => game.reset()}>
  {#if game.phase === 'setup'}
    <header class="py-3 text-center">
      <h1 class="text-4xl font-extrabold">Capoupacap</h1>
      <p class="text-sm text-base-content/50">Action ou Vérité</p>
      <p class="mt-1 text-base-content/70">Le grand classique. Sans tricher.</p>
    </header>

    <PlayerList />
    <ThemePicker {themes} bind:value={game.themeId} />
    <ModePicker modes={MODES} bind:value={game.mode} />

    <HowTo>
      <p>À tour de rôle, chaque joueur choisit « Action » ou « Vérité » et le téléphone tire une carte. On note qui relève ses défis et qui se dégonfle.</p>
    </HowTo>

    <button class="btn btn-primary btn-block h-14 text-lg" disabled={!game.canStart} onclick={() => game.start()}>Lancer la partie</button>
  {:else if game.phase === 'pick'}
    <section class="mt-4 rounded-box bg-base-100 p-6 text-center">
      <Avatar name={game.currentPlayer.name} index={playerIndex()} size="size-16" />
      <p class="mt-3 text-base-content/70">C'est à</p>
      <h2 class="my-2 text-4xl font-extrabold text-secondary">{game.currentPlayer.name}</h2>
      <p class="text-sm text-base-content/70">{game.currentMode.emoji} {game.currentMode.name}</p>
    </section>

    <div class="mt-6 flex flex-col gap-3">
      {#if game.currentMode.random}
        <button class="btn btn-primary btn-block h-16 text-xl" onclick={() => game.choose()}>🎰 Tourner la roue</button>
      {:else}
        <div class="grid gap-3 {game.choices.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}">
          {#each game.choices as kind}
            <button class="btn h-20 text-xl {kind === 'truth' ? 'btn-info' : 'btn-error'}" onclick={() => game.choose(kind)}>{KIND[kind].emoji} {KIND[kind].name}</button>
          {/each}
        </div>
      {/if}
      <ConfirmButton class="btn btn-ghost btn-sm" question="Terminer la partie ?" detail="On passe directement au bilan." confirmLabel="Terminer" onConfirm={() => game.finish()}>Terminer la partie</ConfirmButton>
    </div>
  {:else if game.phase === 'card'}
    <header class="py-3 text-center">
      <p class="text-sm text-base-content/70">{game.currentPlayer.name}</p>
      <h2 class="text-2xl font-bold {game.kind === 'truth' ? 'text-info' : 'text-error'}">{KIND[game.kind].emoji} {KIND[game.kind].name}</h2>
    </header>

    <section class="flex min-h-56 items-center justify-center rounded-box border-4 bg-base-100 p-6 text-center {game.kind === 'truth' ? 'border-info' : 'border-error'}">
      <p class="font-display text-2xl font-bold">{game.card}</p>
    </section>

    <div class="mt-6 grid grid-cols-2 gap-3">
      <button class="btn btn-success h-16 text-lg" onclick={() => game.resolve(true)}>Fait !</button>
      <button class="btn btn-neutral h-16 text-lg" onclick={() => game.resolve(false)}>Dégonflé 🐔</button>
    </div>
  {:else if game.phase === 'end'}
    <header class="py-4 text-center">
      <h2 class="text-3xl font-extrabold">Fin de partie</h2>
      {#if game.biggestChicken}
        <p class="mt-2 text-base-content/70">🐔 {game.biggestChicken.name} s'est dégonflé {game.biggestChicken.chickened} fois.</p>
      {/if}
    </header>

    <ul class="mb-6 flex flex-col gap-2">
      {#each game.ranking as player}
        <li class="flex items-center justify-between rounded-box bg-base-100 px-4 py-3">
          <span class="text-lg font-bold">{player.name}</span>
          <span class="text-sm text-base-content/70">{player.done} relevé{player.done > 1 ? 's' : ''} · {player.chickened} dégonflé{player.chickened > 1 ? 's' : ''}</span>
        </li>
      {/each}
    </ul>

    <div class="flex flex-col gap-3">
      <button class="btn btn-primary btn-block h-14 text-lg" onclick={() => game.start()}>Rejouer</button>
      <button class="btn btn-outline btn-block h-12" onclick={() => game.reset()}>Changer les réglages</button>
    </div>
  {/if}
</GameShell>
