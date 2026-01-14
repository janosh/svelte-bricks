import Masonry from '$lib'
import { mount, tick, unmount } from 'svelte'
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
  test.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])(`renders items with animate=%s, balance=%s`, (animate, balance) => {
    mount(Masonry, { target: document.body, props: { items: indices, animate, balance } })
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

  test(`calculates columns from masonryWidth, minColWidth, gap`, () => {
    const [masonryWidth, minColWidth, gap] = [370, 50, 10]
    mount(Masonry, {
      target: document.body,
      props: { items: indices, masonryWidth, minColWidth, gap },
    })
    expect(document.querySelectorAll(`div.masonry > div.col`).length).toBe(
      Math.floor((masonryWidth + gap) / (minColWidth + gap)),
    )
  })

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

describe(`Masonry column balancing`, () => {
  test(`attaches ResizeObservers when balance=true`, async () => {
    mount(Masonry, {
      target: document.body,
      props: { items: [1, 2, 3], balance: true, masonryWidth: 500 },
    })
    await tick()
    expect(resize_observers.size).toBeGreaterThan(0)
  })

  test(`distributes items evenly with uniform heights`, async () => {
    mount(Masonry, {
      target: document.body,
      props: {
        items: [1, 2, 3, 4, 5, 6],
        balance: true,
        calcCols: () => 2,
        masonryWidth: 500,
      },
    })
    await tick()
    const columns = document.querySelectorAll(`div.masonry > div.col`)
    expect(columns.length).toBe(2)
    expect(columns[0].children.length + columns[1].children.length).toBe(6)
  })

  test(`balance=false uses round-robin distribution`, async () => {
    mount(Masonry, {
      target: document.body,
      props: {
        items: [1, 2, 3, 4],
        balance: false,
        calcCols: () => 2,
        masonryWidth: 500,
      },
    })
    await tick()
    const columns = document.querySelectorAll(`div.masonry > div.col`)
    expect(columns[0].children.length).toBe(2)
    expect(columns[1].children.length).toBe(2)
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
        balance: true,
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

  test.each([
    [true, 2, `with balance`],
    [false, 3, `without balance`],
  ])(`renders subset of items %s`, async (balance, cols, _desc) => {
    mount_virtualized(100, { balance, calcCols: () => cols })
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
  test.each([
    [50, 10, `numeric items`],
    [20, 20, `object items`],
  ])(`handles %d->%d item changes (%s)`, async (initial, final, _desc) => {
    const make_items = (n: number) =>
      _desc === `object items`
        ? Array.from({ length: n }, (_, idx) => ({ id: idx, value: `item-${idx}` }))
        : [...Array(n).keys()]

    const component = mount(Masonry, {
      target: document.body,
      props: {
        items: make_items(initial),
        balance: true,
        calcCols: () => 2,
        masonryWidth: 500,
      },
    })
    await tick()
    expect(document.querySelectorAll(`div.masonry > div.col > div`).length).toBe(initial)

    if (initial !== final) {
      unmount(component)
      document.body.innerHTML = ``
      mount(Masonry, {
        target: document.body,
        props: {
          items: make_items(final),
          balance: true,
          calcCols: () => 2,
          masonryWidth: 500,
        },
      })
      await tick()
      expect(document.querySelectorAll(`div.masonry > div.col > div`).length).toBe(final)
    }
  })
})
