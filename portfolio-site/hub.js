/* The hub's contact form. It posts to Formspree in the background and says how it went. */
(function () {
    var form = document.getElementById('contactForm');
    if (!form) return;
    var submit = document.getElementById('cfSubmit');
    var status = document.getElementById('cfStatus');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        status.textContent = '';
        status.className = 'cf-status';
        if (!form.checkValidity()) {
            status.textContent = 'Add your email and a message first.';
            status.classList.add('err');
            return;
        }
        submit.disabled = true;
        submit.textContent = 'Sending...';
        fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                form.reset();
                status.textContent = 'Message sent, thanks!';
            })
            .catch(function () {
                status.textContent = 'Something went wrong. Try again later.';
                status.classList.add('err');
            })
            .then(function () {
                submit.disabled = false;
                submit.textContent = 'Send message';
            });
    });
})();
