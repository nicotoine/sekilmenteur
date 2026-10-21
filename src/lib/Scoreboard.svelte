<script>
  /** Scores compacts : une pastille par équipe ou joueur. */
  let { entries, highlight = -1 } = $props();
</script>

<ul class="flex flex-wrap justify-center gap-2">
  {#each entries as { name, score }, i}
    <li class="badge badge-lg gap-2 {highlight === i ? 'badge-secondary' : 'badge-neutral'}">
      <span class="max-w-32 truncate">{name}</span>
      <strong class="font-display">{score}</strong>
    </li>
  {/each}
</ul>
