<script lang="ts">
  import { tweened } from 'svelte/motion'
  import { slide } from 'svelte/transition'

  interface Props {
    title: string | string[]
    children?: import('svelte').Snippet
  }

  let { title, children }: Props = $props()

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
  <span style="display:inline-block; transform: rotate({$angle}deg);">👆</span>
</button>
{#if isOpen}
  <div transition:slide={{ duration }}>
    {@render children?.()}
  </div>
{/if}

<style>
  button {
    cursor: pointer;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4pt;
    width: max-content;
    padding: 4pt 1ex;
    box-sizing: border-box;
    display: block;
    margin: 2em auto;
    transition: 0.3s;
    border: none;
    color: white;
    font-size: 1.3em;
  }
  button:hover {
    transform: scale(1.01);
    background: rgba(255, 255, 255, 0.2);
  }
  div {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4pt;
    overflow: scroll;
    padding: 0 1em 1ex;
  }
</style>
