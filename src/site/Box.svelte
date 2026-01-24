<script lang="ts">
  let { index, slide_flip = false }: { index: number; slide_flip?: boolean } =
    $props()
  let flipped = $state(false)
  const height = 100 + 200 * Math.random()

  const random_color = () => Math.random().toString(16).slice(-6)
  function flip(event: MouseEvent | KeyboardEvent) {
    if (event instanceof MouseEvent) {
      flipped = !flipped
      return
    }
    if (event.key === ` `) event.preventDefault() // prevent page scroll (even on repeat)
    if (event.repeat) return // ignore key repeat to prevent rapid toggling
    if (event.key === ` ` || event.key === `Enter`) flipped = !flipped
  }

  const bg = `linear-gradient(45deg, #${random_color()}, #${random_color()})`
</script>

<!-- deno-fmt-ignore -->
<div
  style="min-height: {height}px;"
  onclick={flip}
  onkeydown={flip}
  class:flipped
  class:slide-flip={slide_flip}
  role="button"
  aria-pressed={flipped}
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
    padding-inline: 1em;
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
