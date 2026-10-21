<script>
  import { game, MODES, ROLES, OPTIONAL_ROLES, MIN_PLAYERS } from './state.svelte.js';
  import GameShell from '../../lib/GameShell.svelte';
  import PlayerList from '../../lib/PlayerList.svelte';
  import ModePicker from '../../lib/ModePicker.svelte';
  import Section from '../../lib/Section.svelte';
  import HowTo from '../../lib/HowTo.svelte';
  import RevealSequence from '../../lib/RevealSequence.svelte';
  import Avatar from '../../lib/Avatar.svelte';
  import PlayerGrid from '../../lib/PlayerGrid.svelte';

  let selected = $state(null);

  const playerIndex = (player) => game.players.indexOf(player);
  const names = (list) => list.map((p) => p.name).join(', ');
  const settingsSummary = $derived(
    `${game.effectiveWolfCount} loup${game.effectiveWolfCount > 1 ? 's' : ''}${game.specialRoles.map((id) => ` · ${ROLES[id].emoji}`).join('')}`,
  );
  const tooManyRoles = $derived(game.effectiveWolfCount + game.specialRoles.length > game.playerCount);

  function pick(action) {
    if (!selected) return;
    const player = selected;
    selected = null;
    action(player);
  }
  function describeRole(player) {
    const role = game.roleOf(player);
    return `${role.emoji} ${role.name}`;
  }
</script>

<GameShell title="Loup-Garou" onExit={() => game.reset()}>
  {#if game.phase === 'setup'}
    <header class="py-3 text-center">
      <h1 class="text-4xl font-extrabold">Loup-Garou</h1>
      <p class="mt-1 text-base-content/70">La nuit, les loups dévorent. Le jour, le village vote.</p>
    </header>

    <PlayerList />
    {#if game.playerCount >= 3 && game.playerCount < MIN_PLAYERS}
      <p class="-mt-4 mb-4 text-sm text-error">Il faut au moins {MIN_PLAYERS} joueurs pour Loup-Garou.</p>
    {/if}

    <ModePicker modes={MODES} bind:value={game.mode} />

    <Section title="Rôles" summary={settingsSummary}>
      <div class="flex items-center justify-between gap-4">
        <div>
          <h3 class="font-bold">🐺 Loups-garous</h3>
          <p class="text-sm text-base-content/70">Environ un loup pour trois joueurs.</p>
        </div>
        <div class="join">
          <button class="btn join-item btn-neutral h-12 w-12 text-xl" aria-label="Moins de loups" disabled={game.effectiveWolfCount <= 1} onclick={() => (game.wolfCount = game.effectiveWolfCount - 1)}>−</button>
          <output class="join-item flex w-12 items-center justify-center bg-base-300 font-display text-xl font-bold">{game.effectiveWolfCount}</output>
          <button class="btn join-item btn-neutral h-12 w-12 text-xl" aria-label="Plus de loups" disabled={game.effectiveWolfCount >= game.maxWolves} onclick={() => (game.wolfCount = game.effectiveWolfCount + 1)}>+</button>
        </div>
      </div>
      {#each OPTIONAL_ROLES as id}
        <div class="divider my-3"></div>
        <label class="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span class="block font-bold">{ROLES[id].emoji} {ROLES[id].name}</span>
            <span class="block text-sm text-base-content/70">{ROLES[id].description}</span>
          </span>
          <input type="checkbox" class="toggle toggle-secondary toggle-lg" bind:checked={game.roles[id]} />
        </label>
      {/each}
      {#if tooManyRoles}
        <p class="mt-3 text-sm text-error">Trop de rôles pour {game.playerCount} joueurs : retire un rôle ou un loup.</p>
      {/if}
    </Section>

    <HowTo>
      <p class="mb-2">Chaque nuit, le téléphone passe de main en main : chacun regarde son écran en secret, agit si son rôle le permet, puis le passe au suivant. Au matin, le village découvre les victimes, débat, et vote pour éliminer un suspect.</p>
      <p>Le village gagne quand tous les loups sont éliminés. Les loups gagnent dès qu'ils sont aussi nombreux que les autres.</p>
    </HowTo>

    <button class="btn btn-primary btn-block h-14 text-lg" disabled={!game.canStart} onclick={() => game.start()}>Lancer la partie</button>
  {:else if game.phase === 'reveal'}
    <RevealSequence names={game.players.map((p) => p.name)} onDone={() => game.beginNight()}>
      {#snippet back(i)}
        {@const player = game.players[i]}
        {@const role = game.roleOf(player)}
        <span class="text-6xl" aria-hidden="true">{role.emoji}</span>
        <h2 class="mt-3 text-3xl font-extrabold {player.role === 'loup' ? 'text-error' : 'text-secondary'}">Tu es {role.name}</h2>
        <p class="mt-3 text-base-content/80">{role.description}</p>
        {#if player.role === 'loup' && game.accomplices(player).length > 0}
          <p class="mt-3 text-sm text-base-content/70">Tes complices : <strong class="text-base-content">{names(game.accomplices(player))}</strong></p>
        {/if}
      {/snippet}
    </RevealSequence>
  {:else if game.phase === 'night'}
    {@const player = game.nightPlayer}
    <header class="py-2 text-center">
      <p class="text-sm text-base-content/70">Nuit {game.nightNumber} · joueur {game.nightStep} sur {game.night.order.length}</p>
    </header>

    {#if !game.night.uncovered}
      <section class="card-pattern mx-auto flex min-h-72 w-full max-w-xs flex-col items-center justify-center rounded-3xl p-6 text-center text-white">
        <span class="text-sm opacity-80">Passe le téléphone à</span>
        <span class="font-display my-3 text-4xl font-extrabold break-all">{player.name}</span>
        <span class="text-sm opacity-80">Les autres ferment les yeux.</span>
      </section>
      <button class="btn btn-primary btn-block mt-6 h-14 text-lg" onclick={() => game.uncover()}>Je suis {player.name}</button>
    {:else if player.role === 'loup'}
      <section class="rounded-box border-4 border-error bg-base-100 p-4 text-center">
        <h2 class="text-2xl font-extrabold text-error">🐺 Les loups se réveillent</h2>
        {#if game.accomplices(player).filter((p) => p.alive).length > 0}
          <p class="mt-1 text-sm text-base-content/70">Avec toi : {names(game.accomplices(player).filter((p) => p.alive))}</p>
        {/if}
        {#if game.wolvesAttack}
          <p class="mt-3">Qui dévorez-vous cette nuit ?</p>
          {#if game.night.victim}
            <p class="mt-1 text-sm text-secondary">Choix actuel : {game.night.victim.name}</p>
          {/if}
        {:else}
          <p class="mt-3">Première nuit calme : regardez-vous, personne ne meurt.</p>
        {/if}
      </section>
      {#if game.wolvesAttack}
        <div class="mt-4">
          <PlayerGrid players={game.wolfTargets} selected={game.night.victim} onselect={(p) => game.chooseVictim(p)} index={playerIndex} />
        </div>
      {/if}
      <button class="btn btn-primary btn-block mt-4 h-14 text-lg" disabled={game.wolvesAttack && !game.night.victim} onclick={() => game.nextSleeper()}>Je me rendors</button>
    {:else if player.role === 'voyante'}
      <section class="rounded-box border-4 border-secondary bg-base-100 p-4 text-center">
        <h2 class="text-2xl font-extrabold text-secondary">🔮 La voyante se réveille</h2>
        {#if game.night.seen}
          <p class="mt-3">{game.night.seen.name} est</p>
          <p class="font-display text-3xl font-extrabold">{describeRole(game.night.seen)}</p>
        {:else}
          <p class="mt-3">Qui veux-tu sonder ?</p>
        {/if}
      </section>
      {#if !game.night.seen}
        <div class="mt-4">
          <PlayerGrid players={game.alivePlayers.filter((p) => p !== player)} bind:selected index={playerIndex} />
        </div>
        <button class="btn btn-secondary btn-block mt-4 h-14 text-lg" disabled={!selected} onclick={() => pick((p) => game.peek(p))}>Voir son rôle</button>
      {:else}
        <button class="btn btn-primary btn-block mt-4 h-14 text-lg" onclick={() => game.nextSleeper()}>Je me rendors</button>
      {/if}
    {:else if player.role === 'sorciere'}
      <section class="rounded-box border-4 border-accent bg-base-100 p-4 text-center">
        <h2 class="text-2xl font-extrabold text-accent">🧪 La sorcière se réveille</h2>
        {#if game.night.victim}
          <p class="mt-3">Cette nuit, les loups attaquent <strong class="text-error">{game.night.victim.name}</strong>.</p>
        {:else}
          <p class="mt-3">Les loups n'ont attaqué personne cette nuit.</p>
        {/if}
      </section>
      {#if game.potions.heal && game.night.victim}
        <button class="btn btn-block mt-4 h-12 {game.night.healed ? 'btn-success' : 'btn-outline'}" aria-pressed={game.night.healed} onclick={() => game.toggleHeal()}>
          {game.night.healed ? `✓ ${game.night.victim.name} sera sauvé` : `Potion de vie : sauver ${game.night.victim.name}`}
        </button>
      {/if}
      {#if game.potions.poison}
        <p class="mt-4 text-center text-sm text-base-content/70">Potion de mort : touche un joueur pour l'empoisonner (ou personne).</p>
        <div class="mt-2">
          <PlayerGrid players={game.alivePlayers.filter((p) => p !== player)} selected={game.night.poisoned} onselect={(p) => game.poison(p)} index={playerIndex} />
        </div>
      {/if}
      <button class="btn btn-primary btn-block mt-4 h-14 text-lg" onclick={() => game.nextSleeper()}>Je me rendors</button>
    {:else}
      <section class="rounded-box bg-base-100 p-6 text-center">
        <span class="text-6xl" aria-hidden="true">😴</span>
        <h2 class="mt-3 text-2xl font-bold">Tu dors paisiblement</h2>
        <p class="mt-2 text-base-content/70">Attends quelques secondes, comme si tu agissais, puis passe le téléphone.</p>
      </section>
      <button class="btn btn-primary btn-block mt-6 h-14 text-lg" onclick={() => game.nextSleeper()}>Passer le téléphone</button>
    {/if}
  {:else if game.phase === 'dawn'}
    <header class="py-4 text-center">
      <h2 class="text-3xl font-extrabold">☀️ Le village se réveille</h2>
    </header>
    <section class="rounded-box bg-base-100 p-6 text-center">
      {#if game.deaths.length === 0}
        <p class="text-xl font-bold text-success">Personne n'est mort cette nuit.</p>
      {:else}
        <p class="text-base-content/70">{game.deaths.length > 1 ? 'Sont morts cette nuit' : 'Est mort cette nuit'}</p>
        <ul class="mt-3 flex flex-col gap-2">
          {#each game.deaths as dead}
            <li class="flex items-center justify-center gap-3">
              <Avatar name={dead.name} index={playerIndex(dead)} muted />
              <span class="text-2xl font-bold">{dead.name}</span>
              {#if game.revealRoles}<span class="badge badge-neutral">{describeRole(dead)}</span>{/if}
            </li>
          {/each}
        </ul>
      {/if}
    </section>
    <button class="btn btn-primary btn-block mt-6 h-14 text-lg" onclick={() => game.afterDawn()}>Continuer</button>
  {:else if game.phase === 'hunter'}
    <header class="py-4 text-center">
      <h2 class="text-3xl font-extrabold">🏹 {game.hunterPending.name} était le chasseur</h2>
      <p class="mt-1 text-base-content/70">Dans un dernier souffle, il tire sur un joueur.</p>
    </header>
    {#if game.hunterTarget}
      <section class="rounded-box border-4 border-error bg-base-100 p-6 text-center">
        <p class="text-2xl font-bold">{game.hunterTarget.name} est mort</p>
        {#if game.revealRoles}<p class="mt-2 badge badge-neutral">{describeRole(game.hunterTarget)}</p>{/if}
      </section>
      <button class="btn btn-primary btn-block mt-6 h-14 text-lg" onclick={() => game.afterHunterShot()}>Continuer</button>
    {:else}
      <PlayerGrid players={game.alivePlayers} bind:selected index={playerIndex} />
      <button class="btn btn-error btn-block mt-6 h-14 text-lg" disabled={!selected} onclick={() => pick((p) => game.shoot(p))}>
        {selected ? `Tirer sur ${selected.name}` : 'Choisis une cible'}
      </button>
    {/if}
  {:else if game.phase === 'day'}
    <header class="py-4 text-center">
      <h2 class="text-3xl font-extrabold">Le village débat</h2>
      <p class="mt-1 text-base-content/70">Qui est un loup-garou ? Désignez ensemble un joueur à éliminer.</p>
    </header>
    <PlayerGrid players={game.alivePlayers} bind:selected index={playerIndex} />
    <button class="btn btn-primary btn-block mt-6 h-14 text-lg" disabled={!selected} onclick={() => pick((p) => game.lynch(p))}>
      {selected ? `Éliminer ${selected.name}` : 'Choisis un suspect'}
    </button>
  {:else if game.phase === 'dayResult'}
    <section class="mt-6 rounded-box border-4 bg-base-100 p-6 text-center {game.revealRoles && game.lynched.role === 'loup' ? 'border-success' : 'border-base-300'}">
      <Avatar name={game.lynched.name} index={playerIndex(game.lynched)} size="size-16" muted />
      <h2 class="mt-3 text-2xl font-bold">{game.lynched.name} est éliminé</h2>
      {#if game.revealRoles}
        <p class="mt-4 font-display text-3xl font-extrabold {game.lynched.role === 'loup' ? 'text-success' : 'text-error'}">{describeRole(game.lynched)}</p>
      {:else}
        <p class="mt-4 text-base-content/70">Son rôle reste secret.</p>
      {/if}
      <p class="mt-4 text-base-content/70">Il reste {game.alivePlayers.length} joueur{game.alivePlayers.length > 1 ? 's' : ''} en vie.</p>
    </section>
    <button class="btn btn-primary btn-block mt-6 h-14 text-lg" onclick={() => game.afterDayResult()}>La nuit tombe</button>
  {:else if game.phase === 'end'}
    <header class="py-4 text-center">
      {#if game.outcome === 'village'}
        <h2 class="text-4xl font-extrabold text-success">Le village gagne</h2>
        <p class="mt-2 text-base-content/70">Tous les loups-garous sont éliminés.</p>
      {:else}
        <h2 class="text-4xl font-extrabold text-error">Les loups-garous gagnent</h2>
        <p class="mt-2 text-base-content/70">Ils sont aussi nombreux que les villageois.</p>
      {/if}
    </header>

    <ul class="mb-4 flex flex-wrap justify-center gap-2">
      {#each game.players as player, i}
        <li class="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 {player.role === 'loup' ? 'bg-error/30' : 'bg-base-100'}">
          <Avatar name={player.name} index={i} size="size-7" muted={!player.alive} />
          <span class:line-through={!player.alive}>{player.name}</span>
          <span class="text-xs">{game.roleOf(player).emoji}</span>
        </li>
      {/each}
    </ul>

    <div class="flex flex-col gap-3">
      <button class="btn btn-primary btn-block h-14 text-lg" onclick={() => game.start()}>Rejouer avec les mêmes joueurs</button>
      <button class="btn btn-outline btn-block h-12" onclick={() => game.reset()}>Changer les réglages</button>
    </div>
  {/if}
</GameShell>
