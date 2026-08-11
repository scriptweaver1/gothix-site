(function () {
    if (typeof THREE === 'undefined') { console.warn('three.js not loaded; ship skipped'); return; }

    const MODEL_URL   = 'ship.glb';
    const FOV          = 45;
    const DEPTH_MIN    = 8;     
    const DEPTH_MAX    = 18;   
    const SCALE        = 4.5;  
    const DUR_MIN      = 150;  
    const DUR_MAX      = 200;
    const TARGET_FPS   = 30;   
    const FRAME_MS     = 1000 / TARGET_FPS;


    const NOSE_SIGN   = -1;     
    const FACE_TILT   = 0.55;  
    const BASE_PITCH  = 0.05;  
    const VARY_TILT   = 0.18;  
    const VARY_PITCH  = 0.08;
    const SWAY_AMP    = 0.06;   
    const SWAY_SPEED  = 0.12;   

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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 0); 

    scene.add(new THREE.AmbientLight(0x404058, 1.1));
    const key = new THREE.DirectionalLight(0xfff2d8, 1.5);
    key.position.set(3, 4, 2);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x88aaff, 0.6);
    rim.position.set(-4, -2, -3);
    scene.add(rim);
-
    (function setupEnv() {
        const c = document.createElement('canvas');
        c.width = 128; c.height = 64;
        const g = c.getContext('2d');
        const grad = g.createLinearGradient(0, 0, 0, 64);
        grad.addColorStop(0.0, '#5a5170');
        grad.addColorStop(0.45, '#2a2436');
        grad.addColorStop(0.7, '#1a1420');
        grad.addColorStop(1.0, '#08060c');   
        g.fillStyle = grad; g.fillRect(0, 0, 128, 64);

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

 
    let ship = null;
    const journey = { start: new THREE.Vector3(), end: new THREE.Vector3(), depth: 12,
                      duration: 180, elapsed: 0,
                      baseQuat: new THREE.Quaternion(), swayPhase: 0 };

    function frameHalfExtents(depth) {
        const halfH = Math.tan((FOV * Math.PI / 180) / 2) * depth;
        const halfW = halfH * (window.innerWidth / window.innerHeight);
        return { halfW, halfH };
    }

    let firstJourney = true;

    function newJourney() {
        const depth = DEPTH_MIN + Math.random() * (DEPTH_MAX - DEPTH_MIN);
        const { halfW, halfH } = frameHalfExtents(depth);
        const frameR = Math.sqrt(halfW * halfW + halfH * halfH);
        const R = frameR * 1.4 + SCALE * 1.2;  

        const theta = Math.random() * Math.PI * 2;        
        const dir = new THREE.Vector2(Math.cos(theta), Math.sin(theta));
        const perp = new THREE.Vector2(-dir.y, dir.x);
        const off = (Math.random() * 2 - 1) * frameR * 0.75; 

        journey.depth = depth;
        journey.duration = DUR_MIN + Math.random() * (DUR_MAX - DUR_MIN);
   
        journey.elapsed = firstJourney ? journey.duration * (0.3 + Math.random() * 0.35) : 0;
        firstJourney = false;
        journey.start.set(perp.x * off - dir.x * R, perp.y * off - dir.y * R, -depth);
        journey.end.set(  perp.x * off + dir.x * R, perp.y * off + dir.y * R, -depth);

        const phi = Math.atan2(dir.y, dir.x);
        const tiltZ = Math.tan(FACE_TILT + (Math.random() * 2 - 1) * VARY_TILT);
        const heading = new THREE.Vector3(
            NOSE_SIGN * Math.cos(phi), NOSE_SIGN * Math.sin(phi), tiltZ
        ).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const xAxis = heading.clone();
        const zAxis = new THREE.Vector3().crossVectors(xAxis, up).normalize();
        const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
        journey.baseQuat.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
        // slight nose pitch (local Z), with a little per-pass variety
        const pitchQ = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 0, 1), BASE_PITCH + (Math.random() * 2 - 1) * VARY_PITCH);
        journey.baseQuat.multiply(pitchQ);
        journey.swayPhase = Math.random() * Math.PI * 2;

        if (ship) {
            ship.position.copy(journey.start);
            ship.quaternion.copy(journey.baseQuat);
        }
    }

    new THREE.GLTFLoader().load(MODEL_URL, (gltf) => {
        ship = gltf.scene;
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

    let lastTime = performance.now();
    let acc = 0;

    function tick(now) {
        requestAnimationFrame(tick);
        if (document.hidden) { lastTime = now; return; }

        const dt = Math.min(now - lastTime, 100);
        lastTime = now;
        acc += dt;
        if (acc < FRAME_MS) return;
        acc = 0;

        if (ship) {
            journey.elapsed += dt / 1000;
            let t = journey.elapsed / journey.duration;
            if (t >= 1) { newJourney(); t = 0; }
            const e = t * t * (3 - 2 * t);
            ship.position.lerpVectors(journey.start, journey.end, e);
            const ph = journey.swayPhase + journey.elapsed * SWAY_SPEED;
            ship.quaternion.copy(journey.baseQuat);
            ship.rotateX(Math.sin(ph) * SWAY_AMP);
            ship.rotateY(Math.sin(ph * 0.7) * SWAY_AMP);
            ship.rotateZ(Math.sin(ph * 0.5) * SWAY_AMP * 0.5);
        }
        renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();
