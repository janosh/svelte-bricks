<script>
  export let items = []
  export let minColWidth = 330
  export let maxColWidth = 500
  export let gap = 20
  let width, height
  $: nCols = Math.min(items.length, Math.floor(width / (minColWidth + gap)) || 1)
  $: itemsToCols = items.reduce(
    (cols, item, idx) => {
      cols[idx % cols.length].push(item)
      return cols
    },
    Array(nCols)
      .fill()
      .map(() => [])
  )
</script>

<p>masonry size: {width}px &times; {height}px (w &times; h)</p>
<div
  class="masonry"
  bind:clientWidth={width}
  bind:clientHeight={height}
  style="gap: {gap}px;">
  {#each itemsToCols as col}
    <div class="col" style="gap: {gap}px; max-width: {maxColWidth}px;">
      {#each col as item}
        <slot {item} />
      {/each}
    </div>
  {/each}
</div>

<style>
  .masonry {
    display: flex;
    justify-content: center;
  }
  .col {
    display: grid;
    height: max-content;
    width: 100%;
  }
</style>
