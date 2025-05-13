const params = new URLSearchParams(window.location.search);
const codiceMercante = params.get("azienda");
const mercanteCorrente = params.get("nome");
console.log(mercanteCorrente);


import {
    AIRTABLE_API_KEY,
    BASE_ID,
    TABLE_USER,
    TABLE_TRANSACTIONS
  } from "../Script/airtable-config.js";

let offsetWeek = 0;

const getWeekRange = (offset) => {
  const now = new Date();
  now.setDate(now.getDate() + offset * 7);
  const start = new Date(now);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
};

const fetchRecords = async (table) => {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${table}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
  });
  const data = await response.json();
  return data.records;
};

const aggiornaDashboard = async () => {
  const { start, end } = getWeekRange(offsetWeek);
  document.getElementById("weekRangeLabel").innerText = `Settimana dal ${start.toLocaleDateString()} al ${end.toLocaleDateString()}`;

  const transazioni = (await fetchRecords(TABLE_TRANSACTIONS)).filter(t => {
    const date = new Date(t.fields["Created time"]);
    return t.fields.Merchant === mercanteCorrente && date >= start && date <= end;
  });

  const utenti = await fetchRecords(TABLE_USER);

  const ore = Array(24).fill(0);
  const genereCount = {};
  const paeseCount = {};
  const etàOre = [];

  transazioni.forEach(t => {
    const ora = new Date(t.fields["Created time"]).getHours();
    ore[ora]++;

    const utente = utenti.find(u => u.fields.Email === t.fields.User);
    if (!utente) return;

    const genere = utente.fields.Genere || "Altro";
    const paese = utente.fields.Nazionalita || "Sconosciuto";
    const dob = new Date(utente.fields["Data di nascita"]);
    const età = new Date().getFullYear() - dob.getFullYear();

    genereCount[genere] = (genereCount[genere] || 0) + 1;
    paeseCount[paese] = (paeseCount[paese] || 0) + 1;

    etàOre.push({ x: ora, y: età });
  });

  // Aggiorna grafici
  creaLineChart(ore);
  creaPieChart(genereCount);
  creaBarChart(paeseCount);
  creaScatterChart(etàOre);
};

const creaLineChart = (dati) => {
    new Chart(document.getElementById("lineChart"), {
      type: 'line',
      data: {
        labels: [...Array(24).keys()].map(h => `${h}:00`),
        datasets: [{ label: 'Transazioni', data: dati }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  };
  
  const creaPieChart = (dati) => {
    new Chart(document.getElementById("genderPieChart"), {
      type: 'pie',
      data: {
        labels: Object.keys(dati),
        datasets: [{ data: Object.values(dati) }]
      }
    });
  };
  
  const creaBarChart = (dati) => {
    const colori = Object.keys(dati).map((_, i) =>
      `hsl(${i * 40 % 360}, 70%, 60%)`
    );
  
    new Chart(document.getElementById("countryBarChart"), {
      type: 'bar',
      data: {
        labels: Object.keys(dati),
        datasets: [{
          label: 'Utenti',
          data: Object.values(dati),
          backgroundColor: colori
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  };
  
  const creaScatterChart = (dati) => {
    new Chart(document.getElementById("ageTimeChart"), {
      type: 'scatter',
      data: {
        datasets: [{ label: 'Età per ora', data: dati }]
      },
      options: {
        scales: {
          x: { title: { display: true, text: 'Ora del giorno' } },
          y: {
            title: { display: true, text: 'Età' },
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  };

document.getElementById("prevWeek").addEventListener("click", () => {
  offsetWeek--;
  aggiornaDashboard();
});

document.getElementById("nextWeek").addEventListener("click", () => {
  offsetWeek++;
  aggiornaDashboard();
});

aggiornaDashboard();
