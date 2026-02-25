const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Логирование запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    console.log('Body:', req.body);
  }
  next();
});

// Начальные данные (10 товаров)
let products = [
  {
    id: nanoid(6),
    name: 'Смартфон Xiaomi Redmi Note 12',
    description: '6.67" AMOLED, 128 ГБ, 4G, Android 12',
    price: 18990,
    category: 'Смартфоны',
    stock: 15,
    image: 'https://via.placeholder.com/300x200?text=Xiaomi+Redmi'
  },
  {
    id: nanoid(6),
    name: 'Ноутбук Lenovo IdeaPad 3',
    description: '15.6" IPS, Intel Core i5, 8 ГБ RAM, 512 ГБ SSD',
    price: 45990,
    category: 'Ноутбуки',
    stock: 8,
    image: 'https://via.placeholder.com/300x200?text=Lenovo+IdeaPad'
  },
  {
    id: nanoid(6),
    name: 'Наушники JBL Tune 510BT',
    description: 'Беспроводные, Bluetooth, 40 часов работы',
    price: 3990,
    category: 'Аксессуары',
    stock: 25,
    image: 'https://via.placeholder.com/300x200?text=JBL+Tune'
  },
  {
    id: nanoid(6),
    name: 'Планшет Samsung Tab A8',
    description: '10.5" TFT, 64 ГБ, 4 ГБ RAM, Android 11',
    price: 15990,
    category: 'Планшеты',
    stock: 12,
    image: 'https://via.placeholder.com/300x200?text=Samsung+Tab'
  },
  {
    id: nanoid(6),
    name: 'Умные часы Huawei Watch GT 3',
    description: '1.43" AMOLED, GPS, пульсометр',
    price: 12990,
    category: 'Аксессуары',
    stock: 7,
    image: 'https://via.placeholder.com/300x200?text=Huawei+Watch'
  },
  {
    id: nanoid(6),
    name: 'Монитор Acer Nitro VG270',
    description: '27" IPS, 165 Гц, 1 мс, Full HD',
    price: 18990,
    category: 'Мониторы',
    stock: 5,
    image: 'https://via.placeholder.com/300x200?text=Acer+Monitor'
  },
  {
    id: nanoid(6),
    name: 'Клавиатура Logitech G Pro X',
    description: 'Механическая, переключатели GX Blue',
    price: 8990,
    category: 'Аксессуары',
    stock: 10,
    image: 'https://via.placeholder.com/300x200?text=Logitech+Keyboard'
  },
  {
    id: nanoid(6),
    name: 'Мышь Razer DeathAdder V2',
    description: 'Оптическая, 20000 DPI, проводная',
    price: 3990,
    category: 'Аксессуары',
    stock: 18,
    image: 'https://via.placeholder.com/300x200?text=Razer+Mouse'
  },
  {
    id: nanoid(6),
    name: 'Внешний диск Samsung T7',
    description: '1 ТБ, USB 3.2, скорость 1050 МБ/с',
    price: 6990,
    category: 'Хранение данных',
    stock: 14,
    image: 'https://via.placeholder.com/300x200?text=Samsung+T7'
  },
  {
    id: nanoid(6),
    name: 'Роутер TP-Link Archer AX73',
    description: 'Wi-Fi 6, скорость до 5400 Мбит/с',
    price: 7990,
    category: 'Сетевое оборудование',
    stock: 6,
    image: 'https://via.placeholder.com/300x200?text=TP-Link+Router'
  }
];

// Функция для поиска товара
function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}

// GET /api/products - получение всех товаров
app.get('/api/products', (req, res) => {
  res.json(products);
});

// GET /api/products/:id - получение товара по ID
app.get('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (product) {
    res.json(product);
  }
});

// POST /api/products - создание нового товара
app.post('/api/products', (req, res) => {
  const { name, description, price, category, stock, image } = req.body;
  
  // Валидация
  if (!name || !description || !price || !category || stock === undefined) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['name', 'description', 'price', 'category', 'stock']
    });
  }
  
  const newProduct = {
    id: nanoid(6),
    name: name.trim(),
    description: description.trim(),
    price: Number(price),
    category: category.trim(),
    stock: Number(stock),
    image: image || `https://via.placeholder.com/300x200?text=${encodeURIComponent(name)}`
  };
  
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PATCH /api/products/:id - обновление товара
app.patch('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  
  const { name, description, price, category, stock, image } = req.body;
  
  if (!name && !description && !price && !category && !stock && !image) {
    return res.status(400).json({ error: 'Nothing to update' });
  }
  
  if (name !== undefined) product.name = name.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (category !== undefined) product.category = category.trim();
  if (stock !== undefined) product.stock = Number(stock);
  if (image !== undefined) product.image = image;
  
  res.json(product);
});

// DELETE /api/products/:id - удаление товара
app.delete('/api/products/:id', (req, res) => {
  const exists = products.some(p => p.id === req.params.id);
  if (!exists) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  products = products.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`API available at http://localhost:${port}/api/products`);
});