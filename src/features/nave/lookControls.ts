import { Euler, MathUtils } from 'three';

export type TurnSide = 'left' | 'right';
const TURN_SPEED = Math.PI / 4; // 45 degrees per second
const TAP_MS = 200;

export function createLookControls(rotation: Euler) {
  // World-space yaw followed by local pitch keeps the horizon level.
  rotation.order = 'YXZ';
  let target = rotation.y;
  let press: { source: string; sign: number; start: number; tapTarget: number } | null = null;

  function cancel() {
    press = null;
    target = rotation.y;
  }

  return {
    start(side: TurnSide, source: string) {
      if (press?.source === source) return;
      const sign = side === 'left' ? 1 : -1;
      const base = press ? rotation.y : target;
      press = { source, sign, start: performance.now(), tapTarget: base + sign * Math.PI / 2 };
      target = rotation.y;
    },
    release(source: string, cancelled = false) {
      if (press?.source !== source) return;
      target = !cancelled && performance.now() - press.start < TAP_MS ? press.tapTarget : rotation.y;
      press = null;
    },
    advance(delta: number) {
      const step = TURN_SPEED * delta;
      if (press) rotation.y += press.sign * step;
      else rotation.y += MathUtils.clamp(target - rotation.y, -step, step);
      return press !== null || rotation.y !== target;
    },
    drag(dx: number, dy: number, radiansPerPixel: number) {
      cancel();
      rotation.y -= dx * radiansPerPixel;
      rotation.x = MathUtils.clamp(rotation.x - dy * radiansPerPixel, -Math.PI / 2, Math.PI / 2);
      target = rotation.y;
    },
    cancel,
  };
}
