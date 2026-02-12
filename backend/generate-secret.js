// Generate a secure JWT secret for production
const crypto = require('crypto');

console.log('\n🔐 BillNet - Generate Secure JWT Secret\n');
console.log('Copy this secret to your .env file:\n');
console.log('JWT_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('\n✅ Secret generated successfully!\n');
console.log('⚠️  Keep this secret safe and never commit it to git!\n');
