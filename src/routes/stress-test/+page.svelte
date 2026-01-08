<script lang="ts">
  import Masonry from '$lib'

  // State
  let test_mode = $state<
    'rapid-add' | 'rapid-remove' | 'resize-spam' | 'shuffle-chaos' | 'idle'
  >(`idle`)
  let interval_id = $state<ReturnType<typeof setInterval> | null>(null)
  let operation_count = $state(0)
  let items = $state<{ id: number; height: number; hue: number }[]>([])
  let next_id = $state(0)
  let min_col_width = $state(150)
  let max_col_width = $state(300)
  let gap = $state(10)
  let animate = $state(true)
  let container_width_pct = $state(100)
  let masonry_width = $state(0)
  let masonry_height = $state(0)

  function add_items(count: number) {
    items = [
      ...items,
      ...Array.from({ length: count }, () => {
        const item = {
          id: next_id,
          height: 50 + Math.floor(Math.random() * 200),
          hue: Math.floor(Math.random() * 360),
        }
        next_id++
        return item
      }),
    ]
  }

  function clear_all() {
    items = []
    next_id = 0
  }

  function stop_test() {
    if (interval_id) {
      clearInterval(interval_id)
      interval_id = null
    }
    test_mode = `idle`
  }

  function start_test(
    mode: typeof test_mode,
    setup: () => void,
    tick: () => void,
    interval: number,
  ) {
    stop_test()
    setup()
    test_mode = mode
    operation_count = 0
    interval_id = setInterval(() => {
      tick()
      operation_count++
    }, interval)
  }

  let expected_cols = $derived(
    masonry_width > 0
      ? Math.min(
        items.length || 1,
        Math.floor((masonry_width + gap) / (min_col_width + gap)) || 1,
      )
      : `...`,
  )
</script>

<svelte:head>
  <title>Stress Test | svelte-bricks</title>
</svelte:head>

<h1>🔥 Stress Test</h1>

<p class="description">
  Automated stress tests to verify masonry stability under rapid changes. Watch for layout
  glitches, CLS, or rendering artifacts.
</p>

<section class="test-controls">
  <h3>Automated Stress Tests</h3>
  <div class="button-row">
    <button
      onclick={() => start_test(`rapid-add`, () => {}, () => add_items(1), 50)}
      class:active={test_mode === `rapid-add`}
      disabled={test_mode !== `idle` && test_mode !== `rapid-add`}
    >
      ⚡ Rapid Add
    </button>
    <button
      onclick={() =>
      start_test(`rapid-remove`, () => {
        if (items.length < 50) add_items(100)
      }, () => {
        if (items.length > 0) {
          const idx = Math.floor(Math.random() * items.length)
          items = [...items.slice(0, idx), ...items.slice(idx + 1)]
        } else stop_test()
      }, 50)}
      class:active={test_mode === `rapid-remove`}
      disabled={test_mode !== `idle` && test_mode !== `rapid-remove`}
    >
      💥 Rapid Remove
    </button>
    <button
      onclick={() =>
      start_test(`resize-spam`, () => {}, () => {
        container_width_pct = 30 + Math.floor(Math.random() * 70)
      }, 100)}
      class:active={test_mode === `resize-spam`}
      disabled={test_mode !== `idle` && test_mode !== `resize-spam`}
    >
      📐 Resize Spam
    </button>
    <button
      onclick={() =>
      start_test(`shuffle-chaos`, () => {
        if (items.length < 30) add_items(50)
      }, () => {
        items = [...items].sort(() => Math.random() - 0.5)
        if (Math.random() > 0.7) add_items(1)
        if (Math.random() > 0.7 && items.length > 5) {
          const idx = Math.floor(Math.random() * items.length)
          items = [...items.slice(0, idx), ...items.slice(idx + 1)]
        }
      }, 150)}
      class:active={test_mode === `shuffle-chaos`}
      disabled={test_mode !== `idle` && test_mode !== `shuffle-chaos`}
    >
      🌀 Shuffle Chaos
    </button>
    {#if test_mode !== `idle`}
      <button onclick={stop_test} class="stop">⏹ Stop</button>
    {/if}
  </div>
  {#if test_mode !== `idle`}
    <p class="test-status">
      Running: <strong>{test_mode}</strong> — Operations: <code>{operation_count}</code>
    </p>
  {/if}
</section>

<section class="scenarios">
  <h3>Extreme Scenarios</h3>
  <div class="button-row">
    <button
      onclick={() => {
        stop_test()
        clear_all()
      }}
    >
      0 Items
    </button>
    <button
      onclick={() => {
        stop_test()
        clear_all()
        add_items(1)
      }}
    >
      1 Item
    </button>
    <button
      onclick={() => {
        stop_test()
        clear_all()
        min_col_width = 800
        max_col_width = 1200
        add_items(5)
      }}
    >
      Wide Column
    </button>
    <button
      onclick={() => {
        stop_test()
        clear_all()
        min_col_width = 80
        max_col_width = 120
        add_items(50)
      }}
    >
      Many Narrow
    </button>
    <button
      onclick={() => {
        stop_test()
        clear_all()
        min_col_width = 200
        max_col_width = 200
        gap = 0
        add_items(10)
      }}
    >
      Exact Fit
    </button>
    <button
      onclick={() => {
        stop_test()
        clear_all()
        min_col_width = 50
        max_col_width = 100
        add_items(200)
      }}
    >
      200 Items
    </button>
  </div>
</section>

<section class="manual-controls">
  <h3>Manual Controls</h3>
  <div class="control-row">
    <button onclick={() => add_items(1)}>+ 1</button>
    <button onclick={() => add_items(10)}>+ 10</button>
    <button onclick={() => add_items(50)}>+ 50</button>
    <button onclick={() => items = items.slice(0, -1)}>- 1</button>
    <button onclick={() => items = items.slice(0, -10)}>- 10</button>
    <button onclick={() => items = [...items].sort(() => Math.random() - 0.5)}>
      🔀 Shuffle
    </button>
    <button onclick={clear_all}>🗑 Clear</button>
  </div>
  <div class="sliders">
    <label>
      <span>minColWidth: <code>{min_col_width}px</code></span>
      <input type="range" bind:value={min_col_width} min={50} max={500} />
    </label>
    <label>
      <span>maxColWidth: <code>{max_col_width}px</code></span>
      <input type="range" bind:value={max_col_width} min={min_col_width} max={800} />
    </label>
    <label>
      <span>gap: <code>{gap}px</code></span>
      <input type="range" bind:value={gap} min={0} max={50} />
    </label>
    <label>
      <span>Container: <code>{container_width_pct}%</code></span>
      <input type="range" bind:value={container_width_pct} min={20} max={100} />
    </label>
    <label class="checkbox">
      <input type="checkbox" bind:checked={animate} />
      <span>Animate</span>
    </label>
  </div>
</section>

<div class="stats">
  <span>Items: <code>{items.length}</code></span>
  <span>Width: <code>{masonry_width}px</code></span>
  <span>Height: <code>{masonry_height}px</code></span>
  <span>Columns: <code>{expected_cols}</code></span>
</div>

<div class="masonry-container" style:width="{container_width_pct}%">
  <Masonry
    {items}
    minColWidth={min_col_width}
    maxColWidth={max_col_width}
    {gap}
    {animate}
    bind:masonryWidth={masonry_width}
    bind:masonryHeight={masonry_height}
  >
    {#snippet children({ item })}
      <div
        class="stress-item"
        style:height="{item.height}px"
        style:background={`hsl(${item.hue}, 65%, 55%)`}
      >
        <span>#{item.id}</span>
      </div>
    {/snippet}
  </Masonry>
</div>

{#if items.length === 0}
  <p class="empty">No items. Use controls above to add some.</p>
{/if}

<style>
  h1 {
    text-align: center;
    margin-bottom: 0.3em;
  }
  .description {
    text-align: center;
    color: #888;
    margin: 0 auto 1.5em;
    max-width: 500px;
  }
  section {
    max-width: 900px;
    margin: 0 auto 1.5em;
    padding: 1em;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }
  h3 {
    margin: 0 0 0.8em;
    font-size: 0.95rem;
    color: #aaa;
  }
  .button-row, .control-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
  }
  button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: inherit;
    padding: 0.5em 1em;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }
  button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  button.active {
    background: rgba(0, 200, 100, 0.3);
    border-color: rgba(0, 200, 100, 0.5);
  }
  button.stop {
    background: rgba(255, 50, 50, 0.3);
    border-color: rgba(255, 50, 50, 0.5);
  }
  button.stop:hover {
    background: rgba(255, 50, 50, 0.5);
  }
  .test-status {
    margin-top: 0.8em;
    font-size: 0.9rem;
  }
  .sliders {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1em;
    margin-top: 1em;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.3em;
  }
  label.checkbox {
    flex-direction: row;
    align-items: center;
    gap: 0.5em;
  }
  label span {
    font-size: 0.85rem;
  }
  input[type='range'] {
    width: 100%;
  }
  code {
    background: rgba(0, 120, 255, 0.3);
    padding: 0.1em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
  }
  .stats {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1em 2em;
    margin: 0 auto 1em;
    padding: 0.6em 1em;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    max-width: fit-content;
    font-size: 0.9rem;
  }
  .masonry-container {
    margin: 0 auto;
    padding: 0.5em;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    min-height: 150px;
    transition: width 0.1s ease-out;
  }
  .stress-item {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 6px;
    color: white;
    font-weight: 700;
    font-size: 0.9rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  }
  .empty {
    text-align: center;
    color: #666;
    padding: 2em;
  }
</style>
