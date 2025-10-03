import {AIRTABLE_API_KEY, BASE_ID, TABLE_MERCHANTS} from "../Script/airtable-config.js";

// Ottieni i parametri della URL
const params = new URLSearchParams(window.location.search);
var nome = params.get("azienda"); // Prende il valore di "nome"
checkName();
var nome_completo;

function checkName() {
    if (nome) {
        checkTable();
    } else {
        searchMode("Inserisci il codice aziendale");
    }
}

async function checkTable() {
    
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_MERCHANTS}?filterByFormula={Codice}='${nome}'`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`
            }
        });

        const data = await response.json();

        if (data.records.length > 0) {
            const record = data.records[0].fields;
            if (record["State"] == "Disattivo") {
                searchMode("Azienda non attiva");
                return;
            }
            const button = document.getElementById("button_qr");
            button.innerText = "Scanner QR";
            button.addEventListener("click", () => {
                window.location.href = "scanner_page.html?azienda=" + nome;
            });
            button.style.display = "block";
            document.getElementById("input").style.display = "none";
            document.getElementById("button_qr").style.display = "block";
            document.getElementById("button_dashboard").style.display = "block";
            document.getElementById("button_tutorial").style.display= "block";
            document.getElementById("log").innerText = "Benvenuto " + record["Name"] + "!";
            nome_completo = record["Name"];
        } else {
            searchMode("Azienda non trovata");
        }
    } catch (error) {
        console.error("Errore:", error);
    }
}

function searchMode(text){
    const button = document.getElementById("button_qr");
    button.innerText = "Continua";
    button.addEventListener("click", () => {
        nome = document.getElementById("input").value;
        checkName();
    });
    button.style.display = "block";
    document.getElementById("input").style.display = "block";
    document.getElementById("button_dashboard").style.display = "none";
    document.getElementBy
    document.getElementById("log").innerText = text;
}

document.getElementById("button_dashboard").addEventListener("click", () => {
    window.location.href = "dashboard.html?azienda=" + nome + "&nome=" + nome_completo;
}
);

document.getElementById("button_tutorial").addEventListener("click", () => {
    window.location.href = "tutorial.html?azienda=" + nome;
}
);