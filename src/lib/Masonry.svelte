<script lang="ts">
  import { crossfade } from 'svelte/transition'
  import { flip } from 'svelte/animate'

  export let items: Item[]
  export let minColWidth = 330
  export let maxColWidth = 500
  export let gap = 20
  export let masonryWidth = 0
  export let masonryHeight = 0
  export let animate = true

  type WithKey<K extends string | number | symbol> = {
    [key in K]: string | number
  }

  // on non-primitive types, we need a property to tell them apart
  // this component hard-codes the name of this property to 'id'
  // https://svelte.dev/tutorial/keyed-each-blocks
  type Item = string | number | WithKey<`id`>

  const [send, receive] = crossfade({
    duration: (d) => Math.sqrt(d * 200),
    fallback(node) {
      const style = getComputedStyle(node)
      const transform = style.transform === `none` ? `` : style.transform

      return {
        duration: 500,
        css: (t) => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`,
      }
    },
  })

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
  class="masonry"
  bind:clientWidth={masonryWidth}
  bind:clientHeight={masonryHeight}
  style="gap: {gap}px;">
  {#each itemsToCols as col}
    <div class="col" style="gap: {gap}px; max-width: {maxColWidth}px;">
      {#if animate}
        {#each col as [item, idx] (getId(item) || idx)}
          <div
            in:receive={{ key: getId(item) || idx }}
            out:send={{ key: getId(item) || idx }}
            animate:flip={{ duration: 200 }}>
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
  .masonry {
    display: flex;
    justify-content: center;
    overflow-wrap: anywhere;
    box-sizing: border-box;
  }
  .col {
    display: grid;
    height: max-content;
    width: 100%;
  }
</style>
