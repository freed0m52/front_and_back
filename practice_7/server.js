const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your_secret_key';
const ACCESS_EXPIRES_IN = '15m';

// Хранилища данных
let users = [];
let products = [];

// Middleware
app.use(cors());
app.use(express.json());

// Вспомогательные функции
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Middleware для проверки JWT
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Не авторизован' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Неверный или просроченный токен' });
  }
}

// ========== Аутентификация ==========

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  const { email, password, first_name, last_name } = req.body;

  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'Email уже используется' });
  }

  const hashedPassword = await hashPassword(password);
  const newUser = {
    id: nanoid(),
    email,
    first_name,
    last_name,
    hashedPassword
  };

  users.push(newUser);
  
  res.status(201).json({
    id: newUser.id,
    email: newUser.email,
    first_name: newUser.first_name,
    last_name: newUser.last_name
  });
});

// Вход
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Неверные учетные данные' });
  }

  const isValid = await verifyPassword(password, user.hashedPassword);
  if (!isValid) {
    return res.status(401).json({ error: 'Неверные учетные данные' });
  }

  const accessToken = jwt.sign(
    { sub: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );

  res.json({ accessToken });
});

// Получение текущего пользователя
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.sub);
  
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  res.json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name
  });
});

// ========== Товары ==========

// Создать товар
app.post('/api/products', authMiddleware, (req, res) => {
  const { title, category, description, price } = req.body;

  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  const newProduct = {
    id: nanoid(),
    title,
    category,
    description,
    price: Number(price),
    created_by: req.user.sub
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Получить все товары
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Получить товар по ID
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: 'Товар не найден' });
  }
  
  res.json(product);
});

// Обновить товар
app.put('/api/products/:id', authMiddleware, (req, res) => {
  const { title, category, description, price } = req.body;
  const productIndex = products.findIndex(p => p.id === req.params.id);

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Товар не найден' });
  }

  if (products[productIndex].created_by !== req.user.sub) {
    return res.status(403).json({ error: 'Нет прав на редактирование' });
  }

  products[productIndex] = {
    ...products[productIndex],
    ...(title && { title }),
    ...(category && { category }),
    ...(description && { description }),
    ...(price !== undefined && { price: Number(price) })
  };

  res.json(products[productIndex]);
});

// Удалить товар
app.delete('/api/products/:id', authMiddleware, (req, res) => {
  const productIndex = products.findIndex(p => p.id === req.params.id);

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Товар не найден' });
  }

  if (products[productIndex].created_by !== req.user.sub) {
    return res.status(403).json({ error: 'Нет прав на удаление' });
  }

  products.splice(productIndex, 1);
  res.json({ message: 'Товар удален' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});