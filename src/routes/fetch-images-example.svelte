<script lang="ts">
  import Masonry from '../lib'

  type File = {
    name: string
    path: string
    size: number
    type: string
    url: string
    download_url: string
  }

  async function fetch_gh_files(): Promise<File[]> {
    const response = await fetch(
      `https://api.github.com/repos/vscode-icons/vscode-icons/contents/icons?ref=master`
    )

    if (response.ok) {
      return response.json()
    } else {
      throw `failed to fetch GitHub data`
    }
  }
</script>

<p>
  See <a href="https://github.com/janosh/svelte-bricks/blob/main/src/routes/index.svelte">
    the code
  </a> powering this example.
</p>

<br />

{#await fetch_gh_files()}
  <p>Loading data...</p>
{:then files}
  <p>
    Icons courtesy of <a href="https://github.com/vscode-icons/vscode-icons">
      <strong><code>vscode-icons</code></strong>
    </a>
  </p>
  <Masonry items={files} let:item idKey="name" minColWidth={100}>
    {@const { name, download_url } = item}
    <li>
      <strong>{name.replace(`.svg`, ``).replaceAll(`_`, ` `)}</strong>
      <img src={download_url} alt={name} width="100" />
    </li>
  </Masonry>
{/await}

<style>
  li {
    list-style: none;
    width: min-content;
  }
</style>
