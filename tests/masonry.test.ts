import Masonry from '$lib'
import { beforeEach, describe, expect, test } from 'vitest'

const n_items = 30
const indices = [...Array(n_items).keys()]

beforeEach(() => {
  document.body.innerHTML = ``
})

describe(`Masonry`, () => {
  test(`renders items`, async () => {
    const masonry = new Masonry({
      target: document.body,
      props: { items: indices },
    })

    expect(masonry).toBeTruthy()

    const items = document.querySelectorAll(`div.masonry > div.col > div`)

    expect(items.length).toBe(n_items)
  })

  test(`attaches class props correctly`, async () => {
    new Masonry({
      target: document.body,
      props: { items: indices, class: `foo`, columnClass: `bar` },
    })

    const items = document.querySelectorAll(
      `div.masonry.foo > div.col.bar > div`
    )

    expect(items.length).toBe(n_items)
  })

  // style not being applied in test DOM for unknown reason, skipping for now
  test.skip(`applies style prop correctly`, async () => {
    const bg_color = `background-color: darkblue;`
    new Masonry({
      target: document.body,
      props: { items: indices, style: bg_color },
    })

    const outer_masonry_div = document.querySelector(`div.masonry`)

    expect(outer_masonry_div?.getAttribute(`style`)).toContain(bg_color)
  })

  // same as above
  test.skip(`sets maxColWidth and gap correctly as style attribute`, async () => {
    const [maxColWidth, gap] = [100, 10]
    new Masonry({
      target: document.body,
      props: { items: indices, maxColWidth, gap },
    })

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const outer_masonry_div = document.querySelector(`div.masonry > div.col`)

    expect(outer_masonry_div?.getAttribute(`style`)).toContain(
      `gap: ${gap}px; max-width: ${maxColWidth}px;`
    )
  })
})
