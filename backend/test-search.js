const http = require('http');

const data = JSON.stringify({ email: 'admin@appleweb.com', password: 'admin' });

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const token = JSON.parse(body).token;
    if (!token) return console.log("Login failed");
    
    http.get('http://localhost:3001/api/products/admin/search?page=1&limit=10', {
      headers: { 'Authorization': 'Bearer ' + token }
    }, res2 => {
      let body2 = '';
      res2.on('data', d => body2 += d);
      res2.on('end', () => console.log(body2));
    });
  });
});
req.write(data);
req.end();
