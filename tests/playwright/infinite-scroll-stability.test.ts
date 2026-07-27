import { expect, test } from '@playwright/test'
import {
  click_button,
  get_all_column_item_ids,
  get_column_assignments,
  goto_masonry_test,
  set_order_mode,
  verify_stability,
  wait_for_masonry_stable,
} from './helpers'

// These tests specifically address GitHub issue #53:
// "Adding items to the list with column balancing on makes items boxes jump places"
// https://github.com/janosh/svelte-bricks/issues/53

test.describe(`Infinite Scroll Stability (Issue #53)`, () => {
  test.beforeEach(async ({ page }) => {
    await goto_masonry_test(page)
    await wait_for_masonry_stable(page)
  })

  test(`balanced-stable mode: items never jump when adding new items`, async ({
    page,
  }) => {
    await set_order_mode(page, `balanced-stable`)
    await wait_for_masonry_stable(page)

    const assignments = await get_column_assignments(page)

    // Simulate infinite scroll: add items one at a time, checking stability each time
    for (let round = 0; round < 10; round++) {
      await click_button(page, `add-item-btn`)
      await wait_for_masonry_stable(page)

      await verify_stability(page, assignments, `Round ${round + 1}`)

      // Track new items so later rounds hold them to their first column too
      for (const [id, col_idx] of await get_column_assignments(page)) {
        if (!assignments.has(id)) assignments.set(id, col_idx)
      }
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
      for (const [col_idx, ids] of col_ids.entries()) {
        for (const id of ids) expect(id % n_cols).toBe(col_idx)
      }
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

    const initial = await get_column_assignments(page)

    for (let idx = 0; idx < 3; idx++) await click_button(page, `add-5-items-btn`)
    await wait_for_masonry_stable(page)

    await verify_stability(page, initial, `After rapid additions`)
  })

  test(`balanced-stable mode handles item removal without affecting other items`, async ({
    page,
  }) => {
    await set_order_mode(page, `balanced-stable`)
    await wait_for_masonry_stable(page)

    await click_button(page, `add-5-items-btn`)
    await wait_for_masonry_stable(page)

    const before = await get_column_assignments(page)

    await click_button(page, `remove-last-btn`)
    await click_button(page, `remove-last-btn`)
    await wait_for_masonry_stable(page)

    // survivors keep their columns; the two removed ids are simply gone
    const remaining = await get_column_assignments(page)
    const survivors = new Map([...before].filter(([id]) => remaining.has(id)))
    await verify_stability(page, survivors, `After removal`)
  })
})
