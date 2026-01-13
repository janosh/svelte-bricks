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
    div = $bindable(),
    // Virtualization props
    virtualize = false,
    getEstimatedHeight = undefined,
    overscan = 5,
    height = undefined,
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
    // Virtualization props
    virtualize?: boolean
    getEstimatedHeight?: (item: Item) => number
    overscan?: number
    height?: number | string
  } = $props()

  // Height tracking for column balancing and virtualization
  let item_heights = $state(new Map<string | number, number>())
  let measured_count = $state(0) // trigger reactivity on height updates
  let measured_sum = $state(0) // running sum for average calculation
  let avg_measured_height = $derived(
    measured_count > 0 ? measured_sum / measured_count : null,
  )

  // Clean up stale heights when items change (prevents memory leak)
  $effect(() => {
    const current_ids = new Set(items.map(getId))
    let removed_sum = 0
    for (const [id, height] of item_heights.entries()) {
      if (!current_ids.has(id)) {
        removed_sum += height
        item_heights.delete(id)
      }
    }
    if (removed_sum > 0) {
      measured_sum -= removed_sum
      measured_count = item_heights.size
    }
  })

  // Unified height getter with fallback chain
  const get_height = (item: Item): number => {
    const id = getId(item)
    // 1. Actual measured height (most accurate)
    const measured = item_heights.get(id)
    if (measured !== undefined) return measured
    // 2. User-provided estimate (if custom function provided)
    if (getEstimatedHeight) return getEstimatedHeight(item)
    // 3. Average of measured items
    if (avg_measured_height) return avg_measured_height
    // 4. Hard fallback
    return 150
  }

  // Measure item heights via ResizeObserver
  const measure_height: Action<HTMLElement, string | number> = (node, item_id) => {
    if (!balance && !virtualize) return {}
    const observer = new ResizeObserver(() => {
      const new_height = node.offsetHeight
      if (new_height > 0 && item_heights.get(item_id) !== new_height) {
        const old_height = item_heights.get(item_id) ?? 0
        measured_sum += new_height - old_height
        item_heights.set(item_id, new_height)
        measured_count = item_heights.size
      }
    })
    observer.observe(node)
    return { destroy: () => observer.disconnect() }
  }

  // Derive if we have enough measurements
  let can_balance = $derived(balance && measured_count >= items.length)

  // Distribute items to shortest column (uses get_height for estimates when not fully measured)
  function balance_to_cols(num_cols: number): [Item, number][][] {
    const cols: [Item, number][][] = Array.from({ length: num_cols }, () => [])
    const heights: number[] = Array(num_cols).fill(0)

    for (const [idx, item] of items.entries()) {
      const shortest = heights.indexOf(Math.min(...heights))
      cols[shortest].push([item, idx])
      heights[shortest] += get_height(item) + gap
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
  let nCols = $derived(calcCols(masonryWidth || 1920, minColWidth, gap))

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

  // Virtualization logic
  // Warn if virtualize=true but no height provided (only once)
  let warned_missing_height = false
  $effect.pre(() => {
    if (virtualize && height === undefined && !warned_missing_height) {
      warned_missing_height = true
      console.warn(
        `svelte-bricks: virtualize=true requires a height prop. Falling back to 400px.`,
      )
    }
  })

  // Binary search: find first index where arr[i] >= target
  function binary_search_ge(arr: number[], target: number): number {
    let lo = 0
    let hi = arr.length
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      if (arr[mid] < target) lo = mid + 1
      else hi = mid
    }
    return lo
  }

  // Prefix height arrays per column: prefix_heights[col][i] = cumulative height of items 0..i
  let prefix_heights = $derived(
    itemsToCols.map((col) => {
      let sum = 0
      return col.map(([item]) => {
        sum += get_height(item) + gap
        return sum
      })
    }),
  )

  // Total height per column (for padding calculation)
  let col_total_heights = $derived(prefix_heights.map((ph) => ph.at(-1) ?? 0))

  // Scroll state with requestAnimationFrame throttling
  let scroll_top = $state(0)
  let ticking = false

  function on_scroll(event: Event) {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      scroll_top = (event.target as HTMLElement).scrollTop
      ticking = false
    })
  }

  // Container height for virtualization viewport
  // For numeric height, use directly; for string (CSS units like "80vh"), use measured clientHeight
  let container_height = $derived(
    typeof height === `number` ? height : masonryHeight || 400,
  )

  // Only enable virtualization once we have a valid container height measurement
  // This prevents flicker when using CSS units like "80vh" that need DOM measurement
  let can_virtualize = $derived(
    virtualize && (typeof height === `number` || masonryHeight > 0),
  )

  // Visible ranges per column: [start_idx, end_idx]
  let visible_ranges = $derived(
    can_virtualize
      ? prefix_heights.map((ph) => {
        const start = Math.max(0, binary_search_ge(ph, scroll_top) - 1 - overscan)
        const end = Math.min(
          ph.length,
          binary_search_ge(ph, scroll_top + container_height) + overscan,
        )
        return [start, end] as [number, number]
      })
      : itemsToCols.map((col) => [0, col.length] as [number, number]),
  )

  // Padding to replace culled items (only when actively virtualizing)
  const zero_padding = () => itemsToCols.map(() => 0)
  let col_padding_top = $derived(
    can_virtualize
      ? visible_ranges.map((
        [start],
        idx,
      ) => (start > 0 ? prefix_heights[idx][start - 1] : 0))
      : zero_padding(),
  )
  let col_padding_bottom = $derived(
    can_virtualize
      ? visible_ranges.map(([, end], idx) => {
        const visible_end = end > 0 ? (prefix_heights[idx][end - 1] ?? 0) : 0
        return Math.max(0, col_total_heights[idx] - visible_end)
      })
      : zero_padding(),
  )

  // Auto-disable animations when actively virtualizing (FLIP doesn't work well)
  let effective_animate = $derived(animate && !can_virtualize)
</script>

<!-- Dynamic container query styles for CLS-free SSR -->
<svelte:element this={`style`}>{container_query_css}</svelte:element>

<!-- deno-fmt-ignore -->
<div
  bind:clientWidth={masonryWidth}
  bind:clientHeight={masonryHeight}
  bind:this={div}
  onscroll={virtualize ? on_scroll : undefined}
  style:gap="{gap}px"
  style:overflow-y={virtualize ? `auto` : undefined}
  style:height={virtualize ? (typeof height === `number` ? `${height}px` : height ?? `400px`) : undefined}
  {...rest}
  class="masonry {rest.class ?? ``}"
>
  {#each itemsToCols as col, col_idx}
    {@const [start, end] = visible_ranges[col_idx]}
    {@const visible_items = col.slice(start, end)}
    <div
      class="col col-{col_idx} {columnClass}"
      style="gap: {gap}px; max-width: {maxColWidth}px;{can_virtualize ? ` padding-top: ${col_padding_top[col_idx]}px; padding-bottom: ${col_padding_bottom[col_idx]}px;` : ``} {columnStyle}"
    >
      {#if effective_animate}
        {#each visible_items as [item, item_idx] (getId(item))}
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
        {#each visible_items as [item, item_idx] (getId(item))}
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
