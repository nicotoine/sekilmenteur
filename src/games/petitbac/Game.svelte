<script>
  import { game, MODES } from './state.svelte.js';
  import { themes } from './themes.js';
  import GameShell from '../../lib/GameShell.svelte';
  import PlayerList from '../../lib/PlayerList.svelte';
  import ThemePicker from '../../lib/ThemePicker.svelte';
  import ModePicker from '../../lib/ModePicker.svelte';
  import Section from '../../lib/Section.svelte';
  import Choice from '../../lib/Choice.svelte';
  import HowTo from '../../lib/HowTo.svelte';
  import Scoreboard from '../../lib/Scoreboard.svelte';
  import Timer from '../../lib/Timer.svelte';
  import Avatar from '../../lib/Avatar.svelte';

  const roundCounts = [1, 3, 5, 8];
  const durations = [60, 90, 120, 180];
</script>

<GameShell title="Çakomanspar" onExit={() => game.reset()}>
  {#if game.phase === 'setup'}
    <header class="py-3 text-center">
      <h1 class="text-4xl font-extrabold">Çakomanspar</h1>
      <p class="text-sm text-base-content/50">Petit Bac</p>
      <p class="mt-1 text-base-content/70">Une lettre, des catégories, un papier et un stylo chacun.</p>
    </header>

    <PlayerList />
    <ThemePicker {themes} bind:value={game.themeId} />
    <ModePicker modes={MODES} bind:value={game.mode} />

    <Section title="Réglages" summary="{game.roundCount} manche{game.roundCount > 1 ? 's' : ''}{game.currentMode.timed ? ` · ${game.turnSeconds} s` : ''}">
      <h3 class="mb-2 font-bold">Nombre de manches</h3>
      <Choice options={roundCounts} bind:value={game.roundCount} label="Nombre de manches" />
      {#if game.currentMode.timed}
        <div class="divider my-3"></div>
        <h3 class="mb-2 font-bold">Durée d'une manche</h3>
        <Choice options={durations} bind:value={game.turnSeconds} label="Durée d'une manche" format={(d) => `${d} s`} />
      {/if}
    </Section>

    <HowTo>
      <p>Le téléphone tire une lettre et des catégories. Chacun écrit sur son papier un mot par catégorie commençant par cette lettre. À la fin, on compare : une réponse valable vaut 1 point, 2 si personne d'autre ne l'a écrite. Entrez les points de chacun dans le téléphone.</p>
    </HowTo>

    <button class="btn btn-primary btn-block h-14 text-lg" disabled={!game.canStart} onclick={() => game.start()}>Lancer la partie</button>
  {:else if game.phase === 'ready'}
    <header class="py-4 text-center">
      <p class="text-sm text-base-content/70">Manche {game.round} sur {game.roundCount}</p>
      <h2 class="text-2xl font-bold">Préparez vos papiers</h2>
    </header>
    <section class="rounded-box bg-base-100 p-6 text-center">
      <p class="text-base-content/70">{game.categories.length} catégories à remplir</p>
      <p class="mt-2 text-sm text-base-content/70">{game.currentMode.timed ? `Vous avez ${game.turnSeconds} secondes.` : 'Pas de chrono : le premier qui a tout rempli crie « Stop ».'}</p>
    </section>
    <div class="mt-4"><Scoreboard entries={game.players} /></div>
    <button class="btn btn-primary btn-block mt-6 h-14 text-lg" onclick={() => game.startRound()}>Tirer la lettre</button>
  {:else if game.phase === 'turn'}
    <div class="flex flex-1 flex-col gap-3 landscape:flex-row">
      <div class="flex flex-col items-center justify-center gap-2 landscape:w-40 landscape:shrink-0">
        <p class="text-sm text-base-content/70">La lettre</p>
        <p class="font-display text-[7rem] leading-none font-extrabold text-secondary" aria-label="Lettre {game.letter}">{game.letter}</p>
        {#if game.currentMode.timed}
          {#key game.turnId}
            <Timer seconds={game.turnSeconds} onEnd={() => game.stopRound()} size={5} textClass="text-xl" pausable={false} />
          {/key}
        {/if}
      </div>
      <ol class="flex flex-1 flex-col justify-center gap-1.5">
        {#each game.categories as category, i}
          <li class="flex items-center gap-3 rounded-field bg-base-100 px-3 py-2">
            <span class="w-5 shrink-0 text-right text-sm font-bold text-base-content/60">{i + 1}</span>
            <span class="font-semibold">{category}</span>
          </li>
        {/each}
      </ol>
    </div>
    <button class="btn btn-error btn-block mt-3 h-14 text-lg" onclick={() => game.stopRound()}>Stop !</button>
  {:else if game.phase === 'score'}
    <header class="py-3 text-center">
      <h2 class="text-2xl font-bold">Lettre {game.letter} : les points</h2>
      <p class="mt-1 text-sm text-base-content/70">1 point par réponse valable, 2 si elle est unique. Maximum {game.maxRoundScore}.</p>
    </header>
    <ul class="flex flex-col gap-2">
      {#each game.players as player, i}
        <li class="flex items-center gap-3 rounded-box bg-base-100 px-3 py-2">
          <Avatar name={player.name} index={i} size="size-8" />
          <span class="min-w-0 grow truncate">{player.name}</span>
          <div class="join">
            <button class="btn join-item btn-neutral h-11 w-11 text-xl" aria-label="Moins pour {player.name}" disabled={game.roundScores[i] <= 0} onclick={() => game.setScore(i, game.roundScores[i] - 1)}>−</button>
            <output class="join-item flex w-11 items-center justify-center bg-base-300 font-display text-xl font-bold">{game.roundScores[i]}</output>
            <button class="btn join-item btn-neutral h-11 w-11 text-xl" aria-label="Plus pour {player.name}" disabled={game.roundScores[i] >= game.maxRoundScore} onclick={() => game.setScore(i, game.roundScores[i] + 1)}>+</button>
          </div>
        </li>
      {/each}
    </ul>
    <button class="btn btn-primary btn-block mt-4 h-14 text-lg" onclick={() => game.validateScores()}>
      {game.round >= game.roundCount ? 'Voir le résultat' : 'Manche suivante'}
    </button>
  {:else if game.phase === 'end'}
    <header class="py-4 text-center">
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
