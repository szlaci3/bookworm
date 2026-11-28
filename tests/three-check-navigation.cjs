const assert = require('node:assert/strict');
const path = require('node:path');

// Run with three-check app http://127.0.0.1:5173/3d tests/three-check-navigation.cjs
module.exports = async ({ page, dir, checkRenderer, report }) => {
  const canvas = page.locator('.nave-viewport canvas');
  const left = page.getByRole('button', { name: 'Turn left' });
  const right = page.getByRole('button', { name: 'Turn right' });
  await page.getByRole('heading', { name: 'The Last Kingdom' }).waitFor();
  await page.waitForLoadState('networkidle');
  report.graphics = await checkRenderer(canvas);
  await page.getByRole('button', { name: 'Hide details' }).click();
  await canvas.click({ position: { x: 100, y: 180 } });

  // Compare an unobstructed slice of the composited scene. The full screenshots
  // also retain the controls and book counter for human inspection.
  const bounds = await canvas.boundingBox();
  const clip = { x: bounds.x + 40, y: bounds.y + 130, width: bounds.width - 80, height: 180 };
  async function capture(name) {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    if (name) await page.screenshot({ path: path.join(dir, name + '.png') });
    return page.screenshot({ clip });
  }
  const front = await capture('before');
  await page.keyboard.down('ArrowLeft');
  await page.keyboard.down('ArrowLeft'); // A held key generates a repeat.
  await page.keyboard.up('ArrowLeft');
  const leftView = await capture('left');
  assert.ok(!front.equals(leftView), 'left key changes the view');

  await right.click();
  assert.ok(front.equals(await capture()), 'right button undoes one held left key');
  await right.click();
  const rightView = await capture('right');
  assert.ok(!rightView.equals(front) && !rightView.equals(leftView), 'right and left show different walls');
  await page.keyboard.press('ArrowRight');
  const rear = await capture('rear');
  assert.ok([front, leftView, rightView].every(view => !view.equals(rear)), 'rear is a fourth distinct view');
  await page.keyboard.press('ArrowRight');
  assert.ok(leftView.equals(await capture()), 'three right turns reach the left wall');
  await page.keyboard.press('ArrowRight');
  assert.ok(front.equals(await capture('restored')), 'four right turns restore the initial pixels');

  await left.click();
  assert.ok(leftView.equals(await capture()), 'left button matches the keyboard');
  await page.getByRole('textbox', { name: 'Search books' }).focus();
  await page.keyboard.press('ArrowRight');
  assert.ok(leftView.equals(await capture()), 'editing a search preserves the view');
  assert.match(await page.locator('.nave-progress').innerText(), /^1 \/ /);
};
