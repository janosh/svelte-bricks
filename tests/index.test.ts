import { expect, test } from 'vitest'
import IndexMasonry from '../src/lib'
import Masonry from '../src/lib/Masonry.svelte'

test(`default export from index.ts is same as component file`, () => {
  expect(IndexMasonry).toBe(Masonry)
})
