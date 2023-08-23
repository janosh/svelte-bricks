import Masonry from '$lib'
import { tick } from 'svelte'
import { beforeEach, describe, expect, test } from 'vitest'

const n_items = 30
const indices = [...Array(n_items).keys()]

beforeEach(() => {
  document.body.innerHTML = ``
})

describe(`Masonry`, () => {
  test.each([[true], [false]])(
    `renders items with animate=%s`,
    async (animate) => {
      new Masonry({
        target: document.body,
        props: { items: indices, animate },
      })

      const items = document.querySelectorAll(`div.masonry > div.col > *`)

      expect(items.length).toBe(n_items)
    },
  )

  test(`attaches class props correctly`, async () => {
    new Masonry({
      target: document.body,
      props: { items: indices, class: `foo`, columnClass: `bar` },
    })

    const items = document.querySelectorAll(
      `div.masonry.foo > div.col.bar > div`,
    )

    expect(items.length).toBe(n_items)
  })

  test(`applies style prop correctly`, async () => {
    const bg_color = `background-color: darkblue;`
    new Masonry({
      target: document.body,
      props: { items: indices, style: bg_color },
    })

    const outer_masonry_div = document.querySelector(`div.masonry`)

    expect(outer_masonry_div?.getAttribute(`style`)).toContain(bg_color)
  })

  test(`sets maxColWidth and gap correctly as style attribute`, async () => {
    const [maxColWidth, gap] = [100, 10]
    new Masonry({
      target: document.body,
      props: { items: indices, maxColWidth, gap },
    })

    await tick()

    const outer_masonry_div = document.querySelector(`div.masonry > div.col`)

    expect(outer_masonry_div?.getAttribute(`style`)).toContain(
      `gap: ${gap}px; max-width: ${maxColWidth}px;`,
    )
  })
})
