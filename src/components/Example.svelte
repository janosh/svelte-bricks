<script lang="ts">
  import Masonry from '../lib/Masonry.svelte'
  import Box from './Box.svelte'
  import Slider from './Slider.svelte'
  import Toggle from './Toggle.svelte'

  let nItems = 30
  $: indices = [...Array(nItems).keys()]

  let [minColWidth, maxColWidth] = [330, 500]
  let gap = 20
  let masonryWidth: number, masonryHeight: number

  let slideFlip = false
</script>

<div class="controls">
  <Slider label="nItems" bind:value={nItems} min={1} max={100} />
  <Slider label="minColWidth" bind:value={minColWidth} min={120} max={maxColWidth} />
  <Slider label="maxColWidth" bind:value={maxColWidth} min={minColWidth} max={800} />
  <Slider label="gap" bind:value={gap} min={0} max={50} />
</div>

<p>
  Masonry size: <span>{masonryWidth}px</span> &times; <span>{masonryHeight}px</span> (w &times;
  h)
</p>

<Masonry
  items={indices}
  {minColWidth}
  {maxColWidth}
  {gap}
  let:item
  bind:masonryWidth
  bind:masonryHeight
>
  <Box index={item} {slideFlip} />
</Masonry>

<p>Sliding card flip?<Toggle name="Slide flip" bind:checked={slideFlip} /></p>

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
</style>
