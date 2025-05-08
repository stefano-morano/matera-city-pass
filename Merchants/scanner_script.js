import {
  AIRTABLE_API_KEY,
  BASE_ID,
  TABLE_USER,
  TABLE_PASS,
  TABLE_MERCHANTS,
  TABLE_TRANSACTIONS,
  TABLE_PHOTOS
} from "../Script/airtable-config.js";

const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const resultText = document.getElementById('result');
const card = document.getElementById('card');
const log = document.getElementById('log');
const sconto = document.getElementById('sconto');
const button = document.getElementById('button');
const name_label = document.getElementById('nome');

const params = new URLSearchParams(window.location.search);
const code_azienda = params.get("azienda");

let nome_azienda;
let nome_user;
let cognome_user;
let discount;
let bool_museo;
let recordID;
let number_musei;
let scanning = true;

// Avvia la fotocamera
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } }
  })
  .then(stream => {
    console.log("📸 Fotocamera attivata!");
    video.srcObject = stream;
    video.play();
  })
  .catch(err => {
    console.error("❌ Errore fotocamera:", err);
  });
} else {
  console.warn("getUserMedia non supportato.");
}

function scanQRCode() {
  if (!scanning) return;

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
    if (qrCode) {
      scanning = false;
      checkQRCodeInAirtable(qrCode.data);
      return;
    }
  }

  requestAnimationFrame(scanQRCode);
}

function waitForVideoAndScan() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    scanQRCode();
  } else {
    setTimeout(waitForVideoAndScan, 200);
  }
}

async function checkQRCodeInAirtable(qrCode) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_PASS}?filterByFormula={QR}='${qrCode}'`;
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (data.records.length > 0) {
      const record = data.records[0].fields;
      recordID = data.records[0].id;
      const statoQR = record["Stato QR"];
      const statoPass = record["Stato Pass"];
      const tipoPass = record["Tipo Pass"];
      const gratis = !(tipoPass === 24 || tipoPass === 48 || tipoPass === 72);
      console.log(statoQR + ' ' + statoPass + ' ' + tipoPass + ' ' + gratis);
      const email = record["User"];
      if (statoPass === "Attivo") {
        if (statoQR === "Valido") {
          if (bool_museo) {
            number_musei = record["Musei"];
            if (number_musei > 0) {
              gratis ? validMode(email, "Pass valido\n✅\nSconto disponibile") : validMode(email, "Pass valido\n✅\nBiglietto disponibile");
            } else {
              validMode(email, "Pass valido\n✅\nSconto disponibile");
            }
          } else {
            gratis ? validMode(email, "Pass gratuito valido ✅") : validMode(email, "Pass a pagamento valido ✅");
          }
        } else {
          unvalidMode("QR Code non valido ❌", email);
        }
      } else {
        unvalidMode("Pass non attivo ❌", email);
      }
    } else {
      errorMode();
    }
  } catch (error) {
    console.error("Errore nella richiesta:", error);
  }
}

async function find_merch() {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_MERCHANTS}?filterByFormula={Codice}='${code_azienda}'`;
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });
    const data = await response.json();
    if (data.records.length > 0) {
      const record = data.records[0].fields;
      nome_azienda = record["Name"];
      discount = record["Discount ita"];
      bool_museo = findMusei(record["Category"]);
    } else {
      console.error("Azienda non trovata!");
    }
  } catch (error) {
    console.error("Errore:", error);
  }
}

function findMusei(array) {
  return array.includes("Cultura e Musei");
}

async function find_user(email) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_USER}?filterByFormula={Email}='${email}'`;
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });
    const data = await response.json();
    if (data.records.length > 0) {
      const record = data.records[0].fields;
      nome_user = record["Nome"];
      cognome_user = record["Cognome"];
    } else {
      console.error("Utente non trovato!");
    }
  } catch (error) {
    console.error("Errore:", error);
  }
}

async function completeTransaction(email) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_TRANSACTIONS}`;
  const url_pass = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_PASS}/${recordID}`;
  await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      records: [{
        fields: {
          "User": email,
          "Merchant": nome_azienda
        }
      }]
    })
  });

  const new_musei = number_musei - 1;
  await fetch(url_pass, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fields: {
        "Musei": new_musei
      }
    })
  });
}

function scanMode() {
  scanning = true;
  log.style.display = "none";
  sconto.style.display = "none";
  button.innerText = "Indietro";
  button.onclick = () => {
    window.location.href = "index.html?azienda=" + code_azienda;
  };
  button.style.display = "block";
  name_label.style.display = "none";
  video.style.display = "block";
  canvas.style.display = "none";
  resultText.style.display = "block";
  card.style.backgroundColor = "#f9ae10";
  waitForVideoAndScan();
}

function validMode(email, text) {
  card.style.backgroundColor = "#90EE90";
  video.style.display = "none";
  canvas.style.display = "none";
  log.innerText = text;
  log.style.display = "block";
  sconto.innerText = "Sconto: " + discount;
  sconto.style.display = "block";
  resultText.style.display = "none";
  find_user(email).then(() => {
    name_label.innerText = nome_user + " " + cognome_user;
    name_label.style.display = "block";
    button.onclick = () => {
      completeTransaction(email).then(() => {
        console.log("Transazione completata");
        scanMode();
      });
    };
    button.innerText = "Conferma scansione";
    button.style.display = "block";
  });
}

function unvalidMode(text, email) {
  card.style.backgroundColor = "#FF7F7F";
  log.innerText = text;
  video.style.display = "none";
  canvas.style.display = "none";
  log.style.display = "block";
  sconto.style.display = "none";
  resultText.style.display = "none";
  find_user(email).then(() => {
    if (!nome_user || !cognome_user) {
      name_label.style.display = "none";
    } else {
      name_label.innerText = nome_user + " " + cognome_user;
      name_label.style.display = "block";
    }
    button.onclick = scanMode;
    button.innerText = "Scansiona un altro QR Code";
    button.style.display = "block";
  });
}

function errorMode() {
  card.style.backgroundColor = "#FF7F7F";
  log.innerText = "Pass non trovato ❌";
  video.style.display = "none";
  canvas.style.display = "none";
  log.style.display = "block";
  sconto.style.display = "none";
  resultText.style.display = "none";
  name_label.style.display = "none";
  button.onclick = scanMode;
  button.innerText = "Scansiona un altro QR Code";
  button.style.display = "block";
}

window.onload = () => {
  if (!code_azienda) {
    window.location.href = "index.html";
  }
  find_merch();
  scanMode();
};
