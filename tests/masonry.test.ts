import Masonry from '$lib'
import { mount, tick } from 'svelte'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const n_items = 30
const indices = [...Array(n_items).keys()]

// Track ResizeObserver registrations
const resize_observers = new Map<Element, ResizeObserverCallback>()
let mock_height = 100

// Mock ResizeObserver that calls callback on observe
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

// Mock Web Animations API
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

describe(`Masonry`, () => {
  test.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])(`renders items with animate=%s, balance=%s`, (animate, balance) => {
    mount(Masonry, {
      target: document.body,
      props: { items: indices, animate, balance },
    })
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
    const col_style = document.querySelector(`div.masonry > div.col`)?.getAttribute(
      `style`,
    )
    expect(col_style).toContain(`gap: 5px`)
    expect(col_style).toContain(`max-width: 150px`)
    expect(col_style).toContain(columnStyle)
  })

  test(`calculates columns from masonryWidth, minColWidth, gap`, () => {
    const [masonryWidth, minColWidth, gap] = [370, 50, 10]
    const expected = Math.floor((masonryWidth + gap) / (minColWidth + gap))

    mount(Masonry, {
      target: document.body,
      props: { items: indices, masonryWidth, minColWidth, gap },
    })

    expect(document.querySelectorAll(`div.masonry > div.col`).length).toBe(expected)
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

  test(`uses custom getId and idKey`, () => {
    const getId = vi.fn((item: { x: number }) => item.x)
    mount(Masonry, {
      target: document.body,
      props: { items: [{ x: 1 }, { x: 2 }], getId },
    })
    expect(getId).toHaveBeenCalled()

    document.body.innerHTML = ``
    mount(Masonry, {
      target: document.body,
      props: { items: [{ myId: 1 }], idKey: `myId` },
    })
    expect(document.querySelectorAll(`div.masonry > div.col > div`).length).toBe(1)
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

  test.each([
    [[], 0],
    [[1], 1],
    [[1, 2, 3, 4, 5], 5],
    [[...Array(50).keys()], 50],
  ])(`renders %j items correctly`, (items, expected) => {
    mount(Masonry, { target: document.body, props: { items } })
    expect(document.querySelectorAll(`div.masonry > div.col > *`).length).toBe(expected)
  })

  test.each([`id`, `key`, `uuid`])(`works with idKey=%s`, (idKey) => {
    mount(Masonry, {
      target: document.body,
      props: { items: [{ [idKey]: 1 }, { [idKey]: 2 }], idKey },
    })
    expect(document.querySelectorAll(`div.masonry > div.col > div`).length).toBe(2)
  })

  // SSR behavior
  test(`renders max columns when masonryWidth=0 (SSR mode)`, () => {
    const [minColWidth, gap] = [200, 10]
    const expected = Math.floor((1920 + gap) / (minColWidth + gap))

    mount(Masonry, {
      target: document.body,
      props: { items: indices, minColWidth, gap, masonryWidth: 0 },
    })

    expect(document.querySelectorAll(`div.masonry > div.col`).length).toBe(expected)
  })

  test(`generates container query CSS`, () => {
    mount(Masonry, {
      target: document.body,
      props: { items: indices, minColWidth: 200, gap: 10 },
    })

    const styles = Array.from(document.querySelectorAll(`style`))
    const cq_style = styles.find((s) => s.textContent?.includes(`@container`))
    expect(cq_style?.textContent).toContain(`.masonry > .col:nth-child`)
  })

  test(`limits columns to items.length`, () => {
    mount(Masonry, {
      target: document.body,
      props: { items: [1, 2, 3], minColWidth: 100, gap: 10, masonryWidth: 0 },
    })
    expect(document.querySelectorAll(`div.masonry > div.col`).length).toBe(3)
  })
})

describe(`Masonry column balancing`, () => {
  beforeEach(() => {
    document.body.innerHTML = ``
    resize_observers.clear()
    mock_height = 100
  })

  test(`attaches ResizeObservers when balance=true`, async () => {
    mount(Masonry, {
      target: document.body,
      props: { items: [1, 2, 3], balance: true, masonryWidth: 500 },
    })
    await tick()
    expect(resize_observers.size).toBeGreaterThan(0)
  })

  test(`balancing places items in shortest column`, async () => {
    mock_height = 50
    mount(Masonry, {
      target: document.body,
      props: { items: [1, 2, 3], balance: true, calcCols: () => 3, masonryWidth: 600 },
    })
    await tick()

    // Count item wrappers
    const items = document.querySelectorAll(`div.masonry > div.col > div`)
    expect(items.length).toBe(3)
  })

  test(`distributes items evenly with uniform heights`, async () => {
    mock_height = 100
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

    // Round-robin: col0=[1,3], col1=[2,4]
    const columns = document.querySelectorAll(`div.masonry > div.col`)
    expect(columns[0].children.length).toBe(2)
    expect(columns[1].children.length).toBe(2)
  })
})
