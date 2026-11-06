import { expect, test } from '@playwright/test';

const work = (id: string, title: string) => ({ key: `/works/${id}`, title, author_name: ['Test Author'], first_publish_year: 2020 });
async function fakeLibrary(page: import('@playwright/test').Page) {
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://covers.openlibrary.org/**', route => route.fulfill({ status: 404, body: '' }));
  await page.route('https://openlibrary.org/works/**', route => route.fulfill({ json: { title: 'Detailed work', description: 'A test description', subjects: ['History'] } }));
}
async function search(page: import('@playwright/test').Page, query: string) {
  await page.getByRole('textbox', { name: 'Search books' }).fill(query);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
}
async function walkTo(page: import('@playwright/test').Page, number: number, key = 'w') {
  await page.locator('canvas').click({ position: { x: 20, y: 200 } });
  await page.keyboard.down(key);
  try { await expect(page.locator('.nave-eyebrow')).toHaveText(`CURRENT BOOK · ${number}`, { timeout: 20000 }); }
  finally { await page.keyboard.up(key); }
}

test('3D is default, bundled kingdom makes no API calls, explicit choice survives reload', async ({ page }) => {
  await fakeLibrary(page);
  const searches: string[] = [];
  page.on('request', request => { if (request.url().includes('/search.json')) searches.push(request.url()); });
  await page.goto('/'); await expect(page).toHaveURL(/\/3d$/);
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('.nave-details h2')).toHaveText('The Last Kingdom');
  await expect(page.locator('.nave-description')).toContainText('Bernard Cornwell');
  expect(searches).toEqual([]);
  await page.getByRole('link', { name: '2D', exact: true }).filter({visible: true}).click();
  await expect(page).toHaveURL(/\/2d$/);
  await expect(page.locator('.results-grid > li')).toHaveCount(100);
  await page.goto('/'); await expect(page).toHaveURL(/\/2d$/);
  await page.getByRole('link', { name: '3D', exact: true }).filter({visible: true}).click();
  await page.goto('/'); await expect(page).toHaveURL(/\/3d$/);
  expect(searches).toEqual([]);
});

test('only forward/back move, form typing does not move, new searches retain 3D and reset', async ({ page }) => {
  await fakeLibrary(page);
  await page.route('https://openlibrary.org/search.json**', route => route.fulfill({ json: { numFound: 4, docs: [0,1,2,3].map(i => work(`OLTEST${i}W`, `Result ${i}`)) } }));
  await page.goto('/3d');
  await expect(page.locator('canvas')).toBeVisible();
  await page.keyboard.press('a'); await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.nave-eyebrow')).toHaveText('CURRENT BOOK · 1');
  await walkTo(page, 2);
  await page.getByRole('textbox', { name: 'Search books' }).fill('ssswww');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.nave-eyebrow')).toHaveText('CURRENT BOOK · 2');
  await search(page, 'test');
  await expect(page.locator('.nave-details h2')).toHaveText('Detailed work');
  await expect(page.locator('.nave-eyebrow')).toHaveText('CURRENT BOOK · 1');
  await expect(page).toHaveURL(/\/3d$/);
  await walkTo(page, 4);
  await expect(page.getByRole('button', { name: 'Walk forward' })).toBeDisabled();
  await page.keyboard.down('w'); await page.waitForTimeout(500); await page.keyboard.up('w');
  await expect(page.locator('.nave-eyebrow')).toHaveText('CURRENT BOOK · 4');
  await walkTo(page, 1, 's');
  await expect(page.getByRole('button', { name: 'Walk backward' })).toBeDisabled();
});

test('approaching end appends next page, loading and retry remain usable', async ({ page }) => {
  await fakeLibrary(page);
  const pages: number[] = [];
  let fail = true;
  await page.route('https://openlibrary.org/search.json**', async route => {
    const pageNumber = Number(new URL(route.request().url()).searchParams.get('page') || 1);
    pages.push(pageNumber);
    if (pageNumber === 2 && fail) { await route.fulfill({ status: 503, body: '' }); return; }
    await route.fulfill({ json: { numFound: 102, docs: pageNumber === 1 ? [work('OLPAGE1W', 'Page one')] : [work('OLPAGE2W', 'Page two'),work('OLPAGE3W', 'Page three')] } });
  });
  await page.goto('/3d'); await search(page, 'paging');
  await expect(page.getByRole('button', { name: 'Retry loading more books' })).toBeVisible();
  await expect(page.locator('.nave-eyebrow')).toHaveText('CURRENT BOOK · 1');
  fail = false;
  await page.getByRole('button', { name: 'Retry loading more books' }).click();
  await expect(page.getByRole('button', { name: 'Retry loading more books' })).toHaveCount(0);
  await walkTo(page, 3);
  await expect(page.getByRole('button', { name: 'Walk forward' })).toBeDisabled();
  expect(pages).toEqual([1, 2, 2]);
});

test('mobile menu, sidebar collapse, touch controls and WebGL fallback', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fakeLibrary(page); await page.goto('/3d');
  await expect(page.getByRole('button', { name: 'Book details' })).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Book details' }).click();
  await expect(page.locator('.nave-details h2')).toHaveText('The Last Kingdom');
  await page.getByRole('button', { name: 'Hide details' }).click();
  const button = page.getByRole('button', { name: 'Walk forward' });
  const bounds = (await button.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await expect(page.locator('.nave-eyebrow')).toHaveCount(0);
  await page.waitForTimeout(1300);
  await page.mouse.up();
  await page.getByRole('button', { name: 'Book details' }).click();
  await expect(page.locator('.nave-eyebrow')).not.toHaveText('CURRENT BOOK · 1');
  await page.getByLabel('More search and navigation options').click();
  await expect(page.getByRole('textbox', { name: 'Author contains' })).toBeVisible();
  await page.getByRole('link', { name: '2D', exact: true }).filter({visible: true}).click();
  await expect(page).toHaveURL(/\/2d$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
  await page.goto('/3d');
  await expect(page.getByRole('link', { name: 'Browse the 2D catalog' })).toBeVisible();
});
