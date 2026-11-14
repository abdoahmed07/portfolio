/* The hub's pinned chrome form, drawn behind the page. It changes shape per section:
   a soft blob beside the intro, a twisting rounded cube for the statement, gone for the
   projects, back for the outro. Reads section progress from Motion.scenes. */

function isLight() { return document.documentElement.getAttribute('data-theme') === 'light'; }
function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

export function createChrome(T, mergeVertices, canvas, studioEnv) {
    var Motion = window.Motion;
    var S = Motion.scenes;
    var clamp = Motion.clamp, smooth = Motion.smooth;
    var small = window.innerWidth <= 760;
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1 : 1.5));
    renderer.toneMapping = T.NeutralToneMapping;
    renderer.setClearColor(0x000000, 0);
    var env = studioEnv(T, renderer);

    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(32, 1, 0.1, 100);
    cam.position.set(0, 0, 9);

    var base = new T.IcosahedronGeometry(1, small ? 14 : 30);
    base.deleteAttribute('normal');
    base.deleteAttribute('uv');
    var geo = mergeVertices(base);
    var pos = geo.attributes.position, count = pos.count;
    var dirs = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
        var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), l = Math.sqrt(x * x + y * y + z * z);
        dirs[i * 3] = x / l; dirs[i * 3 + 1] = y / l; dirs[i * 3 + 2] = z / l;
    }
    var mat = new T.MeshPhysicalMaterial({ metalness: 1, roughness: 0.08, clearcoat: 0.5, clearcoatRoughness: 0.08, transparent: true });
    var blob = new T.Mesh(geo, mat);
    var cageMat = new T.LineBasicMaterial({ transparent: true });
    var cage = new T.LineSegments(new T.EdgesGeometry(new T.IcosahedronGeometry(1.42, 1)), cageMat);
    var orbitMat = new T.MeshBasicMaterial({ transparent: true });
    var orbit = new T.Mesh(new T.TorusGeometry(1.75, 0.004, 6, 256), orbitMat);
    orbit.rotation.set(1.2, 0.3, 0);
    var group = new T.Group();
    group.add(blob, cage, orbit);
    scene.add(group);

    function theme() {
        var light = isLight();
        scene.environment = env(light);
        mat.color.set(light ? '#cfcfd4' : '#e4e4ea');
        cageMat.color.set(light ? '#000000' : '#ffffff');
        orbitMat.color.set(cssVar('--brand') || '#ff6b2b');
        Motion.dirty = true;
    }
    theme();
    document.addEventListener('themechange', theme);

    /* look per stage: x, y, scale, cube, twist, wobble, opacity. 0 hero, 1 statement, 2 projects, 3 outro */
    function stageLook(k, aspect, Hh, phone, twist) {
        var hw = Hh * aspect;
        if (k === 0) return phone ? [0, Hh * 0.36, 0.68, 0, 0, 0.1, 1] : [hw * 0.42, 0.05, 1.35, 0, 0, 0.1, 1];
        if (k === 1) return phone ? [hw * 0.35, -Hh * 0.55, 0.8, 0.9, twist, 0.02, 0.35] : [hw * 0.62, -0.1, 0.95, 0.9, twist, 0.02, 1];
        if (k === 2) return [hw * 0.7, Hh * 0.7, 0.25, 0.5, 0.4, 0.04, 0];
        return phone ? [0, Hh * 0.62, 0.42, 0.2, 0.3, 0.06, 0.9] : [hw * 0.42, 0, 1.1, 0.2, 0.3, 0.06, 1];
    }
    var look = null;

    function morph(t, cube, twist, amp) {
        var arr = pos.array;
        for (var i = 0; i < count; i++) {
            var dx = dirs[i * 3], dy = dirs[i * 3 + 1], dz = dirs[i * 3 + 2];
            var ax = dx * dx, ay = dy * dy, az = dz * dz;
            var m = Math.pow(ax * ax * ax + ay * ay * ay + az * az * az, 1 / 6);
            var k = 1 + cube * (0.86 / m - 1);
            var x = dx * k, y = dy * k, z = dz * k;
            var a = twist * y, c = Math.cos(a), s = Math.sin(a);
            var n = Math.sin(dx * 3.1 + t * 0.55) * Math.sin(dy * 2.7 + t * 0.41) * Math.sin(dz * 2.3 + t * 0.33)
                  + 0.5 * Math.sin(dx * 5.3 - t * 0.37) * Math.sin(dy * 4.9 + t * 0.29);
            var f = 1 + amp * n;
            arr[i * 3] = (x * c - z * s) * f; arr[i * 3 + 1] = y * f; arr[i * 3 + 2] = (x * s + z * c) * f;
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
    }

    var pointer = { x: 0, y: 0 };
    window.addEventListener('pointermove', function (e) {
        pointer.x = e.clientX / window.innerWidth - 0.5;
        pointer.y = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    var W = 0, H = 0;
    function resize() {
        W = window.innerWidth; H = window.innerHeight;
        renderer.setSize(W, H, false);
        cam.aspect = W / H;
        cam.updateProjectionMatrix();
        Motion.dirty = true;
    }
    resize();
    window.addEventListener('resize', resize);

    var cleared = false, lastMorph = '';
    function render(t, dt) {
        var reduce = Motion.reduce, phone = W <= 760, time = reduce ? 3.2 : t;
        var hero = S.hero ? S.hero.p : 0, work = S.work ? S.work.enter : 0, outro = S.outro ? S.outro.enter : 0;
        var stage = Math.max(0, hero) + work + clamp((outro - 0.45) / 0.55, 0, 1);
        /* reduced motion: jump between the section shapes, never in between */
        if (reduce) stage = Math.round(stage);
        var lo = Math.floor(clamp(stage, 0, 3)), hi = Math.min(lo + 1, 3), f = smooth(stage - lo);
        var Hh = Math.tan(T.MathUtils.degToRad(cam.fov / 2)) * cam.position.z;
        var twist = 0.2 + (S.statement ? Math.max(0, S.statement.p) : 0) * 1.5;
        var a = stageLook(lo, cam.aspect, Hh, phone, twist), b = stageLook(hi, cam.aspect, Hh, phone, twist);
        var want = a.map(function (v, j) { return v + (b[j] - v) * f; });
        if (!look || reduce) look = want.slice();
        else for (var j = 0; j < look.length; j++) look[j] += (want[j] - look[j]) * 0.05;

        var op = look[6];
        if (op < 0.01) {
            if (!cleared) { renderer.clear(); cleared = true; }
            return;
        }
        cleared = false;
        /* the shape only needs rebuilding when it can change */
        var mk = reduce ? look[3] + ',' + look[4] + ',' + look[5] : '';
        if (!reduce || mk !== lastMorph) { morph(time, look[3], look[4], look[5]); lastMorph = mk; }
        group.position.set(look[0], look[1], 0);
        group.scale.setScalar(look[2]);
        if (!reduce) {
            blob.rotation.y += dt * 0.12;
            cage.rotation.y -= dt * 0.05;
            cage.rotation.x += dt * 0.02;
            orbit.rotation.z += dt * 0.08;
            group.rotation.x += ((pointer.y * 0.25) - group.rotation.x) * 0.03;
            group.rotation.y += ((pointer.x * 0.35) - group.rotation.y) * 0.03;
        }
        mat.opacity = op;
        cageMat.opacity = (isLight() ? 0.16 : 0.13) * op;
        orbitMat.opacity = 0.4 * op;
        renderer.render(scene, cam);
    }
    return { render: render };
}
