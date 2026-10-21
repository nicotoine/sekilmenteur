<script>
  import Avatar from './Avatar.svelte';

  /**
   * Grille de joueurs à désigner (vote, cible…).
   * `selected` est liable ; `onselect` permet de réagir au clic sans liaison.
   */
  let { players, selected = $bindable(null), onselect, index = (_, i) => i, disabled = () => false, columns = 'grid-cols-2 sm:grid-cols-3' } = $props();

  function choose(player) {
    if (onselect) onselect(player);
    else selected = player;
  }
</script>

<div class="grid gap-3 {columns}">
  {#each players as player, i}
    <button
      class="btn h-auto flex-col gap-2 py-3 {selected === player ? 'btn-primary' : 'btn-neutral'}"
      aria-pressed={selected === player}
      disabled={disabled(player)}
      onclick={() => choose(player)}
    >
      <Avatar name={player.name} index={index(player, i)} size="size-12" />
      <span class="max-w-full truncate text-base">{player.name}</span>
    </button>
  {/each}
</div>
