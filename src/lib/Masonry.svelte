<script lang="ts" generics="Item">
  import type { Snippet } from 'svelte'
  import type { Action } from 'svelte/action'
  import { flip } from 'svelte/animate'
  import type { HTMLAttributes } from 'svelte/elements'
  import { fade } from 'svelte/transition'

  // On non-primitive types, we need a property to tell masonry items apart. The name of this attribute can be customized with idKey which defaults to 'id'. See https://svelte.dev/tutorial/svelte/keyed-each-blocks.
  let {
    animate = true,
    balance = true,
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
    balance?: boolean
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

  // Height tracking for column balancing
  let item_heights = $state(new Map<string | number, number>())
  let measured_count = $state(0) // trigger reactivity on height updates

  // Measure item heights via ResizeObserver
  const measure_height: Action<HTMLElement, string | number> = (node, item_id) => {
    if (!balance) return {}
    const observer = new ResizeObserver(() => {
      const height = node.offsetHeight
      if (height > 0 && item_heights.get(item_id) !== height) {
        item_heights.set(item_id, height)
        measured_count = item_heights.size
      }
    })
    observer.observe(node)
    return { destroy: () => observer.disconnect() }
  }

  // Derive if we have enough measurements
  let can_balance = $derived(balance && measured_count >= items.length)

  // Distribute items to shortest column
  function balance_to_cols(num_cols: number): [Item, number][][] {
    const cols: [Item, number][][] = Array.from({ length: num_cols }, () => [])
    const heights: number[] = Array(num_cols).fill(0)

    for (const [idx, item] of items.entries()) {
      const shortest = heights.indexOf(Math.min(...heights))
      cols[shortest].push([item, idx])
      heights[shortest] += (item_heights.get(getId(item)) ?? 0) + gap
    }
    return cols
  }

  $effect.pre(() => {
    if (maxColWidth < minColWidth) {
      console.warn(
        `svelte-bricks: maxColWidth (${maxColWidth}) < minColWidth (${minColWidth}).`,
      )
    }
  })
  // CSS container queries hide excess columns for CLS-free SSR
  // When masonryWidth is 0 (SSR), calculate max cols for 1920px viewport
  const max_ssr_viewport = 1920
  let nCols = $derived(
    calcCols(masonryWidth || max_ssr_viewport, minColWidth, gap),
  )

  // Container query rules: breakpoint(n) = (minColWidth + gap) * n - gap
  let container_query_css = $derived(
    Array.from({ length: nCols - 1 }, (_, idx) => {
      const col = idx + 1
      const max_w = (minColWidth + gap) * (col + 1) - gap - 1
      const min_w = col === 1
        ? ``
        : `(min-width: ${(minColWidth + gap) * col - gap}px) and `
      return `@container ${min_w}(max-width: ${max_w}px) { .masonry > .col:nth-child(n+${
        col + 1
      }) { display: none; } }`
    }).join(`\n`),
  )

  // Balanced distribution when measured, naive round-robin for SSR
  let itemsToCols = $derived.by(() => {
    if (can_balance) return balance_to_cols(nCols)
    // SSR/initial: round-robin distribution
    return items.reduce<[Item, number][][]>(
      (cols, item, idx) => (cols[idx % nCols].push([item, idx]), cols),
      Array.from({ length: nCols }, () => []),
    )
  })
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
        {#each col as [item, item_idx] (getId(item))}
          <div
            use:measure_height={getId(item)}
            in:fade={{ delay: 100, duration }}
            out:fade={{ delay: 0, duration }}
            animate:flip={{ duration }}
          >
            {#if children}{@render children({ idx: item_idx, item })}{:else}
              <span>{item}</span>
            {/if}
          </div>
        {/each}
      {:else}
        {#each col as [item, item_idx] (getId(item))}
          <div use:measure_height={getId(item)}>
            {#if children}{@render children({ idx: item_idx, item })}{:else}
              <span>{item}</span>
            {/if}
          </div>
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
