import { auth } from "./firebase-config.js"
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

// Controllo stato utente
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Utente loggato:", user.email);
        loadPage("main_page");
    }
    else {
        console.log("Nessun utente loggato");
    }
});

// Funzione per il login
async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Login riuscito:", userCredential.user);
        loadPage("main_page");
    } catch (error) {
        console.error("Errore di login:", error.message);
        if (error.code === "auth/invalid-credential") {
            if (lang === "it") {
                document.getElementById("error-message").textContent = "Password non valida";
            }
            if (lang === "en") {
                document.getElementById("error-message").textContent = "Invalid password";
            }
        }
        if (error.code === "auth/invalid-email") {
            if (lang === "it") {
                document.getElementById("error-message").textContent = "Email non valida";
            }
            if (lang === "en") {
                document.getElementById("error-message").textContent = "Invalid email";
            }
        }
        if (error.code === "auth/missing-password") {
            if (lang === "it") {
                document.getElementById("error-message").textContent = "Password mancante";
            }
            if (lang === "en") {
                document.getElementById("error-message").textContent = "Missing password";
            }
        }
    }
}

// Event listener per il pulsante di login
document.getElementById("login-Btn").addEventListener("click", () => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    let errorMessage = "";
    if (lang === "it") {
        errorMessage = "Account non trovato";
    }
    if (lang === "en") {
        errorMessage = "Account not found";
    }
    checkEmailExists(email)
    .then(exists => exists ? login(email, password) : document.getElementById("error-message").textContent = errorMessage);
});

// Funzione per cercare la mail su air table
async function checkEmailExists(email) {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_USER}?filterByFormula=LOWER(Email)='${email.toLowerCase()}'`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`
        }
    });

    const data = await response.json();

    return data.records.length > 0; // Ritorna true se l'email esiste, altrimenti false
}

// Funzione per inviare l'email di reset della password
function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
        .then(() => {
            console.log("Email di reset inviata a:", email);
            if (lang === "it") {
                document.getElementById("error-message").textContent = "Controlla la tua mail per resettare la password";
                document.getElementById("send-email").textContent = "Torna al login";
            }
            if (lang === "en") {
                document.getElementById("error-message").textContent = "Check your email to reset your password";
                document.getElementById("send-email").textContent = "Back to login";
            }
            document.getElementById("send-email").addEventListener("click", () => {
                location.reload();
            });        
        }).catch(error => {
            console.error("Errore durante il reset:", error.message);
        });
}

document.getElementById("reset-button").addEventListener("click", (event) => {
    event.preventDefault();
    document.getElementById("password").style.display = "none";
    document.getElementById("login-Btn").style.display = "none";
    document.getElementById("reset-link").style.display = "none";
    document.getElementById("login-link").style.display = "none";
    document.getElementById("error-message").textContent = "";
    document.getElementById("password-label").style.display = "none";
    if (lang=== "it") {
        document.getElementById("title").textContent= "Recupera password";
        document.getElementById("email-label").textContent = "Inserisci l'email del tuo account:";
    }
    if (lang=== "en") {
        document.getElementById("title").textContent= "Recover password";
        document.getElementById("email-label").textContent = "Enter the email of your account:";
    }
    document.getElementById("reset-form").style.display = "block";
});

document.getElementById("send-email").addEventListener("click", () => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    let errorMessage = "";
    if (lang === "it") {
        errorMessage = "Email non registrata";
    }
    if (lang === "en") {
        errorMessage = "Email not registered";
    }
    checkEmailExists(email)
    .then(exists => exists ? resetPassword(email) : document.getElementById("error-message").textContent = errorMessage);
});