<script>
  export let items = []
  export let minColWidth = 330
  export let maxColWidth = 500
  export let gap = `1em`
  export let width, height
  $: nCols = Math.floor(width / minColWidth) || 1
  $: itemsToCols = items.reduce(
    (cols, item, idx) => {
      cols[idx % cols.length].push({ ...item, idx })
      return cols
    },
    Array(nCols)
      .fill(null)
      .map(() => [])
  )
</script>

<div
  class="masonry"
  bind:clientWidth={width}
  bind:clientHeight={height}
  style="gap: {gap}px;">
  {#each itemsToCols as col}
    <div class="col" style="max-width: {maxColWidth}px; gap: {gap}px;">
      {#each col as item}
        <slot {item} />
      {/each}
    </div>
  {/each}
</div>

<style>
  .masonry {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    margin: auto;
  }
  .col {
    display: grid;
    height: max-content;
  }
</style>
