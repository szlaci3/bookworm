import { expect, test } from '@playwright/test';

test('stone flashcards alternate Chinese and Dutch and support backward navigation', async ({ page }) => {
  test.setTimeout(90000);
  await page.route('https://**/*', route => route.abort());
  const detailRequests: string[] = [];
  page.on('request', request => { if (request.url().includes('openlibrary.org/works/')) detailRequests.push(request.url()); });
  await page.goto('/3d');
  await expect(page.getByRole('heading', { name: 'A walk through words' })).toBeVisible();
  const progress = page.locator('.nave-progress');
  await expect(progress).toContainText('1 / 20');
  await expect(progress.locator('[lang="zh"]')).toHaveText('水');
  await page.locator('canvas').click({ position: { x: 20, y: 200 } });
  await page.keyboard.down('ArrowUp');
  try { await expect(progress.locator('[lang="nl"]')).toHaveText('water', { timeout: 20000 }); }
  finally { await page.keyboard.up('ArrowUp'); }
  await page.keyboard.down('ArrowDown');
  try { await expect(progress).toContainText('1 / 20', { timeout: 20000 }); }
  finally { await page.keyboard.up('ArrowDown'); }
  await expect(page.getByRole('button', { name: 'Walk backward' })).toBeDisabled();
  expect(detailRequests).toEqual([]);
});
