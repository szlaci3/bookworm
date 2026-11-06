import { expect, test } from '@playwright/test';

// The Node request layer trusts the configured environment CA without changing browser trust.
test.beforeEach(async ({ page }) => {
  if (process.env.BOOKWORM_TEST_PROXY) {
    await page.route('https://**/*', async route => {
      const response = await route.fetch();
      await route.fulfill({ response });
    });
  }
});

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
  try { await expect.poll(() => page.locator('.nave-eyebrow').textContent(), { timeout: 20000, intervals: [50] }).toBe(`CURRENT BOOK · ${number}`); }
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
    await route.fulfill({ json: { numFound: 102, docs: pageNumber === 1 ? Array.from({length: 14}, (_, i) => work(`OLPAGE${i}W`, `Page one ${i}`)) : [work('OLNEXT0W', 'Page two'),work('OLNEXT1W', 'Page three')] } });
  });
  await page.goto('/3d'); await search(page, 'paging');
  await expect(page.locator('.nave-eyebrow')).toHaveText('CURRENT BOOK · 1');
  expect(pages).toEqual([1]);
  await walkTo(page, 3);
  await expect(page.getByRole('button', { name: 'Retry loading more books' })).toBeVisible();
  await expect(page.locator('.nave-eyebrow')).toHaveText('CURRENT BOOK · 3');
  fail = false;
  await page.getByRole('button', { name: 'Retry loading more books' }).click();
  await expect(page.getByRole('button', { name: 'Retry loading more books' })).toHaveCount(0);
  await expect(page.locator('.nave-eyebrow')).toHaveText('CURRENT BOOK · 3');
  await walkTo(page, 16);
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
  const touch = await page.context().newCDPSession(page);
  await touch.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }] });
  await expect(page.locator('.nave-eyebrow')).toHaveCount(0);
  await page.waitForTimeout(1300);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
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

test('details preload only two ahead and the current sidebar shows loading then details', async ({ page }) => {
  await fakeLibrary(page);
  const requested: string[] = [];
  let release: (() => Promise<void>) | undefined;
  await page.route('https://openlibrary.org/search.json**', route => route.fulfill({ json: {
    numFound: 6, docs: Array.from({ length: 6 }, (_, i) => work(`OLPRELOAD${i}W`, `Preload ${i}`)),
  } }));
  await page.route('https://openlibrary.org/works/OLPRELOAD*', async route => {
    requested.push(route.request().url());
    if (route.request().url().includes('OLPRELOAD0W')) {
      await new Promise<void>(resolve => { release = async () => { await route.fulfill({ json: { title: 'Ready', description: 'Loaded description' } }); resolve(); }; });
    } else await route.fulfill({ json: { title: 'Ready', description: 'Prefetched description' } });
  });
  await page.goto('/3d'); await search(page, 'preloading');
  await expect(page.getByText('Loading book details…')).toBeVisible();
  await expect.poll(() => requested.length).toBe(3);
  expect(requested.map(url => url.match(/OLPRELOAD\dW/)![0]).sort()).toEqual(['OLPRELOAD0W', 'OLPRELOAD1W', 'OLPRELOAD2W']);
  await release!();
  await expect(page.locator('.nave-description')).toHaveText('Loaded description');
  await walkTo(page, 2);
  await expect(page.locator('.nave-description')).toHaveText('Prefetched description');
  await expect.poll(() => requested.length).toBe(4);
});

test('2D searches stay 2D, pagination returns to first page on a new search, filters apply from the top bar', async ({ page }) => {
  await fakeLibrary(page);
  const requests: URL[] = [];
  await page.route('https://openlibrary.org/search.json**', async route => {
    const url = new URL(route.request().url()); requests.push(url);
    await route.fulfill({ json: { numFound: 201, docs: [work('OL2DTESTW', '2D result')] } });
  });
  await page.goto('/2d'); await search(page, 'first');
  await expect(page.locator('.results-grid')).toContainText('2D result');
  await page.getByRole('button', { name: 'Next', exact: true }).first().click();
  await expect.poll(() => requests.at(-1)?.searchParams.get('page')).toBe('2');
  await page.getByLabel('More search and navigation options').click();
  await page.getByRole('textbox', { name: 'Author contains' }).fill('Tolkien');
  await page.getByRole('spinbutton', { name: 'Publication year from' }).fill('1950');
  await page.getByRole('combobox', { name: 'Sort by' }).selectOption('year_desc');
  await search(page, 'second');
  await expect.poll(() => requests.at(-1)?.searchParams.get('q')).toBe('second first_publish_year:[1950 TO *]');
  expect(requests.at(-1)?.searchParams.get('page')).toBe('1');
  expect(requests.at(-1)?.searchParams.get('author')).toBe('Tolkien');
  expect(requests.at(-1)?.searchParams.get('sort')).toBe('new');
  await expect(page).toHaveURL(/\/2d$/);
  await page.getByLabel('More search and navigation options').click();
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Search books' })).toHaveValue('');
  await expect(page.locator('.results-grid')).toHaveCount(0);
});
