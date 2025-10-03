import {auth} from "./firebase-config.js";
import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {AIRTABLE_API_KEY, BASE_ID, TABLE_USER, TABLE_PASS, TABLE_PHOTOS} from "./airtable-config.js";
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
var original_genre;


onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Utente loggato:", user.email);
        user_email = user.email;
        fetchPassStatus(user.email);
        loadUserProfile(user.email);
    } else {
        loadPage("login");
    }
});

async function loadUserProfile(email) {

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

            document.getElementById("nome").value = user["Nome"];
            document.getElementById("cognome").value = user["Cognome"];
            fetchCountries(user["Nazionalita"]);
            document.getElementById("data").value = user["Data di Nascita"];
            document.getElementById("genere").value = user["Genere"];
            document.getElementById("marketing").checked = user["Promotions"] || false;
            if (user["Telefono"] !== "undefined")
                document.getElementById("telefono").value = user["Telefono"];
            original_genre = user["Genere"];
            const ID = user.Picture;
            loadImage(ID);
        } else {
            console.error("Utente non trovato!");
        }
    } catch (error) {
        console.error("Errore nella richiesta:", error);
    }
}

function fetchCountries(nation_value) {
  const dropdown = document.getElementById("countryDropdown");
  
  fetch("https://restcountries.com/v3.1/all?fields=name,cca2")
      .then(response => response.json())
      .then(data => {
            if (lang === "it") {
                dropdown.innerHTML = `<option value="">Seleziona un Paese</option>`;
            }
            if (lang === "en") {
                dropdown.innerHTML = `<option value="">Select a Country</option>`;
            }
          data.sort((a, b) => a.name.common.localeCompare(b.name.common));

          data.forEach(country => {
              const option = document.createElement("option");
              option.value = country.cca2; // Codice del paese
              option.textContent = country.name.common;
              dropdown.appendChild(option);
          });

          // Se esiste un valore salvato, selezionalo
          if (nation_value) {
              dropdown.value = nation_value;
          }
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
}

// Usa la funzione per salvare le modiche al profilo
document.getElementById("save_button").addEventListener("click", async function(event) {
  event.preventDefault();
  
  const nome = document.getElementById("nome").value;
  const cognome = document.getElementById("cognome").value;
  const genere = document.getElementById("genere").value;
  const nazionalita = document.getElementById("countryDropdown").value;
  const cellulare = document.getElementById("telefono").value;
  const date = document.getElementById("data").value;

  // Controllo se i campi sono vuoti
    if (!nome || !cognome || !genere || !nazionalita || !date) {
        console.log("Compila tutti i campi obbligatori.");
        document.getElementById("alert").style.display = "block";
        return;
    }
  
    try {
        const result = await updateUser(user_email, nome, cognome, genere, nazionalita, cellulare, date);
        console.log(result);
        location.reload();
    } catch (error) {
        console.log("Errore nell'aggiornamento dei dati");
        console.error(error);
    }
});

async function fetchPassStatus(email) {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_PASS}?filterByFormula={User}='${email}'`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.records.length === 0) {
            console.log(`Nessun pass trovato per l'utente ${USER_EMAIL}`);
            return;
        }
        
        data.records.forEach(record => {
            const statoPass = record.fields['Stato Pass'];
            const label = document.getElementById("stato-pass");
            const museo = document.getElementById("stato-musei");
            if (statoPass === "Scaduto") {
                label.style.color = "#E30613";
                museo.textContent = "0";
            } else {
                const number = record.fields['Musei'];
                museo.textContent = number;
                museo.style.fontWeight = "bold";
            }
            label.textContent = statoPass;
            const duration = record.fields['Tipo Pass'];

            const last_update = record.fields['Ultimo Pagamento'];
            
            const lastUpdateDate = new Date(last_update);
            const expirationDate = new Date(lastUpdateDate.getTime() + duration * 60 * 60 * 1000);
            document.getElementById("scadenza").textContent = expirationDate.toLocaleString();
        });
        
    } catch (error) {
        console.error('Errore nel recupero dei dati:', error);
    }
}


//funzione per aggiornare i dati dell'utente
async function updateUser(email, nome, cognome, genere, nazionalita, telefono, dataNascita) {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_USER}?filterByFormula={Email}='${email}'`;
    
    try {
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
        let rand = 0;
        if (genere !== original_genre) {
            if (genere == "Uomo") {
                rand = Math.floor(Math.random() * 5) + 1;
            } else {
                rand = Math.floor(Math.random() * 5) + 6;
            }
        }

        let marketing = document.getElementById("marketing").checked;
        
        const updateUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_USER}/${recordId}`;
        const fieldsToUpdate = {
            "Nome": nome,
            "Cognome": cognome,
            "Genere": genere,
            "Nazionalita": nazionalita,
            "Telefono": telefono,
            "Promotions": marketing
        };

        if (dataNascita) {
            fieldsToUpdate["Data di Nascita"] = dataNascita;
        }

        if (rand !== 0) {
            fieldsToUpdate["Picture"] = rand;
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

//funzione per caricare l'immagine profilo utente
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
        document.getElementById('profileImg').src = imageUrl;
      } 
    } catch (error) {
      console.error("Errore durante la chiamata API:", error);
    }
}