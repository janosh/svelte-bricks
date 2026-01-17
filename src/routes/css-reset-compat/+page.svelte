<script lang="ts">
  // Demo: CSS Reset Compatibility
  // Tests that Masonry works correctly with CSS resets like Tailwind's Preflight
  import Masonry from '$lib'

  // Simulated async data loading (common pattern with APIs)
  async function load_images(): Promise<{ id: string; src: string; alt: string }[]> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return Array.from({ length: 20 }, (_, idx) => ({
      id: `img-${idx}`,
      src: `https://picsum.photos/seed/${idx + 1}/400/${300 + (idx % 5) * 50}`,
      alt: `Image ${idx + 1}`,
    }))
  }

  let masonry_width = $state(0)
  let masonry_height = $state(0)
  let images_loaded = $state<Record<number, boolean>>({})
</script>

<!-- Simulated CSS Reset (like Tailwind Preflight) -->
<svelte:head>
  <style>
    /* CSS Reset - similar to Tailwind's Preflight */
    *,
    ::before,
    ::after {
      box-sizing: border-box;
      border-width: 0;
      border-style: solid;
    }
    /* This rule would break Masonry if styles weren't inline */
    div {
      display: block;
    }
  </style>
</svelte:head>

<main class="demo">
  <h1>CSS Reset Compatibility</h1>
  <p>
    This page tests that the Masonry component works correctly when used alongside CSS
    resets like <a href="https://tailwindcss.com/docs/preflight">Tailwind's Preflight</a>.
  </p>

  <details>
    <summary>Technical details</summary>
    <p>
      CSS resets typically include rules like <code>div {'{'} display: block {'}'}</code>.
      Previously, Masonry used <code>:where()</code> selectors which have zero
      specificity, causing these resets to override the flex layout.
    </p>
    <p>
      <strong>Solution:</strong> Critical layout styles (<code>display: flex</code>,
      <code>width: 100%</code>) are now applied as inline styles, which cannot be
      overridden by external stylesheets.
    </p>
    <p>
      See <a href="https://github.com/janosh/svelte-bricks/issues/48">issue #48</a>
      for the original bug report.
    </p>
  </details>

  <div class="masonry-container">
    {#await load_images()}
      <p>Loading images...</p>
    {:then items}
      <Masonry
        {items}
        minColWidth={200}
        maxColWidth={400}
        gap={16}
        animate={false}
        bind:masonryWidth={masonry_width}
        bind:masonryHeight={masonry_height}
      >
        {#snippet children({ idx, item })}
          <div class="image-card">
            <img
              src={item.src}
              alt={item.alt}
              onload={() => (images_loaded[idx] = true)}
              class:loaded={images_loaded[idx]}
            />
            <span class="caption">{item.alt}</span>
          </div>
        {/snippet}
      </Masonry>
    {:catch error}
      <p>Error loading images: {error.message}</p>
    {/await}
  </div>

  <p class="debug-info">
    Masonry dimensions: {masonry_width}px × {masonry_height}px
  </p>
</main>

<style>
  .demo {
    max-width: 1200px;
    margin: 0 auto;
  }
  p {
    line-height: 1.6;
  }
  details {
    margin: 1rem 0;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
  }
  summary {
    cursor: pointer;
    font-weight: 500;
  }
  details p {
    margin: 0.5rem 0;
  }
  .masonry-container {
    margin: 2rem 0;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
  }
  .image-card {
    display: block;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    overflow: hidden;
    text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .image-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(100, 149, 237, 0.3);
  }
  .image-card img {
    width: 100%;
    height: auto;
    opacity: 0;
    transition: opacity 0.3s;
  }
  .image-card img.loaded {
    opacity: 1;
  }
  .caption {
    display: block;
    padding: 0.75rem;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
  }
  .debug-info {
    font-family: monospace;
    background: rgba(255, 255, 255, 0.05);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 0.85rem;
  }
</style>
