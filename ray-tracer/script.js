/* ════════════════════════════════════════════════════════════
   Ray Tracer, JS port of the C++ path tracer
   Same math as src/*.h: Vec3, Ray, Sphere, materials, camera,
   the recursive ray_color() rendering equation, gamma correction.
   Renders progressively in a canvas instead of writing a PPM file.
════════════════════════════════════════════════════════════ */

/* ── Theme toggle ─────────────────────────────────────────── */
(function () {
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
})();

/* ── Tab switching ────────────────────────────────────────── */
document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

/* ════════════════════════════════════════════════════════════
   VEC3, positions, directions, and colors are all just 3 numbers
   Mirrors src/vec3.h
════════════════════════════════════════════════════════════ */
function vec3(x, y, z) { return { x: x, y: y, z: z }; }

function vAdd(a, b)   { return vec3(a.x + b.x, a.y + b.y, a.z + b.z); }
function vSub(a, b)   { return vec3(a.x - b.x, a.y - b.y, a.z - b.z); }
function vNeg(a)      { return vec3(-a.x, -a.y, -a.z); }
function vScale(a, t) { return vec3(a.x * t, a.y * t, a.z * t); }
function vMul(a, b)   { return vec3(a.x * b.x, a.y * b.y, a.z * b.z); } // component-wise, used for attenuation
function vDot(a, b)   { return a.x * b.x + a.y * b.y + a.z * b.z; }
function vCross(a, b) {
    return vec3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
}
function vLenSq(a) { return vDot(a, a); }
function vLen(a)   { return Math.sqrt(vLenSq(a)); }
function vUnit(a)  { var l = vLen(a); return vec3(a.x / l, a.y / l, a.z / l); }
function vNearZero(a) {
    var e = 1e-8;
    return Math.abs(a.x) < e && Math.abs(a.y) < e && Math.abs(a.z) < e;
}

function randDouble(min, max) {
    if (min === undefined) return Math.random();
    return min + (max - min) * Math.random();
}
function vRandom(min, max) {
    return vec3(randDouble(min, max), randDouble(min, max), randDouble(min, max));
}

/* Rejection sampling, generate random vectors until one lands inside the unit sphere */
function randomInUnitSphere() {
    while (true) {
        var p = vRandom(-1, 1);
        if (vLenSq(p) < 1.0) return p;
    }
}
function randomUnitVector() { return vUnit(randomInUnitSphere()); }

/* Rejection sampling in 2D, used for camera defocus blur */
function randomInUnitDisk() {
    while (true) {
        var p = vec3(randDouble(-1, 1), randDouble(-1, 1), 0);
        if (vLenSq(p) < 1.0) return p;
    }
}

/* v - 2*dot(v,n)*n */
function reflect(v, n) { return vSub(v, vScale(n, 2 * vDot(v, n))); }

/* Snell's law refraction */
function refract(uv, n, etaiOverEtat) {
    var cosTheta = Math.min(vDot(vNeg(uv), n), 1.0);
    var rOutPerp = vScale(vAdd(uv, vScale(n, cosTheta)), etaiOverEtat);
    var rOutPara = vScale(n, -Math.sqrt(Math.abs(1.0 - vLenSq(rOutPerp))));
    return vAdd(rOutPerp, rOutPara);
}

/* Schlick's approximation for reflectance, how much glass reflects vs refracts at this angle */
function reflectance(cosine, refIdx) {
    var r0 = (1 - refIdx) / (1 + refIdx);
    r0 = r0 * r0;
    return r0 + (1 - r0) * Math.pow(1 - cosine, 5);
}

/* ════════════════════════════════════════════════════════════
   RAY, P(t) = origin + t * direction
   Mirrors src/ray.h
════════════════════════════════════════════════════════════ */
function ray(origin, direction) { return { origin: origin, direction: direction }; }
function rayAt(r, t) { return vAdd(r.origin, vScale(r.direction, t)); }

/* ════════════════════════════════════════════════════════════
   MATERIALS, Lambertian (matte), Metal, Dielectric (glass)
   Mirrors src/material.h
   Each scatter() returns { attenuation, scattered } or null (ray absorbed)
════════════════════════════════════════════════════════════ */
function scatterLambertian(mat, rIn, rec) {
    var scatterDirection = vAdd(rec.normal, randomUnitVector());
    if (vNearZero(scatterDirection)) scatterDirection = rec.normal;
    return { attenuation: mat.albedo, scattered: ray(rec.p, scatterDirection) };
}

function scatterMetal(mat, rIn, rec) {
    var reflected  = reflect(vUnit(rIn.direction), rec.normal);
    var scattered  = ray(rec.p, vAdd(reflected, vScale(randomInUnitSphere(), mat.fuzz)));
    if (vDot(scattered.direction, rec.normal) <= 0) return null; // scattered below the surface
    return { attenuation: mat.albedo, scattered: scattered };
}

function scatterDielectric(mat, rIn, rec) {
    var attenuation = vec3(1, 1, 1); // glass doesn't absorb color
    var refractionRatio = rec.frontFace ? (1.0 / mat.ir) : mat.ir;

    var unitDirection = vUnit(rIn.direction);
    var cosTheta = Math.min(vDot(vNeg(unitDirection), rec.normal), 1.0);
    var sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta);

    var cannotRefract = refractionRatio * sinTheta > 1.0;
    var direction;

    if (cannotRefract || reflectance(cosTheta, refractionRatio) > Math.random()) {
        direction = reflect(unitDirection, rec.normal);
    } else {
        direction = refract(unitDirection, rec.normal, refractionRatio);
    }

    return { attenuation: attenuation, scattered: ray(rec.p, direction) };
}

function scatter(mat, rIn, rec) {
    if (mat.type === 'lambertian') return scatterLambertian(mat, rIn, rec);
    if (mat.type === 'metal')      return scatterMetal(mat, rIn, rec);
    return scatterDielectric(mat, rIn, rec);
}

/* ════════════════════════════════════════════════════════════
   SPHERE, ray-sphere intersection via the quadratic formula
   Mirrors src/sphere.h
════════════════════════════════════════════════════════════ */
function sphereHit(sph, r, tMin, tMax) {
    var oc = vSub(r.origin, sph.center);
    var a = vLenSq(r.direction);
    var halfB = vDot(oc, r.direction);
    var c = vLenSq(oc) - sph.radius * sph.radius;

    var discriminant = halfB * halfB - a * c;
    if (discriminant < 0) return null;
    var sqrtd = Math.sqrt(discriminant);

    var root = (-halfB - sqrtd) / a;
    if (root < tMin || root > tMax) {
        root = (-halfB + sqrtd) / a;
        if (root < tMin || root > tMax) return null;
    }

    var p = rayAt(r, root);
    var outwardNormal = vScale(vSub(p, sph.center), 1 / sph.radius);
    var frontFace = vDot(r.direction, outwardNormal) < 0;

    return {
        t: root, p: p,
        normal: frontFace ? outwardNormal : vNeg(outwardNormal),
        frontFace: frontFace,
        material: sph.material,
    };
}

/* Test every sphere, keep the closest hit, mirrors HittableList::hit */
function hitWorld(world, r, tMin, tMax) {
    var closest = tMax, rec = null;
    for (var i = 0; i < world.length; i++) {
        var hit = sphereHit(world[i], r, tMin, closest);
        if (hit) { closest = hit.t; rec = hit; }
    }
    return rec;
}

/* ════════════════════════════════════════════════════════════
   CAMERA, thin-lens model with depth of field
   Mirrors src/camera.h
════════════════════════════════════════════════════════════ */
function makeCamera(lookfrom, lookat, vup, vfov, aspectRatio, aperture, focusDist) {
    var theta = vfov * Math.PI / 180;
    var h = Math.tan(theta / 2);
    var viewportHeight = 2.0 * h;
    var viewportWidth  = aspectRatio * viewportHeight;

    var w = vUnit(vSub(lookfrom, lookat));
    var u = vUnit(vCross(vup, w));
    var v = vCross(w, u);

    var origin = lookfrom;
    var horizontal = vScale(u, focusDist * viewportWidth);
    var vertical   = vScale(v, focusDist * viewportHeight);
    var lowerLeftCorner = vSub(vSub(vSub(origin, vScale(horizontal, 0.5)), vScale(vertical, 0.5)), vScale(w, focusDist));

    return {
        origin: origin, lowerLeftCorner: lowerLeftCorner,
        horizontal: horizontal, vertical: vertical,
        u: u, v: v, w: w, lensRadius: aperture / 2,
    };
}

function cameraGetRay(cam, s, t) {
    var rd = vScale(randomInUnitDisk(), cam.lensRadius);
    var offset = vAdd(vScale(cam.u, rd.x), vScale(cam.v, rd.y));
    var dir = vSub(vAdd(vAdd(cam.lowerLeftCorner, vScale(cam.horizontal, s)), vScale(cam.vertical, t)), vAdd(cam.origin, offset));
    return ray(vAdd(cam.origin, offset), dir);
}

/* ════════════════════════════════════════════════════════════
   RENDERING EQUATION, the recursive heart of the path tracer
   Mirrors ray_color() in main.cpp
════════════════════════════════════════════════════════════ */
function rayColor(r, world, depth) {
    if (depth <= 0) return vec3(0, 0, 0);

    // t_min = 0.001 avoids "shadow acne" (a ray re-hitting the surface it just left)
    var rec = hitWorld(world, r, 0.001, Infinity);
    if (rec) {
        var s = scatter(rec.material, r, rec);
        if (s) return vMul(s.attenuation, rayColor(s.scattered, world, depth - 1));
        return vec3(0, 0, 0); // absorbed
    }

    // Background: gradient from white to sky blue based on ray Y direction
    var unitDirection = vUnit(r.direction);
    var t = 0.5 * (unitDirection.y + 1.0);
    return vAdd(vScale(vec3(1, 1, 1), 1 - t), vScale(vec3(0.5, 0.7, 1.0), t));
}

/* ════════════════════════════════════════════════════════════
   SCENE, the Book 1 final scene, procedurally generated
   Mirrors random_scene() in main.cpp
════════════════════════════════════════════════════════════ */
function buildScene(gridRadius) {
    var world = [];

    world.push({ center: vec3(0, -1000, 0), radius: 1000, material: { type: 'lambertian', albedo: vec3(0.5, 0.5, 0.5) } });

    for (var a = -gridRadius; a < gridRadius; a++) {
        for (var b = -gridRadius; b < gridRadius; b++) {
            var chooseMat = Math.random();
            var center = vec3(a + 0.9 * Math.random(), 0.2, b + 0.9 * Math.random());

            if (vLen(vSub(center, vec3(4, 0.2, 0))) > 0.9) {
                var material;
                if (chooseMat < 0.8) {
                    material = { type: 'lambertian', albedo: vMul(vRandom(0, 1), vRandom(0, 1)) };
                } else if (chooseMat < 0.95) {
                    material = { type: 'metal', albedo: vRandom(0.5, 1), fuzz: randDouble(0, 0.5) };
                } else {
                    material = { type: 'dielectric', ir: 1.5 };
                }
                world.push({ center: center, radius: 0.2, material: material });
            }
        }
    }

    world.push({ center: vec3(0, 1, 0),  radius: 1.0, material: { type: 'dielectric', ir: 1.5 } });
    world.push({ center: vec3(-4, 1, 0), radius: 1.0, material: { type: 'lambertian', albedo: vec3(0.4, 0.2, 0.1) } });
    world.push({ center: vec3(4, 1, 0),  radius: 1.0, material: { type: 'metal', albedo: vec3(0.7, 0.6, 0.5), fuzz: 0.0 } });

    return world;
}

/* ════════════════════════════════════════════════════════════
   PROGRESSIVE RENDERER
   One sample per pixel is added on each pass. The canvas shows
   the running average, so noise clears up over a few seconds
   exactly like the C++ version clears up over more CLI samples.
════════════════════════════════════════════════════════════ */
(function () {
    var PRESETS = {
        fast:     { w: 300, h: 200, gridRadius: 4, maxDepth: 4, label: 'Fast' },
        normal:   { w: 380, h: 253, gridRadius: 6, maxDepth: 6, label: 'Normal' },
        detailed: { w: 460, h: 307, gridRadius: 8, maxDepth: 8, label: 'Detailed' },
    };

    var canvas = document.getElementById('rtCanvas');
    var ctx = canvas.getContext('2d');

    var preset      = 'normal';
    var aperture    = 0.1;
    var world       = null;
    var cam         = null;
    var accum       = null;   // Float64Array, 3 floats per pixel
    var imageData   = null;
    var samples     = 0;
    var resumeIndex = 0;      // pixel index to resume a time-sliced pass from
    var playing     = false;
    var rafHandle   = null;
    var renderedMs  = 0;      // active render time, paused between play/pause segments
    var segmentStart = 0;
    var FRAME_BUDGET_MS = 40;

    function currentConfig() { return PRESETS[preset]; }

    function setupScene() {
        var cfg = currentConfig();
        canvas.width = cfg.w;
        canvas.height = cfg.h;

        world = buildScene(cfg.gridRadius);

        var lookfrom = vec3(13, 2, 3);
        var lookat   = vec3(0, 0, 0);
        var vup      = vec3(0, 1, 0);
        cam = makeCamera(lookfrom, lookat, vup, 20, cfg.w / cfg.h, aperture, 10.0);

        accum = new Float64Array(cfg.w * cfg.h * 3);
        imageData = ctx.createImageData(cfg.w, cfg.h);
        samples = 0;
        resumeIndex = 0;
        renderedMs = 0;
        updateStatus();
    }

    /* Render one additional sample for every pixel, time-sliced across
       animation frames so a slow device never freezes the tab. */
    function renderPass(deadline) {
        var cfg = currentConfig();
        var w = cfg.w, h = cfg.h;
        var total = w * h;
        var checkEvery = 400;
        var processed = 0;

        while (resumeIndex < total) {
            var idx = resumeIndex;
            var x = idx % w;
            var y = (idx - x) / w;

            // Image is written top row first, but the camera's v=0 is the bottom,
            // flip y here so the render comes out right-side up.
            var flippedY = h - 1 - y;
            var u = (x + Math.random()) / (w - 1);
            var v = (flippedY + Math.random()) / (h - 1);

            var r = cameraGetRay(cam, u, v);
            var c = rayColor(r, world, cfg.maxDepth);

            var base = idx * 3;
            accum[base]     += c.x;
            accum[base + 1] += c.y;
            accum[base + 2] += c.z;

            resumeIndex++;
            processed++;

            if (processed % checkEvery === 0 && performance.now() > deadline) {
                return false; // ran out of time this frame, resume next frame
            }
        }

        // Full pass complete, one more sample accumulated for every pixel
        samples++;
        resumeIndex = 0;
        return true;
    }

    /* Write the current accumulated average (with gamma correction) to the canvas.
       Mirrors write_color() in color.h. */
    function present() {
        var cfg = currentConfig();
        var n = Math.max(1, samples);
        var data = imageData.data;

        for (var i = 0, px = 0; i < accum.length; i += 3, px += 4) {
            var r = Math.sqrt(accum[i]     / n);
            var g = Math.sqrt(accum[i + 1] / n);
            var b = Math.sqrt(accum[i + 2] / n);

            data[px]     = Math.floor(256 * Math.min(Math.max(r, 0), 0.999));
            data[px + 1] = Math.floor(256 * Math.min(Math.max(g, 0), 0.999));
            data[px + 2] = Math.floor(256 * Math.min(Math.max(b, 0), 0.999));
            data[px + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
    }

    /* Active render time only, paused segments don't count, so the clock
       doesn't jump ahead if the tab sits idle between play/pause. */
    function currentRenderedMs() {
        return renderedMs + (playing ? performance.now() - segmentStart : 0);
    }

    function updateStatus() {
        var elapsed = (currentRenderedMs() / 1000).toFixed(1);
        document.getElementById('rtStatus').textContent =
            currentConfig().label + ' · ' + samples + ' samples/px · ' + elapsed + 's';
    }

    function loop() {
        var deadline = performance.now() + FRAME_BUDGET_MS;
        var finishedPass = renderPass(deadline);
        if (finishedPass) present();
        updateStatus();
        if (playing) rafHandle = requestAnimationFrame(loop);
    }

    function play() {
        if (playing) return;
        playing = true;
        segmentStart = performance.now();
        document.getElementById('rtPlay').disabled = true;
        document.getElementById('rtPause').disabled = false;
        rafHandle = requestAnimationFrame(loop);
    }

    function pause() {
        if (playing) renderedMs += performance.now() - segmentStart;
        playing = false;
        document.getElementById('rtPlay').disabled = false;
        document.getElementById('rtPause').disabled = true;
        if (rafHandle) cancelAnimationFrame(rafHandle);
    }

    function reset() {
        pause();
        setupScene();
        present();
    }

    document.getElementById('rtPlay').addEventListener('click', play);
    document.getElementById('rtPause').addEventListener('click', pause);
    document.getElementById('rtReset').addEventListener('click', reset);

    document.querySelectorAll('.preset-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            preset = btn.dataset.preset;
            reset();
        });
    });

    var apertureSlider = document.getElementById('rtAperture');
    apertureSlider.addEventListener('input', function () {
        aperture = parseFloat(this.value) / 100;
        document.getElementById('rtApertureVal').textContent = this.value;
        reset();
    });

    setupScene();
    present();
    document.getElementById('rtPause').disabled = true;
})();

/* ════════════════════════════════════════════════════════════
   CODE VIEWER, actual C++ source files
════════════════════════════════════════════════════════════ */
(function () {
    var SRC = {};

    SRC.vec3 = String.raw`// The most important class in the whole project.
// Almost everything in a ray tracer is a vector operation: positions, directions, colors.
class Vec3 {
public:
    double e[3];

    Vec3() : e{0, 0, 0} {}
    Vec3(double x, double y, double z) : e{x, y, z} {}

    double x() const { return e[0]; }
    double y() const { return e[1]; }
    double z() const { return e[2]; }

    Vec3 operator-() const { return Vec3(-e[0], -e[1], -e[2]); }

    double length() const { return std::sqrt(length_squared()); }
    double length_squared() const { return e[0]*e[0] + e[1]*e[1] + e[2]*e[2]; }

    // Needed for diffuse scattering: catches the degenerate case where a random
    // unit vector exactly opposes the surface normal
    bool near_zero() const {
        const double eps = 1e-8;
        return (std::abs(e[0]) < eps) && (std::abs(e[1]) < eps) && (std::abs(e[2]) < eps);
    }

    static Vec3 random();
    static Vec3 random(double min, double max);
};

using Point3 = Vec3;
using Color  = Vec3;

// Reflect a vector v around a normal n
inline Vec3 reflect(const Vec3& v, const Vec3& n) {
    return v - 2 * dot(v, n) * n;
}

// Refract a vector through a surface using Snell's law
// This was the hardest piece of math in Book 1 to understand
inline Vec3 refract(const Vec3& uv, const Vec3& n, double etai_over_etat) {
    double cos_theta = std::fmin(dot(-uv, n), 1.0);
    Vec3 r_out_perp  = etai_over_etat * (uv + cos_theta * n);
    Vec3 r_out_para  = -std::sqrt(std::fabs(1.0 - r_out_perp.length_squared())) * n;
    return r_out_perp + r_out_para;
}`;

    SRC.sphere = String.raw`// A ray P(t) = A + t*b hits a sphere centered at C with radius r when:
//   |P(t) - C|^2 = r^2
// Expanding gives a quadratic in t. I use the discriminant to check for intersection.
class Sphere : public Hittable {
public:
    Point3 center;
    double radius;
    std::shared_ptr<Material> mat_ptr;

    Sphere(Point3 cen, double r, std::shared_ptr<Material> m)
        : center(cen), radius(r), mat_ptr(m) {}

    bool hit(const Ray& r, double t_min, double t_max, HitRecord& rec) const override {
        Vec3 oc = r.origin() - center;
        double a = r.direction().length_squared();
        double half_b = dot(oc, r.direction());
        double c = oc.length_squared() - radius * radius;

        double discriminant = half_b * half_b - a * c;
        if (discriminant < 0) return false;  // ray misses the sphere

        double sqrtd = std::sqrt(discriminant);

        // Find the nearest root that falls within [t_min, t_max]
        double root = (-half_b - sqrtd) / a;
        if (root < t_min || root > t_max) {
            root = (-half_b + sqrtd) / a;
            if (root < t_min || root > t_max) return false;
        }

        rec.t = root;
        rec.p = r.at(rec.t);
        Vec3 outward_normal = (rec.p - center) / radius;
        rec.set_face_normal(r, outward_normal);
        rec.mat_ptr = mat_ptr;

        return true;
    }
};`;

    SRC.material = String.raw`// Lambertian (matte): scatters light in a random direction on the hemisphere
// around the normal, proportional to cos(theta), physically correct for matte surfaces
class Lambertian : public Material {
public:
    Color albedo;
    Lambertian(const Color& a) : albedo(a) {}

    bool scatter(const Ray& r_in, const HitRecord& rec, Color& attenuation, Ray& scattered) const override {
        Vec3 scatter_direction = rec.normal + random_unit_vector();
        if (scatter_direction.near_zero())
            scatter_direction = rec.normal;

        scattered = Ray(rec.p, scatter_direction);
        attenuation = albedo;
        return true;
    }
};

// Metal: reflective, with an optional fuzz parameter for a brushed-metal look
class Metal : public Material {
public:
    Color albedo;
    double fuzz;
    Metal(const Color& a, double f) : albedo(a), fuzz(f < 1 ? f : 1) {}

    bool scatter(const Ray& r_in, const HitRecord& rec, Color& attenuation, Ray& scattered) const override {
        Vec3 reflected = reflect(unit_vector(r_in.direction()), rec.normal);
        scattered = Ray(rec.p, reflected + fuzz * random_in_unit_sphere());
        attenuation = albedo;
        return dot(scattered.direction(), rec.normal) > 0;
    }
};

// Dielectric (glass): uses Schlick's approximation for the Fresnel effect,
// at grazing angles, glass reflects more than it refracts
class Dielectric : public Material {
public:
    double ir; // index of refraction (glass ~1.5, diamond ~2.4, water ~1.33)
    Dielectric(double index_of_refraction) : ir(index_of_refraction) {}

    bool scatter(const Ray& r_in, const HitRecord& rec, Color& attenuation, Ray& scattered) const override {
        attenuation = Color(1.0, 1.0, 1.0); // glass doesn't absorb color
        double refraction_ratio = rec.front_face ? (1.0 / ir) : ir;

        Vec3 unit_direction = unit_vector(r_in.direction());
        double cos_theta = std::fmin(dot(-unit_direction, rec.normal), 1.0);
        double sin_theta = std::sqrt(1.0 - cos_theta * cos_theta);

        bool cannot_refract = refraction_ratio * sin_theta > 1.0;
        Vec3 direction;

        if (cannot_refract || reflectance(cos_theta, refraction_ratio) > random_double()) {
            direction = reflect(unit_direction, rec.normal);
        } else {
            direction = refract(unit_direction, rec.normal, refraction_ratio);
        }

        scattered = Ray(rec.p, direction);
        return true;
    }

private:
    // Polynomial approximation of the Fresnel equations, cheap and accurate enough
    static double reflectance(double cosine, double ref_idx) {
        double r0 = (1 - ref_idx) / (1 + ref_idx);
        r0 = r0 * r0;
        return r0 + (1 - r0) * std::pow((1 - cosine), 5);
    }
};`;

    SRC.camera = String.raw`// Computes rays from the eye through each pixel on the image plane.
// Also handles defocus blur: rays originate from a disk rather than a single
// point, creating the blurry foreground/background effect (depth of field).
class Camera {
public:
    Camera(Point3 lookfrom, Point3 lookat, Vec3 vup, double vfov,
           double aspect_ratio, double aperture, double focus_dist) {
        double theta = degrees_to_radians(vfov);
        double h = std::tan(theta / 2);

        double viewport_height = 2.0 * h;
        double viewport_width  = aspect_ratio * viewport_height;

        // Orthonormal basis (w, u, v) for the camera coordinate system
        w = unit_vector(lookfrom - lookat);
        u = unit_vector(cross(vup, w));
        v = cross(w, u);

        origin = lookfrom;
        horizontal = focus_dist * viewport_width  * u;
        vertical   = focus_dist * viewport_height * v;
        lower_left_corner = origin - horizontal/2 - vertical/2 - focus_dist * w;

        lens_radius = aperture / 2;
    }

    Ray get_ray(double s, double t) const {
        Vec3 rd = lens_radius * random_in_unit_disk();
        Vec3 offset = u * rd.x() + v * rd.y();

        return Ray(
            origin + offset,
            lower_left_corner + s*horizontal + t*vertical - origin - offset
        );
    }

private:
    Point3 origin, lower_left_corner;
    Vec3 horizontal, vertical, u, v, w;
    double lens_radius;
};`;

    SRC.raycolor = String.raw`// The core of the ray tracer: trace a ray through the scene and return its color.
// This is recursive, when a ray hits a surface, it bounces and we trace the bounce too.
// max_depth prevents infinite recursion.
Color ray_color(const Ray& r, const Hittable& world, int depth) {
    if (depth <= 0) return Color(0, 0, 0);

    HitRecord rec;

    // t_min = 0.001 instead of 0 avoids "shadow acne", a floating point artifact
    // where a ray hits the same surface it just scattered from
    if (world.hit(r, 0.001, infinity, rec)) {
        Ray scattered;
        Color attenuation;

        if (rec.mat_ptr->scatter(r, rec, attenuation, scattered)) {
            // Recursively trace the scattered ray, this implements the
            // rendering equation for indirect illumination
            return attenuation * ray_color(scattered, world, depth - 1);
        }

        return Color(0, 0, 0); // absorbed
    }

    // Background: gradient from white to sky blue based on ray Y direction
    Vec3 unit_direction = unit_vector(r.direction());
    double t = 0.5 * (unit_direction.y() + 1.0);
    return (1.0 - t) * Color(1.0, 1.0, 1.0) + t * Color(0.5, 0.7, 1.0);
}

int main() {
    const double aspect_ratio      = 3.0 / 2.0;
    const int    image_width       = 1200;
    const int    image_height      = static_cast<int>(image_width / aspect_ratio);
    const int    samples_per_pixel = 500;
    const int    max_depth         = 50;

    HittableList world = random_scene();

    Point3 lookfrom(13, 2, 3);
    Point3 lookat(0, 0, 0);
    Camera cam(lookfrom, lookat, Vec3(0,1,0), 20, aspect_ratio, 0.1, 10.0);

    std::cout << "P3\n" << image_width << ' ' << image_height << "\n255\n";

    for (int j = image_height - 1; j >= 0; --j) {
        for (int i = 0; i < image_width; ++i) {
            Color pixel_color(0, 0, 0);
            for (int s = 0; s < samples_per_pixel; ++s) {
                double u = (i + random_double()) / (image_width - 1);
                double v = (j + random_double()) / (image_height - 1);
                Ray r = cam.get_ray(u, v);
                pixel_color += ray_color(r, world, max_depth);
            }
            write_color(std::cout, pixel_color, samples_per_pixel);
        }
    }
    return 0;
}`;

    var codeBlock = document.getElementById('codeBlock');
    function loadCode(key) {
        codeBlock.textContent = SRC[key];
        codeBlock.removeAttribute('data-highlighted');
        hljs.highlightElement(codeBlock);
    }
    document.querySelectorAll('.file-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.file-tab').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            loadCode(btn.dataset.file);
        });
    });
    loadCode('raycolor');
})();
