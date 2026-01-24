// deno-lint-ignore-file no-await-in-loop
import { expect, test } from '@playwright/test'
import {
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

test.describe(`Masonry Order Modes`, () => {
  test.beforeEach(async ({ page }) => {
    await goto_masonry_test(page)
    await wait_for_masonry_stable(page)
  })

  test.describe(`order=balanced (default)`, () => {
    test(`distributes items to shortest columns`, async ({ page }) => {
      await set_order_mode(page, `balanced`)
      await wait_for_masonry_stable(page)

      const col_ids = await get_all_column_item_ids(page)
      // With uniform items and balanced mode, columns should have roughly equal items
      const counts = col_ids.map((ids) => ids.length)
      const max_diff = Math.max(...counts) - Math.min(...counts)
      expect(max_diff).toBeLessThanOrEqual(1)
    })

    test(`items may reorder when new items are added`, async ({ page }) => {
      await set_order_mode(page, `balanced`)
      await wait_for_masonry_stable(page)

      // Get initial distribution
      const initial_col_ids = await get_all_column_item_ids(page)

      // Add several items
      for (let idx = 0; idx < 5; idx++) {
        await click_button(page, `add-item-btn`)
        await page.waitForTimeout(100)
      }
      await wait_for_masonry_stable(page)

      // Get new distribution
      const new_col_ids = await get_all_column_item_ids(page)

      // Total items should increase
      const initial_total = initial_col_ids.flat().length
      const new_total = new_col_ids.flat().length
      expect(new_total).toBe(initial_total + 5)

      // In balanced mode, existing items CAN move (items may jump)
      // We verify the new distribution is reasonably balanced
      const counts = new_col_ids.map((ids) => ids.length)
      const max_diff = Math.max(...counts) - Math.min(...counts)
      expect(max_diff).toBeLessThanOrEqual(2)
    })
  })

  test.describe(`order=balanced-stable`, () => {
    test(`new items go to shortest column`, async ({ page }) => {
      await set_order_mode(page, `balanced-stable`)
      await wait_for_masonry_stable(page)

      const col_ids = await get_all_column_item_ids(page)
      const counts = col_ids.map((ids) => ids.length)
      const max_diff = Math.max(...counts) - Math.min(...counts)
      expect(max_diff).toBeLessThanOrEqual(1)
    })

    test(`existing items stay in their columns when new items are added`, async ({ page }) => {
      await set_order_mode(page, `balanced-stable`)
      await wait_for_masonry_stable(page)

      // Get initial distribution
      const initial_col_ids = await get_all_column_item_ids(page)
      const initial_assignments = new Map<number, number>()
      initial_col_ids.forEach((ids, col_idx) => {
        ids.forEach((id) => initial_assignments.set(id, col_idx))
      })

      // Add several items
      for (let idx = 0; idx < 5; idx++) {
        await click_button(page, `add-item-btn`)
        await page.waitForTimeout(100)
      }
      await wait_for_masonry_stable(page)

      // Get new distribution
      const new_col_ids = await get_all_column_item_ids(page)

      // Verify original items stayed in their columns
      for (const [id, original_col] of initial_assignments.entries()) {
        const new_col = new_col_ids.findIndex((ids) => ids.includes(id))
        expect(
          new_col,
          `Item ${id} should stay in column ${original_col} but moved to ${new_col}`,
        ).toBe(original_col)
      }
    })

    test(`removed items do not leave gaps`, async ({ page }) => {
      await set_order_mode(page, `balanced-stable`)
      await wait_for_masonry_stable(page)

      const initial_count = await get_item_count(page)

      // Remove some items
      await click_button(page, `remove-last-btn`)
      await click_button(page, `remove-last-btn`)
      await wait_for_masonry_stable(page)

      const new_count = await get_item_count(page)
      expect(new_count).toBe(initial_count - 2)

      // Verify items are still rendered
      const items = get_items(page)
      await expect(items).toHaveCount(new_count)
    })
  })

  test.describe(`order=row-first`, () => {
    test(`distributes items in round-robin order`, async ({ page }) => {
      await set_order_mode(page, `row-first`)
      await wait_for_masonry_stable(page)

      // Verify row-first (round-robin) distribution
      await assert_row_first_order(page, 3) // Default is 3 columns
    })

    test(`maintains predictable order when items are added`, async ({ page }) => {
      await set_order_mode(page, `row-first`)
      await wait_for_masonry_stable(page)

      // Add items
      await click_button(page, `add-5-items-btn`)
      await wait_for_masonry_stable(page)

      // Verify row-first order is maintained
      await assert_row_first_order(page, 3)
    })

    test(`each column has items with same modulo pattern`, async ({ page }) => {
      await set_order_mode(page, `row-first`)
      await wait_for_masonry_stable(page)

      const col_ids = await get_all_column_item_ids(page)
      // In row-first with 3 cols: col 0 has ids 0,3,6,9... col 1 has 1,4,7,10...
      for (let col_idx = 0; col_idx < col_ids.length; col_idx++) {
        for (const id of col_ids[col_idx]) {
          expect(id % 3).toBe(col_idx)
        }
      }
    })
  })

  test.describe(`order=column-sequential`, () => {
    test(`fills columns sequentially (first N in col 1, next N in col 2)`, async ({ page }) => {
      await set_order_mode(page, `column-sequential`)
      await wait_for_masonry_stable(page)

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
  })

  test.describe(`order=column-balanced`, () => {
    test(`fills columns by target height while maintaining reading order`, async ({ page }) => {
      await set_order_mode(page, `column-balanced`)
      await wait_for_masonry_stable(page)

      const col_ids = await get_all_column_item_ids(page)
      expect(col_ids[0]).toContain(0)

      // Items flow left to right - first item of col N > last item of col N-1
      for (let col_idx = 1; col_idx < col_ids.length; col_idx++) {
        const prev = col_ids[col_idx - 1]
        const curr = col_ids[col_idx]
        if (curr.length > 0 && prev.length > 0) {
          expect(curr[0]).toBeGreaterThan(prev[prev.length - 1])
        }
      }
    })
  })

  // Both column-first modes maintain ascending ID order within columns
  for (const mode of [`column-sequential`, `column-balanced`]) {
    test(`${mode}: maintains ascending ID order within each column`, async ({ page }) => {
      await set_order_mode(page, mode)
      await wait_for_masonry_stable(page)

      const col_ids = await get_all_column_item_ids(page)
      for (const ids of col_ids) {
        for (let idx = 1; idx < ids.length; idx++) {
          expect(ids[idx]).toBeGreaterThan(ids[idx - 1])
        }
      }
    })
  }

  test.describe(`mode switching`, () => {
    test(`can switch between all order modes`, async ({ page }) => {
      for (
        const mode of [
          `balanced`,
          `balanced-stable`,
          `row-first`,
          `column-sequential`,
          `column-balanced`,
        ]
      ) {
        await set_order_mode(page, mode)
        await wait_for_masonry_stable(page)

        const current = await get_current_order(page)
        expect(current).toBe(mode)

        // Verify items are still rendered
        const items = get_items(page)
        const count = await items.count()
        expect(count).toBeGreaterThan(0)
      }
    })

    test(`preserves all items when switching modes`, async ({ page }) => {
      const initial_ids = await get_all_item_ids(page)

      for (
        const mode of [
          `row-first`,
          `column-sequential`,
          `balanced`,
          `column-balanced`,
          `balanced-stable`,
        ]
      ) {
        await set_order_mode(page, mode)
        await wait_for_masonry_stable(page)

        const current_ids = await get_all_item_ids(page)
        expect(current_ids.sort()).toEqual(initial_ids.sort())
      }
    })

    test(`switching from row-first to balanced actually balances columns`, async ({ page }) => {
      // Start with row-first mode
      await set_order_mode(page, `row-first`)
      await wait_for_masonry_stable(page)

      // Get row-first distribution (should follow round-robin pattern)
      const row_first_cols = await get_all_column_item_ids(page)
      // Verify it's actually row-first (item N in column N % 3)
      for (let col_idx = 0; col_idx < row_first_cols.length; col_idx++) {
        for (const id of row_first_cols[col_idx]) {
          expect(id % 3).toBe(col_idx)
        }
      }

      // Switch to balanced mode
      await set_order_mode(page, `balanced`)
      await wait_for_masonry_stable(page)

      // Balanced mode should distribute to shortest columns
      // With varying heights, distribution may differ from row-first
      const balanced_cols = await get_all_column_item_ids(page)

      // Verify columns are reasonably balanced (no huge discrepancy)
      const counts = balanced_cols.map((ids) => ids.length)
      const max_diff = Math.max(...counts) - Math.min(...counts)
      expect(max_diff).toBeLessThanOrEqual(2)

      // Verify all items still present
      const all_ids = balanced_cols.flat().sort((a, b) => a - b)
      const expected_ids = row_first_cols.flat().sort((a, b) => a - b)
      expect(all_ids).toEqual(expected_ids)
    })
  })
})

test.describe(`Masonry Item Operations`, () => {
  test.beforeEach(async ({ page }) => {
    await goto_masonry_test(page)
    await wait_for_masonry_stable(page)
  })

  test(`add item button adds one item`, async ({ page }) => {
    const initial_count = await get_item_count(page)

    await click_button(page, `add-item-btn`)
    await wait_for_masonry_stable(page)

    const new_count = await get_item_count(page)
    expect(new_count).toBe(initial_count + 1)
  })

  test(`add 5 items button adds five items`, async ({ page }) => {
    const initial_count = await get_item_count(page)

    await click_button(page, `add-5-items-btn`)
    await wait_for_masonry_stable(page)

    const new_count = await get_item_count(page)
    expect(new_count).toBe(initial_count + 5)
  })

  test(`remove last button removes one item`, async ({ page }) => {
    const initial_count = await get_item_count(page)

    await click_button(page, `remove-last-btn`)
    await wait_for_masonry_stable(page)

    const new_count = await get_item_count(page)
    expect(new_count).toBe(initial_count - 1)
  })

  test(`clear all button removes all items`, async ({ page }) => {
    await click_button(page, `clear-all-btn`)
    await page.waitForTimeout(100)

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
  test.beforeEach(async ({ page }) => {
    await goto_masonry_test(page)
    await wait_for_masonry_stable(page)
  })

  test(`changing column count redistributes items`, async ({ page }) => {
    // Start with 3 columns (default)
    let columns = get_columns(page)
    await expect(columns).toHaveCount(3)

    // Change to 4 columns
    await page.locator(`[data-testid="cols-input"]`).fill(`4`)
    await page.locator(`[data-testid="cols-input"]`).blur()
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
