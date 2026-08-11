const path = require('path');
const dotenv = require('dotenv');
const fetch = global.fetch || require('node-fetch');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const BASE = 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@renacer.com';
const ADMIN_PASSWORD = 'admin123';
const GR_EMAIL = 'testgr@renacer.com';
const GR_PASSWORD = 'Test1234!';

async function run() {
  try {
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginData)}`);
    }
    const token = loginData.token;

    const existing = await fetch(`${BASE}/api/auth/usuarios`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = await existing.json();
    if (!existing.ok) {
      throw new Error(`Failed to list users: ${JSON.stringify(users)}`);
    }

    const found = users.find((u) => u.email?.toLowerCase() === GR_EMAIL.toLowerCase());
    if (found) {
      console.log('User already exists:', found);
      console.log(`Use ${GR_EMAIL} / ${GR_PASSWORD}`);
      return;
    }

    const regionesRes = await fetch(`${BASE}/api/regiones`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const regiones = await regionesRes.json();
    if (!regionesRes.ok || !Array.isArray(regiones) || regiones.length === 0) {
      throw new Error('Failed to fetch regions for GR creation');
    }

    const result = await fetch(`${BASE}/api/auth/registrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: GR_EMAIL,
        nombre: 'Test Gerente Regional',
        password: GR_PASSWORD,
        rol: 'GERENTE_REGIONAL',
        regionIds: [regiones[0].id],
      }),
    });
    const data = await result.json();
    if (!result.ok) {
      throw new Error(`Failed to create GR user: ${JSON.stringify(data)}`);
    }
    console.log('Created GR user:', data.usuario);
    console.log(`Login with ${GR_EMAIL} / ${GR_PASSWORD}`);
  } catch (error) {
    console.error('ERROR', error.message || error);
    process.exit(1);
  }
}

run();
