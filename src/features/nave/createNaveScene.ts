import { createParquetFloor } from './parquetFloor';
import { architectureTexture } from './architectureTexture';
import * as THREE from 'three';
import type { Flashcard } from './flashcards';
import { BOOK_NEAR_DISTANCE, BOOK_SPACING, BOOK_THICKNESS, VISIBLE_BOOK_COUNT, PASSED_BOOK_CACHE_COUNT, advanceBookDrop, WALK_SPEED, clampPosition, currentBookIndex, isMovementTarget } from './navigation';

export function createNaveScene(host: HTMLElement, onCurrent: (index: number) => void, onError: () => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor('#dceaf4');
  renderer.domElement.setAttribute('aria-label', 'One row of Chinese and Dutch stone flashcards. Use Up to walk forward, Down to walk backward.');
  renderer.domElement.setAttribute('role', 'img');
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#dceaf4', .018);
  const camera = new THREE.PerspectiveCamera(58, 1, .1, 180);
  camera.position.set(0, 3.3, 0);
  camera.lookAt(0, 3.3, -100);
  scene.add(new THREE.HemisphereLight('#ffffff', '#56748b', 1.4));
  const light = new THREE.DirectionalLight('#ffffff', 1.5);
  light.position.set(-3, 10, 8); scene.add(light);
  const resources = new Set<THREE.BufferGeometry | THREE.Material | THREE.Texture>();
  const keep = <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(resource: T): T => { resources.add(resource); return resource; };
  const wallTexture = keep(architectureTexture(true));
  const stone = keep(new THREE.MeshLambertMaterial({ color: '#477fa6' }));
  const trim = keep(new THREE.MeshLambertMaterial({ color: '#6698ba' }));
  const wall = keep(new THREE.MeshBasicMaterial({ map: wallTexture, side: THREE.DoubleSide }));
  // Keep the previous wallpaper width and scale its height by the change in
  // image aspect ratio. Anchor the cropped artwork at the vault spring line.
  const wallHeight = 11;
  const wallpaperScale = 0.90;
  const wallpaperHeight = 16 * wallpaperScale * (1280 / 1239) / (1280 / 960);
  function fitWallpaper(texture: THREE.Texture) {
    texture.repeat.set(1 / wallpaperScale, wallHeight / wallpaperHeight);
    texture.offset.set((1 - texture.repeat.x) / 2, 1 - texture.repeat.y);
  }
  fitWallpaper(wallTexture);
  const parquet = createParquetFloor();
  const floor = parquet.mesh;
  scene.add(floor);
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
    pillars.push([side * 10, 5.5, -i * 10]); bases.push([side * 10, .4, -i * 10]);

  }
  const panels = new THREE.InstancedMesh(keep(new THREE.PlaneGeometry(10, wallHeight)), wall, segments * 2);
  for (let i = 0; i < segments * 2; i++) {
    matrix.makeRotationY(Math.PI / 2);
    matrix.setPosition((i % 2 ? 1 : -1) * 10.5, wallHeight / 2, -Math.floor(i / 2) * 10 - 5);
    panels.setMatrixAt(i, matrix);
  }
  nave.add(panels);
  repeated(new THREE.CylinderGeometry(.55, .65, 11, 12), stone, pillars);
  for (const offset of [-.48, .48]) {
    repeated(new THREE.CylinderGeometry(.18, .23, 11, 8), trim, pillars.map(([x,y,z]) => [x + offset,y,z + .35]));
    repeated(new THREE.CylinderGeometry(.18, .23, 11, 8), trim, pillars.map(([x,y,z]) => [x,y,z + offset]));
  }
  for (const [radius,height,y] of [[1,.35,.18],[.85,.25,.48],[.72,.2,.7],[.78,.3,10.8],[.95,.22,11.05]]) {
    repeated(new THREE.CylinderGeometry(radius, radius + .08, height, 12), trim, bases.map(([x,,z]) => [x,y,z]));
  }
  const archTrim = keep(new THREE.MeshBasicMaterial({ color: '#b6d1e6' }));
  const arch = new THREE.CurvePath<THREE.Vector3>();
  arch.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-10, 11, 0), new THREE.Vector3(-9, 17, 0), new THREE.Vector3(0, 20, 0)));
  arch.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 20, 0), new THREE.Vector3(9, 17, 0), new THREE.Vector3(10, 11, 0)));
  const stations: [number, number, number][] = Array.from({length: segments}, (_, i) => [0,0,-i*10]);
  for (const offset of [-.24, 0, .24]) repeated(new THREE.TubeGeometry(arch, 48, offset ? .11 : .19, 8, false), archTrim, stations.map(([x,y,z]) => [x,y,z+offset]));
  // A continuous pointed vault, built once per bay and instanced into the distance.
  const points = arch.getPoints(48);
  const vertices: number[] = [], uvs: number[] = [], indices: number[] = [];
  points.forEach((point, i) => {
    for (const z of [0,-10]) { vertices.push(point.x, point.y + .12,z); uvs.push(i/48,z/-10); }
    if (i < points.length-1) { const a=i*2; indices.push(a,a+2,a+1,a+1,a+2,a+3); }
  });
  const vault = new THREE.BufferGeometry();
  vault.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  vault.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2)); vault.setIndex(indices); vault.computeVertexNormals();
  const vaultMaterial = keep(new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide, fog: false }));
  repeated(vault,vaultMaterial,stations);
  // Diagonal ribs join each pair of columns to the crown of its bay.
  for (const side of [-1,1]) for (const end of [0,-10]) {
    const rib = new THREE.QuadraticBezierCurve3(new THREE.Vector3(side*10,11,end),new THREE.Vector3(side*8,17,-5),new THREE.Vector3(0,20,-5));
    repeated(new THREE.TubeGeometry(rib,24,.12,6,false),archTrim,stations);
  }
  const blueStone = keep(new THREE.MeshLambertMaterial({ color: '#424f58' }));
  const whiteStone = keep(new THREE.MeshLambertMaterial({ color: '#a9a394' }));
  const stoneHeight = 1.65;
  const stoneCenterY = 2.5 - stoneHeight / 2;
  const reflectionGap = .2;
  const bookGeometry = keep(new THREE.BoxGeometry(5.3, stoneHeight, BOOK_THICKNESS));
  const frontGeometry = keep(new THREE.PlaneGeometry(5.3, stoneHeight));
  const bookMeshes = new Map<string, THREE.Group>();
  const bookDrops = new Map<string, number>();
  // The floor mirrors about y=0. Lower stones only during its reflection pass
  // so their reflected upper edges sit reflectionGap below the real lower edges.
  const reflectScene = floor.onBeforeRender;
  floor.onBeforeRender = (...args) => {
    const reflectionLift = 2 * (stoneCenterY - stoneHeight / 2) - reflectionGap;
    const originalHeights = [...bookMeshes.values()].map(group => [group, group.position.y] as const);
    for (const [group, y] of originalHeights) group.position.y = y - reflectionLift;
    try {
      reflectScene.apply(floor, args);
    } finally {
      for (const [group, y] of originalHeights) {
        group.position.y = y;
        group.updateMatrixWorld();
      }
    }
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let books: Flashcard[] = [], position = 0, current = -1, direction = 0, frame = 0, previousTime = 0, disposed = false;
  const heldKeys = new Set<string>();
  const placeholder = (book: Flashcard) => {
    // Match the face aspect ratio so glyphs retain their natural proportions.
    const canvas = document.createElement('canvas');
    const width = 1024, height = Math.round(width * stoneHeight / 5.3);
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    const chinese = book.language === 'zh';
    ctx.fillStyle = chinese ? '#53616a' : '#bcb6a6';
    ctx.fillRect(0, 0, width, height);
    // Worn slate and limestone flagstones: broad mineral mottling, fine grit,
    // scattered pits and hairline fissures rather than polished marble veins.
    let seed = 53;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 160; i++) {
      const x = random() * width, y = random() * height, radius = 15 + random() * 100;
      const patch = ctx.createRadialGradient(x, y, 0, x, y, radius);
      patch.addColorStop(0, i % 2 ? '#e5ddc51a' : '#171c2020');
      patch.addColorStop(1, '#00000000');
      ctx.fillStyle = patch; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    for (let i = 0; i < 24000; i++) {
      ctx.fillStyle = random() > .5 ? '#eee5cf20' : '#121b2426';
      const size = .5 + random() * 2;
      ctx.fillRect(random() * width, random() * height, size, size);
    }
    for (let i = 0; i < 260; i++) {
      const x = random() * width, y = random() * height;
      ctx.fillStyle = '#151b2538';
      ctx.beginPath(); ctx.ellipse(x, y, 1 + random() * 2, .5 + random(), random() * Math.PI, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f5edda24'; ctx.fillRect(x, y + 2, 2, 1);
    }
    ctx.strokeStyle = '#202a3038'; ctx.lineWidth = .8;
    for (const edge of [0, width]) {
      let x = edge, y = 30 + random() * (height - 60);
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let i = 0; i < 6; i++) {
        x += (edge ? -1 : 1) * (8 + random() * 16); y += random() * 22 - 11;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    const wear = ctx.createLinearGradient(0, 0, 0, height);
    wear.addColorStop(0, '#121b2440'); wear.addColorStop(.12, '#ffffff00');
    wear.addColorStop(.85, '#ffffff00'); wear.addColorStop(1, '#121b2450');
    ctx.fillStyle = wear; ctx.fillRect(0, 0, width, height);
    // Preserve the inset border with a shallow engraved highlight.
    ctx.strokeStyle = chinese ? '#c0c7c080' : '#575e5880';
    ctx.lineWidth = 2; ctx.strokeRect(30, 22, width - 60, height - 44);
    ctx.strokeStyle = '#f0e8d52b'; ctx.lineWidth = 1;
    ctx.strokeRect(32, 24, width - 64, height - 48);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = chinese ? '#f7f3e8' : '#273238';
    ctx.font = '22px sans-serif'; ctx.fillText(chinese ? '中文' : 'NEDERLANDS', width / 2, 65);
    let fontSize = chinese ? 138 : 110;
    const font = () => `${fontSize}px "Noto Sans CJK SC", "Microsoft YaHei", "PingFang SC", sans-serif`;
    ctx.font = font();
    while (ctx.measureText(book.title).width > width - 150) { fontSize -= 4; ctx.font = font(); }
    ctx.fillText(book.title, width / 2, height * .61);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  };
  function removeBook(id: string, group: THREE.Group) {
    scene.remove(group);
    const cover = group.children[1] as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
    cover.material.map?.dispose(); cover.material.dispose(); bookMeshes.delete(id); bookDrops.delete(id);
  }
  function render(delta: number) {
    if (disposed) return false;
    let animating = false;
    nave.position.z = position % 10;
    floor.position.z = -80 + position % 4;
    const index = currentBookIndex(position, books.length);
    if (index !== current) { current = index; onCurrent(index); }
    // Retain the last three covers in GPU memory for immediate backward navigation.
    const start = Math.max(0, index - PASSED_BOOK_CACHE_COUNT);
    const visible = books.slice(start, index + VISIBLE_BOOK_COUNT);
    const ids = new Set(visible.map(book => book.id));
    for (const [id, mesh] of bookMeshes) if (!ids.has(id)) removeBook(id, mesh);
    visible.forEach((book, offset) => {
      const bookIndex = start + offset;
      let group = bookMeshes.get(book.id);
      if (!group) {
        group = new THREE.Group();
        bookDrops.set(book.id, bookIndex < index ? 1 : 0);
        group.add(new THREE.Mesh(bookGeometry, book.language === 'zh' ? blueStone : whiteStone));
        const material = new THREE.MeshBasicMaterial({ map: placeholder(book) });
        const cover = new THREE.Mesh(frontGeometry, material); cover.position.z = BOOK_THICKNESS / 2 + .005; group.add(cover);
        bookMeshes.set(book.id, group); scene.add(group);
      }
      const passed = bookIndex < index;
      const drop = advanceBookDrop(bookDrops.get(book.id) ?? 0, passed, delta, reducedMotion.matches);
      bookDrops.set(book.id, drop);
      animating ||= drop !== (passed ? 1 : 0);
      const easedDrop = drop * drop * (3 - 2 * drop);
      // Keep departing books clear of the camera and move fully below even a portrait frustum.
      const depth = Math.max(BOOK_NEAR_DISTANCE, BOOK_NEAR_DISTANCE + BOOK_SPACING + bookIndex * BOOK_SPACING - position);
      const dropDistance = Math.max(14, Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * depth + 4);
      group.position.set(0, stoneCenterY - easedDrop * dropDistance, -depth);
      // Cached books require no draw calls once the exit completes.
      group.visible = drop < 1;
    });
    renderer.render(scene, camera);
    return animating;
  }
  function tick(time: number) {
    frame = 0;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, .15) : 0;
    previousTime = time;
    const keyboardDirection = Number(heldKeys.has('arrowup')) - Number(heldKeys.has('arrowdown'));
    const movement = direction || keyboardDirection;
    position = clampPosition(position + movement * WALK_SPEED * delta, books.length);
    const animating = render(delta);
    // Stop boundary movement frames while allowing book exit animations to finish.
    const canContinue = movement !== 0 && clampPosition(position + Math.sign(movement), books.length) !== position;
    if (canContinue || animating) frame = requestAnimationFrame(tick); else previousTime = 0;
  }
  function invalidate() { if (!disposed && !frame) frame = requestAnimationFrame(tick); }
  const keydown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (event.altKey || event.ctrlKey || event.metaKey || isMovementTarget(event.target) || !['arrowup', 'arrowdown'].includes(key)) return;
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
    renderer.setSize(host.clientWidth, host.clientHeight);
    parquet.resize(host.clientWidth * renderer.getPixelRatio(), host.clientHeight * renderer.getPixelRatio()); invalidate();
  });
  // One shared image texture for every repeated wall bay.
  const wallpaper = keep(new THREE.TextureLoader().load('/textures/nave-wall-water.jpg', texture => {
    if (disposed) { texture.dispose(); return; }
    wall.map = texture;
    wall.needsUpdate = true;
    invalidate();
  }));
  wallpaper.colorSpace = THREE.SRGBColorSpace;
  fitWallpaper(wallpaper);
  wallpaper.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  observer.observe(host); invalidate();
  return {
    update(next: Flashcard[], reset: boolean) { books = next; if (reset) { position = 0; current = -1; stop(); } position = clampPosition(position, books.length); invalidate(); },
    move(value: number) { direction = value; invalidate(); },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', visibility); renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      for (const [id, mesh] of bookMeshes) removeBook(id, mesh);
      parquet.dispose();
      resources.forEach(resource => resource.dispose()); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
