const http = require('http');
const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) {
  console.error('Uso: node scripts/test-login.js email password');
  process.exit(2);
}

const data = JSON.stringify({ email, password });

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const parsed = JSON.parse(body);
      console.log('Response JSON:', JSON.stringify(parsed, null, 2));
    } catch (err) {
      console.log('Response body:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(data);
req.end();
