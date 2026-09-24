const http = require('http');

http.get('http://localhost:3001/api/products/admin/filters', res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(body));
});
