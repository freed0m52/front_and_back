const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

let products = [
    { id: 1, name: 'Кофеварка', price: 4500 },
    { id: 2, name: 'Наушники', price: 3200 },
    { id: 3, name: 'Клавиатура', price: 2800 }
];

app.get('/', (req, res) => {
    res.send('Сервер с товарами работает!');
});

app.get('/products', (req, res) => {
    res.json(products);
});

app.get('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);

    if (!product) {
        return res.status(404).json({ message: 'Товар не найден' });
    }

    res.json(product);
});

app.post('/products', (req, res) => {
    const { name, price } = req.body;

    if (!name || !price) {
        return res.status(400).json({ message: 'Название и цена обязательны' });
    }

    const maxId = products.length > 0 
        ? Math.max(...products.map(p => p.id)) 
        : 0;

    const newProduct = {
        id: maxId + 1,  
        name,
        price
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.patch('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);

    if (!product) {
        return res.status(404).json({ message: 'Товар не найден' });
    }

    const { name, price } = req.body;

    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;

    res.json(product);
});

app.delete('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({ message: 'Товар не найден' });
    }

    products.splice(productIndex, 1);
    res.json({ message: 'Товар удалён' });
});

app.listen(port, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${port}`);
});