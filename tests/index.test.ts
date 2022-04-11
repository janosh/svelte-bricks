import { expect, test } from 'vitest'
import IndexMasonry from '../src/lib'
import Masonry from '../src/lib/Masonry.svelte'

test(`index.ts default export is component`, () => {
  expect(IndexMasonry).toBe(Masonry)
})
