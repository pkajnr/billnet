// Generate bcrypt hash for admin password
const bcrypt = require('bcryptjs');

const password = 'Admin@2026!';
const hash = bcrypt.hashSync(password, 10);

console.log('\n=== SUPERADMIN CREDENTIALS ===');
console.log('Username: superadmin');
console.log('Email: admin@billnet.com');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('==============================\n');
