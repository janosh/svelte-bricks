import { expect, type Locator, type Page } from '@playwright/test'

// Navigate to masonry test page and wait for it to load
export async function goto_masonry_test(page: Page): Promise<void> {
  await page.goto(`/test/masonry`, { waitUntil: `networkidle` })
  await expect(page.locator(`[data-testid="masonry-container"]`)).toBeVisible()
}

// Get all column elements
export const get_columns = (page: Page): Locator => page.locator(`#test-masonry .col`)

// Get all item elements
export const get_items = (page: Page): Locator =>
  page.locator(`#test-masonry [data-item-id]`)

// Get item IDs per column, in DOM order (one round trip for the whole grid)
export const get_all_column_item_ids = (page: Page): Promise<number[][]> =>
  get_columns(page).evaluateAll((columns) =>
    columns.map((column) =>
      Array.from(column.querySelectorAll(`[data-item-id]`)).map((item) =>
        Number(item.getAttribute(`data-item-id`)),
      ),
    ),
  )

// Map each item ID to the column index it currently sits in
export async function get_column_assignments(page: Page): Promise<Map<number, number>> {
  const assignments = new Map<number, number>()
  for (const [col_idx, ids] of (await get_all_column_item_ids(page)).entries()) {
    for (const id of ids) assignments.set(id, col_idx)
  }
  return assignments
}

// Set the order mode via dropdown
export async function set_order_mode(page: Page, order: string): Promise<void> {
  await page.locator(`[data-testid="order-select"]`).selectOption(order)
  // wait deterministically until the new order has propagated to the page
  await expect(page.locator(`[data-testid="stat-order"]`)).toHaveText(`Order: ${order}`)
}

// Click "Add Item" `count` times, waiting for each add to register before the next
export async function add_items_individually(page: Page, count: number): Promise<void> {
  const start = await get_item_count(page)
  for (let idx = 0; idx < count; idx++) {
    await click_button(page, `add-item-btn`)
    await expect.poll(() => get_item_count(page)).toBe(start + idx + 1)
  }
}

// Click a button by test ID
export async function click_button(page: Page, testid: string): Promise<void> {
  await page.locator(`[data-testid="${testid}"]`).click()
}

// Get the current order mode from stats
export async function get_current_order(page: Page): Promise<string> {
  const text = await page.locator(`[data-testid="stat-order"]`).textContent()
  return text?.replace(`Order: `, ``) ?? ``
}

// Get the current item count from stats
export async function get_item_count(page: Page): Promise<number> {
  const text = await page.locator(`[data-testid="stat-items"]`).textContent()
  const match = text?.match(/Items: (?<count>\d+)/u)
  return match?.groups ? Math.trunc(Number(match.groups.count)) : 0
}

// Wait for masonry to stabilize (items are measured and distributed)
// Uses polling to detect when item count stabilizes rather than fixed timeout
export async function wait_for_masonry_stable(page: Page, timeout = 2000): Promise<void> {
  await expect(get_items(page).first()).toBeVisible({ timeout })
  // Poll until item count stabilizes (no changes for 100ms)
  let prev_count = -1
  await expect
    .poll(
      async () => {
        const count = await get_items(page).count()
        const stable = count === prev_count
        prev_count = count
        return stable
      },
      { timeout, intervals: [50, 100, 100] },
    )
    .toBe(true)
}

// Assert every item is still in the column it was assigned to
export async function verify_stability(
  page: Page,
  expected: Map<number, number>,
  context: string,
): Promise<void> {
  const actual = await get_column_assignments(page)
  for (const [id, expected_col] of expected.entries()) {
    expect(
      actual.get(id),
      `${context}: Item ${id} jumped from column ${expected_col}`,
    ).toBe(expected_col)
  }
}

// Assert that items across columns follow row-first order (round-robin)
export async function assert_row_first_order(page: Page, n_cols: number): Promise<void> {
  const col_ids = await get_all_column_item_ids(page)
  for (let col_idx = 0; col_idx < n_cols; col_idx++) {
    for (const id of col_ids[col_idx]) {
      expect(id % n_cols, `Item ${id} should be in column ${id % n_cols}`).toBe(col_idx)
    }
  }
}

// Get all item IDs across the whole masonry, sorted ascending
export const get_all_item_ids = async (page: Page): Promise<number[]> =>
  (await get_all_column_item_ids(page)).flat().toSorted((a, b) => a - b)
