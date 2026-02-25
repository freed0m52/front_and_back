const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testAPI() {
  try {
    console.log('1. GET all products');
    const getRes = await axios.get(`${API_URL}/products`);
    console.log(`Status: ${getRes.status}, Products: ${getRes.data.length}\n`);

    console.log('2. GET product by ID');
    const firstProductId = getRes.data[0].id;
    const getOneRes = await axios.get(`${API_URL}/products/${firstProductId}`);
    console.log('Product:', getOneRes.data.name, '\n');

    console.log('3. POST create new product');
    const newProduct = {
      name: 'Тестовый товар',
      description: 'Это тестовый товар для проверки API',
      price: 999,
      category: 'Тест',
      stock: 10
    };
    const postRes = await axios.post(`${API_URL}/products`, newProduct);
    console.log('Created:', postRes.data, '\n');

    console.log('4. PATCH update product');
    const updateRes = await axios.patch(`${API_URL}/products/${postRes.data.id}`, {
      price: 1299,
      stock: 15
    });
    console.log('Updated:', updateRes.data, '\n');

    console.log('5. DELETE product');
    const deleteRes = await axios.delete(`${API_URL}/products/${postRes.data.id}`);
    console.log(`Delete status: ${deleteRes.status}\n`);

    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAPI();