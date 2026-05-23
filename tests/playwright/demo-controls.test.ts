import { expect, test, type Page } from '@playwright/test'

const edge_items = (page: Page) => page.locator(`.masonry-container .item`)

function edge_item_heights(page: Page): Promise<number[]> {
  return edge_items(page).evaluateAll((elements) =>
    elements.map((element) => Number.parseFloat(getComputedStyle(element).height)),
  )
}

const virtual_total_items = (page: Page) =>
  page.locator(`.stat`).filter({ hasText: `Total Items` }).locator(`.stat-value`)

test.describe(`Demo controls`, () => {
  test(`edge cases item settings update rendered items immediately`, async ({ page }) => {
    await page.goto(`/edge-cases`, { waitUntil: `networkidle` })
    await expect(edge_items(page).first()).toBeVisible()
    await expect(edge_items(page)).toHaveCount(20)

    const item_settings = page
      .locator(`.control-group`)
      .filter({ hasText: `Item Settings` })
    const count = page.getByLabel(/Number of items/)
    await count.fill(`7`)
    await expect(edge_items(page)).toHaveCount(7)

    await item_settings.getByRole(`button`, { name: /Add/ }).click()
    await expect(edge_items(page)).toHaveCount(8)
    await expect(count).toHaveValue(`8`)

    await item_settings.getByRole(`button`, { name: /Remove/ }).click()
    await expect(edge_items(page)).toHaveCount(7)
    await expect(count).toHaveValue(`7`)

    await item_settings.getByRole(`button`, { name: /Reroll/ }).click()
    await expect(edge_items(page)).toHaveCount(7)

    await item_settings.getByRole(`button`, { name: /Shuffle/ }).click()
    await expect(edge_items(page)).toHaveCount(7)

    await page.getByLabel(/Min height/).fill(`250`)
    await expect
      .poll(async () => {
        const heights = await edge_item_heights(page)
        return heights.length === 7 && heights.every((height) => height >= 250)
      })
      .toBe(true)

    await page.getByLabel(/Max height/).fill(`260`)
    await expect
      .poll(async () => {
        const heights = await edge_item_heights(page)
        return heights.every((height) => height >= 250 && height <= 260)
      })
      .toBe(true)

    await page.getByLabel(/Fixed height/).check()
    await expect.poll(() => edge_item_heights(page)).toEqual(Array(7).fill(250))

    await item_settings.getByRole(`button`, { name: /Clear/ }).click()
    await expect(edge_items(page)).toHaveCount(0)
    await expect(count).toHaveValue(`0`)
  })

  test(`virtual scroll count slider updates rendered item state immediately`, async ({
    page,
  }) => {
    await page.goto(`/virtual-scroll`, { waitUntil: `networkidle` })
    await expect(virtual_total_items(page)).toHaveText(`2,000`)

    const count = page.getByLabel(/Count/)
    await count.fill(`500`)
    await expect(virtual_total_items(page)).toHaveText(`500`)

    await count.fill(`1000`)
    await expect(virtual_total_items(page)).toHaveText(`1,000`)

    await page.getByRole(`button`, { name: /Regenerate Items/ }).click()
    await expect(virtual_total_items(page)).toHaveText(`1,000`)
  })
})
