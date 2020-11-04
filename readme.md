<p align="center">
  <img src="public/favicon.svg" alt="Svelte Masonry" height=150>
</p>

# Svelte Masonry

This is a naive masonry implementation in Svelte without column balancing. [Live demo](https://svelte-masonry.netlify.app).

## Usage

The kitchen sink for this component looks something like this:

```svx
<script>
  import Masonry from './Masonry.svelte'

  let nItems = 30
  $: items = Array(nItems).fill(null).map((_, idx) => idx + 1)

  let [minColWidth, maxColWidth, gap] = [200, 800, 20]
  let width, height
</script>

Masonry size: <span>{width}px</span> &times; <span>{height}px</span> (w &times; h)

<Masonry {items} {minColWidth} {maxColWidth} {gap} let:item bind:width bind:height>
  <Some {item} />
</Masonry>
```

`Masonry.svelte` has 5 props (plus a slot), 4 of which are optional. It expects an array of `items` as well as a slot component used to render each of the items. The array can contain whatever data (objects, strings, numbers, other arrays, etc.) as long as the slot component knows how to handle it. The optional props are `minColWidth = 330`, `maxColWidth = 500`, `gap = 20` (all in `px`).

## Get started

1. Clone and install dependencies:

   ```sh
   git clone https://github.com/janosh/svelte-masonry
   cd svelte-masonry
   yarn
   ```

2. Start [Rollup](https://rollupjs.org):

   ```sh
   yarn dev
   ```

Navigate to <http://localhost:5000>. You should see this app running. Edit a component file in `src`, save it, and reload the page to see your changes.

## Building and running in production mode

To build and serve an optimized version of the app, run

```sh
yarn serve
```

## Deploying to Netlify

Install `netlify` if you haven't already:

```sh
yarn global add netlify
```

Then, from within this project's folder:

```sh
netlify deploy --prod
```

## Formatting

When using VS Code, install the [official Svelte extension](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) and add the following to your `settings.json` to enable autoformating Svelte files on save:

```json
"[svelte]": {
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "svelte.svelte-vscode"
}
```

To get ESLint validation, also add

```json
"eslint.validate": ["svelte"]
```
