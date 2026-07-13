/* ============================================
   BACKGROUND SPACESHIP  (slow drifting GLB)
   Requires THREE + GLTFLoader loaded before this file.
   ============================================ */
(function () {
    if (typeof THREE === 'undefined') { console.warn('three.js not loaded; ship skipped'); return; }

    const MODEL_URL   = 'ship.glb';
    const FOV          = 45;
    const DEPTH_MIN    = 9;     // nearer  -> ship looks bigger
    const DEPTH_MAX    = 20;    // farther -> ship looks smaller
    const SCALE        = 2.5;   // world size of the ship
    const DUR_MIN      = 150;   // seconds for one crossing
    const DUR_MAX      = 200;
    const TARGET_FPS   = 30;    // cap: the drift is slow, 30 is plenty
    const FRAME_MS     = 1000 / TARGET_FPS;

    // --- Renderer (transparent, lightweight) ---
    const renderer = new THREE.WebGLRenderer({
        alpha: true, antialias: true, powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    else renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const canvas = renderer.domElement;
    canvas.id = 'shipCanvas';
    Object.assign(canvas.style, {
        position: 'fixed', inset: '0', width: '100%', height: '100%',
        zIndex: '1', pointerEvents: 'none',
    });
    document.body.appendChild(canvas);

    // --- Scene / camera ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 0); // looks down -Z; ship lives at negative z

    // --- Lights (gold ship reads best with a warm key + cool fill) ---
    scene.add(new THREE.AmbientLight(0x404058, 1.1));
    const key = new THREE.DirectionalLight(0xfff2d8, 1.5);
    key.position.set(3, 4, 2);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x88aaff, 0.6);
    rim.position.set(-4, -2, -3);
    scene.add(rim);

    // --- Environment map (metals need something to reflect or they go black) ---
    (function setupEnv() {
        const c = document.createElement('canvas');
        c.width = 128; c.height = 64;
        const g = c.getContext('2d');
        const grad = g.createLinearGradient(0, 0, 0, 64);
        grad.addColorStop(0.0, '#5a5170');   // top: soft cool light
        grad.addColorStop(0.45, '#2a2436');
        grad.addColorStop(0.7, '#1a1420');
        grad.addColorStop(1.0, '#08060c');   // bottom: near black
        g.fillStyle = grad; g.fillRect(0, 0, 128, 64);
        // a warm glow patch so the gold catches a highlight
        const warm = g.createRadialGradient(90, 20, 2, 90, 20, 40);
        warm.addColorStop(0, 'rgba(255, 220, 150, 0.55)');
        warm.addColorStop(1, 'rgba(255, 220, 150, 0)');
        g.fillStyle = warm; g.fillRect(0, 0, 128, 64);

        const tex = new THREE.CanvasTexture(c);
        tex.mapping = THREE.EquirectangularReflectionMapping;
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromEquirectangular(tex).texture;
        tex.dispose();
        pmrem.dispose();
    })();

    // --- Journey state ---
    let ship = null;
    const journey = { start: new THREE.Vector3(), end: new THREE.Vector3(), depth: 12,
                      duration: 180, elapsed: 0, spin: new THREE.Vector3() };

    function frameHalfExtents(depth) {
        const halfH = Math.tan((FOV * Math.PI / 180) / 2) * depth;
        const halfW = halfH * (window.innerWidth / window.innerHeight);
        return { halfW, halfH };
    }

    function newJourney() {
        const depth = DEPTH_MIN + Math.random() * (DEPTH_MAX - DEPTH_MIN);
        const { halfW, halfH } = frameHalfExtents(depth);
        const frameR = Math.sqrt(halfW * halfW + halfH * halfH);
        const R = frameR * 1.4 + SCALE * 1.2;   // spawn/exit fully off-frame

        const theta = Math.random() * Math.PI * 2;         // travel direction
        const dir = new THREE.Vector2(Math.cos(theta), Math.sin(theta));
        const perp = new THREE.Vector2(-dir.y, dir.x);
        const off = (Math.random() * 2 - 1) * frameR * 0.75; // sideways offset -> varied paths

        journey.depth = depth;
        journey.duration = DUR_MIN + Math.random() * (DUR_MAX - DUR_MIN);
        journey.elapsed = 0;
        journey.start.set(perp.x * off - dir.x * R, perp.y * off - dir.y * R, -depth);
        journey.end.set(  perp.x * off + dir.x * R, perp.y * off + dir.y * R, -depth);
        journey.spin.set((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.01);

        if (ship) {
            ship.position.copy(journey.start);
            ship.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
        }
    }

    // --- Load model ---
    new THREE.GLTFLoader().load(MODEL_URL, (gltf) => {
        ship = gltf.scene;
        // center the model on its own bounding box, then scale
        const box = new THREE.Box3().setFromObject(ship);
        const center = box.getCenter(new THREE.Vector3());
        ship.position.sub(center);
        const holder = new THREE.Group();
        holder.add(ship);
        ship = holder;
        ship.scale.setScalar(SCALE);
        scene.add(ship);
        newJourney();
    }, undefined, (err) => console.warn('ship model failed to load:', err));

    // --- Animation loop (fps-capped, pauses when tab hidden) ---
    let lastTime = performance.now();
    let acc = 0;

    function tick(now) {
        requestAnimationFrame(tick);
        if (document.hidden) { lastTime = now; return; }

        const dt = Math.min(now - lastTime, 100); // clamp big gaps
        lastTime = now;
        acc += dt;
        if (acc < FRAME_MS) return;
        acc = 0;

        if (ship) {
            journey.elapsed += dt / 1000;
            let t = journey.elapsed / journey.duration;
            if (t >= 1) { newJourney(); t = 0; }
            // gentle ease so entry/exit aren't abrupt
            const e = t * t * (3 - 2 * t);
            ship.position.lerpVectors(journey.start, journey.end, e);
            ship.rotation.x += journey.spin.x * (dt / 1000);
            ship.rotation.y += journey.spin.y * (dt / 1000);
            ship.rotation.z += journey.spin.z * (dt / 1000);
        }
        renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);

    // --- Resize ---
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();
