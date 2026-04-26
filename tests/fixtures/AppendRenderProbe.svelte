<script lang="ts">
  let { events, item }: { events: number[]; item: { id: number } } = $props()

  $effect(() => {
    events.push(item.id)
  })
</script>

<span data-probe-id={item.id}></span>
