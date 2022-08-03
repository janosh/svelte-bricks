<script lang="ts">
  import { page } from '$app/stores'
  import GitHubCorner from 'svelte-github-corner'
  import '../app.css'
  import Header from '../components/Header.svx'
  import { repo_url } from '../lib'
</script>

<GitHubCorner href={repo_url} --ghc-color="var(--bodyBg)" --ghc-bg="white" />

{#if $page.url.pathname !== `/`}
  <a href="/" sveltekit:prefetch aria-label="Back to index page">&laquo; back</a>
{/if}

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
  a[href='/'] {
    font-size: 16pt;
    position: absolute;
    top: 2em;
    left: 2em;
    background-color: rgba(255, 255, 255, 0.1);
    padding: 1pt 5pt;
    border-radius: 3pt;
    transition: 0.2s;
  }
  a[href='/']:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
</style>
