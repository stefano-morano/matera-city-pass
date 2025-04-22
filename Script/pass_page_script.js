import {auth} from "./firebase-config.js"
import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {AIRTABLE_API_KEY, BASE_ID, TABLE_PASS, TABLE_USER} from "./airtable-config.js";
import { loadNavbar } from "./navbar-loader.js";

const lang = localStorage.getItem("lang");

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
}

var user_email = "";

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Utente loggato:", user.email);
        user_email = user.email;
        checkProfile(user.email);
        fetchUser(user.email);
        getUserNameByEmail(user.email);
    } else {
       loadPage("login");
    }
});

async function getUserNameByEmail(email) {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_USER}?filterByFormula=Email='${email}'`;

    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (data.records.length > 0) {
            var userName = data.records[0].fields.Nome;
            userName = userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase();
            console.log("Nome utente trovato:", userName);
            if (lang == "it") {
                document.getElementById("username").textContent = `Ciao ${userName}!`;
            }
            if (lang == "en") {
                document.getElementById("username").textContent = `Hello ${userName}!`;
            }
        } else {
            console.log("Nessun utente trovato con questa email.");
        }
    } catch (error) {
        console.error("Errore durante il recupero dell'utente:", error);
    }
}

document.getElementById("generateBtn").addEventListener("click", function() {
    const qrContainer = document.getElementById("qrContainer");
    const timerText = document.getElementById("timer");
    const countdownElement = document.getElementById("countdown");
    document.getElementById("generateBtn").classList.add("hidden");
    
    // Pulisce il contenitore QR
    qrContainer.innerHTML = "";
    
    // Genera una stringa randomica
    const randomString = Math.random().toString(36).substr(2, 10);
    
    // Crea il QR Code
    const qrCode = new QRCode(qrContainer, {
        text: randomString,
        width: 128,
        height: 128
    });

    updateQR(user_email, randomString)
    .then(response => console.log(response));
    
    // Mostra il timer
    timerText.classList.remove("hidden");
    
    let timeLeft = 60;
    countdownElement.textContent = timeLeft;
    
    const countdown = setInterval(() => {
        timeLeft--;
        countdownElement.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(countdown);
            qrContainer.innerHTML = "";
            timerText.classList.add("hidden");
            document.getElementById("generateBtn").classList.remove("hidden");
        }
    }, 1000);
});

async function updateQR(email, newQR) {
    // CERCA L'EMAIL NEL DATABASE
    fetchUser(email);
    const searchUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_PASS}?filterByFormula={User}='${email}'`;

    try {
        const searchResponse = await fetch(searchUrl, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const searchData = await searchResponse.json();

        if (searchData.records.length > 0) {
            const recordId = searchData.records[0].id; // Prende l'ID del record trovato

            const updateUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_PASS}/${recordId}`;

            const updateData = {
                fields: {
                    "QR": newQR
                }
            };

            const updateResponse = await fetch(updateUrl, {
                method: "PATCH",
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const updateResult = await updateResponse.json();
            console.log("QR Code aggiornato con successo:", updateResult);
            return "QR aggiornato con successo";
        } else {
            console.log("Email non trovata nel database");
            return "Email non trovata";
        }
    } catch (error) {
        console.error("Errore nella richiesta:", error);
        return "Errore nella connessione";
    }
}

//funzione per verificare che il pass sia attivo
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
            if (active == "Scaduto") {
                loadPage("loading");
            }
        } else {
            console.log("Nessun utente trovato con questa email.");
        }
    } catch (error) {
        console.error("Errore durante il recupero dell'utente:", error);
    }
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
