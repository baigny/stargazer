// hero-solar-system.js — Immersive 3D solar system hero
// Beautiful textured planets orbiting a glowing sun, viewed from a cinematic angle
// Text floats directly over the scene — no glass card needed
// Runs at 25fps, pauses when hero section is off-screen or tab hidden

window.addEventListener('load', () => {
  setTimeout(initHeroSolarSystem, 250);
});

function initHeroSolarSystem() {
  const canvas = document.getElementById('solar-system-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const section = document.getElementById('hero-section');
  let w = section.clientWidth;
  let h = section.clientHeight;

  // ── Three.js scene ────────────────────────────────────────────────────────
  const scene = new THREE.Scene();

  // Cinematic fog: matches the app's deep background (#05050f) so distant
  // planets and orbit lines dissolve into the backdrop instead of hard-cutting.
  scene.fog = new THREE.FogExp2(0x05050f, 0.0022);

  // Camera: cinematic low-angle perspective — planets feel large and close
  const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 1000);
  const CAMERA_BASE = new THREE.Vector3(0, 65, 95); // Slightly higher and further back
  const LOOK_BASE   = new THREE.Vector3(0, 15, 0);  // Look above the origin to shift the scene down on screen
  camera.position.copy(CAMERA_BASE);
  camera.lookAt(LOOK_BASE);

  // ── Interactive mouse parallax ───────────────────────────────────────────
  // Tracks normalized mouse coordinates (-1..1) and gently pans/tilts the
  // camera toward them each frame for a subtle sense of depth.
  const mouse = { x: 0, y: 0 };
  const parallax = { x: 0, y: 0 }; // smoothed/lerped values actually applied
  const PARALLAX_STRENGTH_X = 12;  // max horizontal camera offset
  const PARALLAX_STRENGTH_Y = 8;   // max vertical camera offset
  const PARALLAX_LERP = 0.04;      // smoothing factor per frame


  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(w, h);
  renderer.outputEncoding = THREE.sRGBEncoding;
  // Tone mapping removed to keep colors vibrant and matching CSS exactly

  // ── Starfield ─────────────────────────────────────────────────────────────
  (function () {
    const count = 400;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 500;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 500;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 500;
      sizes[i] = Math.random() * 0.5 + 0.15;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.4, sizeAttenuation: true, transparent: true, opacity: 0.85,
    });
    scene.add(new THREE.Points(geo, mat));
  })();

  // ── Lights ────────────────────────────────────────────────────────────────
  // Vibrant lighting to make planet colors pop
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  
  // A subtle blue hemisphere light to fill in shadows
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444466, 0.5);
  scene.add(hemiLight);

  // The sun's light
  const sunLight = new THREE.PointLight(0xffffff, 2.0, 500, 1.0);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  // Rim light for that cinematic 3D edge — deep purple/blue sci-fi glow
  const rimLight = new THREE.DirectionalLight(0x6a4dff, 1.1);
  rimLight.position.set(40, 20, -40);
  scene.add(rimLight);

  // Secondary cooler rim from the opposite side reinforces the edge-lit look
  const rimLight2 = new THREE.DirectionalLight(0x3344cc, 0.5);
  rimLight2.position.set(-30, -10, -50);
  scene.add(rimLight2);

  // ── Planet definitions ────────────────────────────────────────────────────
  // Sizes tuned for visual impact at the camera distance
  const PLANETS = [
    { name: 'sun',     radius: 7,   orbit: 0,   speed: 0,       tex: '/textures/2k_sun.webp',              isSun: true, color: 0xffaa00 },
    { name: 'mercury', radius: 1.2, orbit: 14,  speed: 0.022,   tex: '/textures/mercury.webp',             tilt: 0.03,  color: 0x888888, 
      telemetry: { dist: '91.7', avg: '167', high: '430', low: '-180', atm: [{l:'O2',v:42},{l:'Na',v:29},{l:'H2',v:22}] } },
    { name: 'venus',   radius: 2.4, orbit: 22,  speed: 0.010,   tex: '/textures/venus.webp',               tilt: 177.4, color: 0xe3bb76,
      telemetry: { dist: '41.4', avg: '464', high: '475', low: '462', atm: [{l:'CO2',v:96},{l:'N2',v:3.5}] } },
    { name: 'earth',   radius: 2.6, orbit: 32,  speed: 0.007,   tex: '/textures/2k_earth_daymap.webp',     tilt: 23.4,  color: 0x2233ff,
      telemetry: { dist: '0', avg: '15', high: '56', low: '-89', atm: [{l:'N2',v:78},{l:'O2',v:21},{l:'Ar',v:1}] } },
    { name: 'mars',    radius: 1.8, orbit: 42,  speed: 0.005,   tex: '/textures/mars.webp',                tilt: 25.2,  color: 0xff5522,
      telemetry: { dist: '78.3', avg: '-63', high: '20', low: '-140', atm: [{l:'CO2',v:95},{l:'N2',v:2.7},{l:'Ar',v:1.6}] } },
    { name: 'jupiter', radius: 5.0, orbit: 58,  speed: 0.0016,  tex: '/textures/jupiter.webp',             tilt: 3.1,   color: 0xc49b73,
      telemetry: { dist: '628', avg: '-110', high: '-110', low: '-110', atm: [{l:'H2',v:89},{l:'He',v:10}] } },
    { name: 'saturn',  radius: 4.0, orbit: 76,  speed: 0.0009,  tex: '/textures/saturn.webp',              tilt: 26.7,  color: 0xeadaa5, hasRing: true, ringTex: '/textures/saturn_ring_color.webp',
      telemetry: { dist: '1275', avg: '-140', high: '-140', low: '-140', atm: [{l:'H2',v:96},{l:'He',v:3}] } },
    { name: 'uranus',  radius: 2.8, orbit: 92,  speed: 0.0004,  tex: '/textures/uranus.webp',              tilt: 97.8,  color: 0x99ffff,
      telemetry: { dist: '2723', avg: '-195', high: '-195', low: '-195', atm: [{l:'H2',v:83},{l:'He',v:15},{l:'CH4',v:2}] } },
    { name: 'neptune', radius: 2.6, orbit: 106, speed: 0.0003,  tex: '/textures/neptune.webp',             tilt: 28.3,  color: 0x3344ff,
      telemetry: { dist: '4351', avg: '-200', high: '-200', low: '-200', atm: [{l:'H2',v:80},{l:'He',v:19},{l:'CH4',v:1.5}] } },
  ];


  // ── Saturn ring geometry with proper UV mapping ───────────────────────────
  function makeSaturnRingGeo(inner, outer) {
    const geo = new THREE.RingGeometry(inner, outer, 64);
    const pos = geo.attributes.position;
    const uv  = geo.attributes.uv;
    const v3  = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      const r = v3.length();
      uv.setXY(i, (r - inner) / (outer - inner), 0.5);
    }
    uv.needsUpdate = true;
    return geo;
  }

  // ── Procedural sun texture (fallback) ─────────────────────────────────────
  function makeSunTexture() {
    const W = 512, H = 256, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const bg = ctx.createRadialGradient(W * 0.42, H * 0.42, 0, W * 0.5, H * 0.5, W * 0.55);
    bg.addColorStop(0, '#fff8d0'); bg.addColorStop(0.3, '#ffe060');
    bg.addColorStop(0.7, '#ff8800'); bg.addColorStop(1, '#cc3300');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.12;
    for (let i = 0; i < 250; i++) {
      ctx.fillStyle = 'rgba(255,195,50,0.85)';
      ctx.beginPath(); ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 6 + 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    return new THREE.CanvasTexture(cv);
  }

  // ── Create planet meshes ──────────────────────────────────────────────────
  const loader = new THREE.TextureLoader();
  const planetObjects = [];

  PLANETS.forEach((def, idx) => {
    const geo = new THREE.SphereGeometry(def.radius, 48, 32);
    let mat;

    if (def.isSun) {
      // Sun: emissive glow material
      const sunTex = loader.load(
        def.tex,
        () => {
          mat.color.setHex(0xffffff); // reset color so texture shows normally
        },
        undefined,
        (err) => {
          console.error("Sun texture failed to load:", def.tex, err);
          mat.map = makeSunTexture();
          mat.color.setHex(0xffffff);
          mat.needsUpdate = true;
        }
      );
      sunTex.encoding = THREE.sRGBEncoding;
      mat = new THREE.MeshBasicMaterial({ map: sunTex, color: def.color });
    } else {
      // Textured planets with realistic material
      const tex = loader.load(
        def.tex,
        () => {
          mat.color.setHex(0xffffff);
        },
        undefined,
        (err) => console.error("Planet texture failed to load:", def.tex, err)
      );
      tex.encoding = THREE.sRGBEncoding;
      mat = new THREE.MeshStandardMaterial({
        map: tex,
        color: def.color,
        roughness: 0.82,
        metalness: 0.02,
      });
    }

    const mesh = new THREE.Mesh(geo, mat);

    // Axial tilt
    if (def.tilt) {
      mesh.rotation.x = THREE.MathUtils.degToRad(def.tilt);
    }

    // Spread planets at visually balanced starting positions
    const angle = (idx / PLANETS.length) * Math.PI * 2 + idx * 0.8;

    if (def.orbit > 0) {
      mesh.position.set(Math.cos(angle) * def.orbit, 0, Math.sin(angle) * def.orbit);
    }

    scene.add(mesh);

    // ── Sun glow: layered sprite for realistic corona ──
    if (def.isSun) {
      // Add vibrant glow sprite
      const glowCanvas = document.createElement('canvas');
      glowCanvas.width = 256; glowCanvas.height = 256;
      const gctx = glowCanvas.getContext('2d');
      const grad = gctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0,    'rgba(255, 180, 50, 1.0)');
      grad.addColorStop(0.2,  'rgba(255, 120, 20, 0.8)');
      grad.addColorStop(0.4,  'rgba(255, 80, 0, 0.4)');
      grad.addColorStop(0.7,  'rgba(255, 40, 0, 0.1)');
      grad.addColorStop(1,    'rgba(255, 0, 0, 0)');
      gctx.fillStyle = grad;
      gctx.fillRect(0, 0, 256, 256);
      
      const glowTex = new THREE.CanvasTexture(glowCanvas);
      glowTex.encoding = THREE.sRGBEncoding;
      const glowMat = new THREE.SpriteMaterial({
        map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
      });
      const glowSprite = new THREE.Sprite(glowMat);
      glowSprite.scale.set(38, 38, 1);
      mesh.add(glowSprite);

      // Outer diffuse halo
      const haloCanvas = document.createElement('canvas');
      haloCanvas.width = 256; haloCanvas.height = 256;
      const hctx = haloCanvas.getContext('2d');
      const hgrad = hctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      hgrad.addColorStop(0,   'rgba(255,200,100,0.08)');
      hgrad.addColorStop(0.4, 'rgba(255,150,50,0.03)');
      hgrad.addColorStop(1,   'rgba(255,80,0,0)');
      hctx.fillStyle = hgrad;
      hctx.fillRect(0, 0, 256, 256);
      const haloTex = new THREE.CanvasTexture(haloCanvas);
      const haloMat = new THREE.SpriteMaterial({
        map: haloTex, transparent: true, blending: THREE.AdditiveBlending,
      });
      const haloSprite = new THREE.Sprite(haloMat);
      haloSprite.scale.set(55, 55, 1);
      mesh.add(haloSprite);
    }

    const obj = {
      mesh,
      angle,
      def,
      orbitRadius: def.orbit,
      orbitSpeed: def.speed,
      selfRotation: def.isSun ? 0.002 : 0.005 + Math.random() * 0.003,
    };

    // Saturn ring
    if (def.hasRing) {
      const innerR = def.radius * 1.35;
      const outerR = def.radius * 2.3;
      const ringGeo = makeSaturnRingGeo(innerR, outerR);
      if (def.ringTex) {
        const ringTex = loader.load(
          def.ringTex, 
          () => {
            ringMat.color.setHex(0xffffff);
            ringMat.opacity = 0.85;
          },
          undefined,
          (err) => console.error("Saturn ring texture failed to load:", def.ringTex, err)
        );
        ringTex.encoding = THREE.sRGBEncoding;
        var ringMat = new THREE.MeshBasicMaterial({
          map: ringTex, color: 0xc8b890, side: THREE.DoubleSide, transparent: true, opacity: 0.7,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.2;
        mesh.add(ring);
      } else {
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xc8b890, side: THREE.DoubleSide, transparent: true, opacity: 0.7,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.2;
        mesh.add(ring);
      }
    }

    planetObjects.push(obj);
  });

  // ── Orbital path lines — solid glowing style ────────────────
  PLANETS.forEach(def => {
    if (def.orbit <= 0) return;
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * def.orbit, -0.15, Math.sin(a) * def.orbit));
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x99aaff,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending
    });
    const line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);
  });

  // ── Visibility guards ─────────────────────────────────────────────────────
  let heroVisible = true;
  new IntersectionObserver(
    e => { heroVisible = e[0].isIntersecting; }, { threshold: 0.05 }
  ).observe(section);
  let pageVisible = !document.hidden;
  document.addEventListener('visibilitychange', () => { pageVisible = !document.hidden; });

  // ── Raycaster & Interaction ───────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const mouseCoords = new THREE.Vector2();
  let selectedPlanet = null;
  const overlayPanel = document.getElementById('planet-detail-overlay');
  
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseCoords.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseCoords.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouseCoords, camera);
    const intersects = raycaster.intersectObjects(planetObjects.map(p => p.mesh), false);
    
    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const planetData = planetObjects.find(p => p.mesh === hitMesh);
      if (planetData && planetData.def && !planetData.def.isSun) {
        selectPlanet(planetData);
      }
    }
  });

  document.getElementById('btn-return-system')?.addEventListener('click', () => {
    selectedPlanet = null;
    overlayPanel.classList.remove('visible');
    canvas.classList.remove('zoomed');
  });

  function selectPlanet(pData) {
    selectedPlanet = pData;
    const def = pData.def;
    
    // Update DOM overlay
    document.getElementById('po-title').textContent = def.name.toUpperCase();
    document.getElementById('po-distance').textContent = def.telemetry.dist + ' Million km';
    document.getElementById('po-temp-avg').textContent = def.telemetry.avg + '°C';
    document.getElementById('po-temp-high').textContent = def.telemetry.high + '°C';
    document.getElementById('po-temp-low').textContent = def.telemetry.low + '°C';
    
    const barsContainer = document.getElementById('po-atmosphere-bars');
    barsContainer.innerHTML = '';
    def.telemetry.atm.forEach(gas => {
      barsContainer.innerHTML += `
        <div class="po-bar-row">
          <div class="po-bar-label">${gas.l}</div>
          <div class="po-bar-track">
            <div class="po-bar-fill" style="width: ${gas.v}%"></div>
          </div>
          <div class="po-bar-val">${gas.v}%</div>
        </div>
      `;
    });

    overlayPanel.classList.add('visible');
    canvas.classList.add('zoomed');
  }

  // ── Animation loop — 25fps ────────────────────────────────────────────────
  let lastRaf = 0, time = 0;
  const FPS_INTERVAL = 1000 / 25;
  const TARGET_LERP_SPEED = 0.06;

  function animate(now) {
    requestAnimationFrame(animate);
    if (!pageVisible || !heroVisible) return;
    if (now - lastRaf < FPS_INTERVAL) return;
    lastRaf = now;
    time += 0.013;

    planetObjects.forEach(p => {
      if (p.orbitRadius > 0) {
        // Slow down orbit slightly when a planet is selected for dramatic effect
        const speedMult = selectedPlanet ? 0.1 : 1.0;
        p.angle += (p.orbitSpeed * speedMult);
        p.mesh.position.x = Math.cos(p.angle) * p.orbitRadius;
        p.mesh.position.z = Math.sin(p.angle) * p.orbitRadius;
      }
      p.mesh.rotation.y += p.selfRotation;
    });

    const sun = planetObjects[0];
    const pulse = 1.0 + Math.sin(time * 1.5) * 0.02;
    sun.mesh.scale.setScalar(pulse);
    sunLight.intensity = 5.0 * pulse;

    // Camera Lerping for zoom effect
    if (selectedPlanet) {
      const pPos = selectedPlanet.mesh.position;
      // Target camera position: slightly offset to the side and above
      const targetCamPos = new THREE.Vector3(
        pPos.x + (Math.cos(selectedPlanet.angle) * 8),
        pPos.y + 4,
        pPos.z + (Math.sin(selectedPlanet.angle) * 8) + 12
      );
      camera.position.lerp(targetCamPos, TARGET_LERP_SPEED);
      
      const currentLookAt = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld).add(new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion));
      currentLookAt.lerp(pPos, TARGET_LERP_SPEED);
      camera.lookAt(currentLookAt);
    } else {
      camera.position.lerp(CAMERA_BASE, TARGET_LERP_SPEED);
      
      // Lerp lookAt back to LOOK_BASE
      const currentLookAt = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld).add(new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion));
      currentLookAt.lerp(LOOK_BASE, TARGET_LERP_SPEED);
      camera.lookAt(currentLookAt);
    }

    renderer.render(scene, camera);
  }

  // ── Resize ────────────────────────────────────────────────────────────────
  new ResizeObserver(entries => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      w = width; h = height;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }).observe(section);

  animate(performance.now());
}
