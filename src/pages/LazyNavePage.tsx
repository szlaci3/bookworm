import { lazy, Suspense } from 'react';
const NavePage = lazy(() => import('./NavePage'));
export default function LazyNavePage() {
  return <Suspense fallback={<div className="state-message">Opening the library…</div>}><NavePage /></Suspense>;
}
