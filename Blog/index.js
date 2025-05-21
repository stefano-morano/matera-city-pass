import {
  AIRTABLE_API_KEY,
  BASE_ID,
  TABLE_BLOG
} from "../Script/airtable-config.js";

import { loadNavbar } from "../Script/navbar-loader.js";
import { loadFooter } from "../Script/footer.js";

const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_BLOG}?sort[0][field]=Publication%20Date&sort[0][direction]=desc`;


window.onload = function() {
  loadFooter();
  loadNavbar();
  fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Errore nella fetch: ' + response.statusText);
    }
    return response.json();
  })
  .then(data => {
  const container = document.getElementById('blog-container');
  container.innerHTML = '';

  // Mappa per raggruppare per data
  const articoliPerData = {};

  data.records.forEach(record => {
    const fields = record.fields;
    const dataPubblicazione = fields["Publication Date"];
    if (!dataPubblicazione) return;

    const dataChiave = new Date(dataPubblicazione).toLocaleDateString('it-IT');

    if (!articoliPerData[dataChiave]) {
      articoliPerData[dataChiave] = [];
    }
    articoliPerData[dataChiave].push(record);
  });

  // Ordina le date in ordine decrescente
  const dateOrdinate = Object.keys(articoliPerData).sort((a, b) => {
    const da = new Date(a.split('/').reverse().join('-'));
    const db = new Date(b.split('/').reverse().join('-'));
    return db - da;
  });

  // Genera il DOM per ogni giorno
  dateOrdinate.forEach(data => {
  const gruppoData = document.createElement('div');
  gruppoData.className = 'date-group';

  const dataEl = document.createElement('p');
  dataEl.textContent = data;
  dataEl.className = 'data-titolo';
  gruppoData.appendChild(dataEl);

  articoliPerData[data].forEach(record => {
    const fields = record.fields;
    const titolo = fields.seo_title || 'Senza titolo';
    const descrizione = fields.meta_description || '';
    const immagineUrl = fields.Immagine?.[0]?.url || 'https://via.placeholder.com/120';

    const articolo = document.createElement('div');
    articolo.className = 'blog-item';
    articolo.innerHTML = `
      <img src="${immagineUrl}" alt="immagine articolo" />
      <div class="blog-text">
        <h2>${titolo}</h2>
        <p>${descrizione}</p>
      </div>
    `;

    articolo.onclick = () => {
      window.location.href = `/articolo.html?id=${record.id}`;
    };

    gruppoData.appendChild(articolo);
    gruppoData.appendChild(document.createElement('hr'));
  });

  container.appendChild(gruppoData);
});
})
  .catch(error => {
    console.error('Errore nella richiesta:', error);
  });
}
