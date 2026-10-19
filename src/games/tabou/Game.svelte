<script>
  import { game } from './state.svelte.js';
  import { themes } from './themes.js';
  import GameShell from '../../lib/GameShell.svelte';
  import ThemePicker from '../../lib/ThemePicker.svelte';
  import Timer from '../../lib/Timer.svelte';

  const durations = [30, 45, 60, 90, 120];
  const turnCounts = [1, 2, 3, 5];
  const resultLabel = { found: 'Trouvé', taboo: 'Tabou', skip: 'Passé' };
  const resultClass = { found: 'badge-success', taboo: 'badge-error', skip: 'badge-ghost' };
  const signed = (n) => (n > 0 ? `+${n}` : `${n}`);
</script>

<GameShell title="Tabou" onExit={() => game.reset()}>
  {#if game.phase === 'setup'}
    <header class="py-6 text-center">
      <h1 class="text-5xl font-extrabold">Tabou</h1>
      <p class="mt-2 text-base-content/70">Fais deviner le mot, sans dire les mots interdits.</p>
    </header>

    <section class="mb-6">
      <h2 class="mb-3 text-xl font-bold">Équipes</h2>
      <div class="flex flex-col gap-2">
        {#each game.teamNames as _, i}
          <input type="text" class="input input-lg h-12 w-full text-base" placeholder={`Équipe ${i + 1}`} maxlength="20" autocomplete="off" bind:value={game.teamNames[i]} />
        {/each}
      </div>
    </section>

    <ThemePicker {themes} bind:value={game.themeId} />

    <section class="mb-6 rounded-box bg-base-100 p-4">
      <h2 class="mb-2 text-lg font-bold">Durée d'un tour</h2>
      <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Durée d'un tour">
        {#each durations as d}
          <button class="btn btn-sm h-10 {game.turnSeconds === d ? 'btn-secondary' : 'btn-outline'}" role="radio" aria-checked={game.turnSeconds === d} onclick={() => (game.turnSeconds = d)}>{d} s</button>
        {/each}
      </div>

      <div class="divider my-3"></div>

      <h2 class="mb-2 text-lg font-bold">Tours par équipe</h2>
      <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Tours par équipe">
        {#each turnCounts as n}
          <button class="btn btn-sm h-10 {game.turnsPerTeam === n ? 'btn-secondary' : 'btn-outline'}" role="radio" aria-checked={game.turnsPerTeam === n} onclick={() => (game.turnsPerTeam = n)}>{n}</button>
        {/each}
      </div>
    </section>

    <section class="mb-6 rounded-box bg-base-100 p-4 text-sm text-base-content/80">
      <p><strong>Comment jouer.</strong> Un joueur de l'équipe décrit, ses coéquipiers devinent. Un joueur de l'équipe adverse tient le téléphone : il voit les mots interdits et appuie sur « Tabou » dès qu'ils sont prononcés.</p>
    </section>

    <button class="btn btn-primary btn-block h-14 text-lg" disabled={!game.canStart} onclick={() => game.start()}>Lancer la partie</button>
  {:else if game.phase === 'ready'}
    <header class="py-4 text-center">
      <p class="text-sm text-base-content/70">Tour {game.turnIndex + 1} sur {game.totalTurns}</p>
    </header>

    <section class="rounded-box bg-base-100 p-6 text-center">
      <p class="text-base-content/70">Au tour de</p>
      <h2 class="my-2 text-4xl font-extrabold text-secondary">{game.currentTeam}</h2>
      <p class="mt-4">Un joueur décrit, ses coéquipiers devinent.</p>
      <p class="mt-2 text-base-content/70">Le téléphone va à un joueur de <strong class="text-base-content">{game.opponentTeam}</strong>, qui surveille les mots interdits.</p>
    </section>

    <div class="mt-4 flex justify-center gap-6 text-center">
      {#each game.displayNames as name, i}
        <div>
          <p class="text-sm text-base-content/70">{name}</p>
          <p class="font-display text-3xl font-extrabold">{game.scores[i]}</p>
        </div>
      {/each}
    </div>

    <button class="btn btn-primary btn-block mt-6 h-14 text-lg" onclick={() => game.startTurn()}>Démarrer le chrono</button>
  {:else if game.phase === 'turn'}
    <div class="my-2 flex justify-center">
      {#key game.turnIndex}
        <Timer seconds={game.turnSeconds} onEnd={() => game.endTurn()} />
      {/key}
    </div>

    <section class="rounded-box border-4 border-secondary bg-base-100 p-5 text-center">
      <p class="font-display text-4xl font-extrabold break-words text-secondary">{game.card.word}</p>
      <p class="mt-4 text-sm text-base-content/70">Mots interdits</p>
      <ul class="mt-2 flex flex-wrap justify-center gap-2">
        {#each game.card.forbidden as word}
          <li class="badge badge-error badge-lg h-auto px-3 py-2 text-base font-semibold">{word}</li>
        {/each}
      </ul>
    </section>

    <div class="mt-4 flex flex-col gap-3">
      <button class="btn btn-success btn-block h-16 text-xl" onclick={() => game.answer('found')}>Trouvé ({signed(1)})</button>
      <div class="grid grid-cols-2 gap-3">
        <button class="btn btn-error h-14 text-lg" onclick={() => game.answer('taboo')}>Tabou ({signed(-1)})</button>
        <button class="btn btn-neutral h-14 text-lg" onclick={() => game.answer('skip')}>Passer</button>
      </div>
      <button class="btn btn-ghost btn-sm" onclick={() => game.endTurn()}>Terminer le tour</button>
    </div>
  {:else if game.phase === 'summary'}
    <header class="py-4 text-center">
      <h2 class="text-3xl font-extrabold">{game.currentTeam} : {signed(game.turnPoints)}</h2>
      <p class="mt-1 text-base-content/70">{game.turnLog.length} carte{game.turnLog.length > 1 ? 's' : ''} jouée{game.turnLog.length > 1 ? 's' : ''}</p>
    </header>

    {#if game.turnLog.length > 0}
      <ul class="mb-6 flex flex-col gap-2">
        {#each game.turnLog as entry}
          <li class="flex items-center justify-between gap-3 rounded-box bg-base-100 px-4 py-2">
            <span>{entry.word}</span>
            <span class="badge {resultClass[entry.result]}">{resultLabel[entry.result]}</span>
          </li>
        {/each}
      </ul>
    {/if}

    <div class="mb-6 flex justify-center gap-6 text-center">
      {#each game.displayNames as name, i}
        <div>
          <p class="text-sm text-base-content/70">{name}</p>
          <p class="font-display text-3xl font-extrabold">{game.scores[i]}</p>
        </div>
      {/each}
    </div>

    <button class="btn btn-primary btn-block h-14 text-lg" onclick={() => game.nextTurn()}>
      {game.turnIndex + 1 >= game.totalTurns ? 'Voir le résultat' : `Tour suivant`}
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
        <li class="flex items-center justify-between rounded-box bg-base-100 px-4 py-3 {game.winnerIndex === i ? 'border-2 border-success' : ''}">
          <span class="text-lg font-bold">{name}</span>
          <span class="font-display text-3xl font-extrabold">{game.scores[i]}</span>
        </li>
      {/each}
    </ul>

    <div class="flex flex-col gap-3">
      <button class="btn btn-primary btn-block h-14 text-lg" onclick={() => game.start()}>Rejouer</button>
      <button class="btn btn-outline btn-block h-12" onclick={() => game.reset()}>Changer les réglages</button>
    </div>
  {/if}
</GameShell>
