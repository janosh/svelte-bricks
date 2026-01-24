<script lang="ts">
  import Masonry from '$lib'

  // Item generation
  let item_count = $state(2000)
  let height = $state({ min: 80, max: 300 })

  type Item = { id: number; height: number; hue: number }

  const generate_items = (count: number): Item[] =>
    Array.from({ length: count }, (_, idx) => ({
      id: idx,
      height: height.min + Math.floor(Math.random() * (height.max - height.min)),
      hue: Math.floor(Math.random() * 360),
    }))

  let items = $state(generate_items(2000))

  // Masonry settings
  let virtualize = $state(true)
  let scroll_height = $state(600)
  let overscan = $state(5)
  let min_col_width = $state(180)
  let gap = $state(12)
  let balance = $state(true)

  // Stats
  let masonry_width = $state(0)
  let rendered_count = $derived.by(() => {
    if (!virtualize) return items.length
    // Estimate based on viewport
    const cols = Math.floor((masonry_width + gap) / (min_col_width + gap)) || 1
    const avg_height = (height.min + height.max) / 2
    const items_per_col = Math.ceil(scroll_height / avg_height) + overscan * 2
    return Math.min(items.length, cols * items_per_col)
  })

  const presets: { label: string; count: number }[] = [
    { label: `500`, count: 500 },
    { label: `2,000`, count: 2000 },
    { label: `5,000`, count: 5000 },
    { label: `10,000`, count: 10000 },
  ]
</script>

<svelte:head>
  <title>Virtual Scrolling | svelte-bricks</title>
</svelte:head>

<h1>🚀 Virtual Scrolling Demo</h1>

<p class="description">
  Render thousands of items smoothly. Only visible items are in the DOM. Scroll the
  masonry below to see virtualization in action.
</p>

<div class="controls">
  <section class="control-group">
    <h3>Items</h3>
    <div class="preset-row">
      {#each presets as { label, count }}
        <button
          onclick={() => {
            item_count = count
            items = generate_items(item_count)
          }}
          class:active={item_count === count}
        >
          {label}
        </button>
      {/each}
    </div>
    <label>
      <span>Count: <code>{item_count.toLocaleString()}</code></span>
      <input type="range" bind:value={item_count} min={100} max={20000} step={100} />
    </label>
    <button class="regenerate" onclick={() => items = generate_items(item_count)}>
      🔄 Regenerate Items
    </button>
  </section>

  <section class="control-group">
    <h3>Virtualization</h3>
    <label class="checkbox">
      <input type="checkbox" bind:checked={virtualize} />
      <span>Enable (compare performance!)</span>
    </label>
    <label>
      <span>Scroll height: <code>{scroll_height}px</code></span>
      <input type="range" bind:value={scroll_height} min={300} max={900} />
    </label>
    <label>
      <span>Overscan: <code>{overscan}</code></span>
      <input type="range" bind:value={overscan} min={1} max={15} />
    </label>
  </section>

  <section class="control-group">
    <h3>Layout</h3>
    <label>
      <span>minColWidth: <code>{min_col_width}px</code></span>
      <input type="range" bind:value={min_col_width} min={100} max={400} />
    </label>
    <label>
      <span>gap: <code>{gap}px</code></span>
      <input type="range" bind:value={gap} min={0} max={30} />
    </label>
    <label class="checkbox">
      <input type="checkbox" bind:checked={balance} />
      <span>Balance columns</span>
    </label>
  </section>
</div>

<div class="stats-bar">
  <div class="stat">
    <span class="stat-value">{items.length.toLocaleString()}</span>
    <span class="stat-label">Total Items</span>
  </div>
  <div class="stat highlight">
    <span class="stat-value">~{rendered_count.toLocaleString()}</span>
    <span class="stat-label">Rendered</span>
  </div>
  <div class="stat">
    <span class="stat-value">{masonry_width}px</span>
    <span class="stat-label">Width</span>
  </div>
  <div class="stat">
    <span class="stat-value">{virtualize ? `ON` : `OFF`}</span>
    <span class="stat-label">Virtual</span>
  </div>
</div>

<div class="masonry-wrapper">
  <Masonry
    {items}
    {virtualize}
    {balance}
    {gap}
    {overscan}
    height={scroll_height}
    minColWidth={min_col_width}
    maxColWidth={350}
    getEstimatedHeight={(item) => item.height}
    bind:masonryWidth={masonry_width}
  >
    {#snippet children({ item })}
      <div
        class="card"
        style:height="{item.height}px"
        style:background="linear-gradient(135deg, hsl({item.hue}, 70%, 55%), hsl({(item.hue + 30) % 360}, 70%, 45%))"
      >
        <span class="card-id">#{item.id}</span>
        <span class="card-height">{item.height}px</span>
      </div>
    {/snippet}
  </Masonry>
</div>

<section class="info">
  <h3>How it works</h3>
  <ul>
    <li>
      <strong>Per-column virtualization</strong> — Each column independently tracks
      visible items
    </li>
    <li>
      <strong>Binary search</strong> — O(log n) lookup for visible range using cumulative
      heights
    </li>
    <li>
      <strong>Padding spacers</strong> — Culled items replaced with padding to maintain
      scroll position
    </li>
    <li>
      <strong>ResizeObserver</strong> — Visible items measured; heights cached for
      accurate positioning
    </li>
    <li>
      <strong>Height estimation</strong> — Uses <code>getEstimatedHeight</code> before
      measurement
    </li>
  </ul>
</section>

<style>
  h1 {
    text-align: center;
    margin-bottom: 0.3em;
  }
  .description {
    text-align: center;
    color: #999;
    max-width: 500px;
    margin: 0 auto 1.5em;
  }
  .controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1em;
    max-width: 900px;
    margin: 0 auto 1.5em;
    padding: 0 1em;
  }
  .control-group {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 1em;
  }
  .control-group h3 {
    margin: 0 0 0.8em;
    font-size: 0.95rem;
    color: #aaa;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 0.4em;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.3em;
    margin-bottom: 0.8em;
    font-size: 0.9rem;
  }
  label.checkbox {
    flex-direction: row;
    align-items: center;
    gap: 0.5em;
  }
  input[type='range'] {
    width: 100%;
  }
  input[type='checkbox'] {
    width: 1.1em;
    height: 1.1em;
  }
  code {
    background: rgba(0, 150, 255, 0.25);
    padding: 0.1em 0.35em;
    border-radius: 4px;
    font-size: 0.9em;
  }
  .preset-row {
    display: flex;
    gap: 0.4em;
    margin-bottom: 0.8em;
  }
  button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: inherit;
    padding: 0.4em 0.8em;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.15s;
  }
  button:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  button.active {
    background: rgba(0, 180, 120, 0.35);
    border-color: rgba(0, 180, 120, 0.5);
  }
  button.regenerate {
    width: 100%;
    margin-top: 0.3em;
  }
  .stats-bar {
    display: flex;
    justify-content: center;
    gap: 2em;
    padding: 0.8em 1em;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    max-width: fit-content;
    margin: 0 auto 1em;
  }
  .stat {
    text-align: center;
  }
  .stat-value {
    display: block;
    font-size: 1.3rem;
    font-weight: 700;
    color: #fff;
  }
  .stat-label {
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .stat.highlight .stat-value {
    color: #4fc;
  }
  .masonry-wrapper {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0.5em;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
  }
  .card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 0.8em;
    border-radius: 8px;
    color: white;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    box-sizing: border-box; /* Ensures height includes padding, matching getEstimatedHeight */
  }
  .card-id {
    font-size: 1.1rem;
    font-weight: 700;
  }
  .card-height {
    font-size: 0.75rem;
    opacity: 0.8;
  }
  .info {
    max-width: 700px;
    margin: 2em auto 0;
    padding: 1.2em;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 10px;
  }
  .info h3 {
    margin: 0 0 0.6em;
    font-size: 1rem;
    color: #bbb;
  }
  .info ul {
    margin: 0;
    padding-left: 1.2em;
    font-size: 0.9rem;
    color: #999;
    line-height: 1.7;
  }
  .info li strong {
    color: #ccc;
  }
</style>
