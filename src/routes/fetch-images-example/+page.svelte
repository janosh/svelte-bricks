<script lang="ts">
  import Masonry from '$lib'
  import { repository } from '$root/package.json'

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

  const example_code_url = `${repository}/blob/-/src/routes/fetch-images-example/+page.svelte`
</script>

<p>
  View <a href={example_code_url}>the code </a> powering this example.
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
      <span>{name.replace(`.svg`, ``).replaceAll(`_`, ` `)}</span>
      <img src={download_url} alt={name} width="100" />
    </li>
  </Masonry>
{/await}

<style>
  p {
    text-align: center;
  }
  li {
    list-style: none;
    text-transform: capitalize;
    background-color: rgba(255, 255, 255, 0.1);
    padding: 6pt 6pt 0;
    border-radius: 3pt;
  }
  li span {
    font-weight: lighter;
  }
</style>
