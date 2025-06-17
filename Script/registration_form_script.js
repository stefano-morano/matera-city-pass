import { auth } from "./firebase-config.js";
import { onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {AIRTABLE_API_KEY, BASE_ID, TABLE_USER} from "./airtable-config.js";
import { loadNavbar } from "./navbar-loader.js";
import { loadFooter } from "./footer.js";

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

var user_email;

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Utente autenticato:", user.email);
        user_email = user.email;
    } else {
        console.log("Nessun utente loggato, reindirizzo alla login...");
        loadPage("login");
    }
});

async function updateUser(email, nome, cognome, genere, nazionalita, telefono, dataNascita) {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_USER}?filterByFormula={Email}='${email}'`;
    
    try {
        // 🔍 Trova l'utente con l'email specificata
        const searchResponse = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        if (!searchResponse.ok) throw new Error("Errore nella ricerca dell'utente");

        const searchData = await searchResponse.json();
        
        if (searchData.records.length === 0) {
            console.log("❌ Email non trovata nella tabella");
            return null;
        }

        const recordId = searchData.records[0].id;
        let rand;
        if (genere == "Uomo") {
             rand = Math.floor(Math.random() * 5) + 1;
        } else {
             rand = Math.floor(Math.random() * 5) + 6;
        }

        let marketing = document.getElementById("marketing").checked;

        
        // ✏️ Aggiorna i dati dell'utente trovato
        const updateUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_USER}/${recordId}`;
        const fieldsToUpdate = {
            "Nome": nome,
            "Cognome": cognome,
            "Genere": genere,
            "Nazionalita": nazionalita,
            "Telefono": telefono,
            "Completato": true,
            "Picture": rand,
            "Promotions": marketing
        };

        if (dataNascita) {
            fieldsToUpdate["Data di Nascita"] = dataNascita;
        }

        const updateResponse = await fetch(updateUrl, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ fields: fieldsToUpdate })
        });

        if (!updateResponse.ok) throw new Error("Errore durante l'aggiornamento dell'utente");

        const updateData = await updateResponse.json();
        console.log("✅ Utente aggiornato con successo:", updateData);
        return updateData;
    } catch (error) {
        console.error("⚠️ Errore durante l'aggiornamento dell'utente:", error);
        return null;
    }
}


// Funzione click del submit del form
document.getElementById("submit_button").addEventListener("click", async function(event) {
    event.preventDefault();
    validateForm();
});

// Funzione per validare il form facendo un check dei campi obbligatori
async function validateForm() {
    const nome = document.getElementById("nome").value;
    const cognome = document.getElementById("cognome").value;
    const genere = document.getElementById("genere").value;
    const nazionalita = document.getElementById("countryDropdown").value;
    const cellulare = document.getElementById("telefono").value;
    const date = document.getElementById("data").value;
    const privacy = document.getElementById("privacy").checked;
    const terms = document.getElementById("termini").checked;
    const cookie = document.getElementById("cookies").checked;

    // Controllo se i campi sono vuoti
    if (!nome || !cognome || !genere || !nazionalita || !date || !privacy || !terms || !cookie) {
        highlightRequiredFields();
        return;
    }

    try {
        const result = await updateUser(user_email, nome, cognome, genere, nazionalita, cellulare, date);
        console.log(result);
        loadPage("payment");
    } catch (error) {
        console.error(error);
    }
}

//Funzione per sottolineare i campi obbligatori
function highlightRequiredFields(){
    const requiredFields = document.querySelectorAll(".obbligatorio");
    requiredFields.forEach(field => {
        field.style.color = "#E30613";
        field.style.fontWeight = "bold";
    });
}

// Funzione per caricare l'elenco dei paesi nel dropdown
document.addEventListener("DOMContentLoaded", () => {
    const dropdown = document.getElementById("countryDropdown");

    // API per ottenere l'elenco dei paesi
    fetch("https://restcountries.com/v3.1/all?fields=name,cca2")
        .then(response => response.json())
        .then(data => {
            dropdown.innerHTML = ""; // Svuota il dropdown
            if (lang === "it") {
                dropdown.innerHTML += `<option value="">Seleziona un Paese</option>`;
            }
            if (lang === "en") {
                dropdown.innerHTML += `<option value="">Select a Country</option>`;
            }
            // Ordina i paesi per nome
            data.sort((a, b) => a.name.common.localeCompare(b.name.common));

            data.forEach(country => {
                let option = document.createElement("option");
                option.value = country.cca2; // Codice paese
                option.textContent = country.name.common;
                dropdown.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Errore nel caricamento dei paesi:", error);
            if (lang === "it") {
                dropdown.innerHTML = `<option value="">⚠ Errore nel caricamento</option>`;
            }
            if (lang === "en") {
                dropdown.innerHTML = `<option value="">⚠ Loading Error</option>`;
            }
        });
});

