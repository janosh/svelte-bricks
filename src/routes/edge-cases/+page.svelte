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

  function generate_items(count: number) {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      height: fixed_height
        ? min_height
        : Math.floor(min_height + Math.random() * (max_height - min_height)),
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
    }))
  }

  let items = $state(generate_items(20))

  function regenerate() {
    items = generate_items(n_items)
  }

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
  Interactive demo to test the masonry layout with various edge cases. Use the controls
  below to adjust parameters and observe how the layout handles different scenarios.
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
      <button
        onclick={() => {
          const new_id = items.length > 0
            ? Math.max(...items.map((item) => item.id)) + 1
            : 0
          items = [...items, {
            id: new_id,
            height: fixed_height ? min_height : Math.floor(
              min_height + Math.random() * (max_height - min_height),
            ),
            color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
          }]
        }}
      >
        + Add
      </button>
      <button onclick={() => items = items.slice(0, -1)}>- Remove</button>
      <button
        onclick={() => {
          if (items.length > 0) {
            const idx = Math.floor(Math.random() * items.length)
            items = [...items.slice(0, idx), ...items.slice(idx + 1)]
          }
        }}
      >
        🎲 Random
      </button>
      <button onclick={() => items = [...items].sort(() => Math.random() - 0.5)}>
        🔀 Shuffle
      </button>
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
</div>

<section class="presets">
  <h3>Quick Presets</h3>
  <div class="button-row">
    <button
      onclick={() => {
        n_items = 1
        regenerate()
      }}
    >
      1 Item
    </button>
    <button
      onclick={() => {
        n_items = 3
        regenerate()
      }}
    >
      3 Items
    </button>
    <button
      onclick={() => {
        n_items = 100
        regenerate()
      }}
    >
      100 Items
    </button>
    <button
      onclick={() => {
        min_height = 300
        max_height = 500
        regenerate()
      }}
    >
      Tall Items
    </button>
    <button
      onclick={() => {
        min_height = 30
        max_height = 60
        regenerate()
      }}
    >
      Short Items
    </button>
    <button
      onclick={() => {
        fixed_height = true
        regenerate()
      }}
    >
      Uniform Height
    </button>
    <button
      onclick={() => {
        fixed_height = false
        min_height = 50
        max_height = 400
        regenerate()
      }}
    >
      Varied Height
    </button>
    <button
      onclick={() => {
        min_col_width = 100
        max_col_width = 150
      }}
    >
      Narrow Cols
    </button>
    <button
      onclick={() => {
        min_col_width = 400
        max_col_width = 600
      }}
    >
      Wide Cols
    </button>
  </div>
</section>

<div class="stats">
  <span>Measured width: <code>{masonry_width}px</code></span>
  <span>Measured height: <code>{masonry_height}px</code></span>
  <span>Expected columns: <code>{expected_cols}</code></span>
  <span>Items: <code>{items.length}</code></span>
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
    transition: background 0.2s;
  }
  button:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .presets {
    max-width: 1200px;
    margin: 0 auto 2em;
    padding: 0 1em;
  }
  .presets h3 {
    margin: 0 0 0.5em;
    font-size: 1rem;
    color: #aaa;
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
