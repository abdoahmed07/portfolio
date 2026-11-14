
        document.getElementById("menuToggle").addEventListener("click", (e) => {
            const open = document.getElementById("navLinks").classList.toggle("open");
            e.currentTarget.setAttribute("aria-expanded", String(open));
        });
    