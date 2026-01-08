<script lang="ts">
  import Readme from '$root/readme.md'
  import { Collapsible, Example, Header } from '$site'
</script>

<Header />

<p>
  Svelte masonry component with SSR support (via CSS container queries) and automatic
  column balancing.
</p>

<Collapsible title={[`Click for docs`, `Close docs`]}>
  <Readme />
</Collapsible>

<Example />

<style>
  :global(.hide-in-docs) {
    display: none; /* needed to hide part of readme on deployed site */
  }
  p {
    text-align: center;
  }
</style>
