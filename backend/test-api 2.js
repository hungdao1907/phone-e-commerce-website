const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: 'test-admin', role: 'admin' }, 'fallback_secret_key_for_development');
console.log("Token:", token);
