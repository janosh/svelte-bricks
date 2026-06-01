<script lang="ts">
  import Changelog from '$root/changelog.md'
  import Toc from 'svelte-toc'
</script>

<div class="changelog">
  <main>
    <Changelog />
  </main>

  <Toc
    breakpoint={1250}
    --toc-mobile-bg="var(--page-bg)"
    --toc-mobile-btn-color="white"
    --toc-mobile-border="1px solid rgba(255, 255, 255, 0.15)"
  />
</div>

<style>
  .changelog {
    display: flex;
    gap: 2em;
    justify-content: center;
    align-items: flex-start; /* keep TOC short so position: sticky works */
  }
  main {
    flex: 1 1 0;
    max-width: 50em;
    min-width: 0;
    padding-inline: 1em;
  }
</style>
