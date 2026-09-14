const fs = require('fs');

const files = ['calendar.json', 'product.json', 'orders.json', 'user.json', 'performance.json'];

function updateStrokeWidth(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(updateStrokeWidth);
  } else if (obj !== null && typeof obj === 'object') {
    if (obj.ty === 'st' && obj.w && typeof obj.w.k === 'number') {
      obj.w.k = 3.0; // Change stroke width to 3.0
    }
    for (let key in obj) {
      updateStrokeWidth(obj[key]);
    }
  }
}

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(__dirname + '/' + file, 'utf8'));
  updateStrokeWidth(data);
  fs.writeFileSync(__dirname + '/' + file, JSON.stringify(data));
});
console.log('Done updating stroke widths');
