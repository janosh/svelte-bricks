<script lang="ts">
  import Readme from '../../readme.md'
  import Collapsible from '../components/Collapsible.svelte'
  import Example from '../components/Example.svelte'
  import Header from '../components/Header.svx'
</script>

<Header />

<p>Naive implementation in Svelte without column balancing.</p>

<Collapsible title={[`Click for docs`, `Close docs`]}>
  <Readme />
</Collapsible>

<Example />

<h2>See another example with dynamically fetched images</h2>

<a href="/fetch-images-example"><code>fetch-images-example.svelte</code></a>

<style>
  :global(.hide-in-docs) {
    display: none; /* needed to hide part of readme on deployed site */
  }
</style>
