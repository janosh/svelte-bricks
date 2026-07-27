import Masonry from '$lib'
import { mount, tick } from 'svelte'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import MasonryAppendHarness from './fixtures/MasonryAppendHarness.svelte'

const n_items = 30
const make_items = (count: number) => Array.from({ length: count }, (_, idx) => idx)
const indices = make_items(n_items)
const get_col_dist = () =>
  Array.from(document.querySelectorAll(`div.masonry > div.col`)).map((col) =>
    Array.from(col.children).map((child) => child.textContent),
  )
// Rendered layout as a readable string, e.g. `0,3,6 | 1,4 | 2,5` for 3 columns
const as_columns = () =>
  get_col_dist()
    .map((col) => col.join(`,`))
    .join(` | `)
const ALL_ORDER_MODES = [
  `balanced`,
  `balanced-stable`,
  `row-first`,
  `column-sequential`,
  `column-balanced`,
] as const

// Track ResizeObserver registrations
const resize_observers = new Map<Element, ResizeObserverCallback>()
// number for a uniform height, or a function to give each item its own measured height
let mock_height: number | ((el: Element) => number) = 100
const measured_height = (el: Element): number =>
  typeof mock_height === `number` ? mock_height : mock_height(el)

const mock_resize_entry = (target: Element): ResizeObserverEntry => ({
  target,
  contentRect: new DOMRect(0, 0, 0, 0),
  borderBoxSize: [],
  contentBoxSize: [],
  devicePixelContentBoxSize: [],
})

const mock_observer: ResizeObserver = {
  observe: () => {},
  unobserve: () => {},
  disconnect: () => {},
}

globalThis.ResizeObserver = class ResizeObserver implements ResizeObserver {
  private readonly callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe(target: Element): void {
    resize_observers.set(target, this.callback)
    Object.defineProperty(target, `offsetHeight`, {
      value: measured_height(target),
      configurable: true,
    })
    this.callback([mock_resize_entry(target)], this)
  }
  unobserve(target: Element): void {
    resize_observers.delete(target)
  }
  disconnect(): void {}
}

function create_mock_animation(): Animation {
  const mock_animation = { cancel: () => {}, finished: Promise.resolve() }
  // oxlint-disable-next-line no-unsafe-type-assertion -- tests only need cancel() and finished.
  return mock_animation as unknown as Animation
}

Element.prototype.animate = vi.fn<typeof Element.prototype.animate>(create_mock_animation)
Element.prototype.getAnimations = vi.fn<typeof Element.prototype.getAnimations>(() => [])

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
      items: make_items(count),
      virtualize: true,
      height: 300,
      calcCols: () => 2,
      masonryWidth: 500,
      ...overrides,
    },
  })
}

describe(`Masonry`, () => {
  test.each([true, false])(`renders items with animate=%s`, (animate) => {
    mount(Masonry, { target: document.body, props: { items: indices, animate } })
    expect(document.querySelectorAll(`div.masonry > div.col > *`)).toHaveLength(n_items)
  })

  test.each([
    [[`foo`, `bar`], /masonry foo/u, /col col-\d+ bar/u],
    [[`custom`, `col-class`], /masonry custom/u, /col col-\d+ col-class/u],
    [[``, ``], /^masonry\s+svelte-\w+/u, /col col-\d+\s+svelte-\w+/u],
  ])(
    `applies class=%j and columnProps.class correctly`,
    ([cls, colCls], divRe, colRe) => {
      mount(Masonry, {
        target: document.body,
        props: { items: indices, class: cls, columnProps: { class: colCls } },
      })
      expect(document.querySelector(`div.masonry`)?.className).toMatch(divRe)
      expect(document.querySelector(`div.masonry > div.col`)?.className).toMatch(colRe)
    },
  )

  test(`merges container style with layout and spreads columnProps onto columns`, async () => {
    const style = `background-color: darkblue;`
    const column_style = `border: 1px solid red;`
    mount(Masonry, {
      target: document.body,
      props: {
        items: [1, 2],
        style,
        columnProps: { style: column_style, 'data-testid': `col`, role: `list` },
        maxColWidth: 150,
        gap: 5,
      },
    })
    // container: user style merges with (not clobbers) the layout styles
    const masonry = document.querySelector<HTMLElement>(`div.masonry`)
    expect(masonry?.getAttribute(`style`)).toContain(style)
    expect(masonry?.style.display).toBe(`flex`)
    expect(masonry?.style.boxSizing).toBe(`border-box`)
    // every column: columnProps style merges with the style: directives, arbitrary attrs pass through
    for (const col of document.querySelectorAll<HTMLElement>(`div.masonry > div.col`)) {
      expect(col.getAttribute(`style`)).toContain(column_style)
      expect(col.style.gap).toBe(`5px`)
      expect(col.style.maxWidth).toBe(`150px`)
      expect(col.getAttribute(`data-testid`)).toBe(`col`)
      expect(col.getAttribute(`role`)).toBe(`list`)
    }
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
      expect(document.querySelectorAll(`div.masonry > div.col`)).toHaveLength(expected)
    },
  )

  test(`warns if maxColWidth < minColWidth`, () => {
    console.warn = vi.fn<typeof console.warn>()
    mount(Masonry, {
      target: document.body,
      props: { items: indices, minColWidth: 50, maxColWidth: 40 },
    })
    expect(console.warn).toHaveBeenCalledWith(
      `svelte-bricks: maxColWidth (40) < minColWidth (50).`,
    )
  })

  test(`throws a descriptive error if an item has no usable id`, () => {
    expect(() =>
      mount(Masonry, { target: document.body, props: { items: [{ name: `no id` }] } }),
    ).toThrow(
      `svelte-bricks: item["id"] is undefined, expected string | number. Item: {"name":"no id"}`,
    )
  })

  test(`uses custom getId function`, () => {
    const get_id = vi.fn<(item: { x: number }) => number>((item) => item.x)
    mount(Masonry, {
      target: document.body,
      props: { items: [{ x: 1 }, { x: 2 }], getId: get_id },
    })
    expect(get_id).toHaveBeenCalled()
    expect(document.querySelectorAll(`div.masonry > div.col > div`)).toHaveLength(2)
  })

  test(`uses custom calcCols and adds col-N classes`, () => {
    const calc_cols = vi.fn<() => number>(() => 3)
    mount(Masonry, {
      target: document.body,
      props: { items: indices, calcCols: calc_cols, masonryWidth: 500 },
    })
    expect(calc_cols).toHaveBeenCalled()
    const columns = document.querySelectorAll(`div.masonry > div.col`)
    expect(columns).toHaveLength(3)
    columns.forEach((col, idx) => expect(col.classList).toContain(`col-${idx}`))
  })

  test.each([0, 1, 5, 50])(`renders %d items`, (count) => {
    mount(Masonry, {
      target: document.body,
      props: { items: Array.from({ length: count }, (_, idx) => idx) },
    })
    expect(document.querySelectorAll(`div.masonry > div.col > *`)).toHaveLength(count)
  })

  test.each([`id`, `key`, `uuid`])(`works with idKey=%s`, (idKey) => {
    mount(Masonry, {
      target: document.body,
      props: { items: [{ [idKey]: 1 }, { [idKey]: 2 }], idKey },
    })
    expect(document.querySelectorAll(`div.masonry > div.col > div`)).toHaveLength(2)
  })

  test(`renders max columns when masonryWidth=0 (SSR mode)`, () => {
    mount(Masonry, {
      target: document.body,
      props: { items: indices, minColWidth: 200, gap: 10, masonryWidth: 0 },
    })
    expect(document.querySelectorAll(`div.masonry > div.col`)).toHaveLength(
      Math.floor(1930 / 210),
    )
  })

  test.each([
    [{ initialCols: 4, masonryWidth: 0 }, 4],
    [{ initialCols: 99, masonryWidth: 0 }, n_items],
    [{ masonryWidth: 0, calcCols: (): number => 40 }, 40],
    [{ initialCols: 4, masonryWidth: 500, calcCols: (): number => 2 }, 2],
  ])(`resolves column count from %o`, (props, expected) => {
    mount(Masonry, {
      target: document.body,
      props: { items: indices, ...props },
    })
    expect(document.querySelectorAll(`div.masonry > div.col`)).toHaveLength(expected)
  })

  test.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    `throws for invalid initialCols=%s even after width is measured`,
    (initial_cols) => {
      expect(() =>
        mount(Masonry, {
          target: document.body,
          props: { items: indices, initialCols: initial_cols, masonryWidth: 500 },
        }),
      ).toThrow(`svelte-bricks: initialCols must be a positive integer when provided`)
    },
  )

  test(`injects named container query CSS into <head>`, () => {
    mount(Masonry, {
      target: document.body,
      props: { items: indices, minColWidth: 200, gap: 10 },
    })
    const masonry_id = document
      .querySelector(`div.masonry`)
      ?.getAttribute(`data-masonry-id`)
    if (!masonry_id) throw new Error(`data-masonry-id not found`)
    const head_styles = Array.from(document.head.querySelectorAll(`style`))
    const container_css = head_styles.find((style_el) =>
      style_el.textContent.includes(`[data-masonry-id="${masonry_id}"]`),
    )?.textContent
    expect(container_css).toContain(`@container masonry`)
    expect(container_css).toContain(`[data-masonry-id="${masonry_id}"] > .col:nth-child`)
    expect(container_css).not.toContain(`.masonry > .col:nth-child`)
    expect(container_css).toContain(`display: none !important`)
    // no unnamed @container queries should remain (regression guard for #56)
    expect(container_css).not.toMatch(/@container\s*\(/u)
    // styles must be in <head> not <body> to avoid flash on SSR first paint
    const body_container_styles = Array.from(
      document.body.querySelectorAll(`style`),
    ).filter((style_el) => style_el.textContent.includes(`@container`))
    expect(body_container_styles).toHaveLength(0)
  })

  test(`masonry div has container-name for scoped queries`, () => {
    mount(Masonry, {
      target: document.body,
      props: { items: indices },
    })
    const masonry = document.querySelector<HTMLElement>(`div.masonry`)
    if (!masonry) throw new Error(`masonry div not found`)
    const style = getComputedStyle(masonry)
    expect(style.containerName).toBe(`masonry`)
    expect(style.containerType).toBe(`inline-size`)
  })

  test(`limits columns to items.length`, () => {
    mount(Masonry, {
      target: document.body,
      props: { items: [1, 2, 3], minColWidth: 100, masonryWidth: 0 },
    })
    expect(document.querySelectorAll(`div.masonry > div.col`)).toHaveLength(3)
  })
})

describe(`Masonry append render stability`, () => {
  // Regression: https://github.com/janosh/svelte-bricks/issues/58
  test(`balanced-stable append only re-runs effects for new children`, async () => {
    const events: number[] = []
    const harness = mount(MasonryAppendHarness, {
      target: document.body,
      props: { events },
    })
    await tick()
    events.length = 0

    harness.append(5, 6)
    await tick()

    expect(events).toEqual([5, 6])
  })
})

describe(`Masonry order modes`, () => {
  // Distinct heights so every mode yields a different distribution, pinning each
  // algorithm's exact output rather than just item counts per column.
  const dist_heights = [300, 80, 120, 400, 60, 220, 90]
  const dist_height = (item: number) => dist_heights[item]

  test.each([
    [`balanced`, `0,6 | 1,3 | 2,4,5`],
    [`balanced-stable`, `0,6 | 1,3 | 2,4,5`],
    [`row-first`, `0,3,6 | 1,4 | 2,5`],
    [`column-sequential`, `0,1,2 | 3,4,5 | 6`],
    [`column-balanced`, `0,1,2 | 3,4 | 5,6`],
  ] as const)(`order=%s puts 7 items into 3 columns as %s`, async (order, expected) => {
    mock_height = (el) => dist_height(Number(el.textContent))
    mount(Masonry, {
      target: document.body,
      props: {
        items: make_items(7),
        order,
        animate: false,
        calcCols: () => 3,
        gap: 10,
        masonryWidth: 500,
        getEstimatedHeight: dist_height,
      },
    })
    await tick()
    expect(as_columns()).toBe(expected)
  })

  // Appending alone can't tell the two balancing modes apart: greedy shortest-column
  // placement is prefix-deterministic, so re-running it over a longer list reproduces
  // the same columns. Removing from the middle re-packs everything after it, which is
  // exactly what balanced-stable must not do (issue #53).
  test.each([
    [`balanced`, `2,4 | 3`], // re-packed from scratch
    [`balanced-stable`, `3 | 2,4`], // survivors keep their columns
  ] as const)(`order=%s after removing an item mid-list`, async (order, expected) => {
    const harness = mount(MasonryAppendHarness, {
      target: document.body,
      props: { events: [], order },
    })
    await tick()
    expect(as_columns()).toBe(`1,3 | 2,4`)

    harness.remove(1)
    await tick()

    expect(as_columns()).toBe(expected)
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
    const columns = document.querySelectorAll(`div.masonry > div.col`)
    expect(columns[0].textContent).toMatch(/1.*2.*3/u)
    expect(columns[1].textContent).toMatch(/4.*5.*6/u)
  })

  test(`order=balanced-stable repopulates columns after count increases`, async () => {
    const harness = mount(MasonryAppendHarness, {
      target: document.body,
      props: { events: [] },
    })
    const initial_cols = get_col_dist()
    expect(initial_cols).toHaveLength(2)
    expect(initial_cols[1].length).toBeGreaterThan(0)

    harness.set_cols(1)
    await tick()
    const collapsed_cols = get_col_dist()
    expect(collapsed_cols).toHaveLength(1)
    expect(collapsed_cols[0].toSorted()).toEqual(initial_cols.flat().toSorted())

    const removed_ids = initial_cols[1].map(Number)
    harness.remove(...removed_ids)

    harness.set_cols(2)
    await tick()
    const expanded_cols = get_col_dist()
    expect(expanded_cols).toHaveLength(2)
    expect(expanded_cols.every((col) => col.length > 0)).toBe(true)
    expect(expanded_cols.flat().toSorted()).toEqual(initial_cols[0].toSorted())
  })

  test(`order=balanced-stable ignores zero estimated heights`, async () => {
    mock_height = 0
    mount(Masonry, {
      target: document.body,
      props: {
        items: make_items(3),
        order: `balanced-stable`,
        calcCols: () => 2,
        gap: 0,
        getEstimatedHeight: () => 0,
        masonryWidth: 500,
      },
    })

    expect(as_columns()).toBe(`0,2 | 1`)
  })

  test.each(ALL_ORDER_MODES)(
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
    expect(spans).toHaveLength(3)
    expect(Array.from(spans).map((span) => span.textContent)).toEqual(
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

describe(`Masonry virtualization`, () => {
  test(`warns exactly once if virtualize=true without height prop`, () => {
    console.warn = vi.fn<typeof console.warn>()
    mount(Masonry, { target: document.body, props: { items: indices, virtualize: true } })
    expect(console.warn).toHaveBeenCalledExactlyOnceWith(
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
    const masonry = document.querySelector<HTMLElement>(`div.masonry`)
    expect(masonry?.style.overflowY).toBe(`auto`)
    expect(masonry?.style.height).toBe(expected)
  })

  test(`calls getEstimatedHeight and applies column padding`, async () => {
    const get_estimated_height = vi.fn<() => number>(() => 120)
    mount(Masonry, {
      target: document.body,
      props: {
        items: indices,
        virtualize: true,
        height: 500,
        getEstimatedHeight: get_estimated_height,
        order: `balanced`,
        masonryWidth: 500,
      },
    })
    expect(get_estimated_height).toHaveBeenCalled()
    const col = document.querySelector<HTMLElement>(`div.masonry > div.col`)
    expect(col?.getAttribute(`style`)).toMatch(/padding-top:.*padding-bottom:/u)
  })

  test(`respects overscan prop`, async () => {
    mount_virtualized(100, {
      getEstimatedHeight: () => 100,
      overscan: 1,
      calcCols: () => 1,
    })
    const count_1 = document.querySelectorAll(`div.masonry > div.col > div`).length

    mount_virtualized(100, {
      getEstimatedHeight: () => 100,
      overscan: 5,
      calcCols: () => 1,
    })
    const count_5 = document.querySelectorAll(`div.masonry > div.col > div`).length

    expect(count_5).toBeGreaterThan(count_1)
  })

  test.each([
    [`balanced`, 2],
    [`row-first`, 3],
  ] as const)(`renders subset of items %s`, async (order, cols) => {
    mount_virtualized(100, { order, calcCols: () => cols })
    expect(document.querySelectorAll(`div.masonry > div.col`)).toHaveLength(cols)
    const rendered = document.querySelectorAll(`div.masonry > div.col > div`).length
    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(100)
  })

  test(`scrolling moves the rendered window down the column`, async () => {
    mount_virtualized(200, {
      calcCols: () => 1,
      getEstimatedHeight: () => 100,
      gap: 0,
      height: 300,
    })
    const rendered_ids = () =>
      Array.from(document.querySelectorAll(`div.masonry > div.col > div`)).map(
        (item) => item.textContent,
      )
    expect(rendered_ids()[0]).toBe(`0`)

    const masonry = document.querySelector<HTMLElement>(`div.masonry`)
    if (!masonry) throw new Error(`masonry div not found`)
    Object.defineProperty(masonry, `scrollTop`, { value: 5000, configurable: true })
    masonry.dispatchEvent(new Event(`scroll`))
    await new Promise(requestAnimationFrame)
    await tick()

    // scroll_top=5000 with 100px items lands on item 50, minus 1 and 5 overscan
    expect(rendered_ids()[0]).toBe(`43`)
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
        items: make_items(100),
        virtualize: true,
        height: `500px`,
        calcCols: () => 2,
      },
    })

    // With clientHeight=0 (unmeasured), all items render (virtualization deferred)
    expect(document.querySelectorAll(`div.masonry > div.col > div`)).toHaveLength(100)

    if (original) Object.defineProperty(HTMLElement.prototype, `clientHeight`, original)
  })

  test(`virtualize=false skips padding and overflow styles`, async () => {
    mount(Masonry, {
      target: document.body,
      props: { items: indices, virtualize: false },
    })
    const masonry = document.querySelector<HTMLElement>(`div.masonry`)
    const col_style = document
      .querySelector(`div.masonry > div.col`)
      ?.getAttribute(`style`)
    expect(masonry?.style.overflowY).toBe(``)
    expect(col_style).not.toContain(`padding-top:`)
  })
})

describe(`Masonry item cleanup`, () => {
  test(`swapping out every item on a live instance renders only the new ones`, async () => {
    const harness = mount(MasonryAppendHarness, {
      target: document.body,
      props: { events: [] },
    })
    await tick()

    harness.remove(1, 2, 3, 4)
    harness.append(10, 11, 12)
    await tick()

    expect(get_col_dist().flat().toSorted()).toEqual([`10`, `11`, `12`])
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
    expect(document.querySelector<HTMLElement>(selector)?.style.display).toBe(display)
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
    const columns = document.querySelectorAll(`div.masonry > div.col`)
    // Verify round-robin: item N should be in column N % 3
    for (let col_idx = 0; col_idx < columns.length; col_idx++) {
      const spans = columns[col_idx].querySelectorAll(`span`)
      const item_ids = Array.from(spans)
        .map((span) => Math.trunc(Number(span.textContent || `-1`)))
        .filter((id) => id >= 0)
      for (const item_id of item_ids) {
        expect(item_id % 3).toBe(col_idx)
      }
    }
  })

  test(`padding uses estimated heights, not measured`, async () => {
    const [estimated, gap, item_count] = [100, 10, 100]
    mock_height = 200 // 2x the estimate

    mount(Masonry, {
      target: document.body,
      props: {
        items: make_items(item_count),
        virtualize: true,
        height: 300,
        calcCols: () => 1,
        gap,
        getEstimatedHeight: () => estimated,
        masonryWidth: 500,
      },
    })

    const col = document.querySelector<HTMLElement>(`div.masonry > div.col`)
    const rendered = col?.children.length ?? 0
    const padding_css = col?.style.paddingBottom ?? `0`
    const padding = Math.trunc(Number(padding_css.replace(`px`, ``)))

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

      const col = document.querySelector<HTMLElement>(`div.masonry > div.col`)
      const initial_style = col?.getAttribute(`style`)

      // Trigger all ResizeObserver callbacks
      for (const item of document.querySelectorAll(`div.masonry > div.col > div`)) {
        resize_observers.get(item)?.([mock_resize_entry(item)], mock_observer)
      }

      expect(col?.getAttribute(`style`)).toBe(initial_style)
    },
  )

  test(`column distribution stable after measurements`, async () => {
    mount_virtualized(100, {
      calcCols: () => 3,
      getEstimatedHeight: () => 100,
      height: 300,
    })

    const before = get_col_dist()

    for (const item of document.querySelectorAll(`div.masonry > div.col > div`)) {
      resize_observers.get(item)?.([mock_resize_entry(item)], mock_observer)
    }

    expect(get_col_dist()).toEqual(before)
  })

  test(`10k items render under 500ms`, async () => {
    const start = performance.now()
    mount_virtualized(10000, {
      calcCols: () => 4,
      getEstimatedHeight: () => 100,
      height: 500,
    })

    expect(performance.now() - start).toBeLessThan(500)
    const rendered = document.querySelectorAll(`div.masonry > div.col > div`).length
    expect(rendered).toBeLessThan(200)
    expect(rendered).toBeGreaterThan(0)
  })
})

describe(`Masonry order mode edge cases`, () => {
  // Every mode must render every item, whatever the item shape or column count
  const shapes: [label: string, items: unknown[], n_cols: number, expected: number][] = [
    [`no items`, [], 3, 0],
    [`a single item`, [42], 3, 1],
    [`fewer items than columns`, [1, 2], 5, 2],
    [`string items`, [`apple`, `banana`, `cherry`], 2, 3],
    [`object items`, [{ id: `a` }, { id: `b` }, { id: `c` }], 2, 3],
  ]

  test.each(
    ALL_ORDER_MODES.flatMap((order) => shapes.map((shape) => [order, ...shape] as const)),
  )(`order=%s renders %s`, async (order, _label, items, n_cols, expected) => {
    mount(Masonry, {
      target: document.body,
      props: { items, order, calcCols: () => n_cols, masonryWidth: 500 },
    })
    expect(document.querySelectorAll(`div.masonry > div.col > *`)).toHaveLength(expected)
  })
})
