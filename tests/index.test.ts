import DefaultExport, { Masonry as NamedExport } from '$lib'
import Masonry from '$lib/Masonry.svelte'
import { expect, test } from 'vitest'

test(`index.ts default export is component`, () => {
  expect(DefaultExport).toBe(Masonry)
  expect(NamedExport).toBe(Masonry)
})
