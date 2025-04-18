<div class="hide-in-docs">

<h1 align="center">
  <img src="https://raw.githubusercontent.com/janosh/svelte-bricks/main/static/favicon.svg" alt="Logo" height=60>
  <br>&ensp;Svelte Bricks
</h1>

<h4 align="center">

[![Tests](https://github.com/janosh/svelte-bricks/actions/workflows/test.yml/badge.svg)](https://github.com/janosh/svelte-bricks/actions/workflows/test.yml)
[![NPM version](https://img.shields.io/npm/v/svelte-bricks?color=blue&logo=NPM)](https://npmjs.com/package/svelte-bricks)
[![GitHub Pages](https://github.com/janosh/svelte-bricks/actions/workflows/gh-pages.yml/badge.svg)](https://github.com/janosh/svelte-bricks/actions/workflows/gh-pages.yml)
[![pre-commit.ci status](https://results.pre-commit.ci/badge/github/janosh/svelte-bricks/main.svg)](https://results.pre-commit.ci/latest/github/janosh/svelte-bricks/main)
[![Open in StackBlitz](https://img.shields.io/badge/Open%20in-StackBlitz-darkblue?logo=stackblitz)](https://stackblitz.com/github/janosh/svelte-bricks)

</h4>

Naive implementation in Svelte without column balancing. **[Live demo](https://janosh.github.io/svelte-bricks)**

</div>

## Installation

```sh
npm install --dev svelte-bricks
```

## Usage

The kitchen sink for this component looks something like this:

```svelte
<script>
  import Masonry from 'svelte-bricks'

  let nItems = $state(30);
  let items = $derived([...Array(nItems).keys()])

  let [minColWidth, maxColWidth, gap] = [200, 800, 20]
  let width = $state(0), height = $state(0)
</script>

Masonry size: <span>{width}px</span> &times; <span>{height}px</span> (w &times; h)

<Masonry
  {items}
  {minColWidth}
  {maxColWidth}
  {gap}
  style="padding: 20px;"
  columnStyle="background-color: rgba(0, 0, 0, 0.1);"
  bind:masonryWidth={width}
  bind:masonryHeight={height}
>
  {#snippet children({ item })}
    <Some {item} />
  {/snippet}
</Masonry>
```

**Note**: If `items` is an array of objects, this component tries to access an `id` property on each item. This value is used to tell items apart in the keyed `{#each}` block that creates the masonry layout. Without it, Svelte could not avoid duplicates when new items are added or existing ones rearranged. Read the [Svelte docs](https://svelte.dev/tutorial/keyed-each-blocks) for details. To change the name of the identifier key, pass `idKey="some-uniq-key`. Or pass a function `getId = (item: Item) => string | number` that maps items to unique IDs.

**Hint**: Balanced columns can be achieved even with this simple implementation if masonry items are allowed to stretch to the column height.

## Props

`Masonry.svelte` expects an array of `items` as well as a `<slot />` component used to render each of the `items`. The array can contain whatever data (objects, strings, numbers) as long as the slot component knows how to handle it.

Additional optional props are:

1. ```ts
   animate: boolean = true
   ```

   Whether to [FLIP-animate](https://svelte.dev/tutorial/animate) masonry items when viewport resizing or other events cause `items` to rearrange.

1. ```ts
   calcCols = (
     masonryWidth: number,
     minColWidth: number,
     gap: number,
   ): number => {
     return Math.min(
       items.length,
       Math.floor((masonryWidth + gap) / (minColWidth + gap)) || 1,
     )
   }
   ```

   Function used to compute the number of columns based on the masonry width, minimum column width and gap.

1. ```ts
   class: string = ``
   ```

   Applies to the outer `div` wrapping all masonry columns. For use with CSS frameworks like Tailwind.

1. ```ts
   columnClass: string = ``
   ```

   Applies to each column `div`.

1. ```ts
   duration: number = 200
   ```

   Transition duration in milli seconds when masonry items are rearranged or added/removed. Set to 0 to disable transitions.

1. ```ts
   gap: number = 20
   ```

   Gap between columns and items within each column in `px`.

1. ```ts
   getId = (item: Item): string | number => {
     if (typeof item === `number`) return item
     if (typeof item === `string`) return item
     return item[idKey]
   }
   ```

   Custom function that maps masonry items to unique IDs of type `string` or `number`.

1. ```ts
   idKey: string = `id`
   ```

   Name of the attribute to use as identifier if items are objects.

1. ```ts
   items: Item[]
   ```

   The only required prop are the list of items to render where `Item = $$Generic` is a generic type which usually will be `object` but can also be simple types `string` or `number`.

1. ```ts
   masonryHeight: number = 0
   ```

   The masonry `div`s height in `px`.

1. ```ts
   masonryWidth: number = 0
   ```

   The masonry `div`s width in `px`.

1. ```ts
   maxColWidth: number = 500
   ```

   Maximum column width in `px`.

1. ```ts
   minColWidth: number = 330
   ```

   Minimum column width in `px`.

1. ```ts
   style: string = ``
   ```

   Inline styles that will be applied to the top-level `div.masonry`.

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
