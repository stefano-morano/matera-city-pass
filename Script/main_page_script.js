import {auth} from "./firebase-config.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {AIRTABLE_API_KEY, BASE_ID, TABLE_MERCHANTS} from "./airtable-config.js";
import { loadNavbar } from "./navbar-loader.js";
import { loadFooter } from "./footer.js";

function loadPage(name) {
    if (lang === "it") {
        window.location.href = `/Html/Ita/${name}.html`;
    }
    if (lang === "en") {
        window.location.href = `/Html/Eng/${name}.html`;
    }
}

const lang = localStorage.getItem("lang") || "it"; // Imposta la lingua predefinita su italiano

var login = false;
var map;

// Controllo stato utente
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Utente loggato:", user.email);
        login = true;
    } else {
        console.log("Nessun utente loggato");
    }
});

window.addEventListener('DOMContentLoaded', function() {
    const filter = document.querySelector('.filter');
    if (filter) {
        filter.scrollLeft = 0;
    }
});

window.onload = function() { 
    closePopup();
    loadNavbar(); 
    loadFooter();
};

// Funzione per il recupero dei dati dai record di Airtable a seconda del filtro selezionato
function fetchCards(selectedFilter) {
    const container = document.getElementById("cards-container");

    let url_merchants = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_MERCHANTS}`;
    container.innerHTML = "";

    if (selectedFilter != null) {
        url_merchants += `?filterByFormula=FIND("${selectedFilter}",{category})`;
    }

    fetch(url_merchants, {
        headers: {
            "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Errore HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        displayCards(data.records);
    })
    .catch(error => {
        console.error("Errore nel recupero dei dati:", error.message);
    });
}

function findAlberghi(array) {
  return array.includes("Accoglienza");
}


// Funzione per la visualizzazione e creazione delle card
function displayCards(records) {

    const container = document.getElementById('cards-container');
    container.innerHTML = '';
    
    records.forEach(record => {
        const state = record.fields.State || 'Non disponibile';
        const category = record.fields.Category;
     
        if (state == 'Attivo' && !findAlberghi(category)){
            const name = record.fields.Name;
            const address = record.fields.Address;
            let info = '';
            let description = '';

            if (lang == "it"){
                info = record.fields["Discount ita"] || 'Nessuno sconto';
                description = record.fields["Description ita"] || 'Nessuna descrizione';
            }

            if (lang == "en"){
                info = record.fields["Discount eng"]|| 'No discount';
                description = record.fields["Description eng"] || 'No description';
            }

            const mapsLink = record.fields.URL || '#';
            const latitudine = record.fields.Latitudine || 0;
            const longitudine = record.fields.Longitudine || 0;

            const imageField = record.fields.Photo;
            const imageUrl = imageField ? (imageField[0].thumbnails?.full?.url || imageField[0].url) : '../assets/placeholder.png';
        
            const card = document.createElement('div');
            card.classList.add('card');
        
            card.innerHTML = `
                <img src="${imageUrl}" alt="${name}">
                <div class="card-content">
                    <h3 id="title">${name}</h3>
                </div>
            `;

            card.addEventListener('click', () => expandCard(name, address, description, imageUrl, mapsLink, latitudine, longitudine, info));
            container.appendChild(card);
        }
    });

    fetchSearch();
}

// Funzione per l'espansione della card in modalità pop-up
function expandCard(name, address, description, imageUrl, mapsLink, lat, lon, sconto) {
        // Set the content of the pop-up
        document.getElementById('popup-title').textContent = name; // Set Name
        document.getElementById('popup-description').textContent = description; // Set Description
        document.getElementById('popup-img').src = imageUrl; // Set Image
        document.querySelector('#popup-address span').textContent = address; // Set Address
        document.querySelector('#popup-sconto span').textContent = sconto;

        // Set the link for "Apri in Google Maps" (optional)
        let mapLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
        let linkButton = document.getElementById('popup-link');
        linkButton.onclick = () => window.open(mapsLink);

        // Display the pop-up and overlay
        document.getElementById('overlay').style.display = 'block';
        document.getElementById('popup').style.display = 'flex';

       if (map){
            map.remove();
       }

        // Initialize the map
        map = L.map('map').setView([lat, lon], 15); // Set the initial map position and zoom level

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '@OpenStreetMap & CartoDB',
            subdomains: 'abcd',
            maxZoom: 20
          }).addTo(map);

        // Add a marker at the specified location
        L.marker([lat, lon]).addTo(map)

        map.invalidateSize(); // Refresh the map
}

// Funzione per la ricerca delle card
function fetchSearch(){
    const searchText = document.getElementById("searchBar").value.trim().toLowerCase();
    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {
        const cardName = card.querySelector("#title").textContent.toLowerCase().trim();
        card.style.display = cardName.includes(searchText) ? "block" : "none";
    });
}

document.getElementById("searchBar").addEventListener("input", fetchSearch);

document.addEventListener('DOMContentLoaded', () => { fetchCards(null); });

document.getElementById("overlay").addEventListener("click", closePopup);

document.getElementById("closePopup").addEventListener("click", closePopup);

document.getElementById("discover-btn").addEventListener("click", function() {
    loadPage("landing");
});

function closePopup() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('popup').style.display = 'none';
}

document.querySelectorAll(".filter").forEach(filter => {
    filter.addEventListener("click", function() {
        if (this.classList.contains("active")){
            this.classList.remove("active");
            this.querySelector('span').style.color = 'black';
            filter = null;
            fetchCards(null);
            return;
        }
        document.querySelectorAll(".filter").forEach(f => {
            f.classList.remove("active");
            f.querySelector('span').style.color = 'black';
        });
        this.classList.add("active");
        this.querySelector('span').style.color = '#B75E17';
        filter = this.dataset.value;

        console.log("Filtro selezionato:", filter);
        fetchCards(filter);
    });
});
