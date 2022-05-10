<div class="hide-in-docs">

<h1 align="center">
  <img src="https://raw.githubusercontent.com/janosh/svelte-bricks/main/static/favicon.svg" alt="Svelte Bricks" height=60>
  <br>&ensp;Svelte Bricks
</h1>

<h4 align="center">

[![Tests](https://github.com/janosh/svelte-bricks/actions/workflows/test.yml/badge.svg)](https://github.com/janosh/svelte-bricks/actions/workflows/test.yml)
[![NPM version](https://img.shields.io/npm/v/svelte-bricks?color=blue&logo=NPM)](https://npmjs.com/package/svelte-bricks)
[![Netlify Status](https://api.netlify.com/api/v1/badges/c3213069-e3cc-45ef-a446-b2358b9a35fb/deploy-status)](https://app.netlify.com/sites/svelte-bricks/deploys)
[![pre-commit.ci status](https://results.pre-commit.ci/badge/github/janosh/svelte-bricks/main.svg)](https://results.pre-commit.ci/latest/github/janosh/svelte-bricks/main)

</h4>

Naive implementation in Svelte without column balancing.

**[Live demo](https://svelte-bricks.netlify.app)**

</div>

## Installation

```sh
yarn add -D svelte-bricks
```

## Usage

The kitchen sink for this component looks something like this:

```svelte
<script>
  import Masonry from 'svelte-bricks'

  let nItems = 30
  $: items = [...Array(nItems).keys()]

  let [minColWidth, maxColWidth, gap] = [200, 800, 20]
  let width, height
</script>

Masonry size: <span>{width}px</span> &times; <span>{height}px</span> (w &times;
h)

<Masonry
  {items}
  {minColWidth}
  {maxColWidth}
  {gap}
  let:item
  bind:width
  bind:height
>
  <Some {item} />
</Masonry>
```

**Note**: On non-primitive items, i.e. if `items` is an array of objects, this component by default tries to access a key named `'id'` on each item. This value is used to tell items apart in the keyed `{#each}` block that renders the masonry layout. Without it, Svelte could not avoid duplicates when new items are added or existing ones rearranged. Read the [Svelte docs](https://svelte.dev/tutorial/keyed-each-blocks) for details. To change the name of the identifier key, use the `idKey` prop. You can also pass in a custom function as `getId` that should map items to unique IDs.

**Hint**: Balanced columns can be achieved even with this simple implementation if masonry items are allowed to stretch to the column height.

## Props

`Masonry.svelte` expects an array of `items` as well as a `<slot />` component used to render each of the `items`. The array can contain whatever data (objects, strings, numbers) as long as the slot component knows how to handle it.

Additional optional props are:

- `items: (string | number | object)[]`: required
- `minColWidth: number = 330` (in `px`)
- `maxColWidth: number = 500` (in `px`)
- `gap: number = 20` (in `px`)
- `masonryWidth: number = 0`: Bound to the masonry `div`s width (in `px`).
- `masonryHeight: number = 0`: Bound to the masonry `div`s height (in `px`).
- `idKey: string = 'id'`: Name of the attribute to use as identifier if items are objects.
- `getId: (item) => string | number`: Custom function that maps masonry items to unique IDs.
- `animate: boolean = true`: Whether to [FLIP-animate](https://svelte.dev/tutorial/animate) masonry items when viewport resizing or other events cause `items` to rearrange.
- `style: string = ''`: Inline styles that will be applied to the top-level `div.masonry`.
- `duration: number = 200`: Transition duration in milli seconds when masonry items are rearranged or added/removed. Set to 0 to disable transitions.
- `class: string = ''`: Applies to the outer `div` wrapping all masonry columns. For use with CSS frameworks like Tailwind.
- `columnClass: string = ''`: Applies to each column `div`.

## Styling

Besides inline CSS which you can apply through the `style` prop, the following `:global()` CSS selectors can be used for fine-grained control of wrapper and column styles:

```css
:global(div.masonry) {
  /* top-level wrapper div */
}
:global(div.masonry div.col) {
  /* each column in the masonry layout */
}
```
