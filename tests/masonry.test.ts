import { describe, expect, test } from 'vitest'
import Masonry from '../src/lib'

const n_items = 30
const indices = [...Array(n_items).keys()]

describe(`Masonry`, () => {
  test(`renders items`, async () => {
    const masonry = new Masonry({
      target: document.body,
      props: { items: indices },
    })

    expect(masonry).toBeTruthy()

    const items = document.querySelectorAll(`.masonry > .col > div`)

    expect(items.length).toBe(n_items)
  })

  test(`attaches class props correctly`, async () => {
    new Masonry({
      target: document.body,
      props: { items: indices, class: `foo`, columnClass: `bar` },
    })

    const items = document.querySelectorAll(`.masonry.foo > .col.bar > div`)

    expect(items.length).toBe(n_items)
  })
})
