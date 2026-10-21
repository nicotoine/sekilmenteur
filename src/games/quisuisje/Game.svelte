<script>
  import { game, themes, MODES } from './state.svelte.js';
  import GameShell from '../../lib/GameShell.svelte';
  import PlayerList from '../../lib/PlayerList.svelte';
  import ThemePicker from '../../lib/ThemePicker.svelte';
  import ModePicker from '../../lib/ModePicker.svelte';
  import Section from '../../lib/Section.svelte';
  import Choice from '../../lib/Choice.svelte';
  import HowTo from '../../lib/HowTo.svelte';
  import Scoreboard from '../../lib/Scoreboard.svelte';
  import Timer from '../../lib/Timer.svelte';
  import Countdown from '../../lib/Countdown.svelte';
  import Avatar from '../../lib/Avatar.svelte';

  const durations = [30, 45, 60, 90];
  const lapCounts = [1, 2, 3];
  const FLASH_MS = 350;

  let flash = $state('');

  function answer(isFound) {
    game.answer(isFound);
    flash = isFound ? 'found' : 'skip';
    setTimeout(() => (flash = ''), FLASH_MS);
  }
</script>

<GameShell title="Qui suis-je ?" onExit={() => game.reset()}>
  {#if game.phase === 'setup'}
    <header class="py-3 text-center">
      <h1 class="text-4xl font-extrabold">Qui suis-je ?</h1>
      <p class="mt-1 text-base-content/70">Le téléphone sur le front, devine qui tu es.</p>
    </header>

    <PlayerList />
    <ThemePicker {themes} bind:value={game.themeId} />
    <ModePicker modes={MODES} bind:value={game.mode} />

    <Section title="Réglages" summary="{game.turnSeconds} s · {game.laps} tour{game.laps > 1 ? 's' : ''} de table">
      <h3 class="mb-2 font-bold">Durée d'un tour</h3>
      <Choice options={durations} bind:value={game.turnSeconds} label="Durée d'un tour" format={(d) => `${d} s`} />
      <div class="divider my-3"></div>
      <h3 class="mb-2 font-bold">Tours de table</h3>
      <Choice options={lapCounts} bind:value={game.laps} label="Tours de table" />
    </Section>

    <HowTo>
      <p>Tu tiens le téléphone sur ton front, écran vers les autres. Ils voient le mot et te le font deviner sans le dire. Dès que tu trouves, ils appuient sur « Trouvé ». Un point par mot trouvé.</p>
    </HowTo>

    <button class="btn btn-primary btn-block h-14 text-lg" disabled={!game.canStart} onclick={() => game.start()}>Lancer la partie</button>
  {:else if game.phase === 'ready'}
    <header class="py-4 text-center">
      <p class="text-sm text-base-content/70">Tour {game.turnIndex + 1} sur {game.totalTurns}</p>
    </header>

    <section class="rounded-box bg-base-100 p-6 text-center">
      <Avatar name={game.currentPlayer.name} index={game.turnIndex % game.players.length} size="size-16" />
      <p class="mt-3 text-base-content/70">C'est à</p>
      <p class="my-2 text-4xl font-extrabold text-secondary">{game.currentPlayer.name}</p>
      <p class="mt-4">Mets le téléphone sur ton front, écran vers les autres, sans regarder le mot.</p>
      <p class="mt-2 text-sm text-secondary">{game.currentMode.emoji} {game.currentMode.description}</p>
    </section>

    <div class="mt-4"><Scoreboard entries={game.players} /></div>

    <button class="btn btn-primary btn-block mt-6 h-14 text-lg" onclick={() => game.beginCountdown()}>Je suis prêt</button>
  {:else if game.phase === 'countdown'}
    <Countdown from={3} onDone={() => game.startTurn()} />
  {:else if game.phase === 'turn'}
    <div class="flex flex-1 flex-col gap-3 landscape:flex-row landscape:items-stretch">
      <div class="flex justify-center landscape:w-32 landscape:shrink-0 landscape:items-center">
        {#key game.turnId}
          <Timer seconds={game.turnSeconds} onEnd={() => game.endTurn()} size={6} textClass="text-2xl" pausable={false} />
        {/key}
      </div>

      <section
        class="flex min-h-56 flex-1 items-center justify-center rounded-box border-4 p-5 text-center transition-colors duration-200 landscape:min-h-0 {flash === 'found' ? 'border-success bg-success text-success-content' : flash === 'skip' ? 'border-neutral bg-neutral' : 'border-secondary bg-base-100'}"
      >
        <p class="font-display text-6xl font-extrabold break-words landscape:text-7xl {flash ? '' : 'text-secondary'}">{game.card}</p>
      </section>

      <div class="flex flex-col gap-3 landscape:w-44 landscape:shrink-0 landscape:justify-center">
        <div class="grid grid-cols-3 gap-3 landscape:grid-cols-1">
          <button class="btn btn-success col-span-2 h-16 text-xl landscape:order-first landscape:col-span-1" onclick={() => answer(true)}>Trouvé</button>
          <button class="btn btn-neutral h-16 text-lg" onclick={() => answer(false)}>Passer</button>
        </div>
        <button class="btn btn-ghost btn-sm" onclick={() => game.endTurn()}>Terminer le tour</button>
      </div>
    </div>
  {:else if game.phase === 'summary'}
    <header class="py-4 text-center">
      <h2 class="text-3xl font-extrabold">{game.currentPlayer.name} : +{game.turnPoints}</h2>
      {#if game.currentMode.skipCost > 0 && game.passed.length > 0}
        <p class="mt-1 text-sm text-base-content/70">{game.found.length} trouvé{game.found.length > 1 ? 's' : ''}, {game.passed.length} passé{game.passed.length > 1 ? 's' : ''}</p>
      {/if}
    </header>

    {#if game.found.length > 0}
      <ul class="mb-4 flex flex-wrap justify-center gap-2">
        {#each game.found as word}
          <li class="badge badge-success badge-lg h-auto px-3 py-2 text-base">{word}</li>
        {/each}
      </ul>
    {/if}
    {#if game.passed.length > 0}
      <ul class="mb-6 flex flex-wrap justify-center gap-2">
        {#each game.passed as word}
          <li class="badge badge-ghost badge-lg h-auto px-3 py-2 text-base">{word}</li>
        {/each}
      </ul>
    {/if}

    <button class="btn btn-primary btn-block h-14 text-lg" onclick={() => game.nextTurn()}>
      {game.turnIndex + 1 >= game.totalTurns ? 'Voir le résultat' : 'Joueur suivant'}
    </button>
  {:else if game.phase === 'end'}
    <header class="py-6 text-center">
      <h2 class="text-4xl font-extrabold text-success">{game.ranking[0].name} gagne</h2>
    </header>

    <ul class="mb-6 flex flex-col gap-2">
      {#each game.ranking as player, rank}
        <li class="flex items-center justify-between rounded-box bg-base-100 px-4 py-3 {rank === 0 ? 'border-2 border-success' : ''}">
          <span class="text-lg font-bold">{rank + 1}. {player.name}</span>
          <span class="font-display text-3xl font-extrabold">{player.score}</span>
        </li>
      {/each}
    </ul>

    <div class="flex flex-col gap-3">
      <button class="btn btn-primary btn-block h-14 text-lg" onclick={() => game.start()}>Rejouer</button>
      <button class="btn btn-outline btn-block h-12" onclick={() => game.reset()}>Changer les réglages</button>
    </div>
  {/if}
</GameShell>
