<script lang="ts">
  import GitHubCorner from 'svelte-github-corner'
  import '../app.css'
  import Header from '../components/Header.svx'
</script>

<GitHubCorner
  href="https://github.com/janosh/svelte-bricks"
  --ghc-color="var(--bodyBg)"
  --ghc-bg="white"
/>

<Header />

<slot />

<style>
  :global(h1) {
    display: flex;
    font-size: clamp(2rem, 2rem + 2vw, 3rem);
    place-items: center;
    place-content: center;
    margin: 1.2em 0;
  }
  :global(h1 br) {
    display: none;
  }
  @media (max-width: 600px) {
    :global(h1) {
      flex-direction: column;
      gap: 1ex;
      line-height: 1.1em;
    }
  }
  :global(.hide-in-docs) {
    display: none; /* needed to hide part of readme on deployed site */
  }
</style>
