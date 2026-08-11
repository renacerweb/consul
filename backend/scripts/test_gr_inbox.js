const fetch = global.fetch || require('node-fetch');
const BASE = 'http://localhost:3001';

async function run() {
  try {
    const adminLogin = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@renacer.com', password: 'admin123' }),
    });

    const adminData = await adminLogin.json();
    if (!adminLogin.ok) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminData)}`);
    }
    const adminToken = adminData.token;

    const regionesRes = await fetch(`${BASE}/api/regiones`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const regiones = await regionesRes.json();
    if (!regionesRes.ok) {
      throw new Error(`Failed to fetch regiones: ${JSON.stringify(regiones)}`);
    }

    const regionId = regiones[0]?.id;
    if (!regionId) {
      throw new Error('No regions found');
    }

    const userEmail = `prueba_gr_${Date.now()}@renacer.com`;
    const createUserRes = await fetch(`${BASE}/api/auth/registrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        email: userEmail,
        nombre: 'Prueba Gerente Regional',
        password: 'Password123!',
        rol: 'GERENTE_REGIONAL',
        regionIds: [regionId],
      }),
    });
    const createUserData = await createUserRes.json();
    if (!createUserRes.ok) {
      throw new Error(`Failed to create GR user: ${JSON.stringify(createUserData)}`);
    }

    console.log('Created GR user:', createUserData.usuario);

    const grLoginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: 'Password123!' }),
    });
    const grLoginData = await grLoginRes.json();
    if (!grLoginRes.ok) {
      throw new Error(`GR login failed: ${JSON.stringify(grLoginData)}`);
    }

    const grToken = grLoginData.token;
    console.log('GR token acquired');

    const mensajesRes = await fetch(`${BASE}/api/mensajes/recibidos`, {
      headers: { Authorization: `Bearer ${grToken}` },
    });
    const mensajes = await mensajesRes.json();
    console.log('Mensajes recibidos para GR:', mensajes);

    const gerentesRes = await fetch(`${BASE}/api/mensajes/gerentes`, {
      headers: { Authorization: `Bearer ${grToken}` },
    });
    const gerentes = await gerentesRes.json();
    console.log('Gerentes list:', gerentes);
  } catch (error) {
    console.error('ERROR', error.message || error);
  }
}

run();
