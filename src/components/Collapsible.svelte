<script lang="ts">
  import { slide } from 'svelte/transition'
  import { tweened } from 'svelte/motion'

  export let title: string

  const duration = 200
  const angle = tweened(180, { duration })

  let isOpen = false

  function toggle() {
    isOpen = !isOpen
    angle.set(isOpen ? 0 : 180)
  }
</script>

<h2 on:click={toggle}>
  {#if Array.isArray(title)}{isOpen ? title[1] : title[0]}{:else}{title}{/if}
  <span style="display:inline-block; transform: rotate({$angle}deg);">👆</span>
</h2>
{#if isOpen}
  <div transition:slide={{ duration }}>
    <slot />
  </div>
{/if}

<style>
  h2 {
    cursor: pointer;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4pt;
    width: max-content;
    padding: 4pt 1ex;
    margin: 1em auto;
    transition: 0.3s;
  }
  h2:hover {
    transform: scale(1.01);
    background: rgba(255, 255, 255, 0.4);
  }
  div {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4pt;
    overflow: scroll;
    padding: 4pt 1ex;
    text-align: left;
  }
</style>
