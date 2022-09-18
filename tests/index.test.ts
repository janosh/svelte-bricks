import IndexMasonry from '$lib'
import Masonry from '$lib/Masonry.svelte'
import { expect, test } from 'vitest'

test(`index.ts default export is component`, () => {
  expect(IndexMasonry).toBe(Masonry)
})
