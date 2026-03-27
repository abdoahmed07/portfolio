const input      = document.getElementById("text_in");
const submitBtn  = document.getElementById("submitBtn");
const btnLabel   = document.getElementById("btnLabel");
const charCount  = document.getElementById("charCount");
const charFill   = document.getElementById("charFill");
const inputWrap  = document.getElementById("inputWrap");
const validity   = document.getElementById("validity");
const result     = document.getElementById("result");
const resultIcon = document.getElementById("resultIcon");
const resultText = document.getElementById("resultText");
const tryAgain   = document.getElementById("tryAgain");

const MIN_LEN = 4;

// ── LIVE INPUT FEEDBACK ────────────────────────────────────
input.addEventListener("input", () => {
    const val  = input.value;
    const len  = val.length;
    const valid = len >= MIN_LEN;

    // char counter
    charCount.textContent = `${len} / ${MIN_LEN} characters minimum`;

    // progress bar (caps at 100% once valid)
    const pct = Math.min((len / MIN_LEN) * 100, 100);
    charFill.style.width = `${pct}%`;
    charFill.classList.toggle("valid", valid);

    // border state
    inputWrap.classList.toggle("valid",   valid && len > 0);
    inputWrap.classList.toggle("invalid", !valid && len > 0);

    // validity label
    if (len === 0) {
        validity.textContent = "";
        validity.className = "validity";
    } else if (valid) {
        validity.textContent = "✓ looks good";
        validity.className = "validity ok";
    } else {
        validity.textContent = `${MIN_LEN - len} more needed`;
        validity.className = "validity bad";
    }

    // button state
    submitBtn.disabled = !valid;
    btnLabel.textContent = valid ? `Check "${val}"` : "Enter a name first";

    // hide result if user starts typing again
    result.classList.add("hidden");
});

// ── SUBMIT ─────────────────────────────────────────────────
submitBtn.addEventListener("click", () => {
    const val = input.value.trim();
    if (val.length < MIN_LEN) return;

    // show result
    result.classList.remove("hidden", "error");
    resultIcon.textContent = "✓";
    resultText.textContent = `"${val}" is a great name!`;

    // scroll into view smoothly on mobile
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

// ── TRY AGAIN ──────────────────────────────────────────────
tryAgain.addEventListener("click", () => {
    input.value = "";
    input.dispatchEvent(new Event("input")); // reset all UI
    result.classList.add("hidden");
    input.focus();
});