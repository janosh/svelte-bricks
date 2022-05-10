<script lang="ts">
  import { flip } from 'svelte/animate'
  import { fade } from 'svelte/transition'

  export let items: Item[]
  export let minColWidth: number = 330
  export let maxColWidth: number = 500
  export let gap: number = 20
  export let masonryWidth: number = 0
  export let masonryHeight: number = 0
  export let animate: boolean = true
  export let style: string = ``
  export let duration: number = 200

  export { className as class }
  export let columnClass: string = ``

  // On non-primitive types, we need a property to tell masonry items apart. This component
  // hard-codes the name of this property to 'id'. See https://svelte.dev/tutorial/keyed-each-blocks.
  export let id: string | Function = (item: Item) => {
    if (typeof item === `string`) return item
    if (typeof item === `number`) return item
    return (item as Record<string, unknown>).id
  }

  type Item = $$Generic
  let className: string = ``

  const isIterator: boolean = typeof id === `function`

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
        {#each col as [item, idx] (isIterator ? id(item) : item[id])}
          <div
            in:fade|local={{ delay: 100, duration }}
            out:fade|local={{ delay: 0, duration }}
            animate:flip={{ duration }}
          >
            <slot {idx} {item} />
          </div>
        {/each}
      {:else}
        {#each col as [item, idx] (isIterator ? id(item) : item[id])}
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
