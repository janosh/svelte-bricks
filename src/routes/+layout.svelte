<script lang="ts">
  import { page } from '$app/state'
  import { repository } from '$root/package.json'
  import type { Snippet } from 'svelte'
  import { GitHubCorner, Nav } from 'svelte-multiselect'
  import '../app.css'

  let { children }: { children?: Snippet<[]> } = $props()

  const routes: [string, string][] = [
    [`/`, `Home`],
    [`/edge-cases`, `Edge Cases`],
    [`/cls-demo`, `CLS Demo`],
    [`/fetch-images-example`, `Fetched Images`],
    [`/changelog`, `Changelog`],
  ]
</script>

<GitHubCorner
  href={repository}
  --gh-corner-color="var(--page-bg)"
  --gh-corner-bg="white"
/>

<Nav {routes} {page} />

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
  /* Nav component styling */
  :global(nav) {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5em 1em;
    padding: 0.8em 1em;
  }
  :global(nav a) {
    color: #8cf;
    text-decoration: none;
    padding: 0.3em 0.6em;
    border-radius: 4px;
    transition: background 0.2s;
  }
  :global(nav a:hover) {
    background: rgba(255, 255, 255, 0.1);
  }
  :global(nav a[aria-current='page']) {
    background: rgba(100, 180, 255, 0.2);
    color: #fff;
  }
</style>
