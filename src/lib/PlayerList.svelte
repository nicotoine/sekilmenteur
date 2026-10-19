<script>
  import { roster, MIN_PLAYERS, MAX_PLAYERS } from './roster.svelte.js';
  import Avatar from './Avatar.svelte';
</script>

<section class="mb-6">
  <h2 class="mb-3 text-xl font-bold">Joueurs <span class="text-base-content/60">({roster.filled.length})</span></h2>
  <div class="flex flex-col gap-2">
    {#each roster.names as _, i}
      <div class="flex items-center gap-2">
        <Avatar name={roster.names[i]} index={i} />
        <input
          type="text"
          class="input input-lg h-12 w-full min-w-0 text-base"
          placeholder="Nom du joueur"
          maxlength="20"
          autocomplete="off"
          bind:value={roster.names[i]}
        />
        <button
          class="btn btn-ghost btn-square h-12"
          aria-label="Retirer {roster.names[i] || `joueur ${i + 1}`}"
          disabled={roster.names.length <= MIN_PLAYERS}
          onclick={() => roster.remove(i)}>✕</button
        >
      </div>
    {/each}
  </div>
  <button class="btn btn-outline btn-block mt-3 h-12" disabled={roster.names.length >= MAX_PLAYERS} onclick={() => roster.add()}>
    Ajouter un joueur
  </button>
  {#if roster.hasDuplicates}
    <p class="mt-2 text-sm text-error">Deux joueurs portent le même nom. Change l'un des deux.</p>
  {:else if roster.filled.length < MIN_PLAYERS}
    <p class="mt-2 text-sm text-base-content/70">Il faut au moins {MIN_PLAYERS} joueurs pour commencer.</p>
  {/if}
</section>
