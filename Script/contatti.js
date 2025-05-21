import { BASE_ID, AIRTABLE_API_KEY, TABLE_SEGNALATION } from './airtable-config.js';
import {loadNavbar} from './navbar-loader.js';
import {loadFooter} from './footer.js';

const form = document.querySelector('.contatti-form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const motivo = document.getElementById('motivo').value.trim();
  const messaggio = document.getElementById('messaggio').value.trim();

  if (!email || !motivo || !messaggio) {
    alert('Compila tutti i campi.');
    return;
  }

  const record = {
    fields: {
      Email: email,
      Tipo: motivo,
      Testo: messaggio,
      Status: 'Todo'
    }
  };

  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_SEGNALATION}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(record)
    });

    if (!response.ok) {
      throw new Error("Errore durante l'invio della segnalazione");
    }

    document.getElementById('success-message').style.display = 'block';
    form.reset();
  } catch (error) {
    console.error('Errore:', error);
  }
});

window.onload = function() {
    loadNavbar();
    loadFooter();
}
