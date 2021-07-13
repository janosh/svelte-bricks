<script lang="ts">
  export let index: number

  const height = 100 + 200 * Math.random()

  const randColor = () => Math.random().toString(16).substr(-6)
  const bg = `linear-gradient(45deg, #${randColor()}, #${randColor()})`

  let flipped = false
</script>

<div
  style="min-height: {height}px; background: {bg};"
  on:click={() => (flipped = !flipped)}
  class:flipped>
  <p>h<sub>{index}</sub> = {Math.floor(height)}px</p>
  <p style="transform: rotateY(180deg);">{bg}</p>
</div>

<style>
  div {
    display: grid;
    place-content: center;
    border-radius: 1ex;
    transition: 0.5s;
    cursor: pointer;
    transform-style: preserve-3d;
  }
  div.flipped {
    transform: rotateY(180deg);
  }
  div:hover {
    transform: scale(1.03);
  }
  div:hover.flipped {
    transform: rotateY(180deg) scale(1.03);
  }
  div p {
    backface-visibility: hidden;
    grid-area: 1/1;
  }
</style>
