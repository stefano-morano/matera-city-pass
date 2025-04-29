export function loadFooter() {
    const footer = document.getElementById("footer");
    const lang = localStorage.getItem("lang") || "it"; // Imposta la lingua predefinita su italiano
    if (lang === "it") {
        fetch('/Html/Ita/footer.html')
            .then(response => response.text())
            .then(data => {
                footer.innerHTML = data;
            });
    }
    if (lang === "en") {
        fetch('/Html/Eng/footer.html')
            .then(response => response.text())
            .then(data => {
                footer.innerHTML = data;
            });
    }
}