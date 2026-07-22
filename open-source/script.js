/* ════════════════════════════════════════════════════════════
   Open Source Contribution, socket.io
   A small interactive simulation of the actual bug: before the fix,
   an ack callback registered before a disconnect never fires again.
   After the fix, _onclose() calls it with an error immediately.
════════════════════════════════════════════════════════════ */

(function () {
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
})();

(function () {
    var fixed = true;
    var switchEl = document.getElementById('fixSwitch');
    var statusEl = document.getElementById('simStatus');
    var pendingTimer = null;

    function setStatus(cls, text) {
        statusEl.className = 'sim-status ' + cls;
        statusEl.textContent = text;
    }

    switchEl.addEventListener('click', function () {
        fixed = !fixed;
        switchEl.classList.toggle('on', fixed);
        document.getElementById('fixLabel').textContent = fixed ? 'Fixed (patched _onclose)' : 'Before the fix (original code)';
        clearTimeout(pendingTimer);
        setStatus('pending', 'Click "Emit with ack" to try it.');
    });

    document.getElementById('simRun').addEventListener('click', function () {
        clearTimeout(pendingTimer);
        setStatus('pending', 'Client: socket.emit("test", data, callback) ... waiting for ack ...');

        // Simulate the disconnect happening right before the server processes the ack,
        // the exact race condition the bug report described.
        pendingTimer = setTimeout(function () {
            setStatus('pending', 'Server: socket.disconnect(true) called before the ack was sent...');

            pendingTimer = setTimeout(function () {
                if (fixed) {
                    setStatus('resolved', '✓ callback(new Error("socket disconnected")), the caller knows delivery failed and can retry or alert the user.');
                } else {
                    setStatus('hung', '✕ callback is never called. No error, no timeout, nothing. The caller has no way to know the message was lost.');
                }
            }, 900);
        }, 700);
    });

    setStatus('pending', 'Click "Emit with ack" to try it.');
})();
