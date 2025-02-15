<script lang="ts">
  interface Props {
    index: number
    slide_flip?: boolean
  }
  let { index, slide_flip = false }: Props = $props()
  let flipped = $state(false)
  const height = 100 + 200 * Math.random()

  const random_color = () => Math.random().toString(16).slice(-6)
  function flip(event: MouseEvent | KeyboardEvent) {
    if (event instanceof MouseEvent || [` `, `Enter`].includes(event.key)) {
      flipped = !flipped
    }
  }

  const bg = `linear-gradient(45deg, #${random_color()}, #${random_color()})`
</script>

<div
  style="min-height: {height}px;"
  onclick={flip}
  onkeyup={flip}
  class:flipped
  class:slide-flip={slide_flip}
  role="grid"
  tabindex="0"
>
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
  div.slide-flip {
    transition: 1s;
  }
  div.flipped.slide-flip {
    transform-origin: center right;
    transform: translateX(-100%) rotateY(-180deg);
  }
  div:hover.flipped.slide-flip {
    transform-origin: center right;
    transform: translateX(-100%) rotateY(-180deg) scale(1.03);
  }
</style>
