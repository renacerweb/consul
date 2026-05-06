// test.js
require('dotenv').config();

console.log('✅ Variables de entorno cargadas:');
console.log('JWT_SECRET existe:', !!process.env.JWT_SECRET);
console.log('DATABASE_URL existe:', !!process.env.DATABASE_URL);
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);