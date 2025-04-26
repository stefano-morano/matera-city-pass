import {auth} from "./firebase-config.js"
import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {AIRTABLE_API_KEY, BASE_ID, TABLE_PASS, TABLE_USER} from "./airtable-config.js";
import { loadNavbar } from "./navbar-loader.js";

const lang = localStorage.getItem("lang") || "it"; // Imposta la lingua predefinita su italiano

function loadPage(name) {
    if (lang === "it") {
        window.location.href = `/Html/Ita/${name}.html`;
    }
    if (lang === "en") {
        window.location.href = `/Html/Eng/${name}.html`;
    }
}

onAuthStateChanged(auth, async (user) => {
    await new Promise(resolve => setTimeout(resolve, 4000));
    if (user) {
        console.log("Utente loggato:", user.email);
        
        checkProfile(user.email);
        fetchUser(user.email);
    } else {
        loadPage("login");
        console.log("Nessun utente loggato");
    }
});

window.onload = function() {
    loadNavbar();
}

//check profile user
async function checkProfile(email) {

    const searchUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_USER}?filterByFormula=FIND('${email}', {Email})`;
 
     try {
         const response = await fetch(searchUrl, {
             headers: {
                 'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                 'Content-Type': 'application/json'
             }
         });
 
         const data = await response.json();
 
         if (data.records.length > 0) {
             const user = data.records[0].fields;
 
             // Controlla se il profilo è completo e reindirizza l'utente alla pagina di registrazione
             if (user["Completato"] !== true) {
                loadPage("registration_form");
                return;
             }
         } else {
             console.error("Utente non trovato!");
         }
     } catch (error) {
         console.error("Errore nella richiesta:", error);
     }
}

async function fetchUser(email) {
    const url_utenti = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_PASS}?filterByFormula={User}="${email}"`;

    try {
        const response = await fetch(url_utenti, {
            headers: {
                "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (data.records.length > 0) {
            const userRecord = data.records[0].fields; // Prende il primo record trovato
            let active = userRecord["Stato Pass"];
            let passType = userRecord["Tipo Pass"];
            if (active == "Attivo" && passType !== 0) {
                loadPage("pass");
            } else {
                loadPage("payment");
            }
        } else {
            console.log("Nessun utente trovato con questa email.");
        }
    } catch (error) {
        console.error("Errore durante il recupero dell'utente:", error);
    }
}