
        // menu
        document.getElementById("menuToggle").addEventListener("click", (e) => {
            const open = document.getElementById("navLinks").classList.toggle("open");
            e.currentTarget.setAttribute("aria-expanded", String(open));
        });

        // FAQ accordion
        document.querySelectorAll(".faq-question").forEach(btn => {
            btn.addEventListener("click", () => {
                const answer = btn.nextElementSibling;
                const isOpen = btn.classList.contains("open");
                // close all
                document.querySelectorAll(".faq-question").forEach(b => {
                    b.classList.remove("open");
                    b.setAttribute("aria-expanded", "false");
                    b.nextElementSibling.style.display = "none";
                });
                if (!isOpen) {
                    btn.classList.add("open");
                    btn.setAttribute("aria-expanded", "true");
                    answer.style.display = "block";
                }
            });
        });

        // Contact form
        const nameField    = document.getElementById("name");
        const emailField   = document.getElementById("email");
        const messageField = document.getElementById("message");
        let successTimer;

        [nameField, emailField, messageField].forEach(field => {
            field.addEventListener("input", () => field.classList.remove("error"));
        });

        document.getElementById("sendForm").addEventListener("click", () => {
            const name    = nameField.value.trim();
            const email   = emailField.value.trim();
            const message = messageField.value.trim();

            // required is inert here (there's no <form> to trigger native
            // validation), so empty fields need to be flagged by hand
            nameField.classList.toggle("error", !name);
            emailField.classList.toggle("error", !email);
            messageField.classList.toggle("error", !message);
            if (!name || !email || !message) return;

            nameField.value    = "";
            emailField.value   = "";
            messageField.value = "";

            // Restart the hide timer on every submit so a second send stays visible
            const success = document.getElementById("formSuccess");
            success.style.display = "block";
            clearTimeout(successTimer);
            successTimer = setTimeout(() => success.style.display = "none", 4000);
        });

        // Chat
        const messagesEl = document.getElementById("messages");
        const chatInput  = document.getElementById("chatInput");

        function sendChat() {
            const text = chatInput.value.trim();
            if (!text) return;
            const bubble = document.createElement("div");
            bubble.className = "chat-bubble";
            bubble.textContent = text;
            messagesEl.appendChild(bubble);
            chatInput.value = "";
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        document.getElementById("sendBtn").addEventListener("click", sendChat);
        chatInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); sendChat(); } });
    