<script lang="ts" generics="Item">
  import type { Snippet } from 'svelte'
  import type { Action } from 'svelte/action'
  import { flip } from 'svelte/animate'
  import type { HTMLAttributes } from 'svelte/elements'
  import { fade } from 'svelte/transition'
  import type { MasonryOrder } from '.'

  // On non-primitive types, we need a property to tell masonry items apart. The name of this attribute can be customized with idKey which defaults to 'id'. See https://svelte.dev/docs/svelte/each#Keyed-each-blocks.
  let {
    animate = true,
    order = `balanced` as MasonryOrder,
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
    order?: MasonryOrder
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
  // Use plain Map (not reactive) to avoid triggering re-renders on every measurement
  // Only measured_count is reactive to trigger column balancing when needed
  const item_heights_cache = new Map<string | number, number>()
  let measured_count = $state(0) // trigger reactivity for column balancing
  let measured_sum = $state(0) // running sum for average calculation
  let avg_measured_height = $derived(
    measured_count > 0 ? measured_sum / measured_count : null,
  )

  // Tracks which column each item was assigned to (for balanced-stable mode)
  const stable_assignments = new Map<string | number, number>()

  // Clean up stale heights and stable assignments when items change (prevents memory leak)
  $effect(() => {
    const current_ids = new Set(items.map(getId))
    let removed_sum = 0
    for (const [id, height] of item_heights_cache.entries()) {
      if (!current_ids.has(id)) {
        removed_sum += height
        item_heights_cache.delete(id)
      }
    }
    if (removed_sum > 0) {
      measured_sum -= removed_sum
      measured_count = item_heights_cache.size
    }
    // Clean up stable_assignments for removed items
    for (const id of stable_assignments.keys()) {
      if (!current_ids.has(id)) stable_assignments.delete(id)
    }
  })

  // Unified height getter with fallback chain
  // Reads from non-reactive cache, so won't trigger re-renders
  const get_height = (item: Item): number => {
    const id = getId(item)
    // 1. Actual measured height (most accurate)
    const measured = item_heights_cache.get(id)
    if (measured !== undefined) return measured
    // 2. User-provided estimate (if custom function provided)
    if (getEstimatedHeight) return getEstimatedHeight(item)
    // 3. Average of measured items
    if (avg_measured_height) return avg_measured_height
    // 4. Hard fallback
    return 150
  }

  // Check if current order mode needs height measurements before distributing items
  // balanced-stable is excluded: it uses estimates for new items to avoid the round-robin fallback
  const needs_measurement = (mode: MasonryOrder): boolean =>
    mode === `balanced` || mode === `column-balanced`

  // Measure item heights via ResizeObserver
  // Always attach observers for non-virtualizing cases, even for modes that don't
  // need measurement initially, because the user may switch modes at runtime.
  // Skip entirely during virtualization - only estimated heights are used there.
  const measure_height: Action<HTMLElement, string | number> = (node, item_id) => {
    if (virtualize) return {}
    const observer = new ResizeObserver(() => {
      const new_height = node.offsetHeight
      if (new_height > 0 && item_heights_cache.get(item_id) !== new_height) {
        const old_height = item_heights_cache.get(item_id) ?? 0
        measured_sum += new_height - old_height
        item_heights_cache.set(item_id, new_height)
        // Keep measured_count in sync with cache for accurate measurement checks
        // Safe during virtualization: itemsToCols short-circuits for virtualize
        measured_count = item_heights_cache.size
      }
    })
    observer.observe(node)
    return { destroy: () => observer.disconnect() }
  }

  // Effective order: virtualization forces row-first
  let effective_order = $derived(virtualize ? `row-first` : order)

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

  // Stable balancing: new items go to shortest column, existing items keep their column
  // NOTE: This function intentionally mutates stable_assignments Map during $derived computation.
  // This is safe because the Map is a non-reactive cache for persistence across renders,
  // not a reactive dependency. The derived recomputes based on items/nCols/order changes.
  function balanced_stable_to_cols(num_cols: number): [Item, number][][] {
    const cols: [Item, number][][] = Array.from({ length: num_cols }, () => [])
    const heights: number[] = Array(num_cols).fill(0)

    for (const [idx, item] of items.entries()) {
      const id = getId(item)
      let col = stable_assignments.get(id)

      if (col === undefined || col >= num_cols) {
        // New item or column count reduced - assign to shortest
        col = heights.indexOf(Math.min(...heights))
        stable_assignments.set(id, col)
      }

      cols[col].push([item, idx])
      heights[col] += get_height(item) + gap
    }
    return cols
  }

  // Purely sequential column-first: first N items in col 1, next N in col 2, etc.
  function column_sequential_to_cols(num_cols: number): [Item, number][][] {
    const cols: [Item, number][][] = Array.from({ length: num_cols }, () => [])
    const items_per_col = Math.ceil(items.length / num_cols)

    for (const [idx, item] of items.entries()) {
      const col = Math.min(Math.floor(idx / items_per_col), num_cols - 1)
      cols[col].push([item, idx])
    }
    return cols
  }

  // Height-aware column-first: fill col 1 to target height, then col 2, etc.
  function column_balanced_to_cols(num_cols: number): [Item, number][][] {
    const cols: [Item, number][][] = Array.from({ length: num_cols }, () => [])
    const total_height = items.reduce((sum, item) => sum + get_height(item) + gap, 0)
    const target_per_col = total_height / num_cols

    let col = 0
    let col_height = 0

    for (const [idx, item] of items.entries()) {
      cols[col].push([item, idx])
      col_height += get_height(item) + gap

      // Move to next column if exceeded target and not on last column
      if (col_height >= target_per_col && col < num_cols - 1) {
        col++
        col_height = 0
      }
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

  // Round-robin distribution (used for row-first order and SSR fallback)
  const round_robin = (num_cols: number): [Item, number][][] =>
    items.reduce<[Item, number][][]>(
      (cols, item, idx) => (cols[idx % num_cols].push([item, idx]), cols),
      Array.from({ length: num_cols }, () => []),
    )

  // Distribute items based on order mode
  let itemsToCols = $derived.by(() => {
    // balanced-stable should NEVER fall back - it uses stable assignments + estimates for new items
    // This prevents existing items from jumping columns when new items are added
    if (effective_order === `balanced-stable`) return balanced_stable_to_cols(nCols)

    // For other height-dependent modes, fall back to round-robin until items are measured
    if (needs_measurement(effective_order) && measured_count < items.length) {
      return round_robin(nCols)
    }

    if (effective_order === `balanced`) return balance_to_cols(nCols)
    if (effective_order === `column-sequential`) {
      return column_sequential_to_cols(nCols)
    }
    if (effective_order === `column-balanced`) return column_balanced_to_cols(nCols)
    return round_robin(nCols) // row-first (default)
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

  // Scroll state with requestAnimationFrame throttling
  // Declared early because prefix_heights depends on it for virtualization
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

  // Stable height for virtualization - ONLY estimates (no measured heights = no drift)
  const get_estimated_height = (item: Item): number =>
    getEstimatedHeight ? getEstimatedHeight(item) : 150

  // Prefix height arrays per column: prefix_heights[col][i] = cumulative height of items 0..i
  // When virtualizing: use ONLY estimates (stable, no drift)
  // When not virtualizing: use measured heights (accurate balancing)
  let prefix_heights = $derived(
    itemsToCols.map((col) => {
      let sum = 0
      return col.map(([item]) => {
        sum += (virtualize ? get_estimated_height(item) : get_height(item)) + gap
        return sum
      })
    }),
  )

  // Total height per column (for padding calculation)
  let col_total_heights = $derived(prefix_heights.map((ph) => ph.at(-1) ?? 0))

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
  let col_padding_top = $derived(
    can_virtualize
      ? visible_ranges.map((
        [start],
        idx,
      ) => (start > 0 ? prefix_heights[idx][start - 1] : 0))
      : itemsToCols.map(() => 0),
  )
  let col_padding_bottom = $derived(
    can_virtualize
      ? visible_ranges.map(([, end], idx) => {
        const visible_end = end > 0 ? (prefix_heights[idx][end - 1] ?? 0) : 0
        return Math.max(0, col_total_heights[idx] - visible_end)
      })
      : itemsToCols.map(() => 0),
  )

  // Auto-disable animations when actively virtualizing (FLIP doesn't work well)
  let effective_animate = $derived(animate && !can_virtualize)
</script>

<!-- Dynamic container query styles for CLS-free SSR -->
<svelte:element this={`style`}>{container_query_css}</svelte:element>

<div
  bind:clientWidth={masonryWidth}
  bind:clientHeight={masonryHeight}
  bind:this={div}
  onscroll={virtualize ? on_scroll : undefined}
  style="display: flex; width: 100%; justify-content: center; box-sizing: border-box"
  style:gap="{gap}px"
  style:overflow-y={virtualize ? `auto` : undefined}
  style:height={virtualize
  ? (typeof height === `number` ? `${height}px` : height ?? `400px`)
  : undefined}
  {...rest}
  class="masonry {rest.class ?? ``}"
>
  {#each itemsToCols as col, col_idx}
    {@const [start, end] = visible_ranges[col_idx]}
    {@const visible_items = col.slice(start, end)}
    <div
      class="col col-{col_idx} {columnClass}"
      style:display="grid"
      style:flex="1 1 0"
      style:min-width="0"
      style:gap="{gap}px"
      style:max-width="{maxColWidth}px"
      style:padding-top={can_virtualize ? `${col_padding_top[col_idx]}px` : undefined}
      style:padding-bottom={can_virtualize ? `${col_padding_bottom[col_idx]}px` : undefined}
      style={columnStyle || undefined}
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
  div.masonry {
    container-type: inline-size;
    display: flex;
    justify-content: center;
    overflow-wrap: anywhere;
    box-sizing: border-box;
    width: 100%;
  }
  div.masonry div.col {
    display: grid;
    height: max-content;
    flex: 1 1 0;
    min-width: 0;
  }
</style>
