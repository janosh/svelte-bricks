<script lang="ts">
  import { flip } from 'svelte/animate'
  import { crossfade } from 'svelte/transition'

  export let items: Item[]
  export let minColWidth = 330
  export let maxColWidth = 500
  export let gap = 20
  export let masonryWidth = 0
  export let masonryHeight = 0
  export let animate = true
  export let style = ``

  type WithKey<K extends string | number | symbol> = {
    [key in K]: string | number
  }

  // On non-primitive types, we need a property to tell masonry items apart. This component
  // hard-codes the name of this property to 'id'. See https://svelte.dev/tutorial/keyed-each-blocks.
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
  style="gap: {gap}px; {style}"
>
  {#each itemsToCols as col}
    <div class="col" style="gap: {gap}px; max-width: {maxColWidth}px;">
      {#if animate}
        {#each col as [item, idx] (getId(item) || idx)}
          <div
            in:receive|local={{ key: getId(item) || idx }}
            out:send|local={{ key: getId(item) || idx }}
            animate:flip={{ duration: 200 }}
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
