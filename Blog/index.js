

    fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })
    .then(res => res.json())
    .then(data => {
      //const lista = document.getElementById('articoli');
    /*data.results.forEach(page => {
        const titolo = page.properties.Titolo.title[0]?.plain_text || 'Senza titolo';
        const li = document.createElement('li');
        li.textContent = titolo;
        lista.appendChild(li);
      });*/
      console.log(data);
    })
    .catch(err => {
      console.error('Errore nella fetch Notion:', err);
    });

