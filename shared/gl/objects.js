/* One object per project, keyed by the project's folder name.
   Each builder gets an empty group, fills it and may return an update(time, reduce)
   function for the few objects that move. A new project needs a builder here. */

/* The shared materials: a small set, done carefully. The accent only ever goes on one detail. */
export function materials(T) {
    return {
        chrome:   new T.MeshPhysicalMaterial({ color: 0xf1f1f4, metalness: 1, roughness: 0.11 }),
        satin:    new T.MeshPhysicalMaterial({ color: 0x1c1c20, metalness: 0, roughness: 0.62 }),
        brushed:  new T.MeshPhysicalMaterial({ color: 0xb9b9c1, metalness: 1, roughness: 0.3, anisotropy: 0.75 }),
        graphite: new T.MeshPhysicalMaterial({ color: 0x25252a, metalness: 0.45, roughness: 0.38, clearcoat: 0.8, clearcoatRoughness: 0.14 }),
        ceramic:  new T.MeshPhysicalMaterial({ color: 0xe6e6ea, metalness: 0, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.08 }),
        paper:    new T.MeshPhysicalMaterial({ color: 0xe8e7e3, metalness: 0, roughness: 0.85 }),
        hole:     new T.MeshPhysicalMaterial({ color: 0x08080a, metalness: 0, roughness: 0.7 }),
        glass:    new T.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.2, clearcoat: 1, specularIntensity: 1, envMapIntensity: 1.6, side: T.DoubleSide, depthWrite: false }),
        frosted:  new T.MeshPhysicalMaterial({ color: 0xf4f6fa, metalness: 0, roughness: 0.32, transparent: true, opacity: 0.3, clearcoat: 1, clearcoatRoughness: 0.2, side: T.DoubleSide, depthWrite: false }),
        cloth:    new T.MeshPhysicalMaterial({ color: 0x2a2a30, metalness: 0, roughness: 0.78, sheen: 1, sheenColor: new T.Color(0x9a9aa6), sheenRoughness: 0.45, side: T.DoubleSide })
    };
}

/* Per-project accent materials: a glowing detail and an anodised metal one */
export function accentMaterials(T, hex) {
    var accent = new T.Color(hex);
    return {
        color: accent,
        glow: new T.MeshPhysicalMaterial({ color: 0x000000, emissive: accent, emissiveIntensity: 1.8, roughness: 0.35 }),
        anod: new T.MeshPhysicalMaterial({ color: accent, metalness: 1, roughness: 0.26, clearcoat: 0.6, clearcoatRoughness: 0.1 })
    };
}

/* ── ONE OBJECT PER PROJECT ──
   Built from a few good materials with bevels and real proportions. Only a handful move,
   and only where the motion means something (a flame, a flag, a graph being walked). */
export function builders(T, M, RoundedBox, small) {
    function seg(n) { return small ? Math.max(3, Math.round(n * 0.55)) : n; }
    function V(a) { return new T.Vector3(a[0], a[1], a[2]); }
    function add(g, geo, mat, p, r, s) {
        var m = new T.Mesh(geo, mat);
        if (p) m.position.set(p[0], p[1], p[2]);
        if (r) m.rotation.set(r[0] || 0, r[1] || 0, r[2] || 0);
        if (s) m.scale.set(s[0], s[1], s[2]);
        g.add(m);
        return m;
    }
    function rbox(w, h, d, r) { return new RoundedBox(w, h, d, seg(4), r); }
    function lathe(pts, n) { return new T.LatheGeometry(pts.map(function (p) { return new T.Vector2(p[0], p[1]); }), n || seg(72)); }
    function curve(pts, closed) { return new T.CatmullRomCurve3(pts.map(V), !!closed, 'centripetal'); }
    function tube(pts, r, closed, n) { return new T.TubeGeometry(curve(pts, closed), n || seg(120), r, seg(20), !!closed); }
    function rod(g, a, b, r, mat) {
        var va = V(a), vb = V(b);
        var m = new T.Mesh(new T.CylinderGeometry(r, r, va.distanceTo(vb), seg(16)), mat);
        m.position.copy(va).add(vb).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
        g.add(m);
        return m;
    }
    function extrude(pts, depth, bevel) {
        var sh = new T.Shape();
        sh.moveTo(pts[0][0], pts[0][1]);
        for (var i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
        sh.closePath();
        var geo = new T.ExtrudeGeometry(sh, { depth: depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg(5), curveSegments: seg(24) });
        geo.translate(0, 0, -depth / 2);
        return geo;
    }
    function sphere(r) { return new T.SphereGeometry(r, seg(48), seg(32)); }

    return {
        /* a magnifying glass */
        'name-checker': function (g, A) {
            add(g, new T.TorusGeometry(0.8, 0.075, seg(48), seg(160)), M.chrome);
            add(g, new T.TorusGeometry(0.715, 0.02, seg(16), seg(160)), M.brushed, [0, 0, 0.05]);
            add(g, new T.TorusGeometry(0.715, 0.02, seg(16), seg(160)), M.brushed, [0, 0, -0.05]);
            var cap = new T.SphereGeometry(2.2, seg(72), seg(12), 0, Math.PI * 2, 0, Math.asin(0.73 / 2.2));
            cap.translate(0, -Math.sqrt(2.2 * 2.2 - 0.73 * 0.73), 0);
            add(g, cap, M.glass, [0, 0, 0], [Math.PI / 2, 0, 0]);
            add(g, cap, M.glass, [0, 0, 0], [-Math.PI / 2, 0, 0]);
            add(g, new T.TorusGeometry(0.6, 0.006, 8, seg(160)), A.anod, [0, 0, 0.06]);
            var h = new T.Group();
            add(h, new T.CylinderGeometry(0.1, 0.1, 0.22, seg(32)), M.chrome, [0, -0.11, 0]);
            add(h, lathe([[0, -0.22], [0.09, -0.22], [0.1, -0.26], [0.1, -0.32], [0.09, -0.35], [0.1, -0.38], [0.118, -1.1], [0.112, -1.17], [0.08, -1.24], [0, -1.26]]), M.graphite);
            add(h, new T.TorusGeometry(0.102, 0.012, seg(12), seg(48)), M.chrome, [0, -0.35, 0], [Math.PI / 2, 0, 0]);
            h.position.set(0.61, -0.61, 0);
            h.rotation.z = Math.PI / 4;
            g.add(h);
            g.rotation.set(-0.2, 0.35, 0);
        },

        /* a fly at rest */
        'fly-game': function (g, A) {
            add(g, sphere(0.27), M.graphite, [0.08, 0, 0], null, [1.1, 0.92, 0.92]);
            add(g, sphere(0.19), M.graphite, [0.46, 0.02, 0]);
            add(g, sphere(0.12), A.anod, [0.53, 0.08, 0.12], null, [0.9, 1, 1]);
            add(g, sphere(0.12), A.anod, [0.53, 0.08, -0.12], null, [0.9, 1, 1]);
            var ab = lathe([[0, 0], [0.16, 0.04], [0.23, 0.18], [0.225, 0.38], [0.16, 0.56], [0.06, 0.67], [0, 0.69]], seg(48));
            add(g, ab, M.graphite, [-0.1, -0.02, 0], [0, 0, Math.PI / 2]);
            [0.24, 0.4, 0.55].forEach(function (y, k) {
                add(g, new T.TorusGeometry([0.228, 0.215, 0.17][k], 0.009, seg(10), seg(48)), M.brushed, [-0.1 - y, -0.02, 0], [0, Math.PI / 2, 0]);
            });
            [0.2, 0.04, -0.14].forEach(function (x0, k) {
                var dx = [0.26, 0.02, -0.26][k];
                [1, -1].forEach(function (s) {
                    add(g, tube([[x0, -0.14, 0.1 * s], [x0 + dx * 0.6, -0.12, 0.42 * s], [x0 + dx, -0.55, 0.55 * s]], 0.018, false, seg(32)), M.graphite);
                });
            });
            var wing = new T.Shape();
            wing.moveTo(0, 0);
            wing.bezierCurveTo(-0.2, 0.2, -0.75, 0.24, -0.95, 0.08);
            wing.bezierCurveTo(-1.0, -0.02, -0.7, -0.14, 0, 0);
            var wg = new T.ShapeGeometry(wing, seg(32));
            [1, -1].forEach(function (s) {
                var w = add(g, wg, M.glass, [0.1, 0.2, 0.06 * s], [-Math.PI / 2 + 0.25 * s, 0.32 * s, 0]);
                w.scale.z = s;
                var veins = new T.LineSegments(new T.EdgesGeometry(wg), new T.LineBasicMaterial({ color: 0x9a9aa4, transparent: true, opacity: 0.5 }));
                w.add(veins);
            });
            g.rotation.set(0.1, -0.6, 0);
        },

        /* a lantern with a real flame lighting its frame */
        'islam-kindles': function (g, A) {
            add(g, lathe([[0, -0.74], [0.64, -0.74], [0.64, -0.68], [0.58, -0.64], [0.58, -0.6], [0, -0.6]], 8), M.brushed, null, [0, Math.PI / 8, 0]);
            add(g, new T.CylinderGeometry(0.5, 0.5, 1.2, 8, 1, true), M.frosted, null, [0, Math.PI / 8, 0]);
            for (var k = 0; k < 8; k++) {
                var a = k * Math.PI / 4;
                add(g, rbox(0.04, 1.22, 0.04, 0.012), M.chrome, [Math.sin(a) * 0.51, 0, Math.cos(a) * 0.51], [0, a, 0]);
            }
            [0.6, -0.6].forEach(function (y) { add(g, new T.TorusGeometry(0.52, 0.026, seg(10), 8), M.chrome, [0, y, 0], [Math.PI / 2, 0, Math.PI / 8]); });
            add(g, new T.ConeGeometry(0.66, 0.46, 8), M.brushed, [0, 0.84, 0], [0, Math.PI / 8, 0]);
            add(g, sphere(0.065), M.chrome, [0, 1.12, 0]);
            add(g, new T.TorusGeometry(0.14, 0.022, seg(12), seg(48)), M.chrome, [0, 1.3, 0]);
            add(g, new T.CylinderGeometry(0.1, 0.11, 0.34, seg(32)), M.ceramic, [0, -0.43, 0]);
            var flame = add(g, sphere(0.075), A.glow, [0, -0.16, 0], null, [1, 2, 1]);
            var light = new T.PointLight(A.color, 1.6, 2.6, 2);
            light.position.set(0, -0.12, 0);
            g.add(light);
            return function (t, reduce) {
                var f = reduce ? 0 : Math.sin(t * 3.3) * 0.5 + Math.sin(t * 5.1) * 0.5;
                flame.scale.set(1, 2 + f * 0.12, 1);
                light.intensity = 1.6 + f * 0.25;
            };
        },

        /* a padlock */
        'login-system': function (g, A) {
            add(g, rbox(1.15, 0.95, 0.42, 0.13), M.graphite, [0, -0.3, 0]);
            add(g, rbox(0.95, 0.75, 0.03, 0.08), M.brushed, [0, -0.3, 0.205]);
            add(g, new T.CylinderGeometry(0.075, 0.075, 0.04, seg(32)), M.hole, [0, -0.24, 0.215], [Math.PI / 2, 0, 0]);
            add(g, rbox(0.05, 0.16, 0.04, 0.012), M.hole, [0, -0.35, 0.215]);
            add(g, new T.TorusGeometry(0.1, 0.012, seg(12), seg(48)), A.anod, [0, -0.24, 0.228]);
            [[-0.39, -0.02], [0.39, -0.02], [-0.39, -0.58], [0.39, -0.58]].forEach(function (p) {
                add(g, new T.CylinderGeometry(0.03, 0.03, 0.02, seg(20)), M.chrome, [p[0], p[1], 0.225], [Math.PI / 2, 0, 0]);
            });
            add(g, tube([[-0.36, 0.1, 0], [-0.36, 0.42, 0], [-0.3, 0.63, 0], [-0.16, 0.75, 0], [0, 0.79, 0], [0.16, 0.75, 0], [0.3, 0.63, 0], [0.36, 0.42, 0], [0.36, 0.1, 0]], 0.068), M.chrome);
            g.rotation.set(0, -0.35, 0);
        },

        /* a finished board with the winning line */
        'tic-tac-toe': function (g, A) {
            add(g, rbox(2.3, 0.12, 2.3, 0.05), M.graphite, [0, -0.1, 0]);
            [-0.35, 0.35].forEach(function (k) {
                add(g, rbox(2.0, 0.05, 0.045, 0.018), M.brushed, [0, -0.015, k]);
                add(g, rbox(0.045, 0.05, 2.0, 0.018), M.brushed, [k, -0.015, 0]);
            });
            [[-0.7, -0.7], [0, 0], [0.7, 0.7]].forEach(function (c) {
                add(g, rbox(0.48, 0.09, 0.09, 0.035), M.chrome, [c[0], 0.005, c[1]], [0, Math.PI / 4, 0]);
                add(g, rbox(0.48, 0.09, 0.09, 0.035), M.chrome, [c[0], 0.005, c[1]], [0, -Math.PI / 4, 0]);
            });
            [[0.7, -0.7], [-0.7, 0.7], [0, 0.7]].forEach(function (c) {
                add(g, new T.TorusGeometry(0.17, 0.045, seg(24), seg(64)), M.brushed, [c[0], 0.005, c[1]], [Math.PI / 2, 0, 0]);
            });
            add(g, rbox(2.0, 0.018, 0.028, 0.008), A.glow, [0, 0.06, 0], [0, -Math.PI / 4, 0]);
            g.rotation.y = 0.25;
        },

        /* six plates, one per assignment */
        'D0009E': function (g, A) {
            for (var i = 0; i < 6; i++) {
                add(g, rbox(1.45, 0.05, 1.0, 0.02), i === 5 ? M.brushed : M.frosted, [0, i * 0.2, 0]).renderOrder = i;
            }
            [[-0.62, -0.4], [0.62, -0.4], [-0.62, 0.4], [0.62, 0.4]].forEach(function (p) {
                add(g, new T.CylinderGeometry(0.03, 0.03, 1.08, seg(20)), M.chrome, [p[0], 0.5, p[1]]);
                add(g, sphere(0.045), M.chrome, [p[0], 1.06, p[1]]);
            });
            add(g, rbox(0.56, 0.006, 0.035, 0.003), A.glow, [-0.2, 1.028, 0.3]);
            g.rotation.set(0.1, 0.5, 0);
        },

        /* a graph, with a ring walking it in breadth-first order */
        'D0010E': function (g, A) {
            var nodes = [[0, 0.95, 0], [-0.75, 0.35, 0.3], [0.75, 0.4, -0.2], [-1.0, -0.45, -0.15], [-0.3, -0.5, 0.5], [0.4, -0.4, 0.4], [1.0, -0.55, -0.3]];
            [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6], [4, 5]].forEach(function (e) { rod(g, nodes[e[0]], nodes[e[1]], 0.018, M.brushed); });
            nodes.forEach(function (n) { add(g, sphere(0.125), M.chrome, n); });
            var ring = add(g, new T.TorusGeometry(0.21, 0.013, seg(12), seg(64)), A.glow, nodes[0], [Math.PI / 2, 0, 0]);
            var target = new T.Vector3();
            return function (t, reduce) {
                target.fromArray(nodes[reduce ? 0 : Math.floor(t / 1.8) % nodes.length]);
                if (reduce) ring.position.copy(target); else ring.position.lerp(target, 0.06);
            };
        },

        /* a ziggurat for Hammurabi's Sumer */
        'D0015E': function (g, A) {
            [1.8, 1.4, 1.0, 0.6].forEach(function (s, i) {
                add(g, rbox(s, 0.24, s, 0.03), i % 2 ? M.brushed : M.graphite, [0, i * 0.24 + 0.12, 0]);
            });
            for (var k = 0; k < 12; k++) {
                var h = (k + 1) * 0.08;
                add(g, rbox(0.3, h, 0.08, 0.01), M.brushed, [0, h / 2, 1.2 - k * 0.073 - 0.04]);
            }
            add(g, rbox(0.34, 0.22, 0.34, 0.03), M.chrome, [0, 1.07, 0]);
            add(g, rbox(0.1, 0.13, 0.01, 0.004), A.glow, [0, 1.04, 0.171]);
            g.rotation.y = 0.55;
        },

        /* a sword */
        'hero-fight': function (g, A) {
            add(g, extrude([[-0.075, -0.05], [0.075, -0.05], [0.07, 1.2], [0, 1.52], [-0.07, 1.2]], 0.018, 0.012), M.chrome);
            add(g, rbox(0.024, 1.0, 0.006, 0.003), M.graphite, [0, 0.55, 0.021]);
            add(g, rbox(0.024, 1.0, 0.006, 0.003), M.graphite, [0, 0.55, -0.021]);
            add(g, tube([[-0.42, -0.02, 0], [-0.22, -0.08, 0], [0, -0.1, 0], [0.22, -0.08, 0], [0.42, -0.02, 0]], 0.036, false, seg(64)), M.brushed);
            add(g, sphere(0.055), M.chrome, [-0.42, -0.02, 0]);
            add(g, sphere(0.055), M.chrome, [0.42, -0.02, 0]);
            add(g, rbox(0.2, 0.16, 0.11, 0.04), M.chrome, [0, -0.1, 0]);
            add(g, new T.OctahedronGeometry(0.055), A.anod, [0, -0.1, 0.06], null, [1, 1, 0.5]);
            add(g, new T.CylinderGeometry(0.045, 0.045, 0.44, seg(24)), M.graphite, [0, -0.4, 0]);
            for (var k = 0; k < 7; k++) add(g, new T.TorusGeometry(0.047, 0.009, seg(8), seg(32)), M.brushed, [0, -0.22 - k * 0.06, 0], [Math.PI / 2, 0, 0]);
            add(g, sphere(0.085), M.chrome, [0, -0.68, 0]);
            g.rotation.set(0, 0.3, -0.12);
        },

        /* an airliner */
        'airplane-simulator': function (g, A) {
            var body = lathe([[0, 0], [0.045, 0.02], [0.085, 0.08], [0.12, 0.2], [0.14, 0.4], [0.145, 0.7], [0.14, 1.2], [0.12, 1.45], [0.085, 1.62], [0.04, 1.72], [0, 1.75]], seg(48));
            body.translate(0, -0.875, 0);
            body.rotateZ(-Math.PI / 2);
            add(g, body, M.ceramic);
            var wing = extrude([[-0.22, 0.12], [0.18, 0.95], [0.32, 0.95], [0.26, 0.12], [0.26, -0.12], [0.32, -0.95], [0.18, -0.95], [-0.22, -0.12]], 0.02, 0.01);
            wing.rotateX(-Math.PI / 2);
            add(g, wing, M.ceramic, [0, -0.06, 0]);
            var tail = extrude([[0.55, 0.05], [0.72, 0.34], [0.8, 0.34], [0.8, -0.34], [0.72, -0.34], [0.55, -0.05]], 0.015, 0.008);
            tail.rotateX(-Math.PI / 2);
            add(g, tail, M.ceramic, [0, 0.03, 0]);
            add(g, extrude([[0.5, 0.05], [0.72, 0.42], [0.82, 0.42], [0.84, 0.05]], 0.015, 0.008), M.ceramic);
            [0.45, -0.45].forEach(function (z) {
                var nac = lathe([[0, 0], [0.055, 0], [0.072, 0.04], [0.076, 0.14], [0.07, 0.3], [0.05, 0.36], [0, 0.38]], seg(32));
                nac.rotateZ(-Math.PI / 2);
                add(g, nac, M.brushed, [-0.3, -0.15, z]);
                add(g, new T.TorusGeometry(0.068, 0.01, seg(10), seg(40)), M.chrome, [-0.3, -0.15, z], [0, Math.PI / 2, 0]);
                add(g, rbox(0.14, 0.08, 0.02, 0.008), M.ceramic, [-0.14, -0.1, z]);
            });
            add(g, sphere(0.022), A.glow, [0.3, -0.05, -0.95]);
            add(g, sphere(0.022), new T.MeshBasicMaterial({ color: 0xffffff }), [0.3, -0.05, 0.95]);
            g.rotation.set(0.12, 0.2, -0.1);
        },

        /* a processor */
        'D0011E': function (g, A) {
            add(g, rbox(1.5, 0.16, 1.5, 0.04), M.graphite);
            add(g, rbox(1.05, 0.03, 1.05, 0.015), M.brushed, [0, 0.095, 0]);
            add(g, rbox(0.62, 0.02, 0.62, 0.01), M.glass, [0, 0.118, 0]);
            add(g, rbox(0.5, 0.01, 0.5, 0.004), M.hole, [0, 0.112, 0]);
            for (var k = 1; k < 6; k++) {
                var v = -0.25 + k * (0.5 / 6);
                add(g, new T.BoxGeometry(0.46, 0.003, 0.004), M.brushed, [0, 0.119, v]);
                add(g, new T.BoxGeometry(0.004, 0.003, 0.46), M.brushed, [v, 0.119, 0]);
            }
            add(g, rbox(0.14, 0.01, 0.14, 0.004), A.glow, [0, 0.122, 0]);
            var n = 12, pinA = new T.BoxGeometry(0.05, 0.024, 0.16), pinB = new T.BoxGeometry(0.05, 0.12, 0.024);
            var ia = new T.InstancedMesh(pinA, M.chrome, n * 4), ib = new T.InstancedMesh(pinB, M.chrome, n * 4);
            var m4 = new T.Matrix4(), q = new T.Quaternion(), one = new T.Vector3(1, 1, 1), up = new T.Vector3(0, 1, 0);
            for (var side = 0; side < 4; side++) {
                q.setFromAxisAngle(up, side * Math.PI / 2);
                for (var j = 0; j < n; j++) {
                    var o = -0.61 + j * (1.22 / (n - 1));
                    ia.setMatrixAt(side * n + j, m4.compose(new T.Vector3(o, -0.02, 0.83).applyQuaternion(q), q, one));
                    ib.setMatrixAt(side * n + j, m4.compose(new T.Vector3(o, -0.07, 0.9).applyQuaternion(q), q, one));
                }
            }
            g.add(ia, ib);
            g.rotation.set(0.1, 0.4, 0);
        },

        /* two panes of code and a review comment */
        'code-review': function (g, A) {
            add(g, rbox(1.3, 1.7, 0.06, 0.05), M.graphite, [0.38, 0.12, -0.5], [0, -0.12, 0]);
            add(g, rbox(1.3, 1.7, 0.06, 0.05), M.graphite, [0, 0, 0]);
            add(g, rbox(1.18, 1.58, 0.01, 0.03), M.hole, [0, 0, 0.031]);
            [0.8, 0.55, 0.95, 0.4, 0.7, 0.6, 0.85, 0.35, 0.65, 0.5].forEach(function (w, k) {
                add(g, rbox(w, 0.045, 0.008, 0.02), k === 4 ? A.glow : M.ceramic, [-0.52 + w / 2, 0.64 - k * 0.14, 0.04]);
            });
            add(g, rbox(0.66, 0.34, 0.06, 0.1), M.ceramic, [0.82, 0.08, 0.3]);
            add(g, new T.ConeGeometry(0.05, 0.14, seg(24)), M.ceramic, [0.45, 0.08, 0.3], [0, 0, Math.PI / 2]);
            add(g, rbox(0.4, 0.028, 0.01, 0.012), A.anod, [0.78, 0.13, 0.335]);
            add(g, rbox(0.28, 0.028, 0.01, 0.012), M.brushed, [0.72, 0.05, 0.335]);
            g.rotation.y = -0.3;
        },

        /* the classic ray tracer scene: glass, matte and mirror spheres under one light */
        'ray-tracer': function (g, A) {
            add(g, new T.CylinderGeometry(1.7, 1.7, 0.05, seg(128)), M.satin, [0, -0.025, 0]).userData.receive = true;
            var glassBall = M.glass.clone();
            glassBall.opacity = 0.3;
            add(g, sphere(0.45), glassBall, [-0.64, 0.45, 0.12]);
            add(g, sphere(0.4), M.ceramic, [0.05, 0.4, -0.5]);
            add(g, sphere(0.42), M.chrome, [0.62, 0.42, 0.25]);
            add(g, sphere(0.05), A.glow, [0.05, 1.35, 0.55]);
            var light = new T.PointLight(A.color, 1.2, 4, 2);
            light.position.set(0.05, 1.3, 0.55);
            g.add(light);
        },

        /* a syntax tree, with the evaluated path lit */
        'interpreter': function (g, A) {
            var n = [[0, 1.0, 0], [-0.72, 0.4, 0.1], [0.72, 0.4, -0.1], [-1.1, -0.2, 0.15], [-0.38, -0.2, 0], [0.38, -0.2, -0.05], [1.1, -0.2, -0.15], [-0.55, -0.8, 0.1], [-0.2, -0.8, -0.1]];
            var e = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6], [4, 7], [4, 8]];
            var path = { '0-1': 1, '1-4': 1, '4-8': 1 };
            e.forEach(function (x) {
                var lit = path[x[0] + '-' + x[1]];
                rod(g, n[x[0]], n[x[1]], lit ? 0.02 : 0.014, lit ? A.glow : M.brushed);
            });
            var pill = new T.CapsuleGeometry(0.075, 0.2, seg(8), seg(24));
            n.forEach(function (p, i) { add(g, pill, M.chrome, p, [0, 0, Math.PI / 2], i === 0 ? [1.3, 1.3, 1.3] : null); });
        },

        /* a small network, one output lit */
        'neural-network': function (g, A) {
            var layers = [4, 6, 3], pos = [];
            layers.forEach(function (count, li) {
                var col = [];
                for (var j = 0; j < count; j++) col.push([-1.1 + li * 1.1, (j - (count - 1) / 2) * 0.36, (li === 1 ? 0.1 : 0)]);
                pos.push(col);
            });
            for (var li = 0; li < 2; li++) pos[li].forEach(function (a) { pos[li + 1].forEach(function (b) { rod(g, a, b, 0.0055, M.brushed); }); });
            pos.forEach(function (col, li) {
                col.forEach(function (p, j) { add(g, sphere(0.09), li === 2 && j === 1 ? A.glow : M.chrome, p); });
            });
            var light = new T.PointLight(A.color, 0.8, 1.6, 2);
            light.position.set(1.1, 0, 0.3);
            g.add(light);
        },

        /* nested headers, pulled apart like an exploded view */
        'packet-analyser': function (g, A) {
            var sizes = [[1.8, 1.05, 1.05], [1.3, 0.76, 0.76], [0.9, 0.5, 0.5]];
            var layers = sizes.map(function (s, i) {
                var lg = new T.Group();
                add(lg, rbox(s[0], s[1], s[2], 0.06 - i * 0.012), M.frosted).renderOrder = 3 - i;
                g.add(lg);
                return lg;
            });
            var core = new T.Group();
            add(core, rbox(0.5, 0.26, 0.26, 0.04), M.brushed);
            add(core, rbox(0.51, 0.02, 0.27, 0.01), A.glow);
            g.add(core);
            layers.push(core);
            var o = layers[0];
            [[1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]].forEach(function (c) {
                var x = c[0] * 0.9, y = c[1] * 0.525, z = c[2] * 0.525;
                add(o, new T.BoxGeometry(0.14, 0.026, 0.026), M.chrome, [x - c[0] * 0.07, y, z]);
                add(o, new T.BoxGeometry(0.026, 0.14, 0.026), M.chrome, [x, y - c[1] * 0.07, z]);
                add(o, new T.BoxGeometry(0.026, 0.026, 0.14), M.chrome, [x, y, z - c[2] * 0.07]);
            });
            g.rotation.set(0.25, -0.5, 0);
            return function (t, reduce) {
                var k = reduce ? 0.6 : 0.5 - 0.5 * Math.cos(t * 0.5);
                layers.forEach(function (lg, i) { lg.position.x = i * 0.2 * k; });
            };
        },

        /* a captured flag */
        'ctf': function (g, A) {
            add(g, lathe([[0, 0], [0.32, 0], [0.32, 0.05], [0.24, 0.09], [0.21, 0.14], [0.05, 0.16], [0.05, 0.2], [0, 0.2]]), M.graphite, [0, -1.1, 0]);
            add(g, new T.CylinderGeometry(0.028, 0.028, 2.3, seg(24)), M.chrome, [0, 0.05, 0]);
            add(g, sphere(0.065), A.anod, [0, 1.25, 0]);
            [0.44, 1.14].forEach(function (y) { add(g, new T.TorusGeometry(0.04, 0.01, seg(10), seg(32)), M.chrome, [0, y, 0], [Math.PI / 2, 0, 0]); });
            var fg = new T.PlaneGeometry(1.25, 0.78, seg(56), seg(18));
            fg.translate(0.625, 0, 0);
            add(g, fg, M.cloth, [0.03, 0.79, 0]);
            var fp = fg.attributes.position, xs = new Float32Array(fp.count), ys = new Float32Array(fp.count);
            for (var i = 0; i < fp.count; i++) { xs[i] = fp.getX(i); ys[i] = fp.getY(i); }
            g.rotation.y = -0.5;
            return function (t, reduce) {
                var tt = reduce ? 1 : t;
                for (var i = 0; i < fp.count; i++) {
                    var u = xs[i] / 1.25;
                    fp.setZ(i, (Math.sin(xs[i] * 4.2 - tt * 1.6) * 0.075 + Math.sin(xs[i] * 7 + ys[i] * 3 - tt * 2.3) * 0.02) * u);
                    fp.setY(i, ys[i] - u * u * 0.04);
                }
                fp.needsUpdate = true;
                fg.computeVertexNormals();
            };
        },

        /* two chain links, with a packet running round one */
        'open-source': function (g, A) {
            var pts = [], L = 0.34, R = 0.27, k;
            for (k = 0; k <= 10; k++) { var a1 = -Math.PI / 2 + k * Math.PI / 10; pts.push([L + Math.cos(a1) * R, Math.sin(a1) * R, 0]); }
            for (k = 0; k <= 10; k++) { var a2 = Math.PI / 2 + k * Math.PI / 10; pts.push([-L + Math.cos(a2) * R, Math.sin(a2) * R, 0]); }
            var path = curve(pts, true);
            var linkGeo = new T.TubeGeometry(path, seg(160), 0.075, seg(24), true);
            add(g, linkGeo, M.chrome, [-0.33, 0, 0]);
            var b = new T.Group();
            b.position.set(0.33, 0, 0);
            b.rotation.x = Math.PI / 2;
            add(b, linkGeo, M.brushed);
            var packet = add(b, sphere(0.05), A.glow);
            g.add(b);
            g.rotation.set(0.35, 0.3, 0.1);
            return function (t, reduce) {
                var p = path.getPointAt(reduce ? 0.3 : (t * 0.08) % 1);
                packet.position.set(p.x, p.y, p.z + 0.09);
            };
        },

        /* an open notebook and a pen */
        'technical-writing': function (g, A) {
            var pages = new T.BoxGeometry(0.97, 0.08, 1.26, seg(40), 1, 1);
            pages.translate(0.485, 0.04, 0);
            var pp = pages.attributes.position;
            for (var i = 0; i < pp.count; i++) {
                var u = pp.getX(i) / 0.97;
                pp.setY(i, pp.getY(i) + Math.sin(u * Math.PI * 0.9) * 0.08 - (1 - u) * (1 - u) * 0.02);
            }
            pages.computeVertexNormals();
            [1, -1].forEach(function (s) {
                var pv = new T.Group();
                pv.rotation.z = 0.1 * s;
                add(pv, rbox(1.03, 0.045, 1.34, 0.02), M.graphite, [0.515 * s, -0.02, 0]);
                var pg = add(pv, pages, M.paper, [0, 0.005, 0]);
                pg.scale.x = s;
                g.add(pv);
            });
            var pen = new T.Group();
            add(pen, new T.CylinderGeometry(0.035, 0.035, 0.86, seg(32)), M.graphite, null, [0, 0, Math.PI / 2]);
            add(pen, new T.ConeGeometry(0.035, 0.13, seg(32)), M.chrome, [0.495, 0, 0], [0, 0, -Math.PI / 2]);
            add(pen, sphere(0.036), M.chrome, [-0.43, 0, 0]);
            add(pen, new T.CylinderGeometry(0.037, 0.037, 0.05, seg(32)), A.anod, [-0.18, 0, 0], [0, 0, Math.PI / 2]);
            add(pen, rbox(0.3, 0.012, 0.022, 0.005), M.chrome, [-0.28, 0.04, 0]);
            pen.position.set(0.5, 0.21, 0.12);
            pen.rotation.y = 0.55;
            g.add(pen);
            add(g, rbox(0.04, 0.006, 0.6, 0.002), A.anod, [0.02, 0.07, 0.72]);
            g.rotation.set(0, -0.25, 0);
        },

        /* islands on a grid, one of them found */
        'problem-solving': function (g, A) {
            var map = [
                [0, 1, 1, 0, 0, 0, 0],
                [0, 2, 1, 0, 0, 1, 0],
                [0, 1, 0, 0, 1, 2, 1],
                [0, 0, 0, 0, 0, 1, 0],
                [1, 0, 0, 1, 0, 0, 0],
                [2, 1, 0, 2, 1, 0, 0],
                [1, 0, 0, 1, 0, 0, 0]
            ];
            var found = { '1,5': 1, '2,4': 1, '2,5': 1, '2,6': 1, '3,5': 1 };
            add(g, rbox(2.05, 0.1, 2.05, 0.04), M.graphite, [0, -0.05, 0]);
            add(g, rbox(1.87, 0.02, 1.87, 0.01), M.glass, [0, 0.01, 0]);
            map.forEach(function (row, r) {
                row.forEach(function (h, c) {
                    if (!h) return;
                    var hh = 0.14 * h;
                    add(g, rbox(0.22, hh, 0.22, 0.025), found[r + ',' + c] ? A.anod : M.brushed, [(c - 3) * 0.25, 0.02 + hh / 2, (r - 3) * 0.25]);
                });
            });
            g.rotation.y = 0.4;
        }
    };
}
