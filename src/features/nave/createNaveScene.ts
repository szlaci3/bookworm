import { createParquetFloor } from './parquetFloor';
import { architectureTexture } from './architectureTexture';
import * as THREE from 'three';
import type { Book } from '../../types/books';
import { bookCoverUrl } from '../../utils/bookCover';
import { BOOK_NEAR_DISTANCE, BOOK_SPACING, BOOK_THICKNESS, VISIBLE_BOOK_COUNT, WALK_SPEED, clampPosition, currentBookIndex, isMovementTarget } from './navigation';

function paintedTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#c6b798'; ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#918575'; ctx.lineWidth = 1;
  for (let y = 0; y < 256; y += 4) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createNaveScene(host: HTMLElement, onCurrent: (index: number) => void, onError: () => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor('#090909');
  renderer.domElement.setAttribute('aria-label', 'Church library with two rows of books. Use Up to walk forward, Down to walk backward.');
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
  const wallTexture = keep(architectureTexture(true));
  const pageTexture = keep(paintedTexture());
  const masonry = keep(architectureTexture());
  const stone = keep(new THREE.MeshLambertMaterial({ map: masonry, color: '#c5af8d' }));
  const trim = keep(new THREE.MeshLambertMaterial({ map: masonry, color: '#dac29b' }));
  const wall = keep(new THREE.MeshBasicMaterial({ map: wallTexture, side: THREE.DoubleSide }));
  // Darken only the low-luminance brown ground, preserving gold and pale stone.
  wall.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #include <map_fragment>
      float wallLuminance = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      float darkGround = 1.0 - smoothstep(0.025, 0.12, wallLuminance);
      float warmGround = smoothstep(1.05, 1.4, diffuseColor.r / max(diffuseColor.g, 0.001));
      diffuseColor.rgb *= mix(1.0, 0.28, darkGround * warmGround);
    `);
  };
  // Shrink the wallpaper uniformly, centered horizontally and pinned to the
  // vault spring line. Each lateral edge moves inward by 5% of the bay width.
  const wallHeight = 11;
  const wallpaperScale = 0.90;
  const wallpaperHeight = 16 * wallpaperScale;
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
  const arch = new THREE.CurvePath<THREE.Vector3>();
  arch.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-10, 11, 0), new THREE.Vector3(-9, 17, 0), new THREE.Vector3(0, 20, 0)));
  arch.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 20, 0), new THREE.Vector3(9, 17, 0), new THREE.Vector3(10, 11, 0)));
  const stations: [number, number, number][] = Array.from({length: segments}, (_, i) => [0,0,-i*10]);
  for (const offset of [-.24, 0, .24]) repeated(new THREE.TubeGeometry(arch, 48, offset ? .11 : .19, 8, false), trim, stations.map(([x,y,z]) => [x,y,z+offset]));
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
  const vaultMaterial = keep(new THREE.MeshLambertMaterial({map:masonry, color:'#78634b',side:THREE.DoubleSide}));
  repeated(vault,vaultMaterial,stations);
  // Diagonal ribs join each pair of columns to the crown of its bay.
  for (const side of [-1,1]) for (const end of [0,-10]) {
    const rib = new THREE.QuadraticBezierCurve3(new THREE.Vector3(side*10,11,end),new THREE.Vector3(side*8,17,-5),new THREE.Vector3(0,20,-5));
    repeated(new THREE.TubeGeometry(rib,24,.12,6,false),trim,stations);
  }
  const leather = keep(new THREE.MeshLambertMaterial({ color: '#301a12' }));
  const pages = keep(new THREE.MeshLambertMaterial({ map: pageTexture }));
  const bookGeometry = keep(new THREE.BoxGeometry(3.3, 5.3, BOOK_THICKNESS));
  const frontGeometry = keep(new THREE.PlaneGeometry(3.3, 5.3));
  const pageGeometry = keep(new THREE.PlaneGeometry(BOOK_THICKNESS - .01, 5.2));
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
    floor.position.z = -80 + position % 4;
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
        // One leather body, one front cover and one right page block.
        group.add(new THREE.Mesh(bookGeometry, leather));
        const material = new THREE.MeshBasicMaterial({ map: placeholder(book) });
        const cover = new THREE.Mesh(frontGeometry, material); cover.position.z = BOOK_THICKNESS / 2 + .005; group.add(cover);
        const pageBlock = new THREE.Mesh(pageGeometry, pages);
        pageBlock.rotation.y = Math.PI / 2; pageBlock.position.x = 1.655;
        group.add(pageBlock);
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
    const keyboardDirection = Number(heldKeys.has('arrowup')) - Number(heldKeys.has('arrowdown'));
    const movement = direction || keyboardDirection;
    position = clampPosition(position + movement * WALK_SPEED * delta, books.length);
    render();
    if (movement) frame = requestAnimationFrame(tick); else previousTime = 0;
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
  const wallpaper = keep(new THREE.TextureLoader().load('/textures/nave-wall.jpg', texture => {
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
    update(next: Book[], reset: boolean) { books = next; if (reset) { position = 0; current = -1; stop(); } position = clampPosition(position, books.length); invalidate(); },
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
