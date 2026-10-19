<script>
  import { games } from './games/registry.js';
  import { router } from './lib/router.svelte.js';

  const current = $derived(games.find((g) => g.id === router.current));
</script>

{#if current}
  {@const Game = current.component}
  <Game />
{:else}
  <header class="py-8 text-center">
    <h1 class="text-5xl font-extrabold">Jeux de soirée</h1>
    <p class="mt-2 text-base-content/70">Choisis un jeu. Il ne faut qu'un téléphone.</p>
  </header>

  <ul class="flex flex-col gap-3">
    {#each games as game}
      <li>
        <a
          href="#/{game.id}"
          class="flex items-center gap-4 rounded-box bg-base-100 p-4 transition-colors hover:bg-neutral active:bg-neutral"
        >
          <span class="text-5xl" aria-hidden="true">{game.emoji}</span>
          <span>
            <span class="block font-display text-2xl font-extrabold">{game.name}</span>
            <span class="block text-base-content/80">{game.tagline}</span>
            <span class="mt-1 block text-sm text-base-content/60">{game.players}</span>
          </span>
        </a>
      </li>
    {/each}
  </ul>
{/if}
