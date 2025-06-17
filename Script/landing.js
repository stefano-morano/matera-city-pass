import {loadNavbar} from '../../Script/navbar-loader.js';
import {loadFooter} from '../../Script/footer.js';

    const textContainers = document.querySelectorAll(".text-container");
    const lang = localStorage.getItem("lang") || "it"; // Imposta la lingua predefinita su italiano

    function loadPage(name) {
        if (lang === "it") {
            window.location.href = `/Html/Ita/${name}.html`;
        }
        if (lang === "en") {
            window.location.href = `/Html/Eng/${name}.html`;
        }
    }

    window.onload = function() {
        loadNavbar();
        loadFooter();
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, { threshold: 0.3 });

    textContainers.forEach(container => {
      observer.observe(container);
    });

    document.getElementById("button_price").addEventListener("click", () => {
      loadPage("registration");
    });