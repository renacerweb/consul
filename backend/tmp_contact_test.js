const http = require('http');
const data = JSON.stringify({ nombre: 'test', email: 'test@example.com', asunto: 'prueba', mensaje: 'hola' });

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/contacto/enviar',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  console.log('statusCode', res.statusCode);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('body', body);
  });
});

req.on('error', (error) => {
  console.error('error', error.message);
});

req.write(data);
req.end();
