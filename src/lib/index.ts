export { default, default as Masonry } from './Masonry.svelte'

// Order modes for item distribution across columns
export type MasonryOrder =
  | `balanced` // Rebalances all items to shortest columns (items may jump)
  | `balanced-stable` // New items go to shortest column, existing items never move
  | `row-first` // Round-robin: 1->2->3->1->2->3...
  | `column-sequential` // Purely sequential: first N items in col 1, next N in col 2
  | `column-balanced` // Height-aware: fill col 1 to target height, then col 2, etc.
