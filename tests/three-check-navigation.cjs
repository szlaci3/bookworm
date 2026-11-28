const assert = require('node:assert/strict');
const path = require('node:path');

// Observe the matrices actually drawn for the nave. Its instanced meshes have
// world-aligned local axes. Skip the floor reflection's offscreen render pass.
async function observeCamera(page) {
  await page.evaluate(() => {
    const gl = document.querySelector('.nave-viewport canvas').getContext('webgl2');
    window.poses = [];
    const draw = gl.drawElementsInstanced;
    let sampled = false;
    gl.drawElementsInstanced = function (...args) {
      if (!sampled && !gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING)) {
        const program = gl.getParameter(gl.CURRENT_PROGRAM);
        const matrix = gl.getUniform(program, gl.getUniformLocation(program, 'modelViewMatrix'));
        const yaw = Math.atan2(matrix[2], matrix[10]) * 180 / Math.PI;
        const pitch = -Math.asin(matrix[6]) * 180 / Math.PI;
        window.poses.push({ ms: performance.now(), yaw, pitch });
        sampled = true;
        requestAnimationFrame(() => { sampled = false; });
      }
      return draw.apply(this, args);
    };
  });
}

module.exports = async ({ page, dir, checkRenderer, report }) => {
  const canvas = page.locator('.nave-viewport canvas');
  const left = page.getByRole('button', { name: 'Turn left' });
  const right = page.getByRole('button', { name: 'Turn right' });
  await page.getByRole('heading', { name: 'The Last Kingdom' }).waitFor();
  await page.waitForLoadState('networkidle');
  report.graphics = await checkRenderer(canvas);
  await page.getByRole('button', { name: 'Hide details' }).click();
  await observeCamera(page);
  await page.setViewportSize({ width: 800, height: 540 });
  const screenshot = name => page.screenshot({ path: path.join(dir, name + '.png') });
  const pose = () => page.evaluate(() => window.poses.at(-1));
  const waitYaw = (min, max) => page.waitForFunction(([lo, hi]) => {
    const angle = window.poses.at(-1)?.yaw;
    return angle >= lo && angle <= hi;
  }, [min, max]);
  await waitYaw(-0.01, 0.01);
  const initial = await screenshot('before');
  const start = await page.evaluate(() => window.poses.length);
  await left.click();
  await waitYaw(20, 42);
  await screenshot('mid-turn');
  await waitYaw(89.99, 90.01);
  const steps = await page.evaluate(start => window.poses.slice(start), start);
  report.leftTurn = steps;
  const different = steps.filter((p, i) => i && p.yaw > steps[i - 1].yaw + 0.001);
  assert.ok(different.length >= 12, 'quarter turn visibly traverses intermediate angles');
  assert.ok(steps.every((p, i) => !i || (p.yaw >= steps[i - 1].yaw - 0.001 && p.yaw - steps[i - 1].yaw < 7)));
  assert.ok(steps.at(-1).ms - steps[0].ms >= 1800, 'quarter turn takes about two seconds or longer');
  await screenshot('left');
  await page.keyboard.press('ArrowRight');
  await waitYaw(-0.01, 0.01);
  assert.ok(initial.equals(await screenshot('restored')), 'opposite animated turns restore the original pixels');

  // Stop a held pointer between cardinal headings, away from the button.
  const box = await right.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await waitYaw(-35, -22);
  await page.mouse.move(20, 180);
  await page.mouse.up();
  const stopped = await screenshot('released');
  assert.ok((await pose()).yaw < -15 && (await pose()).yaw > -80);
  await page.waitForTimeout(400);
  assert.ok(stopped.equals(await screenshot('still')), 'release holds the exact rendered view');
  report.released = await pose();

  await page.keyboard.down('ArrowLeft');
  await waitYaw(12, 30);
  await page.keyboard.up('ArrowLeft');
  const keyStop = await pose();
  assert.ok(keyStop.yaw < 60);
  await page.getByRole('textbox', { name: 'Search books' }).focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(350);
  assert.equal((await pose()).yaw, keyStop.yaw, 'form focus and released key leave the view still');

  // Drag diagonally to a pitched, non-cardinal view and retrace the gesture.
  await page.mouse.move(350, 240);
  await page.mouse.down();
  await page.mouse.move(465, 182, { steps: 8 });
  await page.mouse.up();
  await page.waitForFunction(() => window.poses.at(-1).pitch > 5);
  report.dragged = await pose();
  assert.ok(report.dragged.yaw < keyStop.yaw - 8);
  await screenshot('free-look');
  await page.mouse.down();
  await page.mouse.move(350, 240, { steps: 8 });
  await page.mouse.up();
  await page.waitForFunction(y => {
    const p = window.poses.at(-1);
    return Math.abs(p.yaw - y) < 0.01 && Math.abs(p.pitch) < 0.01;
  }, keyStop.yaw);
  const prior = await page.screenshot({ clip: { x: 60, y: 170, width: 600, height: 130 } });
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
  await waitYaw(-170, -100); // Pass through the rear half of the nave.
  await waitYaw(keyStop.yaw - 0.01, keyStop.yaw + 0.01);
  assert.ok(prior.equals(await page.screenshot({ clip: { x: 60, y: 170, width: 600, height: 130 } })),
    'four queued turns return to the same non-cardinal view');
  assert.match(await page.locator('.nave-progress').innerText(), /^1 \/ /);
};
