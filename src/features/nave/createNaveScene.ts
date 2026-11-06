import * as THREE from 'three';
import type { Book } from '../../types/books';
import { bookCoverUrl } from '../../utils/bookCover';
import { BOOK_NEAR_DISTANCE, BOOK_SPACING, VISIBLE_BOOK_COUNT, WALK_SPEED, clampPosition, currentBookIndex, isMovementTarget } from './navigation';

function paintedTexture(kind: 'wall' | 'floor' | 'pages') {
  const canvas = document.createElement('canvas');
  canvas.width = kind === 'wall' ? 512 : 256;
  canvas.height = kind === 'wall' ? 1024 : 256;
  const ctx = canvas.getContext('2d')!;
  const { width: w, height: h } = canvas;
  ctx.fillStyle = kind === 'pages' ? '#c6b798' : kind === 'floor' ? '#655342' : '#77604b';
  ctx.fillRect(0, 0, w, h);
  if (kind === 'wall') {
    const glow = ctx.createRadialGradient(w / 2, h * .72, 10, w / 2, h * .65, h * .75);
    glow.addColorStop(0, '#b29565'); glow.addColorStop(1, '#342b26');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c0a16c'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(55, 930); ctx.lineTo(55, 360);
    ctx.quadraticCurveTo(60, 200, 256, 110); ctx.quadraticCurveTo(450, 200, 457, 360);
    ctx.lineTo(457, 930); ctx.closePath(); ctx.stroke();
    // Painted fresco and banner; no extra ornamental meshes or lights.
    ctx.fillStyle = '#303c43'; ctx.fillRect(208, 255, 96, 310);
    ctx.beginPath(); ctx.moveTo(208, 565); ctx.lineTo(256, 615); ctx.lineTo(304, 565); ctx.fill();
    ctx.strokeStyle = '#a98b57'; ctx.lineWidth = 3;
    for (let y = 290; y < 540; y += 70) {
      ctx.beginPath(); ctx.moveTo(256, y - 20); ctx.lineTo(256, y + 30);
      ctx.moveTo(236, y); ctx.quadraticCurveTo(256, y - 24, 276, y);
      ctx.moveTo(236, y + 15); ctx.quadraticCurveTo(256, y + 34, 276, y + 15); ctx.stroke();
    }
    ctx.globalAlpha = .16;
    for (let x = 80; x < w - 50; x += 40) for (let y = 650; y < 900; y += 55) {
      ctx.beginPath(); ctx.ellipse(x, y, 12, 25, 0, 0, Math.PI * 2); ctx.stroke();
    }
  } else {
    ctx.strokeStyle = kind === 'pages' ? '#918575' : '#302923'; ctx.lineWidth = 1;
    for (let y = 0; y < h; y += kind === 'pages' ? 4 : 64) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      if (kind === 'floor') for (let x = (y % 128 ? 64 : 0); x < w; x += 128) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 64); ctx.stroke();
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (kind === 'floor') { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(5, 50); }
  return texture;
}

export function createNaveScene(host: HTMLElement, onCurrent: (index: number) => void, onError: () => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor('#090909');
  renderer.domElement.setAttribute('aria-label', 'Church library with two rows of books. Use W or Up to walk forward, S or Down to walk backward.');
  renderer.domElement.setAttribute('role', 'img');
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#090909', .026);
  const camera = new THREE.PerspectiveCamera(58, 1, .1, 180);
  camera.position.set(0, 3.3, 0);
  camera.lookAt(0, 3.3, -100);
  scene.add(new THREE.HemisphereLight('#eed8b2', '#292018', 2));
  const light = new THREE.DirectionalLight('#ffe2b1', 2.2);
  light.position.set(-3, 10, 8); scene.add(light);
  const resources = new Set<THREE.BufferGeometry | THREE.Material | THREE.Texture>();
  const keep = <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(resource: T): T => { resources.add(resource); return resource; };
  const wallTexture = keep(paintedTexture('wall'));
  const floorTexture = keep(paintedTexture('floor'));
  const pageTexture = keep(paintedTexture('pages'));
  const stone = keep(new THREE.MeshLambertMaterial({ color: '#77614e' }));
  const trim = keep(new THREE.MeshLambertMaterial({ color: '#a0845c' }));
  const wall = keep(new THREE.MeshBasicMaterial({ map: wallTexture, side: THREE.DoubleSide }));
  const floor = new THREE.Mesh(keep(new THREE.PlaneGeometry(18, 180)), keep(new THREE.MeshLambertMaterial({ map: floorTexture })));
  floor.rotation.x = -Math.PI / 2; floor.position.z = -80; scene.add(floor);
  const nave = new THREE.Group(); scene.add(nave);
  const matrix = new THREE.Matrix4();
  function repeated(geometry: THREE.BufferGeometry, material: THREE.Material, positions: [number, number, number][]) {
    const mesh = new THREE.InstancedMesh(keep(geometry), material, positions.length);
    positions.forEach(([x, y, z], i) => mesh.setMatrixAt(i, matrix.makeTranslation(x, y, z)));
    nave.add(mesh); return mesh;
  }
  const segments = 16;
  const pillars: [number, number, number][] = [];
  const bases: [number, number, number][] = [];
  for (let i = 0; i < segments; i++) for (const side of [-1, 1]) {
    pillars.push([side * 8, 4.8, -i * 10]); bases.push([side * 8, .4, -i * 10]);

  }
  const panels = new THREE.InstancedMesh(keep(new THREE.PlaneGeometry(10, 13)), wall, segments * 2);
  for (let i = 0; i < segments * 2; i++) {
    matrix.makeRotationY(Math.PI / 2);
    matrix.setPosition((i % 2 ? 1 : -1) * 8.4, 6.5, -Math.floor(i / 2) * 10 - 5);
    panels.setMatrixAt(i, matrix);
  }
  nave.add(panels);
  repeated(new THREE.CylinderGeometry(.38, .5, 9.6, 8), stone, pillars);
  repeated(new THREE.BoxGeometry(1.3, .8, 1.3), trim, bases);
  repeated(new THREE.BoxGeometry(1.2, .55, 1.2), trim, pillars.map(([x, , z]) => [x, 9.5, z]));
  const arch = new THREE.CurvePath<THREE.Vector3>();
  arch.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-8, 9.6, 0), new THREE.Vector3(-7, 14.6, 0), new THREE.Vector3(0, 17, 0)));
  arch.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 17, 0), new THREE.Vector3(7, 14.6, 0), new THREE.Vector3(8, 9.6, 0)));
  repeated(new THREE.TubeGeometry(arch, 36, .2, 6, false), trim, Array.from({ length: segments }, (_, i) => [0, 0, -i * 10]));
  const ceiling = new THREE.Mesh(keep(new THREE.PlaneGeometry(18, 180)), keep(new THREE.MeshBasicMaterial({ color: '#191715', side: THREE.DoubleSide })));
  ceiling.rotation.x = Math.PI / 2; ceiling.position.set(0, 17, -80); scene.add(ceiling);
  const leather = keep(new THREE.MeshLambertMaterial({ color: '#301a12' }));
  const pages = keep(new THREE.MeshLambertMaterial({ map: pageTexture }));
  const bookGeometry = keep(new THREE.BoxGeometry(3.3, 5.3, .48));
  const frontGeometry = keep(new THREE.PlaneGeometry(3.3, 5.3));
  const bookMeshes = new Map<string, THREE.Group>();
  const loader = new THREE.TextureLoader();
  let books: Book[] = [], position = 0, current = -1, direction = 0, frame = 0, previousTime = 0, disposed = false;
  const heldKeys = new Set<string>();
  const placeholder = (book: Book) => {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 410;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#47342b'; ctx.fillRect(0, 0, 256, 410);
    ctx.strokeStyle = '#b19463'; ctx.strokeRect(15, 15, 226, 380);
    ctx.fillStyle = '#ead9b7'; ctx.font = '22px Georgia'; ctx.textAlign = 'center';
    const words = book.title.split(' '); let line = '', y = 135;
    for (const word of words) {
      if (ctx.measureText(line + word).width > 205) { ctx.fillText(line, 128, y); line = ''; y += 30; }
      line += word + ' ';
    }
    ctx.fillText(line, 128, y);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  };
  function removeBook(id: string, group: THREE.Group) {
    scene.remove(group);
    const cover = group.children[1] as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
    cover.material.map?.dispose(); cover.material.dispose(); bookMeshes.delete(id);
  }
  function render() {
    if (disposed) return;
    nave.position.z = position % 10;
    floor.position.z = -80 + position % 8;
    const index = currentBookIndex(position, books.length);
    if (index !== current) { current = index; onCurrent(index); }
    const visible = books.slice(index, index + VISIBLE_BOOK_COUNT);
    const ids = new Set(visible.map(book => book.id));
    for (const [id, mesh] of bookMeshes) if (!ids.has(id)) removeBook(id, mesh);
    visible.forEach((book, offset) => {
      const bookIndex = index + offset;
      let group = bookMeshes.get(book.id);
      if (!group) {
        group = new THREE.Group();
        // Box faces: right = pages, left = plain dark-brown spine.
        group.add(new THREE.Mesh(bookGeometry, [pages, leather, pages, leather, leather, leather]));
        const material = new THREE.MeshBasicMaterial({ map: placeholder(book) });
        const cover = new THREE.Mesh(frontGeometry, material); cover.position.z = .245; group.add(cover);
        bookMeshes.set(book.id, group); scene.add(group);
        const url = bookCoverUrl(book.coverId);
        if (url) loader.load(url, texture => {
          if (disposed || bookMeshes.get(book.id) !== group) { texture.dispose(); return; }
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
          material.map?.dispose(); material.map = texture; material.needsUpdate = true; invalidate();
        }, undefined, () => { /* Keep the title cover when an image is missing. */ });
      }
      // Remove each passed book before it can fill or clip through the viewport.
      group.position.set(bookIndex % 2 ? 3.75 : -3.75, 3.05, -(BOOK_NEAR_DISTANCE + BOOK_SPACING + bookIndex * BOOK_SPACING - position));
    });
    renderer.render(scene, camera);
  }
  function tick(time: number) {
    frame = 0;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, .15) : 0;
    previousTime = time;
    const keyboardDirection = Number(heldKeys.has('w') || heldKeys.has('arrowup')) - Number(heldKeys.has('s') || heldKeys.has('arrowdown'));
    const movement = direction || keyboardDirection;
    position = clampPosition(position + movement * WALK_SPEED * delta, books.length);
    render();
    if (movement) frame = requestAnimationFrame(tick); else previousTime = 0;
  }
  function invalidate() { if (!disposed && !frame) frame = requestAnimationFrame(tick); }
  const keydown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (event.altKey || event.ctrlKey || event.metaKey || isMovementTarget(event.target) || !['w', 's', 'arrowup', 'arrowdown'].includes(key)) return;
    event.preventDefault(); heldKeys.add(key); invalidate();
  };
  const keyup = (event: KeyboardEvent) => { heldKeys.delete(event.key.toLowerCase()); };
  const stop = () => { heldKeys.clear(); direction = 0; };
  const visibility = () => { if (document.hidden) stop(); };
  const contextLost = (event: Event) => { event.preventDefault(); stop(); onError(); };
  window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup); window.addEventListener('blur', stop);
  document.addEventListener('visibilitychange', visibility); renderer.domElement.addEventListener('webglcontextlost', contextLost);
  const observer = new ResizeObserver(() => {
    camera.aspect = host.clientWidth / Math.max(1, host.clientHeight);
    // Preserve the full aisle on narrow screens instead of cropping both covers.
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(58 / 2)) * Math.max(1, 1.25 / camera.aspect)));
    camera.updateProjectionMatrix();
    renderer.setSize(host.clientWidth, host.clientHeight); invalidate();
  });
  observer.observe(host); invalidate();
  return {
    update(next: Book[], reset: boolean) { books = next; if (reset) { position = 0; current = -1; stop(); } position = clampPosition(position, books.length); invalidate(); },
    move(value: number) { direction = value; invalidate(); },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', visibility); renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      for (const [id, mesh] of bookMeshes) removeBook(id, mesh);
      resources.forEach(resource => resource.dispose()); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
