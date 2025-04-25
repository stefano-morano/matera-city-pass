//Function to load the upper navigation bar in different languages

const lang = localStorage.getItem("lang") || "it"; // Default to Italian if not set

function loadNavbar() {
    const currentPage = window.location.pathname.split('/').pop();

    if (lang === "it") {
        fetch('/Html/Ita/navigation-bar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbar').innerHTML = data;

            // Carica dinamicamente il modulo JavaScript
            import('/Script/navigation-bar.js')
                .then(module => {
                    console.log("Modulo JavaScript caricato!");
                    if (currentPage === "login.html" || currentPage === "registration.html") {
                        document.getElementById("loginBtn").style.display = "none";
                    }
                })
                .catch(err => {
                    console.error("Errore nel caricamento del modulo:", err);
                });
        });
    }

    if (lang === "en") {
        fetch('/Html/Eng/navigation-bar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbar').innerHTML = data;

            // Carica dinamicamente il modulo JavaScript
            import('/Script/navigation-bar.js')
                .then(module => {
                    console.log("Modulo JavaScript caricato!");
                    if (currentPage === "login.html" || currentPage === "registration.html") {
                        document.getElementById("loginBtn").style.display = "none";
                    }
                })
                .catch(err => {
                    console.error("Errore nel caricamento del modulo:", err);
                });
        });
    }
};

export { loadNavbar };