
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
        document.getElementById("sendForm").addEventListener("click", () => {
            const name    = document.getElementById("name").value.trim();
            const email   = document.getElementById("email").value.trim();
            const message = document.getElementById("message").value.trim();
            if (!name || !email || !message) return;

            document.getElementById("name").value    = "";
            document.getElementById("email").value   = "";
            document.getElementById("message").value = "";

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
    