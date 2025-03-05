const crypto = require('crypto');

// Generate a random 32-byte private key
const privateKey = '0x' + crypto.randomBytes(32).toString('hex');
console.log('Your Verida private key:');
console.log(privateKey);