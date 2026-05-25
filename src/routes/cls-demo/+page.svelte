<script lang="ts">
  import { onMount } from 'svelte'
  import Masonry from '$lib'

  // Track hydration
  let is_hydrated = $state(false)
  let hydration_time = $state<number | null>(null)

  $effect(() => {
    const start = performance.now()
    is_hydrated = true
    hydration_time = Math.round(performance.now() - start)
  })

  // State
  let min_col_width = $state(200)
  let gap = $state(15)
  let initial_cols = $state(4)
  let simulate_slow_load = $state(true)
  let masonry_width = $state(0)
  let cls_events = $state<string[]>([])
  const image_count = 15

  type Image = {
    id: number
    width: number
    height: number
    loaded: boolean
    load_delay: number
  }

  const get_load_delay = (idx: number, batch: number): number =>
    500 + ((idx * 397 + batch * 211) % 2000)

  const generate_images = (batch = 0): Image[] =>
    Array.from({ length: image_count }, (_, idx) => ({
      id: batch * image_count + idx,
      width: 300,
      height: 150 + ((idx * 73 + batch * 41) % 250),
      loaded: !simulate_slow_load,
      load_delay: simulate_slow_load ? get_load_delay(idx, batch) : 0,
    }))

  function simulate_loading(): void {
    const batch = ++loading_batch
    images.forEach(({ id, loaded, load_delay }, idx) => {
      if (loaded) return
      setTimeout(() => {
        const current_image = images[idx]
        if (batch === loading_batch && current_image?.id === id) {
          images[idx] = { ...current_image, loaded: true }
        }
      }, load_delay)
    })
  }

  let image_batch = 0
  let loading_batch = 0
  let images = $state(generate_images())

  function regenerate_images(): void {
    image_batch += 1
    images = generate_images(image_batch)
    if (simulate_slow_load) simulate_loading()
  }

  function reset_loading_state(): void {
    images = images.map((image, idx) => ({
      ...image,
      loaded: false,
      load_delay: get_load_delay(idx, image_batch),
    }))
    simulate_loading()
  }

  // Simulate image loading on mount if slow load is enabled
  onMount(() => {
    if (simulate_slow_load) simulate_loading()
  })

  // Observe CLS
  $effect(() => {
    if (typeof PerformanceObserver === `undefined`) return
    let observer: PerformanceObserver | null = null
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const value = (entry as PerformanceEntry & { value?: number }).value
          if (value) {
            cls_events.push(`CLS: ${(value * 1000).toFixed(2)}ms`)
          }
        }
      })
      observer.observe({ type: `layout-shift`, buffered: true })
    } catch { /* Layout shift API not supported */ }
    return () => observer?.disconnect()
  })

  const calc_cols = (width: number): number =>
    Math.min(images.length, Math.floor((width + gap) / (min_col_width + gap)) || 1)

  let actual_cols = $derived(masonry_width > 0 ? calc_cols(masonry_width) : initial_cols)
</script>

<svelte:head>
  <title>CLS Demo | svelte-bricks</title>
</svelte:head>

<h1>📊 CLS Visualization</h1>

<p class="description">
  This page demonstrates how the masonry layout reduces Cumulative Layout Shift (CLS).
  It passes a deterministic <code>initialCols</code> value for SSR. When that value
  matches the first measured client column count, stable order modes can hydrate with
  the same masonry column tree; otherwise CSS container queries still hide excess
  columns before JavaScript runs.
</p>

<section class="info-panel">
  <h2>Hydration Status</h2>
  <div class="status-grid">
    <div class="status-item">
      <span class="label">Hydrated:</span>
      <span class="value" class:success={is_hydrated}>{
        is_hydrated ? `✓ Yes` : `⏳ Pending`
      }</span>
    </div>
    <div class="status-item">
      <span class="label">Hydration time:</span>
      <span class="value">{hydration_time !== null ? `${hydration_time}ms` : `...`}</span>
    </div>
    <div class="status-item">
      <span class="label">Container width:</span>
      <span class="value">{
        masonry_width > 0 ? `${masonry_width}px` : `measuring...`
      }</span>
    </div>
    <div class="status-item">
      <span class="label">SSR columns:</span>
      <span class="value">{initial_cols}</span>
    </div>
    <div class="status-item">
      <span class="label">Actual columns:</span>
      <span class="value">{actual_cols}</span>
    </div>
    <div class="status-item">
      <span class="label">Column match:</span>
      <span class="value" class:success={initial_cols === actual_cols}>{
        initial_cols === actual_cols ? `✓ Exact SSR` : `⚠ Hint mismatch`
      }</span>
    </div>
  </div>
</section>

<section class="controls">
  <h2>Controls</h2>
  <div class="control-row">
    <label>
      <span>minColWidth: <code>{min_col_width}px</code></span>
      <input type="range" bind:value={min_col_width} min={100} max={400} />
    </label>
    <label>
      <span>gap: <code>{gap}px</code></span>
      <input type="range" bind:value={gap} min={0} max={40} />
    </label>
    <label>
      <span>initialCols: <code>{initial_cols}</code></span>
      <input type="range" bind:value={initial_cols} min={1} max={8} />
    </label>
  </div>
  <div class="button-row">
    <label class="checkbox">
      <input type="checkbox" bind:checked={simulate_slow_load} />
      <span>Simulate slow image loading</span>
    </label>
    <button onclick={regenerate_images}>🔄 Regenerate Images</button>
    <button onclick={reset_loading_state} disabled={!simulate_slow_load}>
      ⏳ Reset Loading State
    </button>
  </div>
</section>

<div class="masonry-container">
  <Masonry
    items={images}
    order="balanced-stable"
    minColWidth={min_col_width}
    initialCols={initial_cols}
    {gap}
    bind:masonryWidth={masonry_width}
  >
    {#snippet children({ item })}
      <div
        class="image-placeholder"
        style:aspect-ratio={item.width / item.height}
        class:loaded={item.loaded}
      >
        {#if item.loaded}
          <img
            src="https://picsum.photos/seed/{item.id}/{item.width}/{item.height}"
            alt="Demo {item.id}"
            loading="lazy"
          />
        {:else}
          <div class="loading-skeleton">
            <span>Loading #{item.id}...</span>
            <span class="delay">{item.load_delay}ms</span>
          </div>
        {/if}
      </div>
    {/snippet}
  </Masonry>
</div>

{#if cls_events.length > 0}
  <section class="cls-log">
    <h2>Layout Shift Events</h2>
    <ul>{#each cls_events as event, event_idx (`${event_idx}:${event}`)}<li>{event}</li>{/each}</ul>
  </section>
{/if}

<section class="explanation">
  <h2>How CLS Mitigation Works</h2>
  <div class="explanation-content">
    <div class="step">
      <span class="step-num">1</span>
      <div>
        <strong>SSR renders initial columns</strong>
        <p>
          On the server, <code>masonryWidth</code> is 0. This demo passes
          <code>initialCols</code> so SSR can render the same number of columns the
          client will use after its first width measurement.
        </p>
      </div>
    </div>
    <div class="step">
      <span class="step-num">2</span>
      <div>
        <strong>CSS container queries hide excess</strong>
        <p>
          Dynamic <code>@container</code> rules immediately hide SSR columns that don't
          fit the actual container width. This happens purely in CSS, before any JS runs.
        </p>
      </div>
    </div>
    <div class="step">
      <span class="step-num">3</span>
      <div>
        <strong>JS hydrates and measures</strong>
        <p>
          After hydration, JavaScript measures the actual width and calculates the client
          column count. Once <code>masonryWidth</code> is greater than 0, the measured
          <code>calcCols</code> result wins over <code>initialCols</code>; stable order
          modes avoid item redistribution when both counts match.
        </p>
      </div>
    </div>
  </div>
</section>

<style>
  h1 {
    text-align: center;
    margin-bottom: 0.3em;
  }
  .description {
    text-align: center;
    color: #999;
    max-width: 650px;
    margin: 0 auto 1.5em;
    line-height: 1.5;
  }
  section {
    max-width: 900px;
    margin: 0 auto 1.5em;
    padding: 1em 1.2em;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }
  h2 {
    margin: 0 0 0.8em;
    font-size: 1rem;
    color: #bbb;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 0.4em;
  }
  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.8em;
  }
  .status-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5em 0.8em;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    font-size: 0.9rem;
  }
  .status-item .label {
    color: #888;
  }
  .status-item .value {
    font-weight: 600;
  }
  .status-item .value.success {
    color: #4c8;
  }
  .cls-log {
    background: rgba(255, 100, 50, 0.1);
    border: 1px solid rgba(255, 100, 50, 0.3);
  }
  .cls-log ul {
    margin: 0;
    padding-left: 1.5em;
    font-size: 0.9rem;
    color: #f96;
  }
  .controls {
    padding: 1.2em;
  }
  .control-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1em;
    margin-bottom: 1em;
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
    background: rgba(0, 120, 255, 0.25);
    padding: 0.15em 0.4em;
    border-radius: 4px;
    font-size: 0.85em;
  }
  .button-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1em;
  }
  button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: inherit;
    padding: 0.5em 1em;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: background 0.2s;
  }
  button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .masonry-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1em;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 10px;
  }
  .image-placeholder {
    border-radius: 8px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
    transition: opacity 0.3s;
  }
  .image-placeholder img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .loading-skeleton {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    min-height: 100px;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.05) 25%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.05) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    color: #666;
    font-size: 0.85rem;
  }
  .loading-skeleton .delay {
    font-size: 0.75rem;
    opacity: 0.6;
    margin-top: 0.3em;
  }
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  .explanation {
    max-width: 700px;
  }
  .explanation-content {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
  .step {
    display: flex;
    gap: 1em;
    align-items: flex-start;
  }
  .step-num {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 2em;
    height: 2em;
    background: rgba(0, 150, 255, 0.3);
    border-radius: 50%;
    font-weight: 700;
    flex-shrink: 0;
  }
  .step strong {
    display: block;
    margin-bottom: 0.3em;
  }
  .step p {
    margin: 0;
    font-size: 0.9rem;
    color: #aaa;
    line-height: 1.5;
  }
</style>
