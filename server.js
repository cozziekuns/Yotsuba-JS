const https = require('https');

const express = require('express');
const path = require('path');

const app = express();
const port = 8080;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (_, res) => res.sendFile(path.join(__dirname + '/index.html')));

app.post('/proxy', (req, res) => {
  let payload = '';

  const uuid = req.body.uuid;
  const requestUrl = 'https://tenhou.net/3/mjlog2xml.cgi?' + uuid;

  https.get(requestUrl, (resp) => {
    resp.on('data', (chunk) => payload += chunk);
    resp.on('end', () => res.send(payload));
  });
});

app.listen(port);

console.log('hewoooo');
