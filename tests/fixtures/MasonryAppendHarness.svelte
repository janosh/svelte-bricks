<script lang="ts">
  import Masonry from '$lib'
  import AppendRenderProbe from './AppendRenderProbe.svelte'

  type Item = { id: number }

  let { events }: { events: number[] } = $props()

  let items = $state<Item[]>([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }])

  export const append = (new_items: Item[]): void => {
    items = [...items, ...new_items]
  }
</script>

<Masonry
  {items}
  animate={false}
  calcCols={() => 2}
  idKey="id"
  masonryWidth={500}
  order="balanced-stable"
>
  {#snippet children({ item })}
    <AppendRenderProbe {events} {item} />
  {/snippet}
</Masonry>
