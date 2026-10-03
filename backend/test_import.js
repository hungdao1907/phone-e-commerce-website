const { parseSpecificationJSON } = require('./src/services/import.service');

const jsonStr = `[
  {
    "title": "Cấu hình & Bộ nhớ",
    "items": [
      { "label": "Hệ điều hành", "value": "Android 15" },
      { "label": "RAM", "value": "12 GB" }
    ]
  },
  {
    "title": "Màn hình",
    "items": [
      { "label": "Công nghệ", "value": "AMOLED" },
      { "label": "Kích thước", "value": "6.9 inch" }
    ]
  },
  {
    "title": "Camera",
    "items": [
      { "label": "Sau", "value": "200 MP" },
      { "label": "Trước", "value": "12 MP" }
    ]
  },
  {
    "title": "Pin & Sạc",
    "items": [
      { "label": "Pin", "value": "5000 mAh" },
      { "label": "Sạc", "value": "45W" }
    ]
  }
]`;

const result = parseSpecificationJSON(jsonStr, "Test Product");
console.log("Parsed result length:", result.specs.length);
console.log(JSON.stringify(result, null, 2));
