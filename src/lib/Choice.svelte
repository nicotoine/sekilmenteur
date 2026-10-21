<script>
  /** Rangée de boutons exclusifs : durées, nombres de tours, etc. */
  let { options, value = $bindable(), label, format = (o) => String(o), size = 'btn-sm h-10' } = $props();
</script>

<div class="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
  {#each options as option}
    <button
      class="btn {size} {value === option ? 'btn-secondary' : 'btn-outline'}"
      role="radio"
      aria-checked={value === option}
      onclick={() => (value = option)}>{format(option)}</button
    >
  {/each}
</div>
