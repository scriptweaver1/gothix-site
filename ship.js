/* TEMPORARY DEBUG SHIP — parks the model big + centered + on top.
   If you SEE a slowly spinning gold ship in the middle of the screen,
   rendering works and we just need to tune size/position/layer.
   Swap ship.js back afterward. */
(function () {
    if (typeof THREE === 'undefined') { console.warn('three.js NOT loaded'); return; }
    console.log('[ship.debug] three.js loaded, version', THREE.REVISION);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    const canvas = renderer.domElement;
    Object.assign(canvas.style, { position:'fixed', inset:'0', width:'100%', height:'100%', zIndex:'50', pointerEvents:'none' });
    document.body.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 100);

    scene.add(new THREE.AmbientLight(0x404058, 1.2));
    const key = new THREE.DirectionalLight(0xfff2d8, 1.6); key.position.set(3,4,2); scene.add(key);
    const rim = new THREE.DirectionalLight(0x88aaff, 0.6); rim.position.set(-4,-2,-3); scene.add(rim);

    (function env(){
        const c=document.createElement('canvas'); c.width=128;c.height=64; const g=c.getContext('2d');
        const gr=g.createLinearGradient(0,0,0,64); gr.addColorStop(0,'#5a5170'); gr.addColorStop(1,'#08060c');
        g.fillStyle=gr; g.fillRect(0,0,128,64);
        const t=new THREE.CanvasTexture(c); t.mapping=THREE.EquirectangularReflectionMapping;
        const p=new THREE.PMREMGenerator(renderer); scene.environment=p.fromEquirectangular(t).texture; t.dispose(); p.dispose();
    })();

    let ship=null;
    new THREE.GLTFLoader().load('ship.glb', (gltf)=>{
        console.log('[ship.debug] MODEL LOADED OK');
        const box=new THREE.Box3().setFromObject(gltf.scene);
        const center=box.getCenter(new THREE.Vector3());
        gltf.scene.position.sub(center);
        ship=new THREE.Group(); ship.add(gltf.scene);
        ship.scale.setScalar(5);          // big
        ship.position.set(0,0,-9);         // centered, close
        scene.add(ship);
    }, (p)=>console.log('[ship.debug] loading', Math.round((p.loaded/(p.total||1))*100)+'%'),
       (e)=>console.warn('[ship.debug] MODEL FAILED', e));

    (function loop(){ requestAnimationFrame(loop); if(ship) ship.rotation.y+=0.004; renderer.render(scene,camera); })();
    addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
})();
