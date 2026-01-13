<script lang="ts">
  import Masonry from '$lib'

  // State
  let n_items = $state(20)
  let min_height = $state(50)
  let max_height = $state(300)
  let fixed_height = $state(false)
  let min_col_width = $state(200)
  let max_col_width = $state(400)
  let gap = $state(15)
  let animate = $state(true)
  let duration = $state(200)
  let container_width = $state(100)
  let constrained_width = $state(false)
  let masonry_width = $state(0)
  let masonry_height = $state(0)
  // Virtualization state
  let virtualize = $state(false)
  let virtual_height = $state(500)
  let overscan = $state(5)

  // Stress test state
  type TestMode =
    | 'rapid-add'
    | 'rapid-remove'
    | 'resize-spam'
    | 'shuffle-chaos'
    | 'idle'
  let test_mode = $state<TestMode>(`idle`)
  let interval_id = $state<ReturnType<typeof setInterval> | null>(null)
  let operation_count = $state(0)

  const rand_height = () =>
    fixed_height
      ? min_height
      : Math.floor(min_height + Math.random() * (max_height - min_height))
  const rand_color = () => `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`
  const make_item = (id: number) => ({
    id,
    height: rand_height(),
    color: rand_color(),
  })

  let next_id = $state(20)
  let items = $state(Array.from({ length: 20 }, (_, idx) => make_item(idx)))

  function regenerate() {
    items = Array.from({ length: n_items }, (_, idx) => make_item(idx))
    next_id = n_items
  }

  const add_item = () => {
    items = [...items, make_item(next_id++)]
  }
  const add_items = (count: number) => {
    items = [...items, ...Array.from({ length: count }, () => make_item(next_id++))]
  }
  const remove_last = () => (items = items.slice(0, -1))
  const remove_random = () => {
    if (items.length > 0) {
      items = items.toSpliced(Math.floor(Math.random() * items.length), 1)
    }
  }
  const shuffle = () => (items = [...items].sort(() => Math.random() - 0.5))
  const clear_all = () => {
    items = []
    next_id = 0
  }

  // Stress test controls
  function stop_test() {
    if (interval_id) clearInterval(interval_id)
    interval_id = null
    test_mode = `idle`
  }

  function start_test(
    mode: TestMode,
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

  const presets: { label: string; action: () => void }[] = [
    {
      label: `1 Item`,
      action: () => {
        n_items = 1
        regenerate()
      },
    },
    {
      label: `3 Items`,
      action: () => {
        n_items = 3
        regenerate()
      },
    },
    {
      label: `100 Items`,
      action: () => {
        n_items = 100
        regenerate()
      },
    },
    {
      label: `Tall Items`,
      action: () => {
        min_height = 300
        max_height = 500
        regenerate()
      },
    },
    {
      label: `Short Items`,
      action: () => {
        min_height = 30
        max_height = 60
        regenerate()
      },
    },
    {
      label: `Uniform Height`,
      action: () => {
        fixed_height = true
        regenerate()
      },
    },
    {
      label: `Varied Height`,
      action: () => {
        fixed_height = false
        min_height = 50
        max_height = 400
        regenerate()
      },
    },
    {
      label: `Narrow Cols`,
      action: () => {
        min_col_width = 100
        max_col_width = 150
      },
    },
    {
      label: `Wide Cols`,
      action: () => {
        min_col_width = 400
        max_col_width = 600
      },
    },
    {
      label: `No Gap`,
      action: () => {
        gap = 0
      },
    },
    {
      label: `200 Items`,
      action: () => {
        n_items = 200
        min_col_width = 80
        regenerate()
      },
    },
  ]

  let expected_cols = $derived(
    masonry_width > 0
      ? Math.min(
        items.length,
        Math.floor((masonry_width + gap) / (min_col_width + gap)) || 1,
      )
      : `calculating...`,
  )
</script>

<svelte:head>
  <title>Edge Cases | svelte-bricks</title>
</svelte:head>

<h1>Edge Cases & Stress Tests</h1>

<p class="description">
  Interactive demo to test the masonry layout with various edge cases and automated stress
  tests. Use the controls to adjust parameters and observe layout behavior.
</p>

<div class="controls-grid">
  <section class="control-group">
    <h3>Item Settings</h3>
    <label>
      <span>Number of items: <code>{n_items}</code></span>
      <input type="range" bind:value={n_items} min={0} max={200} />
    </label>
    <label>
      <span>Min height: <code>{min_height}px</code></span>
      <input type="range" bind:value={min_height} min={20} max={500} />
    </label>
    <label>
      <span>Max height: <code>{max_height}px</code></span>
      <input type="range" bind:value={max_height} min={min_height} max={600} />
    </label>
    <label class="checkbox">
      <input type="checkbox" bind:checked={fixed_height} />
      <span>Fixed height (use min only)</span>
    </label>
    <div class="button-row">
      <button onclick={regenerate}>Regenerate</button>
      <button onclick={add_item}>+ Add</button>
      <button onclick={remove_last}>- Remove</button>
      <button onclick={remove_random}>🎲 Random</button>
      <button onclick={shuffle}>🔀 Shuffle</button>
      <button onclick={clear_all}>🗑 Clear</button>
    </div>
  </section>

  <section class="control-group">
    <h3>Column Settings</h3>
    <label>
      <span>minColWidth: <code>{min_col_width}px</code></span>
      <input type="range" bind:value={min_col_width} min={50} max={600} />
    </label>
    <label>
      <span>maxColWidth: <code>{max_col_width}px</code></span>
      <input type="range" bind:value={max_col_width} min={min_col_width} max={800} />
    </label>
    <label>
      <span>gap: <code>{gap}px</code></span>
      <input type="range" bind:value={gap} min={0} max={50} />
    </label>
  </section>

  <section class="control-group">
    <h3>Animation Settings</h3>
    <label class="checkbox">
      <input type="checkbox" bind:checked={animate} />
      <span>Animate transitions</span>
    </label>
    <label>
      <span>Duration: <code>{duration}ms</code></span>
      <input type="range" bind:value={duration} min={0} max={1000} disabled={!animate} />
    </label>
  </section>

  <section class="control-group">
    <h3>Container Settings</h3>
    <label>
      <span>Container width: <code>{container_width}%</code></span>
      <input type="range" bind:value={container_width} min={20} max={100} />
    </label>
    <label class="checkbox">
      <input type="checkbox" bind:checked={constrained_width} />
      <span>Constrained max-width (800px)</span>
    </label>
  </section>

  <section class="control-group">
    <h3>Virtualization</h3>
    <label class="checkbox">
      <input type="checkbox" bind:checked={virtualize} />
      <span>Enable virtual scrolling</span>
    </label>
    <label>
      <span>Scroll height: <code>{virtual_height}px</code></span>
      <input
        type="range"
        bind:value={virtual_height}
        min={200}
        max={800}
        disabled={!virtualize}
      />
    </label>
    <label>
      <span>Overscan: <code>{overscan}</code></span>
      <input type="range" bind:value={overscan} min={1} max={20} disabled={!virtualize} />
    </label>
    <div class="button-row">
      <button
        onclick={() => {
          virtualize = true
          n_items = 1000
          regenerate()
        }}
      >
        🚀 1000 Items
      </button>
      <button
        onclick={() => {
          virtualize = true
          n_items = 5000
          regenerate()
        }}
      >
        🔥 5000 Items
      </button>
    </div>
  </section>
</div>

<section class="presets">
  <h3>Quick Presets</h3>
  <div class="button-row">
    {#each presets as { label, action }}
      <button onclick={action}>{label}</button>
    {/each}
  </div>
</section>

<section class="stress-tests">
  <h3>🔥 Automated Stress Tests</h3>
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
        if (items.length > 0) remove_random()
        else stop_test()
      }, 50)}
      class:active={test_mode === `rapid-remove`}
      disabled={test_mode !== `idle` && test_mode !== `rapid-remove`}
    >
      💥 Rapid Remove
    </button>
    <button
      onclick={() =>
      start_test(`resize-spam`, () => {}, () => {
        container_width = 30 + Math.floor(Math.random() * 70)
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
        shuffle()
        if (Math.random() > 0.7) add_items(1)
        if (Math.random() > 0.7 && items.length > 5) remove_random()
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

<div class="stats">
  <span>Width: <code>{masonry_width}px</code></span>
  <span>Height: <code>{masonry_height}px</code></span>
  <span>Columns: <code>{expected_cols}</code></span>
  <span>Items: <code>{items.length}</code></span>
  {#if virtualize}
    <span>Mode: <code>virtualized</code></span>
  {/if}
</div>

<div
  class="masonry-container"
  style:width="{container_width}%"
  style:max-width={constrained_width ? `800px` : ``}
>
  <Masonry
    {items}
    minColWidth={min_col_width}
    maxColWidth={max_col_width}
    {gap}
    {animate}
    {duration}
    {virtualize}
    {overscan}
    height={virtualize ? virtual_height : undefined}
    getEstimatedHeight={(item) => item.height}
    bind:masonryWidth={masonry_width}
    bind:masonryHeight={masonry_height}
  >
    {#snippet children({ item })}
      <div class="item" style:height="{item.height}px" style:background={item.color}>
        <span class="item-id">#{item.id}</span>
        <span class="item-height">{item.height}px</span>
      </div>
    {/snippet}
  </Masonry>
</div>

{#if items.length === 0}
  <p class="empty-message">
    No items to display. Add some items using the controls above.
  </p>
{/if}

<style>
  h1 {
    text-align: center;
    margin-bottom: 0.5em;
  }
  .description {
    text-align: center;
    color: #888;
    max-width: 600px;
    margin: 0 auto 2em;
  }
  .controls-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5em;
    margin: 0 auto 2em;
    max-width: 1200px;
    padding: 0 1em;
  }
  .control-group {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 1em;
  }
  .control-group h3 {
    margin: 0 0 1em;
    font-size: 1rem;
    color: #aaa;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 0.5em;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.3em;
    margin-bottom: 1em;
  }
  label.checkbox {
    flex-direction: row;
    align-items: center;
    gap: 0.5em;
  }
  label span {
    font-size: 0.9rem;
  }
  input[type='range'] {
    width: 100%;
    cursor: pointer;
  }
  input[type='checkbox'] {
    width: 1.2em;
    height: 1.2em;
    cursor: pointer;
  }
  code {
    background: rgba(0, 120, 255, 0.3);
    padding: 0.1em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
  }
  .button-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
  }
  button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: inherit;
    padding: 0.4em 0.8em;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
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
  .presets, .stress-tests {
    max-width: 1200px;
    margin: 0 auto 1.5em;
    padding: 0 1em;
  }
  .presets h3, .stress-tests h3 {
    margin: 0 0 0.5em;
    font-size: 1rem;
    color: #aaa;
  }
  .test-status {
    margin-top: 0.8em;
    font-size: 0.9rem;
  }
  .stats {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1em 2em;
    margin: 0 auto 1.5em;
    padding: 0.8em;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    max-width: fit-content;
  }
  .stats span {
    font-size: 0.9rem;
  }
  .masonry-container {
    margin: 0 auto;
    padding: 1em;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    min-height: 200px;
    transition: width 0.1s ease-out;
  }
  .item {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 1em;
    border-radius: 8px;
    color: white;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    font-weight: 600;
  }
  .item-id {
    font-size: 1.2rem;
  }
  .item-height {
    font-size: 0.8rem;
    opacity: 0.8;
  }
  .empty-message {
    text-align: center;
    color: #666;
    padding: 2em;
  }
</style>
