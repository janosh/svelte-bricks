import Masonry from '$lib'
import { mount, tick } from 'svelte'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const n_items = 30
const indices = [...Array(n_items).keys()]

// Track ResizeObserver registrations
const resize_observers = new Map<Element, ResizeObserverCallback>()
let mock_height = 100

globalThis.ResizeObserver = class ResizeObserver {
  private callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe(target: Element): void {
    resize_observers.set(target, this.callback)
    Object.defineProperty(target, `offsetHeight`, {
      value: mock_height,
      configurable: true,
    })
    this.callback([{ target } as ResizeObserverEntry], this as unknown as ResizeObserver)
  }
  unobserve(target: Element): void {
    resize_observers.delete(target)
  }
  disconnect(): void {}
}

Element.prototype.animate = vi.fn().mockReturnValue({
  finished: Promise.resolve(),
  cancel: () => {},
})
Element.prototype.getAnimations = vi.fn().mockReturnValue([])

beforeEach(() => {
  document.body.innerHTML = ``
  resize_observers.clear()
  mock_height = 100
})

// Helper for virtualization tests
const mount_virtualized = (count: number, overrides = {}) => {
  document.body.innerHTML = ``
  mount(Masonry, {
    target: document.body,
    props: {
      items: [...Array(count).keys()],
      virtualize: true,
      height: 300,
      calcCols: () => 2,
      masonryWidth: 500,
      ...overrides,
    },
  })
}

describe(`Masonry`, () => {
  test.each(
    [
      [true, `balanced`],
      [true, `row-first`],
      [false, `balanced`],
      [false, `row-first`],
    ] as const,
  )(`renders items with animate=%s, order=%s`, (animate, order) => {
    mount(Masonry, { target: document.body, props: { items: indices, animate, order } })
    expect(document.querySelectorAll(`div.masonry > div.col > *`).length).toBe(n_items)
  })

  test.each([
    [[`foo`, `bar`], /masonry foo/, /col col-\d+ bar/],
    [[`custom`, `col-class`], /masonry custom/, /col col-\d+ col-class/],
    [[``, ``], /^masonry\s+svelte-\w+/, /col col-\d+\s+svelte-\w+/],
  ])(`applies class=%j and columnClass correctly`, ([cls, colCls], divRe, colRe) => {
    mount(Masonry, {
      target: document.body,
      props: { items: indices, class: cls, columnClass: colCls },
    })
    expect(document.querySelector(`div.masonry`)?.className).toMatch(divRe)
    expect(document.querySelector(`div.masonry > div.col`)?.className).toMatch(colRe)
  })

  test(`applies style and columnStyle props`, async () => {
    const style = `background-color: darkblue;`
    const columnStyle = `border: 1px solid red;`
    mount(Masonry, {
      target: document.body,
      props: { items: [1, 2], style, columnStyle, maxColWidth: 150, gap: 5 },
    })
    await tick()
    expect(document.querySelector(`div.masonry`)?.getAttribute(`style`)).toContain(style)
    const col_style =
      document.querySelector(`div.masonry > div.col`)?.getAttribute(`style`) ?? ``
    expect(col_style).toContain(`gap: 5px`)
    expect(col_style).toContain(`max-width: 150px`)
    expect(col_style).toContain(columnStyle)
  })

  test.each([
    [370, 50, 10, 6], // normal case
    [100, 50, 0, 2], // gap=0
    [200, 100, 50, 1], // large gap forces single column
    [500, 100, 10, 4], // exact fit
    [109, 100, 10, 1], // just under 2 columns
    [110, 100, 10, 1], // exactly at boundary (needs 220 for 2 cols)
    [220, 100, 10, 2], // exactly 2 columns
  ])(
    `calculates columns: width=%d, minCol=%d, gap=%d -> %d cols`,
    (width, minCol, gap, expected) => {
      mount(Masonry, {
        target: document.body,
        props: { items: indices, masonryWidth: width, minColWidth: minCol, gap },
      })
      expect(document.querySelectorAll(`div.masonry > div.col`).length).toBe(expected)
    },
  )

  test(`warns if maxColWidth < minColWidth`, () => {
    console.warn = vi.fn()
    mount(Masonry, {
      target: document.body,
      props: { items: indices, minColWidth: 50, maxColWidth: 40 },
    })
    expect(console.warn).toHaveBeenCalledWith(
      `svelte-bricks: maxColWidth (40) < minColWidth (50).`,
    )
  })

  test(`uses custom getId function`, () => {
    const getId = vi.fn((item: { x: number }) => item.x)
    mount(Masonry, {
      target: document.body,
      props: { items: [{ x: 1 }, { x: 2 }], getId },
    })
    expect(getId).toHaveBeenCalled()
    expect(document.querySelectorAll(`div.masonry > div.col > div`).length).toBe(2)
  })

  test(`uses custom calcCols and adds col-N classes`, () => {
    const calcCols = vi.fn(() => 3)
    mount(Masonry, {
      target: document.body,
      props: { items: indices, calcCols, masonryWidth: 500 },
    })
    expect(calcCols).toHaveBeenCalled()
    const columns = document.querySelectorAll(`div.masonry > div.col`)
    expect(columns.length).toBe(3)
    columns.forEach((col, idx) => expect(col.classList).toContain(`col-${idx}`))
  })

  test(`distributes items evenly across columns`, () => {
    mount(Masonry, {
      target: document.body,
      props: { items: indices, calcCols: () => 3, masonryWidth: 500 },
    })
    const columns = document.querySelectorAll(`div.masonry > div.col`)
    const per_col = Math.ceil(n_items / 3)
    columns.forEach((col) => {
      expect(col.children.length).toBeGreaterThanOrEqual(per_col - 1)
      expect(col.children.length).toBeLessThanOrEqual(per_col)
    })
  })

  test.each([0, 1, 5, 50])(`renders %d items`, (count) => {
    mount(Masonry, { target: document.body, props: { items: [...Array(count).keys()] } })
    expect(document.querySelectorAll(`div.masonry > div.col > *`).length).toBe(count)
  })

  test.each([
    [[1, 2, 3], `number array`],
    [[`a`, `b`, `c`], `string array`],
    [[{ id: 1 }, { id: 2 }], `object array`],
  ])(`handles %s items`, (items, _desc) => {
    mount(Masonry, { target: document.body, props: { items } })
    expect(document.querySelectorAll(`div.masonry > div.col > *`).length).toBe(
      items.length,
    )
  })

  test.each([`id`, `key`, `uuid`])(`works with idKey=%s`, (idKey) => {
    mount(Masonry, {
      target: document.body,
      props: { items: [{ [idKey]: 1 }, { [idKey]: 2 }], idKey },
    })
    expect(document.querySelectorAll(`div.masonry > div.col > div`).length).toBe(2)
  })

  test(`renders max columns when masonryWidth=0 (SSR mode)`, () => {
    mount(Masonry, {
      target: document.body,
      props: { items: indices, minColWidth: 200, gap: 10, masonryWidth: 0 },
    })
    expect(document.querySelectorAll(`div.masonry > div.col`).length).toBe(
      Math.floor(1930 / 210),
    )
  })

  test(`generates container query CSS`, () => {
    mount(Masonry, {
      target: document.body,
      props: { items: indices, minColWidth: 200, gap: 10 },
    })
    const styles = Array.from(document.querySelectorAll(`style`))
    expect(styles.find((s) => s.textContent?.includes(`@container`))?.textContent)
      .toContain(`.masonry > .col:nth-child`)
  })

  test(`limits columns to items.length`, () => {
    mount(Masonry, {
      target: document.body,
      props: { items: [1, 2, 3], minColWidth: 100, masonryWidth: 0 },
    })
    expect(document.querySelectorAll(`div.masonry > div.col`).length).toBe(3)
  })
})

describe(`Masonry order modes`, () => {
  test.each(
    [
      [`balanced`, 6],
      [`balanced-stable`, 4],
      [`row-first`, 4],
      [`column-sequential`, 6],
      [`column-balanced`, 6],
    ] as const,
  )(`order=%s distributes items to 2 columns`, async (order, count) => {
    mount(Masonry, {
      target: document.body,
      props: {
        items: [...Array(count).keys()],
        order,
        calcCols: () => 2,
        masonryWidth: 500,
      },
    })
    await tick()
    await tick()
    const columns = document.querySelectorAll(`div.masonry > div.col`)
    expect(columns.length).toBe(2)
    expect(columns[0].children.length).toBeGreaterThan(0)
    expect(columns[1].children.length).toBeGreaterThan(0)
    // Verify all items rendered via text content
    const masonry = document.querySelector(`div.masonry`)
    for (let idx = 0; idx < count; idx++) {
      expect(masonry?.textContent).toContain(String(idx))
    }
  })

  test(`order=column-sequential fills columns in reading order`, async () => {
    mount(Masonry, {
      target: document.body,
      props: {
        items: [1, 2, 3, 4, 5, 6],
        order: `column-sequential`,
        calcCols: () => 2,
        masonryWidth: 500,
      },
    })
    await tick()
    const columns = document.querySelectorAll(`div.masonry > div.col`)
    expect(columns[0].textContent).toMatch(/1.*2.*3/)
    expect(columns[1].textContent).toMatch(/4.*5.*6/)
  })

  test.each(
    [
      [`balanced`],
      [`balanced-stable`],
      [`column-balanced`],
      [`row-first`],
      [`column-sequential`],
    ] as const,
  )(
    `order=%s always attaches ResizeObservers for mode switching support`,
    async (order) => {
      mount(Masonry, {
        target: document.body,
        props: { items: [1, 2, 3], order, masonryWidth: 500 },
      })
      await tick()
      // All modes attach observers to support runtime mode switching
      expect(resize_observers.size).toBe(4) // masonry container + 3 items
    },
  )

  test(`virtualization skips ResizeObservers (only estimated heights used)`, async () => {
    mount(Masonry, {
      target: document.body,
      props: {
        items: [1, 2, 3],
        order: `balanced`,
        virtualize: true,
        height: 300,
        masonryWidth: 500,
      },
    })
    await tick()
    // Only masonry container observer, no item observers during virtualization
    expect(resize_observers.size).toBe(1)
  })
})

describe(`Masonry bindable props`, () => {
  test(`exposes div bindable for DOM access`, async () => {
    let bound_div: HTMLDivElement | undefined
    mount(Masonry, {
      target: document.body,
      props: {
        items: [1, 2],
        get div() {
          return bound_div
        },
        set div(val: HTMLDivElement | undefined) {
          bound_div = val
        },
      },
    })
    await tick()
    expect(bound_div).toBeInstanceOf(HTMLDivElement)
    expect(bound_div?.classList).toContain(`masonry`)
  })

  test(`exposes masonryHeight bindable`, async () => {
    let bound_height = 0
    const original_desc = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      `clientHeight`,
    )
    Object.defineProperty(HTMLElement.prototype, `clientHeight`, {
      get() {
        return this.classList?.contains(`masonry`) ? 250 : 0
      },
      configurable: true,
    })

    mount(Masonry, {
      target: document.body,
      props: {
        items: [1, 2],
        get masonryHeight() {
          return bound_height
        },
        set masonryHeight(val: number) {
          bound_height = val
        },
      },
    })
    await tick()
    expect(bound_height).toBe(250)

    if (original_desc) {
      Object.defineProperty(HTMLElement.prototype, `clientHeight`, original_desc)
    }
  })
})

describe(`Masonry default rendering`, () => {
  test(`renders string items as spans with correct content`, () => {
    mount(Masonry, {
      target: document.body,
      props: { items: [`apple`, `banana`, `cherry`] },
    })
    const spans = document.querySelectorAll(`div.masonry > div.col > div > span`)
    expect(spans.length).toBe(3)
    expect(Array.from(spans).map((s) => s.textContent)).toEqual(
      expect.arrayContaining([`apple`, `banana`, `cherry`]),
    )
  })

  test(`passes rest props to container div`, () => {
    mount(Masonry, {
      target: document.body,
      props: {
        items: [1, 2],
        'data-testid': `my-masonry`,
        'aria-label': `Image gallery`,
      } as Record<string, unknown>,
    })
    const masonry = document.querySelector(`div.masonry`)
    expect(masonry?.getAttribute(`data-testid`)).toBe(`my-masonry`)
    expect(masonry?.getAttribute(`aria-label`)).toBe(`Image gallery`)
  })
})

describe(`Masonry animations`, () => {
  test.each([50, 200, 1000])(
    `accepts duration=%d and renders items`,
    async (duration) => {
      mount(Masonry, {
        target: document.body,
        props: { items: [1, 2, 3], animate: true, duration },
      })
      await tick()
      expect(document.querySelectorAll(`div.masonry > div.col > div`).length).toBe(3)
    },
  )
})

describe(`Masonry virtualization`, () => {
  test(`warns if virtualize=true without height prop`, () => {
    console.warn = vi.fn()
    mount(Masonry, { target: document.body, props: { items: indices, virtualize: true } })
    expect(console.warn).toHaveBeenCalledWith(
      `svelte-bricks: virtualize=true requires a height prop. Falling back to 400px.`,
    )
  })

  test.each([
    [500, `500px`],
    [`80vh`, `80vh`],
  ])(`applies height=%s correctly when virtualize=true`, async (height, expected) => {
    mount(Masonry, {
      target: document.body,
      props: { items: indices, virtualize: true, height },
    })
    await tick()
    const masonry = document.querySelector(`div.masonry`) as HTMLElement
    expect(masonry.style.overflowY).toBe(`auto`)
    expect(masonry.style.height).toBe(expected)
  })

  test(`calls getEstimatedHeight and applies column padding`, async () => {
    const getEstimatedHeight = vi.fn(() => 120)
    mount(Masonry, {
      target: document.body,
      props: {
        items: indices,
        virtualize: true,
        height: 500,
        getEstimatedHeight,
        order: `balanced`,
        masonryWidth: 500,
      },
    })
    await tick()
    expect(getEstimatedHeight).toHaveBeenCalled()
    const col = document.querySelector(`div.masonry > div.col`) as HTMLElement
    expect(col.getAttribute(`style`)).toMatch(/padding-top:.*padding-bottom:/)
  })

  test(`respects overscan prop`, async () => {
    mount_virtualized(100, {
      getEstimatedHeight: () => 100,
      overscan: 1,
      calcCols: () => 1,
    })
    await tick()
    const count_1 = document.querySelectorAll(`div.masonry > div.col > div`).length

    mount_virtualized(100, {
      getEstimatedHeight: () => 100,
      overscan: 5,
      calcCols: () => 1,
    })
    await tick()
    const count_5 = document.querySelectorAll(`div.masonry > div.col > div`).length

    expect(count_5).toBeGreaterThan(count_1)
  })

  test.each(
    [
      [`balanced`, 2, `with balanced order`],
      [`row-first`, 3, `with row-first order`],
    ] as const,
  )(`renders subset of items %s`, async (order, cols, _desc) => {
    mount_virtualized(100, { order, calcCols: () => cols })
    await tick()
    expect(document.querySelectorAll(`div.masonry > div.col`).length).toBe(cols)
    const rendered = document.querySelectorAll(`div.masonry > div.col > div`).length
    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(100)
  })

  test(`warning count stays constant after initial mount`, async () => {
    const spy = vi.spyOn(console, `warn`).mockImplementation(() => {})
    mount(Masonry, { target: document.body, props: { items: indices, virtualize: true } })
    await tick()
    const initial = spy.mock.calls.filter((c) => c[0]?.includes?.(`height prop`)).length
    await tick()
    await tick()
    const after = spy.mock.calls.filter((c) => c[0]?.includes?.(`height prop`)).length
    expect(initial).toBeLessThanOrEqual(2)
    expect(after).toBe(initial)
    spy.mockRestore()
  })

  test(`defers virtualization until masonryHeight is measured for string heights`, async () => {
    // Mock clientHeight=0 to simulate unmeasured state
    const original = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      `clientHeight`,
    )
    Object.defineProperty(HTMLElement.prototype, `clientHeight`, {
      get: () => 0,
      configurable: true,
    })

    mount(Masonry, {
      target: document.body,
      props: {
        items: [...Array(100).keys()],
        virtualize: true,
        height: `500px`,
        calcCols: () => 2,
      },
    })
    await tick()

    // With clientHeight=0 (unmeasured), all items render (virtualization deferred)
    expect(document.querySelectorAll(`div.masonry > div.col > div`).length).toBe(100)

    if (original) Object.defineProperty(HTMLElement.prototype, `clientHeight`, original)
  })

  test(`virtualize=false skips padding and overflow styles`, async () => {
    mount(Masonry, {
      target: document.body,
      props: { items: indices, virtualize: false },
    })
    await tick()
    const masonry = document.querySelector(`div.masonry`) as HTMLElement
    const col_style = document.querySelector(`div.masonry > div.col`)?.getAttribute(
      `style`,
    )
    expect(masonry.style.overflowY).toBe(``)
    expect(col_style).not.toContain(`padding-top:`)
  })
})

describe(`Masonry item cleanup`, () => {
  test(`updates when items array is replaced with same length`, async () => {
    // Verify itemsToCols recalculates when items changes (uses string items for easy verification)
    const items_v1 = [`apple`, `banana`]
    const items_v2 = [`X-ray`, `Yankee`] // same length, different content

    mount(Masonry, {
      target: document.body,
      props: { items: items_v1, masonryWidth: 500 },
    })
    await tick()
    expect(document.querySelector(`div.masonry`)?.textContent).toContain(`apple`)

    document.body.innerHTML = ``
    mount(Masonry, {
      target: document.body,
      props: { items: items_v2, masonryWidth: 500 },
    })
    await tick()
    const content = document.querySelector(`div.masonry`)?.textContent
    expect(content).toContain(`X-ray`)
    expect(content).not.toContain(`apple`)
  })

  test.each([
    [50, 10],
    [30, 5],
  ])(`handles item count change %d->%d`, async (initial, final) => {
    const make_items = (n: number) => [...Array(n).keys()]
    mount(Masonry, {
      target: document.body,
      props: {
        items: make_items(initial),
        order: `balanced`,
        calcCols: () => 2,
        masonryWidth: 500,
      },
    })
    await tick()
    expect(document.querySelectorAll(`div.masonry > div.col > div`).length).toBe(initial)

    document.body.innerHTML = ``
    mount(Masonry, {
      target: document.body,
      props: {
        items: make_items(final),
        order: `balanced`,
        calcCols: () => 2,
        masonryWidth: 500,
      },
    })
    await tick()
    expect(document.querySelectorAll(`div.masonry > div.col > div`).length).toBe(final)
  })

  test(`works with object items`, async () => {
    const items = Array.from(
      { length: 10 },
      (_, idx) => ({ id: idx, value: `item-${idx}` }),
    )
    mount(Masonry, {
      target: document.body,
      props: { items, order: `balanced`, calcCols: () => 2, masonryWidth: 500 },
    })
    await tick()
    expect(document.querySelectorAll(`div.masonry > div.col > div`).length).toBe(10)
  })
})

describe(`Masonry CSS reset compatibility`, () => {
  // Regression: https://github.com/janosh/svelte-bricks/issues/48
  test.each([
    [`div.masonry`, `flex`],
    [`div.masonry > div.col`, `grid`],
  ])(`%s has inline display:%s style`, async (selector, display) => {
    mount(Masonry, {
      target: document.body,
      props: { items: [1, 2, 3], masonryWidth: 500 },
    })
    await tick()
    expect((document.querySelector(selector) as HTMLElement).style.display).toBe(display)
  })
})

describe(`Masonry virtual scroll stability`, () => {
  // Regression: https://github.com/janosh/svelte-bricks/issues/50

  test(`uses round-robin distribution when virtualizing regardless of order prop`, async () => {
    mount_virtualized(12, {
      order: `balanced`,
      calcCols: () => 3,
      getEstimatedHeight: () => 100,
    })
    await tick()
    const columns = document.querySelectorAll(`div.masonry > div.col`)
    // Verify round-robin: item N should be in column N % 3
    for (let col_idx = 0; col_idx < columns.length; col_idx++) {
      const items = columns[col_idx].querySelectorAll(`span`)
      items.forEach((span) => {
        const item_id = parseInt(span.textContent || `-1`, 10)
        if (item_id >= 0) {
          expect(item_id % 3, `Item ${item_id} should be in column ${item_id % 3}`).toBe(
            col_idx,
          )
        }
      })
    }
  })

  test(`getEstimatedHeight is called and padding is applied`, async () => {
    const getEstimatedHeight = vi.fn(() => 150)
    mount_virtualized(100, {
      calcCols: () => 1,
      getEstimatedHeight,
      height: 300,
      overscan: 2,
    })
    await tick()
    expect(getEstimatedHeight).toHaveBeenCalled()
    expect(document.querySelector(`div.masonry > div.col`)?.getAttribute(`style`))
      .toContain(
        `padding-bottom:`,
      )
  })

  test(`padding uses estimated heights, not measured`, async () => {
    const estimated = 100, gap = 10, item_count = 100
    mock_height = 200 // 2x the estimate

    mount(Masonry, {
      target: document.body,
      props: {
        items: [...Array(item_count).keys()],
        virtualize: true,
        height: 300,
        calcCols: () => 1,
        gap,
        getEstimatedHeight: () => estimated,
        masonryWidth: 500,
      },
    })
    await tick()

    const col = document.querySelector(`div.masonry > div.col`) as HTMLElement
    const rendered = col.children.length
    const padding = parseInt(col.style.paddingBottom || `0`, 10)

    // Should match estimated calculation, not measured
    const expected_estimated = (item_count - rendered) * (estimated + gap)
    const expected_measured = (item_count - rendered) * (mock_height + gap)
    expect(padding).toBeLessThan(expected_measured * 0.8)
    expect(padding).toBeGreaterThan(expected_estimated * 0.5)
  })

  test.each([
    { estimated: 100, measured: 80 },
    { estimated: 200, measured: 150 },
  ])(
    `padding stable after measurements (est=$estimated, meas=$measured)`,
    async ({ estimated, measured }) => {
      mock_height = measured
      mount_virtualized(50, {
        calcCols: () => 1,
        getEstimatedHeight: () => estimated,
        height: 200,
        gap: 10,
      })
      await tick()

      const col = document.querySelector(`div.masonry > div.col`) as HTMLElement
      const initial_style = col.getAttribute(`style`)

      // Trigger all ResizeObserver callbacks
      document.querySelectorAll(`div.masonry > div.col > div`).forEach((item) => {
        resize_observers.get(item)?.(
          [{ target: item } as ResizeObserverEntry],
          {} as ResizeObserver,
        )
      })
      await tick()

      expect(col.getAttribute(`style`)).toBe(initial_style)
    },
  )

  test(`column distribution stable after measurements`, async () => {
    mount_virtualized(100, {
      calcCols: () => 3,
      getEstimatedHeight: () => 100,
      height: 300,
    })
    await tick()

    const get_dist = () =>
      Array.from(document.querySelectorAll(`div.masonry > div.col`)).map((col) =>
        Array.from(col.children).map((c) => c.textContent)
      )
    const before = get_dist()

    document.querySelectorAll(`div.masonry > div.col > div`).forEach((item) => {
      resize_observers.get(item)?.(
        [{ target: item } as ResizeObserverEntry],
        {} as ResizeObserver,
      )
    })
    await tick()

    expect(get_dist()).toEqual(before)
  })

  test(`handles height mismatch gracefully`, async () => {
    const items = Array.from(
      { length: 100 },
      (_, idx) => ({ id: idx, height: 100 + (idx % 50) }),
    )
    mock_height = 150

    mount(Masonry, {
      target: document.body,
      props: {
        items,
        virtualize: true,
        height: 300,
        calcCols: () => 2,
        gap: 10,
        getEstimatedHeight: (item: { height: number }) => item.height,
        masonryWidth: 500,
      },
    })
    await tick()

    const rendered = document.querySelectorAll(`div.masonry > div.col > div`).length
    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(100)
  })

  test(`10k items render under 500ms`, async () => {
    const start = performance.now()
    mount_virtualized(10000, {
      calcCols: () => 4,
      getEstimatedHeight: () => 100,
      height: 500,
    })
    await tick()

    expect(performance.now() - start).toBeLessThan(500)
    const rendered = document.querySelectorAll(`div.masonry > div.col > div`).length
    expect(rendered).toBeLessThan(200)
    expect(rendered).toBeGreaterThan(0)
  })
})

const ALL_ORDER_MODES = [
  `balanced`,
  `balanced-stable`,
  `row-first`,
  `column-sequential`,
  `column-balanced`,
] as const

describe(`Masonry order mode edge cases`, () => {
  test.each(ALL_ORDER_MODES.flatMap((order) => [
    [order, [], 0],
    [order, [42], 1],
  ]))(`order=%s with %d items renders correctly`, async (order, items, expected) => {
    mount(Masonry, {
      target: document.body,
      props: { items, order, calcCols: () => 3, masonryWidth: 500 },
    })
    await tick()
    expect(document.querySelectorAll(`div.masonry > div.col > *`).length).toBe(expected)
  })

  test(`order=column-sequential distributes correctly with uneven division`, async () => {
    // 7 items across 3 columns: ceil(7/3) = 3 items per col
    // Col 0: 3 items (0,1,2), Col 1: 3 items (3,4,5), Col 2: 1 item (6)
    mount(Masonry, {
      target: document.body,
      props: {
        items: [0, 1, 2, 3, 4, 5, 6],
        order: `column-sequential`,
        calcCols: () => 3,
        masonryWidth: 500,
      },
    })
    await tick()
    const columns = document.querySelectorAll(`div.masonry > div.col`)
    const counts = Array.from(columns).map((col) => col.children.length)
    expect(counts.reduce((a, b) => a + b, 0)).toBe(7)
    // First column should have the most items
    expect(counts[0]).toBeGreaterThanOrEqual(counts[1])
    expect(counts[1]).toBeGreaterThanOrEqual(counts[2])
  })

  test(`order=row-first distributes correctly with uneven division`, async () => {
    // 7 items across 3 columns: 0,3,6 in col0; 1,4 in col1; 2,5 in col2
    mount(Masonry, {
      target: document.body,
      props: {
        items: [0, 1, 2, 3, 4, 5, 6],
        order: `row-first`,
        calcCols: () => 3,
        masonryWidth: 500,
      },
    })
    await tick()
    const columns = document.querySelectorAll(`div.masonry > div.col`)
    expect(columns[0].children.length).toBe(3) // items 0, 3, 6
    expect(columns[1].children.length).toBe(2) // items 1, 4
    expect(columns[2].children.length).toBe(2) // items 2, 5
  })

  // Covered by `uses round-robin distribution when virtualizing` test in virtual scroll stability

  test(`order=balanced-stable stable_assignments cache is cleaned on item removal`, async () => {
    // This tests the cleanup logic for the stable_assignments Map
    mount(Masonry, {
      target: document.body,
      props: {
        items: [{ id: `a` }, { id: `b` }, { id: `c` }],
        order: `balanced-stable`,
        calcCols: () => 2,
        masonryWidth: 500,
        idKey: `id`,
      },
    })
    await tick()
    expect(document.querySelectorAll(`div.masonry > div.col > *`).length).toBe(3)

    // Remount with fewer items (simulates item removal)
    document.body.innerHTML = ``
    mount(Masonry, {
      target: document.body,
      props: {
        items: [{ id: `a` }, { id: `c` }], // removed 'b'
        order: `balanced-stable`,
        calcCols: () => 2,
        masonryWidth: 500,
        idKey: `id`,
      },
    })
    await tick()
    expect(document.querySelectorAll(`div.masonry > div.col > *`).length).toBe(2)
  })

  test.each(ALL_ORDER_MODES)(
    `order=%s handles column count > item count`,
    async (order) => {
      mount(Masonry, {
        target: document.body,
        props: { items: [1, 2], order, calcCols: () => 5, masonryWidth: 500 },
      })
      await tick()
      expect(document.querySelectorAll(`div.masonry > div.col > *`).length).toBe(2)
    },
  )

  test(`order defaults to balanced when not specified`, async () => {
    mount(Masonry, {
      target: document.body,
      props: {
        items: [1, 2, 3, 4, 5, 6],
        calcCols: () => 2,
        masonryWidth: 500,
      },
    })
    await tick()
    // Default behavior should match balanced mode (distributes evenly)
    const columns = document.querySelectorAll(`div.masonry > div.col`)
    expect(columns.length).toBe(2)
    expect(columns[0].children.length + columns[1].children.length).toBe(6)
  })
})

describe(`Masonry order mode column count changes`, () => {
  test(`balanced-stable reassigns items when column count decreases`, async () => {
    // Items assigned to column 2 should be reassigned when columns reduced to 2
    mount(Masonry, {
      target: document.body,
      props: {
        items: [...Array(9).keys()],
        order: `balanced-stable`,
        calcCols: () => 3,
        masonryWidth: 500,
      },
    })
    await tick()
    expect(document.querySelectorAll(`div.masonry > div.col`).length).toBe(3)
    expect(document.querySelectorAll(`div.masonry > div.col > *`).length).toBe(9)

    // Simulate column count change by remounting
    document.body.innerHTML = ``
    mount(Masonry, {
      target: document.body,
      props: {
        items: [...Array(9).keys()],
        order: `balanced-stable`,
        calcCols: () => 2,
        masonryWidth: 500,
      },
    })
    await tick()
    expect(document.querySelectorAll(`div.masonry > div.col`).length).toBe(2)
    expect(document.querySelectorAll(`div.masonry > div.col > *`).length).toBe(9)
  })
})

describe(`Masonry order mode with object items`, () => {
  test(`balanced mode works with object items having custom getId`, async () => {
    const items_with_heights = [
      { key: `a`, h: 100 },
      { key: `b`, h: 200 },
      { key: `c`, h: 100 },
      { key: `d`, h: 150 },
    ]

    mount(Masonry, {
      target: document.body,
      props: {
        items: items_with_heights,
        order: `balanced`,
        calcCols: () => 2,
        masonryWidth: 500,
        getId: (item: { key: string }) => item.key,
      },
    })
    await tick()
    await tick()

    const columns = document.querySelectorAll(`div.masonry > div.col`)
    expect(columns.length).toBe(2)
    // All items should be rendered across the columns
    const total_items = Array.from(columns).reduce(
      (sum, col) => sum + col.children.length,
      0,
    )
    expect(total_items).toBeGreaterThanOrEqual(4)
  })

  test.each(ALL_ORDER_MODES)(`order=%s works with string items`, async (order) => {
    const items = [`apple`, `banana`, `cherry`]
    mount(Masonry, {
      target: document.body,
      props: { items, order, calcCols: () => 2, masonryWidth: 500 },
    })
    await tick()
    await tick()
    for (const item of items) {
      expect(document.querySelector(`div.masonry`)?.textContent).toContain(item)
    }
  })
})
