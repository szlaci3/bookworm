import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createNaveScene } from '../features/nave/createNaveScene';
import { FLASHCARDS } from '../features/nave/flashcards';
import '../features/nave/nave.css';

export default function NavePage() {
  const [index, setIndex] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createNaveScene> | null>(null);
  const current = FLASHCARDS[index];
  useEffect(() => {
    if (!host.current) return;
    try {
      scene.current = createNaveScene(host.current, setIndex, () => setUnavailable(true));
      scene.current.update(FLASHCARDS, true);
    } catch { queueMicrotask(() => setUnavailable(true)); }
    return () => { scene.current?.dispose(); scene.current = null; };
  }, []);
  const controls = (direction: number) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.blur(); scene.current?.move(direction);
    },
    onPointerUp: () => scene.current?.move(0),
    onPointerCancel: () => scene.current?.move(0),
    onLostPointerCapture: () => scene.current?.move(0),
    onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); scene.current?.move(direction); }
    },
    onKeyUp: () => scene.current?.move(0),
    onBlur: () => scene.current?.move(0),
  });
  return (
    <section className="nave-page" aria-label="Chinese to Dutch stone flashcards">
      <div className="nave-viewport" ref={host} />
      <div className="nave-heading"><span>CHINESE → DUTCH</span><h1>A walk through words</h1><p>Dark stone: Chinese · Pale stone: Dutch</p></div>
      {unavailable && <div className="nave-notice" role="alert">3D rendering is unavailable. <Link to="/2d">Browse the 2D catalog</Link></div>}
      <div className="nave-bottom">
        <div className="nave-progress" aria-live="polite">{index + 1} / {FLASHCARDS.length}<span lang={current.language}>{current.title}</span></div>
        <div className="nave-controls" aria-label="Movement controls">
          <button {...controls(-1)} disabled={index === 0} aria-label="Walk backward"><span>↓</span><small>Backward</small></button>
          <div className="nave-controls__hint">WALK THE WORDS<br/><span>↑ &nbsp; ↓</span></div>
          <button {...controls(1)} disabled={index === FLASHCARDS.length - 1} aria-label="Walk forward"><span>↑</span><small>Forward</small></button>
        </div>
        <div className="nave-page-status">Read the word. Move forward for its translation.</div>
      </div>
    </section>
  );
}
