import {
  AIRTABLE_API_KEY,
  BASE_ID,
  TABLE_BLOG
} from "../Script/airtable-config.js";
import { loadNavbar } from "../Script/navbar-loader.js";
import { loadFooter } from "../Script/footer.js";


const articleContainer = document.getElementById('article-container');
const backBtn = document.getElementById('backBtn');
const params = new URLSearchParams(window.location.search);
const RECORD_ID = params.get("id");
backBtn.addEventListener('click', () => history.back());

const fetchArticle = async () => {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_BLOG}/${RECORD_ID}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
  });

  if (!res.ok) {
    articleContainer.innerHTML = `<p>Errore nel caricamento dell'articolo.</p>`;
    return;
  }

  const data = await res.json();
  const htmlContent = data.fields?.Text || '<p>Nessun contenuto disponibile.</p>';
  
  articleContainer.innerHTML = htmlContent;
  articleContainer.querySelector('#article-image').src  = data.fields.Immagine?.[0]?.url || 'https://via.placeholder.com/120';
};

if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
  window.location.href = `./index.html`;
}

loadFooter();
loadNavbar();
fetchArticle();

window.onload = function() {
  const language_page = localStorage.getItem('lang') || 'it';
  if (language_page === 'en') {
    document.getElementById('backBtn').textContent = '← Back';
  }
}