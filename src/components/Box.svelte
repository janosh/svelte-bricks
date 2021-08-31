<script lang="ts">
  export let index: number
  export let slideFlip = false

  let flipped = false

  const height = 100 + 200 * Math.random()

  const randColor = () => Math.random().toString(16).substr(-6)

  const bg = `linear-gradient(45deg, #${randColor()}, #${randColor()})`
</script>

<div
  style="min-height: {height}px;"
  on:click={() => (flipped = !flipped)}
  class:flipped
  class:slideFlip>
  <!-- background: {bg} must be applied to the p tags, not the div as backface-visibility: hidden would hide text on backface -->
  <p style="background: {bg};">
    <span>h<sub>{index}</sub> = {Math.floor(height)}px</span>
  </p>
  <p style="transform: rotateY(-180deg); background: {bg};">
    <span>{bg}</span>
  </p>
</div>

<style>
  div {
    display: grid;
    transition: 0.5s;
    cursor: pointer;
    transform-style: preserve-3d;
  }
  div p {
    display: grid;
    place-items: center;
    backface-visibility: hidden;
    grid-area: 1/1;
    border-radius: 1ex;
    margin: 0;
  }
  div:hover {
    transform: scale(1.03);
  }
  div.flipped {
    transform: rotateY(-180deg);
  }
  div:hover.flipped {
    transform: rotateY(-180deg) scale(1.03);
  }
  div.slideFlip {
    transition: 1s;
  }
  div.flipped.slideFlip {
    transform-origin: center right;
    transform: translateX(-100%) rotateY(-180deg);
  }
  div:hover.flipped.slideFlip {
    transform-origin: center right;
    transform: translateX(-100%) rotateY(-180deg) scale(1.03);
  }
</style>
