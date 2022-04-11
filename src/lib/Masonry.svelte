<script lang="ts">
  import { flip } from 'svelte/animate'
  import { fade } from 'svelte/transition'

  export let items: Item[]
  export let minColWidth = 330
  export let maxColWidth = 500
  export let gap = 20
  export let masonryWidth = 0
  export let masonryHeight = 0
  export let animate = true
  export let style = ``
  export let duration = 200

  export { className as class }
  export let columnClass = ``

  let className = ``

  type WithKey<K extends string | number | symbol> = {
    [key in K]: string | number
  }

  // On non-primitive types, we need a property to tell masonry items apart. This component
  // hard-codes the name of this property to 'id'. See https://svelte.dev/tutorial/keyed-each-blocks.
  type Item = string | number | WithKey<`id`>

  $: nCols = Math.min(items.length, Math.floor(masonryWidth / (minColWidth + gap)) || 1)
  $: itemsToCols = items.reduce(
    (cols: [Item, number][][], item, idx) => {
      cols[idx % cols.length].push([item, idx])
      return cols
    },
    Array(nCols)
      .fill(null)
      .map(() => [])
  )
  function getId(item: Item): string | number | undefined {
    if (typeof item === `string`) return item
    if (typeof item === `number`) return item
    return item.id
  }
</script>

<div
  class="masonry {className}"
  bind:clientWidth={masonryWidth}
  bind:clientHeight={masonryHeight}
  style="gap: {gap}px; {style}"
>
  {#each itemsToCols as col}
    <div class="col {columnClass}" style="gap: {gap}px; max-width: {maxColWidth}px;">
      {#if animate}
        {#each col as [item, idx] (getId(item) || idx)}
          <div
            in:fade|local={{ delay: 100, duration }}
            out:fade|local={{ delay: 0, duration }}
            animate:flip={{ duration }}
          >
            <slot {idx} {item} />
          </div>
        {/each}
      {:else}
        {#each col as [item, idx] (getId(item) || idx)}
          <slot {idx} {item} />
        {/each}
      {/if}
    </div>
  {/each}
</div>

<style>
  :where(div.masonry) {
    display: flex;
    justify-content: center;
    overflow-wrap: anywhere;
    box-sizing: border-box;
  }
  :where(div.masonry div.col) {
    display: grid;
    height: max-content;
    width: 100%;
  }
</style>
