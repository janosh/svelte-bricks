// deno-lint-ignore-file no-await-in-loop no-boolean-literal-for-arguments
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

// Get item IDs in a specific column (in DOM order)
export async function get_column_item_ids(
  page: Page,
  col_idx: number,
): Promise<number[]> {
  const items = page.locator(`#test-masonry .col-${col_idx} [data-item-id]`)
  const ids: number[] = []
  const count = await items.count()
  for (let idx = 0; idx < count; idx++) {
    const id_str = await items.nth(idx).getAttribute(`data-item-id`)
    if (id_str) ids.push(parseInt(id_str, 10))
  }
  return ids
}

// Get all item IDs across all columns (returns array of arrays by column)
export async function get_all_column_item_ids(page: Page): Promise<number[][]> {
  const columns = get_columns(page)
  const col_count = await columns.count()
  const result: number[][] = []
  for (let col_idx = 0; col_idx < col_count; col_idx++) {
    result.push(await get_column_item_ids(page, col_idx))
  }
  return result
}

// Set the order mode via dropdown
export async function set_order_mode(page: Page, order: string): Promise<void> {
  await page.locator(`[data-testid="order-select"]`).selectOption(order)
  await page.waitForTimeout(100) // Brief wait for reactivity
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
  const match = text?.match(/Items: (\d+)/)
  return match ? parseInt(match[1], 10) : 0
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

// Assert that items across columns follow row-first order (round-robin)
export async function assert_row_first_order(page: Page, n_cols: number): Promise<void> {
  const col_ids = await get_all_column_item_ids(page)
  for (let col_idx = 0; col_idx < n_cols; col_idx++) {
    for (const id of col_ids[col_idx]) {
      expect(id % n_cols, `Item ${id} should be in column ${id % n_cols}`).toBe(col_idx)
    }
  }
}

// Get all item IDs as a flat array
export async function get_all_item_ids(page: Page): Promise<number[]> {
  const items = get_items(page)
  const ids: number[] = []
  const count = await items.count()
  for (let idx = 0; idx < count; idx++) {
    const id_str = await items.nth(idx).getAttribute(`data-item-id`)
    if (id_str) ids.push(parseInt(id_str, 10))
  }
  return ids.sort((a, b) => a - b)
}
