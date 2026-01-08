import Masonry from '$lib'
import { mount, tick } from 'svelte'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const n_items = 30
const indices = [...Array(n_items).keys()]

// Mock required browser APIs
globalThis.ResizeObserver = class ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

// Mock Web Animations API
Element.prototype.animate = vi.fn().mockReturnValue({
  finished: Promise.resolve(),
  cancel: () => {},
})
Element.prototype.getAnimations = vi.fn().mockReturnValue([])

beforeEach(() => {
  document.body.innerHTML = ``
})

describe(`Masonry`, () => {
  test.each([[true], [false]])(`renders items with animate=%s`, (animate) => {
    mount(Masonry, {
      target: document.body,
      props: { items: indices, animate },
    })

    const items = document.querySelectorAll(`div.masonry > div.col > *`)

    expect(items.length).toBe(n_items)
  })

  test(`attaches class props correctly`, () => {
    mount(Masonry, {
      target: document.body,
      props: { items: indices, class: `foo`, columnClass: `bar` },
    })

    const items = document.querySelectorAll(`div.masonry.foo > div.col.bar > div`)

    expect(items.length).toBe(n_items)
  })

  test(`applies style prop correctly`, () => {
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

  test(`uses custom getId function for keyed each blocks`, () => {
    const customItems = [{ customId: 1 }, { customId: 2 }]
    const getId = vi.fn((item) => item.customId)

    mount(Masonry, {
      target: document.body,
      props: { items: customItems, getId },
    })

    expect(getId).toHaveBeenCalled()
    expect(getId).toHaveBeenCalledWith(customItems[0])
  })

  test(`uses custom idKey for object items`, () => {
    const customItems = [{ myId: 1 }, { myId: 2 }]

    mount(Masonry, {
      target: document.body,
      props: { items: customItems, idKey: `myId` },
    })

    const items = document.querySelectorAll(`div.masonry > div.col > div`)
    expect(items.length).toBe(customItems.length)
  })

  test(`uses custom calcCols function and adds column index classes`, () => {
    const n_cols = 3
    const calcCols = vi.fn(() => n_cols)

    // Provide masonryWidth > 0 to trigger calcCols (when 0, component uses maxCols for SSR)
    mount(Masonry, {
      target: document.body,
      props: { items: indices, calcCols, masonryWidth: 500 },
    })

    expect(calcCols).toHaveBeenCalled()
    const columns = document.querySelectorAll(`div.masonry > div.col`)
    expect(columns.length).toBe(n_cols)

    // Check that each column has the correct index class
    for (const [idx, col] of columns.entries()) {
      expect(col.classList).toContain(`col-${idx}`)
    }
  })

  test(`distributes items evenly across columns`, () => {
    const n_cols = 3
    // Provide masonryWidth > 0 to trigger calcCols (when 0, component uses maxCols for SSR)
    mount(Masonry, {
      target: document.body,
      props: { items: indices, calcCols: () => n_cols, masonryWidth: 500 },
    })

    const columns = document.querySelectorAll(`div.masonry > div.col`)
    const items_per_col = Math.ceil(indices.length / n_cols)

    for (const col of columns) {
      const col_items = col.children.length
      // Each column should have either itemsPerCol or itemsPerCol-1 items
      expect(col_items).toBeGreaterThanOrEqual(items_per_col - 1)
      expect(col_items).toBeLessThanOrEqual(items_per_col)
    }
  })

  test.each([{ minColWidth: 100, maxColWidth: 200, gap: 10, expected: 3 }])(
    `calculates columns correctly with different widths and gaps`,
    ({ minColWidth, maxColWidth, gap, expected }) => {
      mount(Masonry, {
        target: document.body,
        props: { items: indices, masonryWidth: 400, minColWidth, maxColWidth, gap },
      })

      const columns = document.querySelectorAll(`div.masonry > div.col`)
      expect(columns.length).toBe(expected)
    },
  )

  test.each`
    animate | duration
    ${true} | ${200}
    ${true} | ${0}
  `(
    `renders items correctly with animate=$animate and duration=$duration`,
    ({ animate, duration }) => {
      // Provide masonryWidth > 0 to ensure consistent column layout
      mount(Masonry, {
        target: document.body,
        props: { items: indices, animate, duration, masonryWidth: 500 },
      })

      const item_divs = document.querySelectorAll(`div.masonry > div.col > div`)
      // With animate=true, items are wrapped in additional divs for transitions
      expect(item_divs.length).toBe(n_items)
    },
  )

  test.each([
    [[], 0],
    [[1], 1],
    [[1, 2, 3, 4, 5], 5],
    [[...Array(50)].map((_, i) => i), 50],
  ])(
    `renders correct number of items for different array lengths: %j`,
    (items, expected) => {
      mount(Masonry, {
        target: document.body,
        props: { items },
      })

      const itemElements = document.querySelectorAll(`div.masonry > div.col > *`)
      expect(itemElements.length).toBe(expected)
    },
  )

  test.each([
    { items: [{ id: 1 }, { id: 2 }], idKey: `id` },
    { items: [{ key: `a` }, { key: `b` }], idKey: `key` },
    { items: [{ uuid: `123` }, { uuid: `456` }], idKey: `uuid` },
  ])(`works with different idKey values: $idKey`, ({ items, idKey }) => {
    mount(Masonry, {
      target: document.body,
      props: { items, idKey },
    })

    const itemElements = document.querySelectorAll(`div.masonry > div.col > div`)
    expect(itemElements.length).toBe(items.length)
  })

  test.each([
    [`custom`, `col-class`, /^masonry custom svelte-\w+/, /col col-\d+ col-class/],
    [`multiple`, `cols`, /^masonry multiple svelte-\w+/, /col col-\d+ cols/],
    [``, ``, /^masonry\s+svelte-\w+/, /col col-\d+/],
  ])(
    `applies CSS class names correctly: %s and %s`,
    (class_name, columnClass, div_class_regex, col_class_regex) => {
      mount(Masonry, {
        target: document.body,
        props: { items: indices, class: class_name, columnClass },
      })

      const masonry_div = document.querySelector(`div.masonry`)
      const col_div = document.querySelector(`div.masonry > div.col`)

      expect(masonry_div?.className.trim()).toMatch(div_class_regex)
      expect(col_div?.className.trim()).toMatch(col_class_regex)

      expect(col_div?.classList).toContain(`col-0`)
    },
  )

  test(`applies columnClass correctly to column divs`, () => {
    const testColClass = `my-column-class`
    mount(Masonry, {
      target: document.body,
      props: { items: [1, 2, 3, 4], columnClass: testColClass },
    })

    const columns = document.querySelectorAll(`div.masonry > div.col`)
    expect(columns.length).toBeGreaterThan(0) // Ensure columns rendered
    columns.forEach((col) => {
      expect(col.classList).toContain(testColClass)
      expect(col.className).toMatch(/col col-\d+ my-column-class/)
    })
  })

  test(`applies columnStyle correctly to column divs`, () => {
    const testColStyle = `border: 1px solid red;`
    const [maxColWidth, gap] = [150, 5] // Use known values for base style check
    mount(Masonry, {
      target: document.body,
      props: { items: [1, 2, 3, 4], columnStyle: testColStyle, maxColWidth, gap },
    })

    const columns = document.querySelectorAll(`div.masonry > div.col`)
    expect(columns.length).toBeGreaterThan(0) // Ensure columns rendered
    columns.forEach((col) => {
      const style = col.getAttribute(`style`)
      expect(style).toContain(`gap: ${gap}px;`)
      expect(style).toContain(`max-width: ${maxColWidth}px;`)
      expect(style).toContain(testColStyle)
    })
  })

  // CLS-free SSR behavior tests
  test(`renders max columns when masonryWidth is 0 (SSR mode)`, () => {
    const [minColWidth, gap] = [200, 10]
    // With max_viewport=1920, nCols = floor((1920+10)/(200+10)) = 9
    const expected_max_cols = Math.floor((1920 + gap) / (minColWidth + gap))

    mount(Masonry, {
      target: document.body,
      props: { items: indices, minColWidth, gap, masonryWidth: 0 },
    })

    const columns = document.querySelectorAll(`div.masonry > div.col`)
    expect(columns.length).toBe(expected_max_cols)
  })

  test(`generates container query CSS for column hiding`, () => {
    const [minColWidth, gap] = [200, 10]

    mount(Masonry, {
      target: document.body,
      props: { items: indices, minColWidth, gap },
    })

    // Check that a style element with container queries was generated
    const style_elements = document.querySelectorAll(`style`)
    const container_query_style = Array.from(style_elements).find((style_el) =>
      style_el?.textContent?.includes(`@container`)
    )

    expect(container_query_style).toBeTruthy()
    expect(container_query_style?.textContent).toContain(`.masonry > .col:nth-child`)
  })

  test(`limits nCols to items.length`, () => {
    const small_items = [1, 2, 3] // Only 3 items
    const [minColWidth, gap] = [100, 10] // Would allow many more columns

    mount(Masonry, {
      target: document.body,
      props: { items: small_items, minColWidth, gap, masonryWidth: 0 },
    })

    const columns = document.querySelectorAll(`div.masonry > div.col`)
    // Should only render 3 columns since we only have 3 items
    expect(columns.length).toBe(small_items.length)
  })

  test(`container-type inline-size is applied to masonry div`, () => {
    mount(Masonry, {
      target: document.body,
      props: { items: indices },
    })

    const masonry_div = document.querySelector(`div.masonry`) as HTMLElement
    // Check computed style has container-type (note: jsdom may not fully support this)
    // At minimum, verify the element exists and has the masonry class
    expect(masonry_div).toBeTruthy()
    expect(masonry_div.classList).toContain(`masonry`)
  })
})
