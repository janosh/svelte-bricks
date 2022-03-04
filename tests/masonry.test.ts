import { expect, test } from 'vitest'
import Masonry from '../src/lib'

const n_items = 30
const indices = [...Array(n_items).keys()]

test(`renders items`, async () => {
  const masonry = new Masonry({
    target: document.body,
    props: { items: indices },
  })

  expect(masonry).toBeTruthy()

  const items = document.querySelectorAll(`.masonry > .col > div`)

  expect(items.length).toBe(n_items)
})
