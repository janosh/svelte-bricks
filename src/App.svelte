<script>
  import Masonry from './Masonry.svelte'
  import Box from './Box.svelte'

  const items = Array(30).fill(null)
</script>

<main>
  <h1>Svelte Masonry</h1>
  <p>This is a naive masonry implementation without column balancing.</p>
  <p>
    The columns on this page are only flush because the items are allowed to stretch to
    the column height.
  </p>
  <br />
  <Masonry {items}>
    <Box />
  </Masonry>
</main>

<style>
  :global(body) {
    background: #090019;
    padding: 2em;
    font-family: -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif;
    color: white;
    text-align: center;
    font-size: 3ex;
  }
  h1 {
    font-size: calc(1em + 3vw);
  }
</style>
