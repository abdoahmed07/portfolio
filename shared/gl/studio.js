/* The 3D layer. One fixed canvas over the page draws every .stage[data-object] on it
   with a scissor rect, so any number of objects share one WebGL context.
   Studio lighting: a reflection setup (cached per theme), neutral tone mapping, one key light
   with soft shadows on larger screens, a rim light in the project's accent, a floor shadow,
   a light pool and a contact shadow.
   Three.js is loaded after first paint. Without WebGL, or if loading fails, the page gets
   .no-gl and the stages show the project number instead.
   Needs shared/motion.js on the page for the frame loop. */

var root = document.documentElement;
var stages = Array.prototype.slice.call(document.querySelectorAll('.stage[data-object]'));
var backCanvas = document.getElementById('glBack');

function hasWebGL() {
    try {
        var c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
}

function noGL(err) {
    if (err) console.warn('3D layer unavailable', err);
    root.classList.add('no-gl');
    document.querySelectorAll('canvas.gl').forEach(function (c) { c.remove(); });
}

function afterLoad() {
    return new Promise(function (resolve) {
        if (document.readyState === 'complete') setTimeout(resolve, 0);
        else window.addEventListener('load', function () { setTimeout(resolve, 0); }, { once: true });
    });
}

function isLight() { return root.getAttribute('data-theme') === 'light'; }

/* A studio for reflections: dark room, a big overhead softbox, two tall strip lights and a
   rim light behind. Chrome picks up clean highlights instead of a generic room. */
export function studioEnv(T, renderer) {
    var cache = {};
    return function (light) {
        var key = light ? 'light' : 'dark';
        if (cache[key]) return cache[key];
        var pm = new T.PMREMGenerator(renderer);
        var s = new T.Scene();
        s.background = new T.Color(light ? 0xcfcfd3 : 0x050506);
        function box(w, h, x, y, z, i) {
            var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(i, i, i), side: T.DoubleSide }));
            m.position.set(x, y, z);
            m.lookAt(0, 0, 0);
            s.add(m);
        }
        box(10, 4, -1.5, 7, 2.5, 7);
        box(2.2, 8, 7, 1.5, 0.5, 5.5);
        box(2.2, 8, -7, 1, -1.5, 3.5);
        box(12, 2, 0, 2.5, -8, 3.2);
        box(9, 2.4, 1, -1.5, 8, light ? 2 : 1.1);
        box(12, 12, 0, -6, 0, light ? 0.8 : 0.12);
        cache[key] = pm.fromScene(s, 0.035).texture;
        pm.dispose();
        return cache[key];
    };
}

function createFront(T, RoundedBox, objects) {
    var Motion = window.Motion;
    var canvas = document.createElement('canvas');
    canvas.className = 'gl gl-front';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);

    var small = window.innerWidth <= 760;
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.25 : 1.75));
    renderer.toneMapping = T.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0);
    /* real soft shadows on larger screens; phones get the baked contact shadow only */
    renderer.shadowMap.enabled = !small;
    renderer.shadowMap.type = T.PCFShadowMap;
    var env = studioEnv(T, renderer);

    var cam = new T.PerspectiveCamera(26, 1, 0.1, 60);
    cam.position.set(0, 1.55, 7.2);
    cam.lookAt(0, -0.05, 0);

    /* one key light and one rim light, moved into whichever scene is being drawn */
    var key = new T.DirectionalLight(0xffffff, 2.3);
    key.position.set(2.2, 6, 3.2);
    key.castShadow = !small;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -2.6; key.shadow.camera.right = 2.6;
    key.shadow.camera.top = 2.6; key.shadow.camera.bottom = -2.6;
    key.shadow.camera.near = 1; key.shadow.camera.far = 16;
    key.shadow.radius = 6;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    var rim = new T.DirectionalLight(0xffffff, 0);
    rim.position.set(-3.5, 2.5, -4.5);

    function radialTexture(inner, outer) {
        var c = document.createElement('canvas');
        c.width = c.height = 256;
        var g = c.getContext('2d');
        var grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
        grd.addColorStop(0, inner);
        grd.addColorStop(1, outer);
        g.fillStyle = grd;
        g.fillRect(0, 0, 256, 256);
        var tex = new T.CanvasTexture(c);
        tex.colorSpace = T.SRGBColorSpace;
        return tex;
    }
    var shadowMat = new T.ShadowMaterial({ opacity: 0.5 });
    var poolMat = new T.MeshBasicMaterial({ map: radialTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)'), transparent: true, depthWrite: false, opacity: 0.07 });
    var contactMat = new T.MeshBasicMaterial({ map: radialTexture('rgba(0,0,0,0.9)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false, opacity: small ? 0.55 : 0.3 });

    var M = objects.materials(T);
    var build = objects.builders(T, M, RoundedBox, small);
    var groundGeo = new T.PlaneGeometry(7, 7).rotateX(-Math.PI / 2);
    var poolGeo = new T.PlaneGeometry(2.6, 2.6).rotateX(-Math.PI / 2);
    var contactGeo = new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

    var list = [];
    stages.forEach(function (stage, idx) {
        var slug = stage.getAttribute('data-object');
        if (!build[slug]) { stage.classList.add('stage-empty'); return; }
        var hex = stage.getAttribute('data-accent') || '#ff6b2b';
        var A = objects.accentMaterials(T, hex);
        var scene = new T.Scene();
        var inner = new T.Group();
        var update = build[slug](inner, A) || null;

        /* fit every object to the same size and stand it on the floor */
        inner.updateMatrixWorld(true);
        var box = new T.Box3().setFromObject(inner);
        var sphere = box.getBoundingSphere(new T.Sphere());
        var s = 1.55 / sphere.radius;
        inner.scale.multiplyScalar(s);
        inner.position.set(-sphere.center.x * s, -sphere.center.y * s, -sphere.center.z * s);
        var floorY = (box.min.y - sphere.center.y) * s - 0.01;
        var footprint = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * s;

        inner.traverse(function (o) {
            if (!o.isMesh) return;
            o.castShadow = !o.material.transparent;
            o.receiveShadow = !!o.userData.receive;
        });

        var turn = new T.Group();
        turn.add(inner);
        scene.add(turn);

        var ground = new T.Mesh(groundGeo, shadowMat);
        ground.position.y = floorY;
        ground.receiveShadow = true;
        var pool = new T.Mesh(poolGeo, poolMat);
        pool.position.y = floorY - 0.002;
        var contact = new T.Mesh(contactGeo, contactMat);
        contact.scale.set(footprint * 0.9, 1, footprint * 0.9);
        contact.position.y = floorY + 0.001;
        scene.add(pool, ground, contact);

        list.push({
            scene: scene, turn: turn, update: update, accent: A.color, stage: stage,
            phase: idx * 0.9
        });
    });

    function theme() {
        var light = isLight();
        var e = env(light);
        list.forEach(function (pr) { pr.scene.environment = e; pr.scene.environmentIntensity = 1.2; });
        shadowMat.opacity = light ? 0.22 : 0.55;
        poolMat.opacity = light ? 0 : 0.07;
        contactMat.opacity = (small ? 0.55 : 0.3) * (light ? 0.6 : 1);
        Motion.dirty = true;
    }
    theme();
    document.addEventListener('themechange', theme);

    var W = 0, H = 0;
    function resize() {
        W = window.innerWidth; H = window.innerHeight;
        renderer.setSize(W, H, false);
        Motion.dirty = true;
    }
    resize();
    window.addEventListener('resize', resize);

    var drewLast = true;
    function render(t) {
        var reduce = Motion.reduce, time = reduce ? 2 : t;
        var drew = false;
        for (var i = 0; i < list.length; i++) {
            var pr = list[i];
            var r = pr.stage.getBoundingClientRect();
            var l = Math.max(r.left, 0), rt = Math.min(r.right, W), tp = Math.max(r.top, 0), bt = Math.min(r.bottom, H);
            if (r.width < 2 || rt - l < 1 || bt - tp < 1) continue;
            if (!drew) {
                renderer.setScissorTest(false);
                renderer.clear();
                renderer.setScissorTest(true);
                drew = true;
            }

            /* entrance follows scroll: rises, settles and turns into place */
            var e = reduce ? 1 : Motion.smooth((H - r.top) / (H * 0.6));
            /* a slow sway around a good viewing angle, so flat objects never show edge-on */
            pr.turn.rotation.y = (reduce ? 0 : Math.sin(t * 0.32 + pr.phase) * 0.42) + (1 - e) * 1.1;
            pr.turn.position.y = -(1 - e) * 0.35;
            pr.turn.scale.setScalar(0.86 + 0.14 * e);
            if (pr.update) pr.update(time, reduce);

            pr.scene.add(key, rim);
            rim.color.copy(pr.accent);
            rim.intensity = 1.4;

            renderer.setScissor(l, H - bt, rt - l, bt - tp);
            renderer.setViewport(r.left, H - r.bottom, r.width, r.height);
            cam.aspect = r.width / r.height;
            cam.zoom = Math.min(1, cam.aspect * 1.05);
            cam.updateProjectionMatrix();
            renderer.render(pr.scene, cam);
        }
        /* nothing on screen: clear once, then stay idle */
        if (!drew && drewLast) {
            renderer.setScissorTest(false);
            renderer.clear();
        }
        drewLast = drew;
    }

    return { render: render, canvas: canvas };
}

async function boot() {
    if (!stages.length && !backCanvas) return;
    if (!window.Motion) return noGL(new Error('motion.js missing'));
    if (!hasWebGL()) return noGL();
    await afterLoad();
    var mods = await Promise.all([
        import('three'),
        import('three/addons/geometries/RoundedBoxGeometry.js'),
        import('./objects.js'),
        backCanvas ? import('three/addons/utils/BufferGeometryUtils.js') : null,
        backCanvas ? import('./chrome.js') : null
    ]);
    var T = mods[0];
    var back = backCanvas ? mods[4].createChrome(T, mods[3].mergeVertices, backCanvas, studioEnv) : null;
    var front = stages.length ? createFront(T, mods[1].RoundedBoxGeometry, mods[2]) : null;
    window.Motion.onFrame(function (t, dt) {
        if (back) back.render(t, dt);
        if (front) front.render(t, dt);
    });
    requestAnimationFrame(function () {
        if (back) backCanvas.classList.add('ready');
        if (front) front.canvas.classList.add('ready');
    });
}

boot().catch(noGL);
