<script lang="ts">
  import Masonry, { type MasonryOrder, order_options } from '$lib'

  // Item type
  type Item = { id: number; height: number; color: string }

  // State
  let order = $state<MasonryOrder>(`balanced`)
  let n_cols = $state(3)
  let gap = $state(10)
  let animate = $state(false)
  const init_item_count = 12
  let item_count = $state(init_item_count)
  let masonry_width = $state(0)
  let masonry_height = $state(0)

  // Generate deterministic items for reproducible tests
  const make_item = (id: number): Item => ({
    id,
    height: 80 + (id % 5) * 30, // Heights: 80, 110, 140, 170, 200, repeating
    color: `hsl(${(id * 37) % 360}, 70%, 60%)`,
  })

  let items = $state<Item[]>(
    Array.from({ length: init_item_count }, (_, idx) => make_item(idx)),
  )

  // Actions for E2E tests
  const add_item = () => {
    const next_id = items.length > 0 ? Math.max(...items.map((itm) => itm.id)) + 1 : 0
    items = [...items, make_item(next_id)]
  }

  const add_items = (count: number) => {
    const start_id = items.length > 0
      ? Math.max(...items.map((itm) => itm.id)) + 1
      : 0
    items = [
      ...items,
      ...Array.from({ length: count }, (_, idx) => make_item(start_id + idx)),
    ]
  }

  const remove_last = () => {
    items = items.slice(0, -1)
  }

  const clear_all = () => {
    items = []
  }

  const reset_items = () => {
    items = Array.from({ length: item_count }, (_, idx) => make_item(idx))
  }
</script>

<svelte:head>
  <title>Masonry Test Page</title>
</svelte:head>

<div class="test-page">
  <h1>Masonry E2E Test Page</h1>

  <div class="controls" data-testid="controls">
    <div class="control-row">
      <label>
        <span>Order mode:</span>
        <select bind:value={order} data-testid="order-select">
          {#each order_options as opt}
            <option value={opt}>{opt}</option>
          {/each}
        </select>
      </label>

      <label>
        <span>Columns:</span>
        <input
          type="number"
          bind:value={n_cols}
          min={1}
          max={6}
          data-testid="cols-input"
        />
      </label>

      <label>
        <span>Gap:</span>
        <input type="number" bind:value={gap} min={0} max={50} data-testid="gap-input" />
      </label>

      <label>
        <span>Item count:</span>
        <input
          type="number"
          bind:value={item_count}
          min={0}
          max={100}
          data-testid="item-count-input"
        />
      </label>
    </div>

    <div class="button-row">
      <button onclick={add_item} data-testid="add-item-btn">Add Item</button>
      <button onclick={() => add_items(5)} data-testid="add-5-items-btn">
        Add 5 Items
      </button>
      <button onclick={remove_last} data-testid="remove-last-btn">Remove Last</button>
      <button onclick={clear_all} data-testid="clear-all-btn">Clear All</button>
      <button onclick={reset_items} data-testid="reset-btn">Reset</button>
    </div>

    <label class="checkbox">
      <input type="checkbox" bind:checked={animate} data-testid="animate-checkbox" />
      <span>Animate</span>
    </label>
  </div>

  <div class="stats" data-testid="stats">
    <span data-testid="stat-items">Items: {items.length}</span>
    <span data-testid="stat-width">Width: {masonry_width}px</span>
    <span data-testid="stat-height">Height: {masonry_height}px</span>
    <span data-testid="stat-order">Order: {order}</span>
  </div>

  <div id="test-masonry" class="masonry-container" data-testid="masonry-container">
    <Masonry
      {items}
      {order}
      {gap}
      {animate}
      calcCols={() => n_cols}
      minColWidth={100}
      maxColWidth={300}
      bind:masonryWidth={masonry_width}
      bind:masonryHeight={masonry_height}
    >
      {#snippet children({ item, idx })}
        <div
          class="item"
          style:height="{item.height}px"
          style:background={item.color}
          data-item-id={item.id}
          data-item-idx={idx}
        >
          <span class="item-id">#{item.id}</span>
          <span class="item-height">{item.height}px</span>
        </div>
      {/snippet}
    </Masonry>
  </div>
</div>

<style>
  .test-page {
    padding: 1em;
    max-width: 1200px;
    margin: 0 auto;
  }
  h1 {
    text-align: center;
    margin-bottom: 1em;
  }
  .controls {
    background: rgba(0, 0, 0, 0.05);
    padding: 1em;
    border-radius: 8px;
    margin-bottom: 1em;
  }
  .control-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1em;
    margin-bottom: 0.5em;
  }
  .button-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
    margin-bottom: 0.5em;
  }
  label {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }
  label.checkbox {
    margin-top: 0.5em;
  }
  input[type='number'] {
    width: 60px;
    padding: 0.3em;
  }
  select {
    padding: 0.3em;
  }
  button {
    padding: 0.5em 1em;
    cursor: pointer;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
  }
  button:hover {
    background: #f0f0f0;
  }
  .stats {
    display: flex;
    gap: 1.5em;
    padding: 0.5em 1em;
    background: #333;
    color: white;
    border-radius: 4px;
    margin-bottom: 1em;
    font-family: monospace;
  }
  .masonry-container {
    background: #f5f5f5;
    padding: 1em;
    border-radius: 8px;
    min-height: 300px;
  }
  .item {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 0.5em;
    border-radius: 6px;
    color: white;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
  .item-id {
    font-size: 1.1rem;
  }
  .item-height {
    font-size: 0.75rem;
    opacity: 0.8;
  }
</style>
