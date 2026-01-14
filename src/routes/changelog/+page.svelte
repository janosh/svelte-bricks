<script lang="ts">
  import Changelog from '$root/changelog.md'
  import Toc from 'svelte-toc'
</script>

<main>
  <Changelog />
</main>

<Toc headingSelector="main > :where(h3, h4)" breakpoint={1250} />

<style>
  main {
    max-width: 50em;
    margin-inline: auto;
    padding-inline: 1em;
  }
  :global(aside.toc.desktop) {
    position: fixed;
    top: 3em;
    left: calc(50vw + 50em / 2);
    max-width: 16em;
  }
</style>
