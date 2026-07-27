<script lang="ts">
  import Masonry, { type MasonryOrder, order_options } from '$lib'

  // CSS Reset test state
  let css_reset_active = $state(false)
  let reset_style_el: HTMLStyleElement | null = null

  $effect(() => {
    if (css_reset_active) {
      reset_style_el = document.createElement(`style`)
      reset_style_el.textContent = `
        /* Simulated CSS Reset - like Tailwind Preflight */
        div { display: block; }
        *, ::before, ::after { box-sizing: border-box; }
      `
      document.head.append(reset_style_el)
    } else if (reset_style_el) {
      reset_style_el.remove()
      reset_style_el = null
    }
    return () => reset_style_el?.remove()
  })

  // State
  let n_items = $state(20)
  let min_height = $state(50)
  let max_height = $state(300)
  let fixed_height = $state(false)
  let min_col_width = $state(200)
  let max_col_width = $state(400)
  let gap = $state(15)
  let animate = $state(true)
  let order = $state<MasonryOrder>(`balanced`)
  let container_width = $state(100)
  let constrained_width = $state(false)
  let masonry_width = $state(0)
  let masonry_height = $state(0)
  // Virtualization state
  let virtualize = $state(false)
  let virtual_height = $state(500)
  let overscan = $state(5)

  // Stress test state
  type StressMode = `rapid-add` | `rapid-remove` | `resize-spam` | `shuffle-chaos`
  type TestMode = StressMode | `idle`
  type StressTest = {
    mode: StressMode
    label: string
    interval: number
    setup?: () => void
    tick: () => void
  }
  let test_mode = $state<TestMode>(`idle`)
  let interval_id: ReturnType<typeof setInterval> | null = null
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
  const make_items = (count: number, start_id = 0) =>
    Array.from({ length: count }, (_, idx) => make_item(start_id + idx))

  let next_id = $state(20)
  let items = $state(make_items(20))

  function set_items(next_items: typeof items): void {
    items = next_items
    n_items = items.length
  }

  function update_item_heights(): void {
    items = items.map((item) => ({ ...item, height: rand_height() }))
  }

  function set_n_items(next_count: number): void {
    if (next_count <= items.length) set_items(items.slice(0, next_count))
    else add_items(next_count - items.length)
  }

  function set_min_height(next_height: number): void {
    min_height = next_height
    if (max_height < min_height) max_height = min_height
    update_item_heights()
  }

  function set_max_height(next_height: number): void {
    max_height = Math.max(next_height, min_height)
    update_item_heights()
  }

  function set_fixed_height(next_fixed_height: boolean): void {
    fixed_height = next_fixed_height
    update_item_heights()
  }

  function regenerate(count = n_items): void {
    set_items(make_items(count))
    next_id = count
  }

  const add_items = (count: number) => {
    if (count <= 0) return
    const new_items = make_items(count, next_id)
    next_id += count
    set_items([...items, ...new_items])
  }
  const add_item = () => add_items(1)
  const remove_last = () => set_items(items.slice(0, -1))
  const reroll_items = () => {
    items = items.map(({ id }) => make_item(id))
  }
  const remove_random = () => {
    if (items.length > 0) {
      const random_idx = Math.floor(Math.random() * items.length)
      set_items(items.toSpliced(random_idx, 1))
    }
  }
  const shuffle = () => (items = items.toSorted(() => Math.random() - 0.5))
  const clear_all = () => {
    next_id = 0
    set_items([])
  }

  function apply_height_preset(min_height_px: number, max_height_px: number): void {
    min_height = min_height_px
    max_height = max_height_px
    regenerate()
  }

  // Stress test controls
  function regenerate_virtual_items(count: number): void {
    virtualize = true
    regenerate(count)
  }

  function stop_test(): void {
    if (interval_id) clearInterval(interval_id)
    interval_id = null
    test_mode = `idle`
  }

  function start_test({ mode, setup, tick, interval }: StressTest): void {
    stop_test()
    setup?.()
    test_mode = mode
    operation_count = 0
    interval_id = setInterval(() => {
      tick()
      operation_count++
    }, interval)
  }

  const stress_tests: StressTest[] = [
    { mode: `rapid-add`, label: `⚡ Rapid Add`, interval: 50, tick: () => add_items(1) },
    {
      mode: `rapid-remove`,
      label: `💥 Rapid Remove`,
      interval: 50,
      setup: () => {
        if (items.length < 50) add_items(100)
      },
      tick: () => {
        if (items.length > 0) remove_random()
        else stop_test()
      },
    },
    {
      mode: `resize-spam`,
      label: `📐 Resize Spam`,
      interval: 100,
      tick: () => {
        container_width = 30 + Math.floor(Math.random() * 70)
      },
    },
    {
      mode: `shuffle-chaos`,
      label: `🌀 Shuffle Chaos`,
      interval: 150,
      setup: () => {
        if (items.length < 30) add_items(50)
      },
      tick: () => {
        shuffle()
        if (Math.random() > 0.7) add_items(1)
        if (Math.random() > 0.7 && items.length > 5) remove_random()
      },
    },
  ]

  type Preset = {
    label: string
    description: string
    action: () => void
    link?: [string, string]
  }
  let selected_preset = $state<Preset | null>(null)
  const presets: Preset[] = [
    {
      label: `1 Item`,
      description: `Checks that one item does not create empty extra columns.`,
      action: () => regenerate(1),
    },
    {
      label: `100 Items`,
      description: `Exercises a larger non-virtualized layout.`,
      action: () => regenerate(100),
    },
    {
      label: `Tall Items`,
      description: `Stresses balancing with tall, uneven item heights.`,
      action: () => apply_height_preset(300, 500),
    },
    {
      label: `Short Items`,
      description: `Creates a dense layout for inspecting gaps and columns.`,
      action: () => apply_height_preset(30, 60),
    },
    {
      label: `Issue #60`,
      description: `Recreates balanced-stable columns repopulating after resize.`,
      link: [`https://github.com/janosh/svelte-bricks/issues/60`, `issue #60`],
      action: () => {
        order = `balanced-stable`
        min_col_width = 180
        max_col_width = 260
        gap = 20
        container_width = 100
        constrained_width = false
        virtualize = false
        regenerate(12)
      },
    },
    {
      label: `No Gap`,
      description: `Removes item spacing to stress placement math.`,
      action: () => {
        gap = 0
      },
    },
    {
      label: `200 Items`,
      description: `Combines many items with narrow columns.`,
      action: () => {
        min_col_width = 80
        regenerate(200)
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

<h1>Edge Cases</h1>

<p class="description">
  Test the masonry layout with unusual item, column, and container settings.
</p>

<section class="control-group item-settings">
  <h2>Item Settings</h2>
  <label>
    <span>Number of items: <code>{n_items}</code></span>
    <input type="range" bind:value={() => n_items, set_n_items} min={0} max={200} />
  </label>
  <label>
    <span>Min height: <code>{min_height}px</code></span>
    <input
      type="range"
      bind:value={() => min_height, set_min_height}
      min={20}
      max={500}
    />
  </label>
  <label>
    <span>Max height: <code>{max_height}px</code></span>
    <input
      type="range"
      bind:value={() => max_height, set_max_height}
      min={min_height}
      max={600}
    />
  </label>
  <label class="checkbox">
    <input type="checkbox" bind:checked={() => fixed_height, set_fixed_height} />
    <span>Fixed height (use min only)</span>
  </label>
  <div class="button-row">
    <button onclick={add_item}>+ Add</button>
    <button onclick={remove_last}>- Remove</button>
    <button onclick={reroll_items}>🎲 Reroll</button>
    <button onclick={shuffle}>🔀 Shuffle</button>
    <button onclick={clear_all}>🗑 Clear</button>
  </div>
</section>

<div class="controls-grid">
  <section class="control-group">
    <h2>Column Settings</h2>
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
    <h2>Layout</h2>
    <label>
      <span>Order mode: <code>{order}</code></span>
      <select bind:value={order}>
        {#each order_options as order_option (order_option)}
          <option value={order_option}>{order_option}</option>
        {/each}
      </select>
    </label>
    <label class="checkbox">
      <input type="checkbox" bind:checked={animate} />
      <span>Animate transitions</span>
    </label>
  </section>

  <section class="control-group">
    <h2>Container Settings</h2>
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
    <h2>Virtualization</h2>
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
      {#each [[`🚀`, 1000], [`🔥`, 5000]] as const as [icon, count] (count)}
        <button onclick={() => regenerate_virtual_items(count)}>
          {icon}
          {count.toLocaleString()} Items
        </button>
      {/each}
    </div>
  </section>
</div>

<section class="presets">
  <h2>Quick Presets</h2>
  <div class="button-row">
    {#each presets as preset (preset.label)}
      <button
        onclick={() => {
          preset.action()
          selected_preset = preset
        }}>{preset.label}</button
      >
    {/each}
  </div>
  {#if selected_preset}
    <p class="preset-description">
      {selected_preset.description}
      {#if selected_preset.link}
        {@const [href, title] = selected_preset.link}
        (<a {href}>{title}</a>)
      {/if}
    </p>
  {/if}
</section>

<section class="css-reset-test">
  <h2>🛡️ CSS Reset Compatibility</h2>
  <p>
    Test that Masonry resists CSS resets like
    <a href="https://tailwindcss.com/docs/preflight">Tailwind Preflight</a>. Toggle the
    reset to inject <code>div &#123; display: block &#125;</code> into the page. Layout
    should remain intact due to inline styles. (<a
      href="https://github.com/janosh/svelte-bricks/issues/48">issue #48</a
    >)
  </p>
  <div class="button-row">
    <button
      onclick={() => (css_reset_active = !css_reset_active)}
      class:active={css_reset_active}
    >
      {css_reset_active ? `✓ CSS Reset Active` : `Apply CSS Reset`}
    </button>
  </div>
</section>

<details class="stress-tests">
  <summary>🔥 Automated Stress Tests</summary>
  <div class="button-row">
    {#each stress_tests as stress_test (stress_test.mode)}
      <button
        onclick={() => start_test(stress_test)}
        class:active={test_mode === stress_test.mode}
        disabled={test_mode !== `idle` && test_mode !== stress_test.mode}
      >
        {stress_test.label}
      </button>
    {/each}
    {#if test_mode !== `idle`}
      <button onclick={stop_test} class="stop">⏹ Stop</button>
    {/if}
  </div>
  {#if test_mode !== `idle`}
    <p class="test-status">
      Running: <strong>{test_mode}</strong> — Operations: <code>{operation_count}</code>
    </p>
  {/if}
</details>

<div class="stats">
  <span>Width: <code>{masonry_width}px</code></span>
  <span>Height: <code>{masonry_height}px</code></span>
  <span>Columns: <code>{expected_cols}</code></span>
  <span>Items: <code>{items.length}</code></span>
  <span>Order: <code>{virtualize ? `row-first (forced)` : order}</code></span>
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
    {order}
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
    margin-bottom: 0.4em;
    font-size: 1.5rem;
  }
  .description {
    text-align: center;
    color: #888;
    max-width: 600px;
    margin: 0 auto 1.2em;
    font-size: 0.875rem;
  }
  .controls-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1em;
    margin: 0 auto 1.2em;
    max-width: 1200px;
    padding: 0 0.75em;
  }
  .item-settings {
    width: min(520px, calc(100% - 1.5em));
    margin: 0 auto 1em;
  }
  .control-group {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    padding: 0.6em 0.75em;
  }
  .control-group h2 {
    margin: 0 0 0.5em;
    font-size: 0.85rem;
    color: #aaa;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 0.35em;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.2em;
    margin-bottom: 0.6em;
  }
  label.checkbox {
    flex-direction: row;
    align-items: center;
    gap: 0.4em;
  }
  label span {
    font-size: 0.8rem;
  }
  input[type='range'] {
    width: 100%;
    cursor: pointer;
  }
  input[type='checkbox'] {
    width: 1em;
    height: 1em;
    cursor: pointer;
  }
  select {
    width: 100%;
    padding: 0.3em;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: inherit;
    cursor: pointer;
  }
  code {
    background: rgba(0, 120, 255, 0.3);
    padding: 0.05em 0.35em;
    border-radius: 3px;
    font-size: 0.85em;
  }
  .button-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35em;
  }
  button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: inherit;
    padding: 0.3em 0.6em;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
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
  .presets,
  .stress-tests,
  .css-reset-test {
    max-width: 1200px;
    margin: 0 auto 1em;
    padding: 0 0.75em;
  }
  .css-reset-test p {
    font-size: 0.8rem;
    color: #aaa;
    margin: 0.35em 0;
  }
  .preset-description {
    color: #aaa;
    font-size: 0.8rem;
    margin: 0.5em 0 0;
  }
  .css-reset-test a {
    color: cornflowerblue;
  }
  .presets h2,
  .stress-tests summary,
  .css-reset-test h2 {
    margin: 0 0 0.4em;
    font-size: 0.85rem;
    color: #aaa;
  }
  .stress-tests summary {
    cursor: pointer;
  }
  .test-status {
    margin-top: 0.5em;
    font-size: 0.8rem;
  }
  .stats {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.6em 1.5em;
    margin: 0 auto 1em;
    padding: 0.5em 0.75em;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    max-width: fit-content;
  }
  .stats span {
    font-size: 0.8rem;
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
