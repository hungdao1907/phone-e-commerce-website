const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:3001/api/products', {
      name: "Test Laptop",
      description: "Test Desc",
      brand: "Apple",
      image: "",
      images: [],
      categoryId: "cf6ab04c-35cd-4b7f-b52b-42289c09bf43", // some category
      status: "active",
      specifications: [{ key: "Màn hình", value: "15 inch" }],
      variants: [{
        sku: "TEST-LAPT-1",
        price: 25000000,
        salePrice: null,
        stock: 10,
        attributes: { "Phiên bản": "M3", "Màu sắc": "Đen" },
        colorCode: "#000000",
        image: null
      }]
    }, {
      headers: { 'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LWFkbWluIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzg5NzkwODkzfQ.uxTIVF8unKuQg5XjK3qAg2LX2ogTmit3yKgUAYMt1jQ` }
    });
    console.log(res.data);
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
  }
}
test();
