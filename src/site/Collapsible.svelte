<script lang="ts">
  import type { Snippet } from 'svelte'
  import { tweened } from 'svelte/motion'
  import { slide } from 'svelte/transition'

  let { title, children }: { title: string | string[]; children?: Snippet<[]> } =
    $props()

  const duration = 200
  const angle = tweened(180, { duration })

  let isOpen = $state(false)

  function toggle() {
    isOpen = !isOpen
    angle.set(isOpen ? 0 : 180)
  }
</script>

<button onclick={toggle}>
  {#if Array.isArray(title)}{isOpen ? title[1] : title[0]}{:else}{title}{/if}
  <span style="display: inline-block; transform: rotate({$angle}deg)">👆</span>
</button>
{#if isOpen}
  <div transition:slide={{ duration }}>
    {@render children?.()}
  </div>
{/if}

<style>
  button {
    cursor: pointer;
    background: var(--btn-bg, rgba(255, 255, 255, 0.1));
    border-radius: var(--btn-border-radius, 4pt);
    width: max-content;
    padding: var(--btn-padding, 4pt 1ex);
    box-sizing: border-box;
    display: block;
    margin: var(--btn-margin, 2em auto);
    transition: 0.3s;
    border: none;
    color: var(--btn-text-color, white);
    font-size: var(--btn-font-size, 1.1em);
  }
  button:hover {
    transform: var(--btn-hover-transform, scale(1.01));
    background: var(--btn-hover-bg, rgba(255, 255, 255, 0.2));
  }
  div {
    background: var(--collapsible-bg, rgba(255, 255, 255, 0.1));
    border-radius: var(--collapsible-border-radius, 4pt);
    overflow: scroll;
    padding: var(--collapsible-padding, 0 1em 1ex);
  }
</style>
