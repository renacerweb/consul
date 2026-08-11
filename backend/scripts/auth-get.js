const http = require('http');
const token = process.argv[2];
const path = process.argv[3] || '/api/campania/historial';
if (!token) { console.error('Uso: node scripts/auth-get.js <token> [path]'); process.exit(2); }

const options = {
  hostname: 'localhost',
  port: 3001,
  path,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try { console.log(JSON.stringify(JSON.parse(body), null, 2)); } catch (e) { console.log(body); }
  });
});
req.on('error', (e) => console.error('Request error:', e.message));
req.end();
