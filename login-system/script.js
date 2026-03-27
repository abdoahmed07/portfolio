// ── DEMO MODE DETECTION ────────────────────────────────────
// When opening as a local file (no server), skip PHP fetch entirely
const DEMO_MODE = window.location.protocol === "file:" ||
                  !window.location.hostname;


function switchTab(tab) {
    const panels = { login: "loginPanel", signup: "signupPanel" };
    const tabs   = { login: "tabLogin",   signup: "tabSignup" };

    // hide success panel whenever switching tabs
    document.getElementById("successPanel").classList.add("hidden");

    Object.keys(panels).forEach(key => {
        document.getElementById(panels[key]).classList.toggle("hidden", key !== tab);
        document.getElementById(tabs[key]).classList.toggle("active", key === tab);
    });

    // clear all alerts and error states
    document.querySelectorAll(".alert").forEach(el => {
        el.classList.add("hidden");
        el.textContent = "";
        el.className = "alert hidden";
    });
    document.querySelectorAll(".field-input").forEach(el => el.classList.remove("error"));

    // reset buttons in case they were disabled
    const loginBtn  = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");
    if (loginBtn)  { loginBtn.textContent  = "Login →";          loginBtn.disabled  = false; }
    if (signupBtn) { signupBtn.textContent = "Create Account →"; signupBtn.disabled = false; }
}

// ── ALERT HELPERS ───────────────────────────────────────────
function showAlert(id, msg, type) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.className = `alert alert-${type}`;
}

function hideAlert(id) {
    const el = document.getElementById(id);
    el.className = "alert hidden";
    el.textContent = "";
}

// ── SUCCESS STATE ───────────────────────────────────────────
function showSuccess(title, msg, redirectUrl) {
    // hide all panels, show success
    ["loginPanel","signupPanel"].forEach(id =>
        document.getElementById(id).classList.add("hidden")
    );
    const panel = document.getElementById("successPanel");
    panel.classList.remove("hidden");

    document.getElementById("successTitle").textContent = title;
    document.getElementById("successMsg").textContent   = msg;

    // animate the redirect bar then navigate
    requestAnimationFrame(() => {
        const fill = document.getElementById("redirectFill");
        fill.style.width = "100%";
    });

    setTimeout(() => {
        if (redirectUrl) window.location.href = redirectUrl;
    }, 2600);
}

// ── PASSWORD TOGGLE ─────────────────────────────────────────
function togglePass(fieldId, btn) {
    const field   = document.getElementById(fieldId);
    const isHidden = field.type === "password";
    field.type = isHidden ? "text" : "password";

    const path = btn.querySelector("path");
    const svg  = btn.querySelector("svg");

    if (isHidden) {
        path.setAttribute("d",
            "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" +
            "M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" +
            "m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
        );
        const circle = svg.querySelector("circle");
        if (circle) circle.remove();
    } else {
        path.setAttribute("d", "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z");
        if (!svg.querySelector("circle")) {
            const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            c.setAttribute("cx","12"); c.setAttribute("cy","12"); c.setAttribute("r","3");
            svg.appendChild(c);
        }
    }
}

// ── PASSWORD STRENGTH ───────────────────────────────────────
const signupPassEl = document.getElementById("signupPass");
if (signupPassEl) {
    signupPassEl.addEventListener("input", function() {
        const val   = this.value;
        const fill  = document.getElementById("strengthFill");
        const label = document.getElementById("strengthLabel");

        if (!val) {
            fill.style.width = "0%";
            label.textContent = "";
            return;
        }

        let score = 0;
        if (val.length >= 8)            score++;
        if (/[A-Z]/.test(val))          score++;
        if (/[0-9]/.test(val))          score++;
        if (/[^A-Za-z0-9]/.test(val))   score++;

        const levels = [
            { pct:"25%", color:"#ef4444", text:"Weak"   },
            { pct:"50%", color:"#f59e0b", text:"Fair"   },
            { pct:"75%", color:"#3b82f6", text:"Good"   },
            { pct:"100%",color:"#10b981", text:"Strong" },
        ];
        const lvl = levels[Math.max(0, score - 1)];
        fill.style.width      = lvl.pct;
        fill.style.background = lvl.color;
        label.textContent     = lvl.text;
        label.style.color     = lvl.color;
    });
}

// ── VALIDATION HELPERS ──────────────────────────────────────
function validate(fields) {
    let valid = true;
    fields.forEach(({ id, check, msg, alertId }) => {
        const el = document.getElementById(id);
        if (!check(el.value)) {
            el.classList.add("error");
            if (alertId) showAlert(alertId, msg, "error");
            valid = false;
        }
    });
    return valid;
}

// clear error on input
document.querySelectorAll(".field-input").forEach(input => {
    input.addEventListener("input", function() {
        this.classList.remove("error");
    });
});

// ── LOGIN FORM ──────────────────────────────────────────────
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        hideAlert("loginAlert");

        const user = document.getElementById("loginUser").value.trim();
        const pass = document.getElementById("loginPass").value;

        // client-side checks
        if (!user) {
            document.getElementById("loginUser").classList.add("error");
            showAlert("loginAlert", "Please enter your username or email.", "error");
            return;
        }
        if (!pass) {
            document.getElementById("loginPass").classList.add("error");
            showAlert("loginAlert", "Please enter your password.", "error");
            return;
        }

        // show loading state
        const btn = document.getElementById("loginBtn");
        btn.textContent  = "Logging in…";
        btn.disabled     = true;

        if (DEMO_MODE) {
            showSuccess("Logged in!", `Welcome back, ${user}. Redirecting you to the game…`, null);
            return;
        }

        try {

            if (res.ok || res.redirected) {
                showSuccess(
                    "Logged in!",
                    `Welcome back, ${user}. Redirecting you to the game…`,
                    res.redirected ? res.url : "ttt/index.html"
                );
            } else {
                const text = await res.text();
                const match = text.match(/Password incorrect|Email is not registered|not registered/i);
                showAlert("loginAlert",
                    match ? match[0] : "Incorrect username or password.",
                    "error"
                );
                btn.textContent = "Login →";
                btn.disabled    = false;
            }
        } catch {
            // No PHP server — demo mode
            showSuccess(
                "Logged in!",
                `Welcome back, ${user}. Redirecting you to the game…`,
                null
            );
        }
    });
}

// ── SIGNUP FORM ─────────────────────────────────────────────
const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        hideAlert("signupAlert");

        const user  = document.getElementById("signupUser").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const pass  = document.getElementById("signupPass").value;

        // validation
        if (!user) {
            document.getElementById("signupUser").classList.add("error");
            showAlert("signupAlert", "Please choose a username.", "error");
            return;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            document.getElementById("signupEmail").classList.add("error");
            showAlert("signupAlert", "Please enter a valid email address.", "error");
            return;
        }
        if (pass.length < 6) {
            document.getElementById("signupPass").classList.add("error");
            showAlert("signupAlert", "Password must be at least 6 characters.", "error");
            return;
        }

        const btn = document.getElementById("signupBtn");
        btn.textContent = "Creating account…";
        btn.disabled    = true;

        if (DEMO_MODE) {
            showSuccess("Account created!", `Welcome, ${user}! Your account is ready.`, null);
            return;
        }

        try {

            const res = await fetch("signup.php", { method:"POST", body: fd });

            if (res.ok || res.redirected) {
                showSuccess(
                    "Account created!",
                    `Welcome, ${user}! Your account is ready. Redirecting to login…`,
                    "index.html"
                );
            } else {
                const text = await res.text();
                const match = text.match(/already exists/i);
                showAlert("signupAlert",
                    match ? "That username or email is already registered." : "Something went wrong. Try again.",
                    "error"
                );
                btn.textContent = "Create Account →";
                btn.disabled    = false;
            }
        } catch {
            // No PHP server — demo mode: show success
            showSuccess(
                "Account created!",
                `Welcome, ${user}! Your account is ready.`,
                null
            );
        }
    });
}