// deno-lint-ignore-file no-await-in-loop
import { expect, test } from '@playwright/test'
import {
  click_button,
  get_all_column_item_ids,
  goto_masonry_test,
  set_order_mode,
  wait_for_masonry_stable,
} from './helpers'

// Build a Map of item ID -> column index from column ID arrays
const build_assignments = (col_ids: number[][]): Map<number, number> => {
  const assignments = new Map<number, number>()
  col_ids.forEach((ids, col_idx) => ids.forEach((id) => assignments.set(id, col_idx)))
  return assignments
}

// Verify items stayed in their assigned columns
const verify_stability = (
  col_ids: number[][],
  expected: Map<number, number>,
  context: string,
) => {
  for (const [id, expected_col] of expected.entries()) {
    const actual_col = col_ids.findIndex((ids) => ids.includes(id))
    expect(
      actual_col,
      `${context}: Item ${id} jumped from column ${expected_col} to ${actual_col}`,
    ).toBe(expected_col)
  }
}

// These tests specifically address GitHub issue #53:
// "Adding items to the list with column balancing on makes items boxes jump places"
// https://github.com/janosh/svelte-bricks/issues/53

test.describe(`Infinite Scroll Stability (Issue #53)`, () => {
  test.beforeEach(async ({ page }) => {
    await goto_masonry_test(page)
    await wait_for_masonry_stable(page)
  })

  test(`balanced-stable mode: items never jump when adding new items`, async ({ page }) => {
    await set_order_mode(page, `balanced-stable`)
    await wait_for_masonry_stable(page)

    const assignments = build_assignments(await get_all_column_item_ids(page))

    // Simulate infinite scroll: add items one at a time, checking stability each time
    for (let round = 0; round < 10; round++) {
      await click_button(page, `add-item-btn`)
      await wait_for_masonry_stable(page)

      const current_col_ids = await get_all_column_item_ids(page)
      verify_stability(current_col_ids, assignments, `Round ${round + 1}`)

      // Track new items
      current_col_ids.forEach((ids, col_idx) => {
        ids.forEach((id) => {
          if (!assignments.has(id)) assignments.set(id, col_idx)
        })
      })
    }
  })

  test(`balanced mode: items may jump (expected behavior)`, async ({ page }) => {
    await set_order_mode(page, `balanced`)
    await wait_for_masonry_stable(page)

    const initial_ids = build_assignments(await get_all_column_item_ids(page))

    for (let idx = 0; idx < 5; idx++) await click_button(page, `add-item-btn`)
    await wait_for_masonry_stable(page)

    // In balanced mode, items CAN move - just verify all items are still present
    const all_new_ids = (await get_all_column_item_ids(page)).flat()
    for (const id of initial_ids.keys()) {
      expect(all_new_ids).toContain(id)
    }
  })

  test(`row-first mode: items maintain predictable positions`, async ({ page }) => {
    await set_order_mode(page, `row-first`)
    await wait_for_masonry_stable(page)

    const n_cols = 3
    for (let idx = 0; idx < 5; idx++) {
      await click_button(page, `add-item-btn`)
      await wait_for_masonry_stable(page)

      const col_ids = await get_all_column_item_ids(page)
      col_ids.forEach((ids, col_idx) => {
        ids.forEach((id) => expect(id % n_cols).toBe(col_idx))
      })
    }
  })

  test(`column-sequential mode: items maintain sequential order`, async ({ page }) => {
    await set_order_mode(page, `column-sequential`)
    await wait_for_masonry_stable(page)

    for (let idx = 0; idx < 5; idx++) {
      await click_button(page, `add-item-btn`)
      await wait_for_masonry_stable(page)

      for (const ids of await get_all_column_item_ids(page)) {
        for (let jdx = 1; jdx < ids.length; jdx++) {
          expect(ids[jdx]).toBeGreaterThan(ids[jdx - 1])
        }
      }
    }
  })

  test(`balanced-stable mode handles rapid item additions`, async ({ page }) => {
    await set_order_mode(page, `balanced-stable`)
    await wait_for_masonry_stable(page)

    const initial = build_assignments(await get_all_column_item_ids(page))

    for (let idx = 0; idx < 3; idx++) await click_button(page, `add-5-items-btn`)
    await wait_for_masonry_stable(page)

    verify_stability(
      await get_all_column_item_ids(page),
      initial,
      `After rapid additions`,
    )
  })

  test(`balanced-stable mode handles item removal without affecting other items`, async ({ page }) => {
    await set_order_mode(page, `balanced-stable`)
    await wait_for_masonry_stable(page)

    await click_button(page, `add-5-items-btn`)
    await wait_for_masonry_stable(page)

    const before = build_assignments(await get_all_column_item_ids(page))

    await click_button(page, `remove-last-btn`)
    await click_button(page, `remove-last-btn`)
    await wait_for_masonry_stable(page)

    const after_col_ids = await get_all_column_item_ids(page)
    for (const id of after_col_ids.flat()) {
      const expected_col = before.get(id)
      if (expected_col !== undefined) {
        const actual_col = after_col_ids.findIndex((ids) => ids.includes(id))
        expect(actual_col).toBe(expected_col)
      }
    }
  })
})
