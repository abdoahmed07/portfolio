
        // menu
        document.getElementById("menuToggle").addEventListener("click", () => {
            document.getElementById("navLinks").classList.toggle("open");
        });

        // FAQ accordion
        document.querySelectorAll(".faq-question").forEach(btn => {
            btn.addEventListener("click", () => {
                const answer = btn.nextElementSibling;
                const isOpen = btn.classList.contains("open");
                // close all
                document.querySelectorAll(".faq-question").forEach(b => {
                    b.classList.remove("open");
                    b.nextElementSibling.style.display = "none";
                });
                if (!isOpen) {
                    btn.classList.add("open");
                    answer.style.display = "block";
                }
            });
        });

        // Contact form
        const nameField    = document.getElementById("name");
        const emailField   = document.getElementById("email");
        const messageField = document.getElementById("message");

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

            const success = document.getElementById("formSuccess");
            success.style.display = "block";
            setTimeout(() => success.style.display = "none", 4000);
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
    