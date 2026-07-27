import { expect, test } from '@playwright/test'
import {
  add_items_individually,
  assert_row_first_order,
  click_button,
  get_all_column_item_ids,
  get_all_item_ids,
  get_columns,
  get_current_order,
  get_item_count,
  get_items,
  goto_masonry_test,
  set_order_mode,
  wait_for_masonry_stable,
} from './helpers'

// mirrors order_options in src/lib/index.ts ($lib can't be imported from node)
const ALL_ORDER_MODES = [
  `balanced`,
  `balanced-stable`,
  `row-first`,
  `column-sequential`,
  `column-balanced`,
] as const

// every test in this file starts from a freshly loaded, settled masonry page
test.beforeEach(async ({ page }) => {
  await goto_masonry_test(page)
  await wait_for_masonry_stable(page)
})

test.describe(`Masonry Order Modes`, () => {
  // Both height-balancing modes even out column item counts for uniform items
  for (const mode of [`balanced`, `balanced-stable`] as const) {
    test(`order=${mode} keeps column item counts within 1`, async ({ page }) => {
      await set_order_mode(page, mode)

      const counts = (await get_all_column_item_ids(page)).map((ids) => ids.length)
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1)
    })
  }

  test(`order=balanced lets items reorder when new items are added`, async ({ page }) => {
    await set_order_mode(page, `balanced`)

    const initial_total = (await get_all_column_item_ids(page)).flat().length

    await add_items_individually(page, 5)
    await wait_for_masonry_stable(page)

    const new_col_ids = await get_all_column_item_ids(page)
    expect(new_col_ids.flat()).toHaveLength(initial_total + 5)

    // In balanced mode existing items CAN move, so only check the result stays balanced
    const counts = new_col_ids.map((ids) => ids.length)
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(2)
  })

  test(`order=balanced-stable repopulates columns after count increases`, async ({
    page,
  }) => {
    await set_order_mode(page, `balanced-stable`)

    const filled_col_count = async (): Promise<number> =>
      (await get_all_column_item_ids(page)).filter((ids) => ids.length > 0).length
    const cols_input = page.locator(`[data-testid="cols-input"]`)

    await cols_input.fill(`1`)
    await expect.poll(filled_col_count).toBe(1)

    await cols_input.fill(`3`)
    await expect.poll(filled_col_count).toBe(3)
  })

  test(`order=row-first distributes items in round-robin order`, async ({ page }) => {
    await set_order_mode(page, `row-first`)

    await assert_row_first_order(page, 3) // page defaults to 3 columns
  })

  test(`order=column-sequential fills columns in reading order`, async ({ page }) => {
    await set_order_mode(page, `column-sequential`)

    const col_ids = await get_all_column_item_ids(page)
    const total = col_ids.flat().length
    const items_per_col = Math.ceil(total / 3)

    let expected_start = 0
    for (const ids of col_ids) {
      if (ids.length > 0) {
        expect(ids[0]).toBeGreaterThanOrEqual(expected_start)
        expect(ids[0]).toBeLessThan(expected_start + items_per_col + 1)
        expected_start += items_per_col
      }
    }
  })

  test(`order=column-balanced fills by target height in reading order`, async ({
    page,
  }) => {
    await set_order_mode(page, `column-balanced`)

    const col_ids = await get_all_column_item_ids(page)
    expect(col_ids[0]).toContain(0)

    // Items flow left to right - first item of col N > last item of col N-1
    for (let col_idx = 1; col_idx < col_ids.length; col_idx++) {
      const prev = col_ids[col_idx - 1]
      const curr = col_ids[col_idx]
      if (curr.length > 0 && prev.length > 0) {
        const prev_last = prev.at(-1)
        if (prev_last !== undefined) expect(curr[0]).toBeGreaterThan(prev_last)
      }
    }
  })

  // Both column-first modes maintain ascending ID order within columns
  for (const mode of [`column-sequential`, `column-balanced`]) {
    test(`${mode}: maintains ascending ID order within each column`, async ({ page }) => {
      await set_order_mode(page, mode)

      const col_ids = await get_all_column_item_ids(page)
      for (const ids of col_ids) {
        for (let idx = 1; idx < ids.length; idx++) {
          expect(ids[idx]).toBeGreaterThan(ids[idx - 1])
        }
      }
    })
  }

  test(`switching modes applies each mode and preserves every item`, async ({ page }) => {
    const initial_ids = await get_all_item_ids(page)
    expect(initial_ids.length).toBeGreaterThan(0)

    for (const mode of ALL_ORDER_MODES) {
      await set_order_mode(page, mode)

      expect(await get_current_order(page)).toBe(mode)
      expect(await get_all_item_ids(page)).toEqual(initial_ids)
    }
  })
})

test.describe(`Masonry Item Operations`, () => {
  for (const [button, delta] of [
    [`add-item-btn`, 1],
    [`add-5-items-btn`, 5],
    [`remove-last-btn`, -1],
  ] as const) {
    test(`${button} changes item count by ${delta}`, async ({ page }) => {
      const initial_count = await get_item_count(page)

      await click_button(page, button)
      await wait_for_masonry_stable(page)

      expect(await get_item_count(page)).toBe(initial_count + delta)
    })
  }

  test(`clear all button removes all items`, async ({ page }) => {
    await click_button(page, `clear-all-btn`)
    // wait deterministically until the clear has taken effect
    await expect(page.locator(`[data-testid="stat-items"]`)).toHaveText(`Items: 0`)

    const count = await get_item_count(page)
    expect(count).toBe(0)

    const items = get_items(page)
    await expect(items).toHaveCount(0)
  })

  test(`reset button restores original items`, async ({ page }) => {
    const initial_count = await get_item_count(page)

    // Add and remove some items
    await click_button(page, `add-5-items-btn`)
    await click_button(page, `remove-last-btn`)
    await click_button(page, `remove-last-btn`)
    await wait_for_masonry_stable(page)

    // Reset
    await click_button(page, `reset-btn`)
    await wait_for_masonry_stable(page)

    const count = await get_item_count(page)
    expect(count).toBe(initial_count)
  })
})

test.describe(`Masonry Column Configuration`, () => {
  test(`changing column count redistributes items`, async ({ page }) => {
    // Start with 3 columns (default)
    let columns = get_columns(page)
    await expect(columns).toHaveCount(3)

    await page.locator(`[data-testid="cols-input"]`).fill(`4`)
    await wait_for_masonry_stable(page)

    columns = get_columns(page)
    await expect(columns).toHaveCount(4)

    // All items should still be present
    const total_items = await get_item_count(page)
    const items = get_items(page)
    await expect(items).toHaveCount(total_items)
  })

  test(`changing gap updates layout`, async ({ page }) => {
    await page.locator(`[data-testid="gap-input"]`).fill(`20`)
    await page.locator(`[data-testid="gap-input"]`).blur()
    await wait_for_masonry_stable(page)

    // Verify items are still rendered (gap change shouldn't break layout)
    const items = get_items(page)
    const count = await items.count()
    expect(count).toBeGreaterThan(0)
  })
})
