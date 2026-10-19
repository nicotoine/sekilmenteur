<script>
  let { name, index = 0, size = 'size-10', muted = false } = $props();

  const hue = $derived((index * 47 + 12) % 360);
</script>

<span
  class="inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-base-300 {size}"
  class:opacity-40={muted}
  style="background: hsl({hue} 70% 68%)"
  aria-hidden="true"
>
  {name.trim().charAt(0).toUpperCase() || '?'}
</span>
