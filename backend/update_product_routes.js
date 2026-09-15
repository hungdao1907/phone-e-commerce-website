const fs = require('fs');
const path = require('path');
const file = '/Users/mac/Desktop/AppleWeb/backend/src/routes/product.routes.ts';
let code = fs.readFileSync(file, 'utf8');

// Update single product query
code = code.replace(
  `category: { include: { attributes: true } },`,
  `category: { include: { attributes: true, parent: true } },`
);

fs.writeFileSync(file, code);
console.log('Backend product routes updated');
