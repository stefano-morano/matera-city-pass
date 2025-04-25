import {logout, auth} from "./firebase-config.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {AIRTABLE_API_KEY, BASE_ID, TABLE_USER, TABLE_PHOTOS} from "./airtable-config.js";

// Controllo stato utente
onAuthStateChanged(auth, (user) => {
    if (user) {
        fetchUser(user.email);
        document.getElementById("loginBtn").style.display = "none";
        document.getElementById("profileMenu").style.display = "block";
    }
});

function toggleProfileMenu() {
    document.getElementById("profileMenu").classList.toggle("active");
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("active");
}


checkLanguage();

// Funzione per il recupero dei dati dell'utente
async function fetchUser(email) {

    const url_utenti = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_USER}?filterByFormula={Email}="${email}"`;

    try {
        const response = await fetch(url_utenti, {
            headers: {
                "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (data.records.length > 0) {
            const userRecord = data.records[0].fields;

            const ID = userRecord.Picture;
            loadImage(ID);
        } else {
            console.log("Nessun utente trovato con questa email.");
        }
    } catch (error) {
        console.error("Errore durante il recupero dell'utente:", error);
    }
}

async function loadImage(recordID) {

    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_PHOTOS}?filterByFormula={ID}='${recordID}'`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`
        }
      });

      const data = await response.json();

      if (data.records.length === 0) {
        console.log("Nessun record trovato per questo ID.");
        return;
      }

      const attachment = data.records[0].fields.Photo;
      if (attachment && attachment.length > 0) {
        const imageUrl = attachment[0].url;
        document.getElementById('profileMenu').style.backgroundImage = `url(${imageUrl})`;
      } 
    } catch (error) {
      console.error("Errore durante la chiamata API:", error);
    }
}

function goHome(){
    const lang = localStorage.getItem("lang") || "it";
    if (lang === "it") {
        window.location.href = "/Html/Ita/main_page.html";
    } else if (lang === "en") {
        window.location.href = "/Html/Eng/main_page.html";
    }
}

function changeLanguage() {
    const lang = document.getElementById("language-select").value;
    localStorage.setItem("lang", lang);
    console.log("Lingua salvata: " + lang);
    location.reload();
}

function changeLanguagePhone() {
    const lang = document.getElementById("language-select-phone").value;
    localStorage.setItem("lang", lang);
    console.log("Lingua salvata: " + lang);
    location.reload();
}

document.getElementById("language-select").addEventListener("change", changeLanguage);
document.getElementById("profileMenu").addEventListener("click", toggleProfileMenu);
document.getElementById("logout-btn").addEventListener("click", () => {
    logout();
});

document.getElementById("burger").addEventListener("click", toggleSidebar);
document.getElementById("close-btn").addEventListener("click", toggleSidebar);
document.getElementById("title").addEventListener("click", goHome);
document.getElementById("logo").addEventListener("click", goHome);

function checkLanguage() {
    const lang = localStorage.getItem("lang") || "it"; // Default to Italian if no language is set
    document.getElementById("language-select").value = lang;
};