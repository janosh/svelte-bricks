import Masonry from '$lib'
import { mount, tick } from 'svelte'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const n_items = 30
const indices = [...Array(n_items).keys()]

// Mock required browser APIs
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock Web Animations API
Element.prototype.animate = vi.fn().mockReturnValue({
  finished: Promise.resolve(),
  cancel: () => {},
})

beforeEach(() => {
  document.body.innerHTML = ``
})

describe(`Masonry`, () => {
  test.each([[true], [false]])(
    `renders items with animate=%s`,
    async (animate) => {
      mount(Masonry, {
        target: document.body,
        props: { items: indices, animate },
      })

      const items = document.querySelectorAll(`div.masonry > div.col > *`)

      expect(items.length).toBe(n_items)
    },
  )

  test(`attaches class props correctly`, async () => {
    mount(Masonry, {
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
    mount(Masonry, {
      target: document.body,
      props: { items: indices, style: bg_color },
    })

    const outer_masonry_div = document.querySelector(`div.masonry`)

    expect(outer_masonry_div?.getAttribute(`style`)).toContain(bg_color)
  })

  test(`sets maxColWidth and gap correctly as style attribute`, async () => {
    const [maxColWidth, gap] = [100, 10]
    mount(Masonry, {
      target: document.body,
      props: { items: indices, maxColWidth, gap },
    })

    await tick()

    const outer_masonry_div = document.querySelector(`div.masonry > div.col`)

    expect(outer_masonry_div?.getAttribute(`style`)).toContain(
      `gap: ${gap}px; max-width: ${maxColWidth}px;`,
    )
  })

  test(`calculates correct number of columns based masonryWidth, minColWidth, gap`, () => {
    const [masonryWidth, minColWidth, gap] = [370, 50, 10]
    // floor((370 + 10) / (50 + 10)) = 6 columns
    const expected_cols = Math.floor((masonryWidth + gap) / (minColWidth + gap))

    mount(Masonry, {
      target: document.body,
      props: { items: indices, masonryWidth, minColWidth, gap },
    })

    const columns = document.querySelectorAll(`div.masonry > div.col`)
    expect(columns.length).toBe(expected_cols)
  })

  test(`warns if maxColWidth is less than minColWidth`, () => {
    const minColWidth = 50
    const maxColWidth = 40
    console.warn = vi.fn()

    mount(Masonry, {
      target: document.body,
      props: { items: indices, minColWidth, maxColWidth },
    })

    expect(console.warn).toHaveBeenCalledWith(
      `svelte-bricks: maxColWidth (${maxColWidth}) < minColWidth (${minColWidth}).`,
    )
    expect(console.warn).toHaveBeenCalledTimes(1)
  })
})
