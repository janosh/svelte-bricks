<script>
  export let items = []
  export let colMinWidth = 250
  let width
  $: nCols = Math.floor(width / colMinWidth) || 1
  $: itemsToCols = items.reduce(
    (cols, el, idx) => {
      cols[idx % cols.length].push(el)
      return cols
    },
    Array(nCols)
      .fill(null)
      .map(() => [])
  )
</script>

<div class="masonry" bind:clientWidth={width}>
  {#each itemsToCols as col}
    <div class="col">
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
    gap: 1em;
  }
  .col {
    display: grid;
    gap: 1em;
  }
</style>
