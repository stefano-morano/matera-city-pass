import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

// Controllo stato utente
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Utente loggato:", user.email);
        const user_mail = user.email;
        checkProfile(user_mail);
        fetchFirstPayment(user_mail);

        document.getElementById("zero").addEventListener("click", function() {
            updatePass(user_mail).then((result) => {
                console.log("Pass giornaliero creato: ", result);
                // Reindirizza alla pagina di pagamento
                loadPage("loading");
            });
        }
        );

        document.getElementById("first").addEventListener("click", function() {
            let url = 'https://buy.stripe.com/4gweYEah72rE1fWfZ0?prefilled_email=' + user_mail;
            console.log(url);
            window.location.href = url;
        }
        );
        
        document.getElementById("second").addEventListener("click", function() {
            let url = 'https://buy.stripe.com/14kdUAgFv8Q2aQw3cd?prefilled_email=' + user_mail;
            console.log(url);
            window.location.href = url;
        }
        );
        
        document.getElementById("third").addEventListener("click", function() {
            let url = 'https://buy.stripe.com/00gdUA0Gx8Q20bS3cc?prefilled_email=' + user_mail;
            console.log(url);
            window.location.href = url;
        }
        );
    } else {
        console.log("Nessun utente loggato");
        loadPage("login");
    }
});

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

async function updatePass(email) {

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

            let ore = midnight();

            const updateData = {
                fields: {
                    "Tipo Pass": ore
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
            console.log("Pass giornaliero creato: ", updateResult);
        } else {
            console.log("Email non trovata nel database");
            return "Email non trovata";
        }
    } catch (error) {
        console.error("Errore nella richiesta:", error);
        return "Errore nella connessione";
    }
}

//Funzione che calcola quante ore mancano a mezzanotte
function midnight() {
    const oraCorrente = new Date();
    const mezzanotte = new Date();
  
    // Imposta mezzanotte al giorno successivo, ore 00:00:00
    mezzanotte.setHours(24, 0, 0, 0);
  
    const millisecondiMancanti = mezzanotte - oraCorrente;
    const oreMancanti = millisecondiMancanti / (1000 * 60 * 60);
  
    return parseFloat(oreMancanti.toFixed(2));
}

//funzione per verificare che il pass non sia stato ancora comprato per la prima volta
async function fetchFirstPayment(email) {
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
            let type = userRecord["Tipo Pass"];
            let active = userRecord["Stato Pass"];
            if (active == "Attivo" && type !== 0) {
                loadPage("pass");
            }
            if (type == 0) {
                document.getElementById("zero-card").style.display = "block";
            }
        } else {
            console.log("Nessun utente trovato con questa email.");
        }
    } catch (error) {
        console.error("Errore durante il recupero dell'utente:", error);
    }
}






