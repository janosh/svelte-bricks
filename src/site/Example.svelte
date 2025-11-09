<script lang="ts">
  import { Masonry } from '$lib'
  import { Toggle } from 'svelte-multiselect'
  import { Box } from '.'

  let nItems = $state(30)
  let indices = $derived([...Array(nItems).keys()])

  let [minColWidth, maxColWidth] = $state([330, 500])
  let gap = $state(20)
  let masonryWidth: number = $state(0)
  let masonryHeight: number = $state(0)

  let slide_flip = $state(false)
</script>

<div class="controls">
  <label>
    <code>nItems</code> = {nItems}
    <input type="range" bind:value={nItems} min={1} max={100} />
  </label>
  <label>
    <code>minColWidth</code> = {minColWidth}
    <input type="range" bind:value={minColWidth} min={120} max={maxColWidth} />
  </label>
  <label>
    <code>maxColWidth</code> = {maxColWidth}
    <input type="range" bind:value={maxColWidth} min={minColWidth} max={800} />
  </label>
  <label>
    <code>gap</code> = {gap}
    <input type="range" bind:value={gap} min={0} max={50} />
  </label>
</div>

<p>
  Masonry size: <span>{masonryWidth}px</span> &times; <span>{masonryHeight}px</span>
  (w &times; h)
</p>

<Masonry
  items={indices}
  {minColWidth}
  {maxColWidth}
  {gap}
  bind:masonryWidth
  bind:masonryHeight
>
  {#snippet children({ item }: { item: number })}
    <Box index={item} {slide_flip} />
  {/snippet}
</Masonry>

<p>
  Sliding card flip?
  <Toggle bind:checked={slide_flip} />
</p>

<style>
  .controls {
    display: flex;
    flex-wrap: wrap;
    margin: 3em auto;
    gap: 1em;
    place-content: center;
  }
  span {
    padding: 1pt 3pt;
    border-radius: 4pt;
    vertical-align: middle;
    background: #0075ff;
  }
  p {
    display: flex;
    gap: 6pt;
    place-content: center;
    place-items: center;
  }
</style>
