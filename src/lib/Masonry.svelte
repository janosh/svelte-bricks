<script>
  import { gsap } from 'gsap'
  import { data } from '$lib/data/home/06'
  import { getContext } from 'svelte'

  export let key
  export let pct = 0
  export let width = 0 // width of chart

  const { explainer, legend } = getContext('copy')

  const personAspectRatio = 43 / 50

  // gsap
  let tickerEl
  let explainerHeight = 16

  $: grid = { x: width < 640 ? 10 : 24, y: 5 }

  $: margin = {
    top: width > 640 ? explainerHeight : spaceHeight * 1.15,
    right: 0,
    bottom: 0,
    left: 0,
  }
  $: spaceWidth = width / grid.x // width of people
  $: chartHeight = spaceWidth * (1 / personAspectRatio) * grid.y // height of people chart, which is dynamic based on the width of the people
  $: containerHeight = chartHeight + margin.top // height of full container, which includes top margin
  $: spaceHeight = chartHeight / grid.y // height of people

  $: if (tickerEl && key)
    gsap.timeline().counter(
      tickerEl,
      {
        end: pct,
        increment: 1,
        duration: 1,
      },
      0
    )
</script>

<figure class="w-full" bind:clientWidth={width}>
  <figcaption
    class="axis my-4 mb-8 w-full bg-white bg-opacity-50 text-shadow md:my-0 md:absolute md:left-0 md:-top-4 md:max-w-[60%]"
    bind:clientHeight={explainerHeight}
  >
    {@html explainer[key]}
  </figcaption>

  <div class="relative my-4 md:my-12" style:height="{containerHeight}px">
    <div class="absolute inset-0 h-full grid grid-cols-10 md:grid-cols-3">
      {#each ['Denied', 'Approved'] as quadrant, i}
        {@const isApproved = quadrant === 'Approved'}
        {@const border = i === 0 ? '' : 'border-x-[1px]'}
        <div
          class="relative {border} border-secondary-lighter border-opacity-40 p-1 h-full"
          class:approved-bg={isApproved}
        >
          {#if isApproved}
            <p
              class="absolute whitespace-nowrap left-1/2 -top-4 transform -translate-x-1/2 bg-primary-dark bg-opacity-80 text-base md:text-xl callout-sm text-white font-semibold rounded px-3 py-2"
            >
              <span bind:this={tickerEl}>0</span>
              <small>%</small>
              <span class="inline">&nbsp;Approved</span>
            </p>
          {/if}
        </div>
      {/each}
    </div>

    <div class="w-full h-full relative overflow-hidden">
      {#each data[width < 640 ? 'mobile' : 'desktop'] as person (person.id)}
        {@const src = `images/people/${person.color}/Person_${person.person}`}
        {@const x = spaceWidth * (+person.steps[key].x - 1)}
        {@const y = chartHeight - spaceHeight * +person.steps[key].y + margin.top}
        <picture>
          {#each ['avif', 'webp'] as format}
            <source srcset="{src}.{format}" type="image/{format}" />
          {/each}
          <img
            src="{src}.png"
            alt="Silhouette of a person"
            width="20.64"
            height="24"
            loading="lazy"
            decoding="async"
            draggable="false"
            class="absolute person will-change-transform transition-all duration-1000"
            class:opacity-10={person.steps[key].y > grid.y}
            class:opacity-50={person.steps[key].y === grid.y}
            class:opacity-75={person.steps[key].y === grid.y - 1}
            style:width="{spaceWidth}px"
            style:transform="translate({x}px, {y}px)"
            style:transition-delay="{(person.id - 1) * 3}ms"
            data-id={person.id}
            data-x={person.steps[key].x}
            data-y={person.steps[key].y}
          />
        </picture>
      {/each}
    </div>
  </div>

  <div
    class="w-full flex flex-col justify-between items-start mt-4 gap-2 sm:flex-row sm:items-center "
  >
    <p class="axis leading-none text-primary-dark">
      {@html legend.title}
      <i class="fa-light fa-arrow-right ml-1 leading-none align-middle" />
    </p>
    <div class="flex items-center gap-x-6">
      {#each legend.entries as { src, caption }}
        <figure class="flex items-center">
          <picture>
            {#each ['avif', 'webp'] as format}
              <source srcset="{src}.{format}" type="image/{format}" />
            {/each}
            <img
              loading="lazy"
              decoding="async"
              draggable="false"
              width="20.64"
              height="24"
              src="{src}.png"
              alt="Silhouette of a person"
            />
          </picture>

          <figcaption class="axis leading-none">{caption}</figcaption>
        </figure>
      {/each}
    </div>
  </div>
</figure>

<style lang="postcss">
  .approved-bg {
    background: linear-gradient(
      180deg,
      rgba(140, 207, 176, 0.25) 32.68%,
      rgba(140, 207, 176, 0) 100%
    );
    @apply col-start-7 col-span-4 md:col-span-1 md:col-start-3;
  }
  img {
    transition-timing-function: cubic-bezier(0.33, 1, 0.68, 1);
  }
</style>
