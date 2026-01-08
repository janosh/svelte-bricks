<script lang="ts" generics="Item">
  import type { Snippet } from 'svelte'
  import { flip } from 'svelte/animate'
  import type { HTMLAttributes } from 'svelte/elements'
  import { fade } from 'svelte/transition'

  // On non-primitive types, we need a property to tell masonry items apart. The name of this attribute can be customized with idKey which defaults to 'id'. See https://svelte.dev/tutorial/svelte/keyed-each-blocks.
  let {
    animate = true,
    calcCols = (masonryWidth: number, minColWidth: number, gap: number): number => {
      return Math.min(
        items.length,
        Math.floor((masonryWidth + gap) / (minColWidth + gap)) || 1,
      )
    },
    duration = 200,
    gap = 20,
    getId = (item: Item): string | number => {
      if (typeof item === `number`) return item
      if (typeof item === `string`) return item
      return (item as Record<string, string | number>)[idKey]
    },
    idKey = `id`,
    items,
    masonryHeight = $bindable(0),
    masonryWidth = $bindable(0),
    maxColWidth = 500,
    minColWidth = 330,
    columnStyle = ``,
    columnClass = ``,
    children,
    div = $bindable(), // TODO add unit test for this prop
    ...rest
  }: Omit<HTMLAttributes<HTMLDivElement>, `children`> & {
    animate?: boolean
    calcCols?: (masonryWidth: number, minColWidth: number, gap: number) => number
    duration?: number
    gap?: number
    getId?: (item: Item) => string | number
    idKey?: string
    items: Item[]
    masonryHeight?: number
    masonryWidth?: number
    maxColWidth?: number
    minColWidth?: number
    style?: string
    class?: string
    columnStyle?: string
    columnClass?: string
    children?: Snippet<[{ idx: number; item: Item }]>
    div?: HTMLDivElement
  } = $props()

  $effect.pre(() => {
    if (maxColWidth < minColWidth) {
      console.warn(
        `svelte-bricks: maxColWidth (${maxColWidth}) < minColWidth (${minColWidth}).`,
      )
    }
  })
  // Calculate number of columns - CSS container queries hide excess columns for CLS-free SSR
  const max_viewport = 1920
  let nCols = $derived(
    masonryWidth > 0 ? calcCols(masonryWidth, minColWidth, gap) : Math.min(
      items.length,
      Math.floor((max_viewport + gap) / (minColWidth + gap)) || 1,
    ),
  )

  // Generate CSS container query rules to hide excess columns based on container width
  // breakpoint(n) = (minColWidth + gap) * n - gap is the minimum width needed for n columns
  let container_query_css = $derived.by(() => {
    const rules: string[] = []
    for (let col_count = 1; col_count < nCols; col_count++) {
      const min_width_for_next = (minColWidth + gap) * (col_count + 1) - gap
      if (col_count === 1) {
        // Hide all columns except first when container is too narrow for 2 columns
        rules.push(
          `@container (max-width: ${
            min_width_for_next - 1
          }px) { .masonry > .col:nth-child(n+2) { display: none; } }`,
        )
      } else {
        const min_width_for_current = (minColWidth + gap) * col_count - gap
        rules.push(
          `@container (min-width: ${min_width_for_current}px) and (max-width: ${
            min_width_for_next - 1
          }px) { .masonry > .col:nth-child(n+${col_count + 1}) { display: none; } }`,
        )
      }
    }
    return rules.join(`\n`)
  })

  let itemsToCols = $derived(
    items.reduce<[Item, number][][]>(
      (cols, item, idx) => {
        cols[idx % cols.length].push([item, idx])
        return cols
      },
      Array(nCols).fill(null).map(() => []),
    ),
  )
</script>

<!-- Dynamic container query styles for CLS-free SSR -->
<svelte:element this={`style`}>{container_query_css}</svelte:element>

<!-- deno-fmt-ignore -->
<div
  bind:clientWidth={masonryWidth}
  bind:clientHeight={masonryHeight}
  bind:this={div}
  style:gap="{gap}px"
  {...rest}
  class="masonry {rest.class ?? ``}"
>
  {#each itemsToCols as col, idx}
    <div
      class="col col-{idx} {columnClass}"
      style="gap: {gap}px; max-width: {maxColWidth}px; {columnStyle}"
    >
      {#if animate}
        {#each col as [item, idx] (getId(item))}
          <div
            in:fade={{ delay: 100, duration }}
            out:fade={{ delay: 0, duration }}
            animate:flip={{ duration }}
          >
            {#if children}{@render children({ idx, item })}{:else}
              <span>{item}</span>
            {/if}
          </div>
        {/each}
      {:else}
        {#each col as [item, idx] (getId(item))}
          {#if children}{@render children({ idx, item })}{:else}
            <span>{item}</span>
          {/if}
        {/each}
      {/if}
    </div>
  {/each}
</div>

<style>
  :where(div.masonry) {
    container-type: inline-size;
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
