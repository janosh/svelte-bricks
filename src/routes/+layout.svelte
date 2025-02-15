<script lang="ts">
  import { page } from '$app/stores'
  import { repository } from '$root/package.json'
  import { GitHubCorner } from 'svelte-zoo'
  import '../app.css'

  interface Props {
    children?: import('svelte').Snippet
  }

  let { children }: Props = $props()
</script>

<GitHubCorner
  href={repository}
  --zoo-gh-corner-color="var(--page-bg)"
  --zoo-gh-corner-bg="white"
/>

{#if $page.url.pathname !== `/`}
  <a href="/" aria-label="Back to index page">&laquo; home</a>
{/if}

{@render children?.()}

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
