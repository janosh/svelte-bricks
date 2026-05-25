<script lang="ts">
  import Masonry from '$lib'

  const items = [0, 1, 2, 3, 4, 5, 6, 7, 8]

  let exact_masonry_width = $state(0)
</script>

<section data-testid="exact-masonry" style="width: 400px">
  <p data-testid="exact-masonry-width">Measured width: {exact_masonry_width}px</p>

  <Masonry
    items={items.slice(0, 6)}
    order="row-first"
    initialCols={2}
    minColWidth={200}
    gap={0}
    animate={false}
    bind:masonryWidth={exact_masonry_width}
  >
    {#snippet children({ item })}
      <div data-item-id={`A${item}`}>A{item}</div>
    {/snippet}
  </Masonry>
</section>

<section data-testid="wide-masonry" style="width: 360px">
  <Masonry
    {items}
    order="row-first"
    initialCols={3}
    minColWidth={120}
    gap={0}
    animate={false}
  >
    {#snippet children({ item })}
      <div data-item-id={`B${item}`}>B{item}</div>
    {/snippet}
  </Masonry>
</section>

<section data-testid="fallback-masonry" style="width: 360px">
  <Masonry
    items={items.slice(0, 8)}
    order="row-first"
    minColWidth={100}
    gap={0}
    animate={false}
  >
    {#snippet children({ item })}
      <div data-item-id={`F${item}`}>F{item}</div>
    {/snippet}
  </Masonry>
</section>
