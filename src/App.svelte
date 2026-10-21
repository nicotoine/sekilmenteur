<script>
  import { games, groups } from './games/registry.js';
  import { router } from './lib/router.svelte.js';
  import { loadSettings, saveSettings } from './lib/storage.js';

  const MENU_KEY = 'menu:collapsed';

  const current = $derived(games.find((g) => g.id === router.current));

  let collapsed = $state(loadSettings(MENU_KEY));

  function toggle(groupId, open) {
    collapsed = { ...collapsed, [groupId]: !open };
    saveSettings(MENU_KEY, collapsed);
  }
</script>

{#if current}
  {@const Game = current.component}
  <Game />
{:else}
  <header class="py-4 text-center">
    <h1 class="text-4xl font-extrabold">Jeux de soirée</h1>
    <p class="mt-1 text-base-content/70">{games.length} jeux. Un seul téléphone.</p>
  </header>

  {#each groups as group}
    <details class="collapse-arrow collapse mb-2 bg-base-100" open={!collapsed[group.id]} ontoggle={(e) => toggle(group.id, e.currentTarget.open)}>
      <summary class="collapse-title flex min-h-12 items-center gap-2 font-display text-lg font-bold">
        <span aria-hidden="true">{group.emoji}</span>
        <span>{group.name}</span>
        <span class="text-sm font-normal text-base-content/60">{games.filter((g) => g.group === group.id).length}</span>
      </summary>
      <ul class="collapse-content flex flex-col gap-2 !pb-3">
        {#each games.filter((g) => g.group === group.id) as game}
          <li>
            <a
              href="#/{game.id}"
              class="flex items-center gap-3 rounded-field bg-base-200 px-3 py-1.5 transition-colors hover:bg-neutral active:bg-neutral"
            >
              <span class="text-2xl" aria-hidden="true">{game.emoji}</span>
              <span class="min-w-0">
                <span class="block font-display text-lg font-extrabold">{game.name}</span>
                <span class="block truncate text-sm text-base-content/70">{game.tagline}</span>
              </span>
              <span class="ml-auto shrink-0 text-xs text-base-content/50">{game.players}</span>
            </a>
          </li>
        {/each}
      </ul>
    </details>
  {/each}
{/if}
