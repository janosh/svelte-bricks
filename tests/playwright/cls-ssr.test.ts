import { expect, test, type Browser, type Page } from '@playwright/test'

const viewport = { width: 500, height: 800 }
const route = `/test/initial-cols`

async function open_page(browser: Browser, java_script_enabled: boolean): Promise<Page> {
  const page = await browser.newPage({ javaScriptEnabled: java_script_enabled, viewport })
  await page.goto(route, {
    waitUntil: java_script_enabled ? `networkidle` : `domcontentloaded`,
  })
  return page
}

const masonry_columns = (page: Page, test_id: string) =>
  page.locator(`[data-testid="${test_id}"] div.masonry > div.col`)

const column_displays = (page: Page, test_id: string): Promise<string[]> =>
  masonry_columns(page, test_id).evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).display),
  )

const visible_item_ids = (page: Page, test_id: string): Promise<string[][]> =>
  masonry_columns(page, test_id).evaluateAll((elements) =>
    elements
      .filter((element) => getComputedStyle(element).display !== `none`)
      .map((element) =>
        Array.from(element.querySelectorAll(`[data-item-id]`)).map(
          (item) => item.getAttribute(`data-item-id`) ?? ``,
        ),
      ),
  )

const expected_displays = (visible_count: number, total_count: number): string[] => [
  ...Array(visible_count).fill(`grid`),
  ...Array(total_count - visible_count).fill(`none`),
]

const ssr_cases = [
  [`exact-masonry`, 2, 2],
  [`wide-masonry`, 3, 3],
  [`fallback-masonry`, 3, 8],
] as const

test(`SSR CSS is scoped and initialCols prevents hydration redistribution`, async ({
  browser,
}) => {
  const ssr_page = await open_page(browser, false)
  await Promise.all(
    ssr_cases.map(async ([test_id, visible_count, total_count]) => {
      await expect(masonry_columns(ssr_page, test_id)).toHaveCount(total_count)
      expect(await column_displays(ssr_page, test_id)).toEqual(
        expected_displays(visible_count, total_count),
      )
    }),
  )
  const ssr_exact_items = await visible_item_ids(ssr_page, `exact-masonry`)
  const ssr_wide_items = await visible_item_ids(ssr_page, `wide-masonry`)
  await ssr_page.close()

  const hydrated_page = await open_page(browser, true)
  await expect(hydrated_page.getByTestId(`exact-masonry-width`)).toHaveText(
    `Measured width: 400px`,
  )

  expect(await visible_item_ids(hydrated_page, `exact-masonry`)).toEqual(ssr_exact_items)
  expect(await visible_item_ids(hydrated_page, `wide-masonry`)).toEqual(ssr_wide_items)
  await hydrated_page.close()
})
