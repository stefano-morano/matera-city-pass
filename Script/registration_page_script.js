import { auth } from "./firebase-config.js";
import { createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {AIRTABLE_API_KEY, BASE_ID, TABLE_USER, TABLE_PASS} from "./airtable-config.js";
import { loadFooter } from "./footer.js";
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

window.onload = function() {
    loadNavbar();
    loadFooter();
}

// Funzione che controlla tutti i parametri per la registrazione alla pressione del tasto
const registerUser = async () => {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm_password").value;
  const log_msg = document.getElementById("log-msg");

  if (email === "" || password === "" || confirm === "") {
    if (lang === "it") {
        log_msg.innerText = "Attenzione: compila tutti i campi";
    }
    if (lang === "en") {
        log_msg.innerText = "Warning: fill all the fields";
    }
    return;
  }
  
  if (password !== confirm) {
    if (lang === "it") {
      log_msg.innerText = "Attenzione: le due password non combaciano";
    }
    if (lang === "en") {
      log_msg.innerText = "Warning: the two passwords do not match";
    }
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
    document.getElementById("confirm_password").value = "";
    return;
  }

  const deviceID = await getDeviceFingerprint();
            
  // Controlla se il dispositivo è già registrato
  if (await isDeviceRegistered(deviceID)) {
    if (lang === "it") {
      log_msg.textContent = "Attenzione: questo dispositivo ha già registrato un account!";
    }
    if (lang === "en") {
      log_msg.textContent = "Warning: this device has already registered an account!";
    }
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log("User registered:", userCredential.user);
      log_msg.style.color = "#B75E17";
      if (lang === "it") {
        log_msg.innerText = "Registrazione in corso...";
      }
      if (lang === "en") {
        log_msg.innerText = "Registration in progress...";
      }
      saveUser(email, deviceID);
    })
    .catch((error) => {
      if (error.code === "auth/email-already-in-use") {
        if (lang === "it") {
          log_msg.innerText = "Attenzione: account già esistente";
        }
        if (lang === "en") {
          log_msg.innerText = "Warning: this account already exists";
        }
        document.getElementById("email").value = "";
        document.getElementById("password").value = "";
        document.getElementById("confirm_password").value = "";
      }
      if (error.code === "auth/weak-password") {
        if (lang === "it") {
          log_msg.innerText = "Attenzione: la password deve contenere almeno 6 caratteri";
        }
        if (lang === "en") {
          log_msg.innerText = "Warning: the password must contains at least 6 characters";
        }
        document.getElementById("email").value = "";
        document.getElementById("password").value = "";
        document.getElementById("confirm_password").value = "";
      }
      console.error(error);
    });
};

// Funzione per salvare l'utente su airtable
async function saveRecord(email, deviceID) {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_USER}`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            fields: {
                Email: email,
                DeviceID: deviceID,
            }
        })
    });
    const data = await response.json();
    return data;
}

// Funzione per creare il pass gratuito da 24 ore
async function createPass(email){
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_PASS}`;
  const response = await fetch(url, {
      method: "POST",
      headers: {
          "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json"
      },
      body: JSON.stringify({
        records: [ 
            {
                fields: {
                    "User": email,    
                    "Tipo Pass": 0,
                    "Musei": 0,
                    "Numero Rinnovi": 0,
                    "Totale Pagamenti": 0     
                }
            }
        ]
    })
  });
  const data = await response.json();
  return data;
}

// Funzione per ottenere l'ID del dispositivo
async function getDeviceFingerprint() {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  return result.visitorId;
}

// Funzione per controllare se il dispositivo è già registrato attraverso l'ID
async function isDeviceRegistered(deviceID) {
  const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_USER}?filterByFormula={DeviceID}='${deviceID}'`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
  });
  const data = await response.json();
  return data.records.length > 0;
}

// Funzione per salvare l'utente su airtble e creare il pass
async function saveUser(email, deviceID){
    try {
        const result = await saveRecord(email, deviceID);
        const pass = await createPass(email);
        loadPage("registration_form");
        console.log(result);
        console.log(pass);
    } catch (error) {
        console.error(error);
    }
}

document.getElementById("regButton").addEventListener("click", registerUser);
