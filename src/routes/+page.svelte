<script lang="ts">
  import Readme from '$root/readme.md'
  import { Collapsible, Example, Header } from '$site'
</script>

<Header />

<p>Naive implementation in Svelte without column balancing.</p>

<Collapsible title={[`Click for docs`, `Close docs`]}>
  <Readme />
</Collapsible>

<Example />

<footer>
  <a href="/fetch-images-example">example with dynamically fetched images</a>
  &bull;
  <a href="/changelog">changelog</a>
</footer>

<style>
  :global(.hide-in-docs) {
    display: none; /* needed to hide part of readme on deployed site */
  }
  p {
    text-align: center;
  }
  footer {
    display: flex;
    flex-wrap: wrap;
    gap: 5pt;
    place-content: center;
    margin-top: 5em;
  }
</style>
