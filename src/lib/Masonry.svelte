<script lang="ts">
  import { flip } from 'svelte/animate'
  import { fade } from 'svelte/transition'

  export let animate = true
  export { className as class }
  export let columnClass = ``
  export let duration = 200
  export let gap = 20
  // On non-primitive types, we need a property to tell masonry items apart. This component
  // hard-codes the name of this property to 'id'. See https://svelte.dev/tutorial/keyed-each-blocks.
  export let getId = (item: Item) => {
    if (typeof item === `number`) return item
    if (typeof item === `string`) return item
    return (item as Record<string, unknown>)[idKey]
  }
  export let idKey = `id`
  export let items: Item[]
  export let masonryHeight = 0
  export let masonryWidth = 0
  export let maxColWidth = 500
  export let minColWidth = 330
  export let style = ``

  type Item = $$Generic
  let className = ``

  $: nCols = Math.min(items.length, Math.floor(masonryWidth / (minColWidth + gap)) || 1)
  $: itemsToCols = items.reduce(
    (cols: [Item, number][][], item, idx) => {
      cols[idx % cols.length].push([item, idx])
      return cols
    },
    Array(nCols).fill(null).map(() => []) // prettier-ignore
  )
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
        {#each col as [item, idx] (getId(item))}
          <div
            in:fade|local={{ delay: 100, duration }}
            out:fade|local={{ delay: 0, duration }}
            animate:flip={{ duration }}
          >
            <slot {idx} {item} />
          </div>
        {/each}
      {:else}
        {#each col as [item, idx] (getId(item))}
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
