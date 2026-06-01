<script lang="ts">
  import { page } from '$app/state'
  import { repository } from '$root/package.json'
  import type { Snippet } from 'svelte'
  import { GitHubCorner, Nav } from 'svelte-multiselect'
  // eslint-disable-next-line import/no-unassigned-import
  import '../app.css'

  let { children }: { children?: Snippet<[]> } = $props()

  // Auto-discover all demo pages via import.meta.glob
  const page_modules = import.meta.glob(`./*/+page.svelte`, { eager: true })

  // Custom labels for nav links (url -> label)
  const labels: Record<string, string> = {
    '/': `Home`,
    '/cls-demo': `CLS Demo`,
    '/css-reset-compat': `CSS Reset Compat`,
    '/fetch-images-example': `Fetched Images`,
  }
  const routes: string[] = [
    `/`,
    ...Object.keys(page_modules)
      .map((path) => `/${path.replace(`./`, ``).replace(`/+page.svelte`, ``)}`)
      .toSorted((a, b) => (labels[a] ?? a).localeCompare(labels[b] ?? b)),
  ]
  for (const route of [`/edge-cases`, `/changelog`]) {
    routes.push(...routes.splice(routes.indexOf(route), 1))
  }
</script>

<GitHubCorner
  href={repository}
  --gh-corner-color="var(--page-bg)"
  --gh-corner-bg="white"
/>

<Nav {routes} {page} {labels} />

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
</style>
