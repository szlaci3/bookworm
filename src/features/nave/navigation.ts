// World units. At the near cutoff a cover occupies roughly 60% of view height.
export const BOOK_SPACING = 3.6;
export const BOOK_NEAR_DISTANCE = 8;
export const DETAIL_PRELOAD_COUNT = 2;
export const PAGE_PRELOAD_REMAINING = 12;
export const VISIBLE_BOOK_COUNT = 18;
export const WALK_SPEED = 5;

export function clampPosition(position: number, count: number) {
  return Math.max(0, Math.min(position, Math.max(0, count - 1) * BOOK_SPACING));
}
export function currentBookIndex(position: number, count: number) {
  return count ? Math.min(count - 1, Math.floor((position + 0.00001) / BOOK_SPACING)) : 0;
}
export function isMovementTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, button, a, summary, [contenteditable="true"], [role="dialog"]'));
}
