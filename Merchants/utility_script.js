import {AIRTABLE_API_KEY, BASE_ID, TABLE_MERCHANTS} from "../Script/airtable-config.js";

const API_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_MERCHANTS}`;
const URL_QR = "https://www.materacitypass.com/Merchants/index.html?azienda=";

    const headers = {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    };

    // Utility: genera stringa random
    function generaStringaRandom(length = 11) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

// Genera codici unici per record con State = "attivo"
async function generaCodici() {
    const records = await fetch(API_URL, { headers }).then(r => r.json());
    const esistenti = new Set(records.records.map(r => r.fields.Codice).filter(Boolean));
    for (const record of records.records) {
        if (record.fields.State === 'Attivo' && !record.fields.Codice) {
            let nuovoCodice;
            do {
                nuovoCodice = generaStringaRandom();
            } while (esistenti.has(nuovoCodice));
            esistenti.add(nuovoCodice);

            // Aggiorna record
            await fetch(`${API_URL}/${record.id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ fields: { "Codice": nuovoCodice } })
            });
        }
    }
    document.getElementById("success").style.display = "block";
}

// Genera QR
async function generaQR() {
    document.getElementById("success").style.display = "none";
    document.getElementById('qrcodes').innerHTML = '';
    const records = await fetch(API_URL, { headers }).then(r => r.json());

    generaLink("https://www.materacitypass.com", "Matera City Pass");
    generaLink("https://rebrand.ly/MCPAPR2025", "Matera City Pass Rebrand");
    generaLink("https://kutt.it/MspCzw", "Matera City Pass Kutt");
    records.records.forEach(record => {
        const nome = record.fields.Name || 'Senza nome';
        const codice = record.fields.Codice;
        const stato = record.fields.State;
        if (stato === 'Attivo' && codice) {
          const div = document.createElement('div');
          div.className = 'qr-block';

          const title = document.createElement('h3');
          title.textContent = nome;

          const qr = document.createElement('div');
          let url_codice = URL_QR + codice;
          new QRCode(qr, { text: url_codice, width: 256, height: 256 });

          const txt = document.createElement('p');
          txt.textContent = codice;

          div.appendChild(title);
          div.appendChild(qr);
          div.appendChild(txt);
          document.getElementById('qrcodes').appendChild(div);
        }
    });
}

function generaLink(link, nome) {
    const div = document.createElement('div');
    div.className = 'qr-block';

    const title = document.createElement('h3');
    title.textContent = nome;

    const qr = document.createElement('div');
    let url_sito = link
    new QRCode(qr, { text: url_sito, width: 256, height: 256 });

    div.appendChild(title);
    div.appendChild(qr);
    document.getElementById('qrcodes').appendChild(div);
}

document.getElementById('genera-codici').addEventListener('click', generaCodici);
document.getElementById('genera-qr').addEventListener('click', generaQR);