<script>
  import Masonry from './Masonry.svelte'
  import Slider from './Slider.svelte'
  import Box from './Box.svelte'

  let nItems = 30
  $: items = Array(nItems).fill(null)
  let [minColWidth, maxColWidth] = [330, 500]
  let gap = 20
  let width, height
</script>

<main>
  <h1>Svelte Masonry</h1>
  <p>This is a naive masonry implementation without column balancing.</p>
  <p>
    Balanced columns can be achieved even with this simple version if the items are
    allowed to stretch to the column height.
  </p>

  <div class="controls">
    <Slider label="nItems" bind:value={nItems} min="1" max="100" />
    <Slider label="minColWidth" bind:value={minColWidth} min="10" max={maxColWidth} />
    <Slider label="maxColWidth" bind:value={maxColWidth} min={minColWidth} max="800" />
    <Slider label="gap" bind:value={gap} min="0" max="50" />
  </div>

  <p>masonry size: {width}px &times; {height}px (w &times; h)</p>
  <Masonry {items} {minColWidth} {maxColWidth} {gap} bind:width bind:height>
    <Box />
  </Masonry>
</main>

<style>
  :global(body) {
    background: #090019;
    padding: 2em;
    font-family: -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif;
    color: white;
    text-align: center;
    font-size: 3ex;
  }
  h1 {
    font-size: calc(1em + 3vw);
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    margin: 3em auto;
    gap: 1em;
    place-content: center;
  }
</style>
