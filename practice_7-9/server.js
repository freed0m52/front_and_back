const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const cors = require('cors');
const app = express();
const PORT = 3000;

const JWT_ACCESS_SECRET = 'access_secret_key_change_me';
const JWT_REFRESH_SECRET = 'refresh_secret_key_change_me';

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

let users = [];
let products = [];

let refreshTokens = new Set();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function generateAccessToken(user) {
  return jwt.sign(
    { 
      sub: user.id, 
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name
    },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Не авторизован' });
  }

  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Неверный или просроченный токен' });
  }
}

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
    hashedPassword,
    created_at: new Date().toISOString()
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

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  refreshTokens.add(refreshToken);

  res.json({ 
    accessToken, 
    refreshToken 
  });
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken обязателен' });
  }

  if (!refreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: 'Невалидный refresh-токен' });
  }

  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    const user = users.find(u => u.id === payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    refreshTokens.delete(refreshToken);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    refreshTokens.add(newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    return res.status(401).json({ error: 'Невалидный или просроченный refresh-токен' });
  }
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }
  res.json({ message: 'Успешный выход' });
});

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

// Получить все товары
app.get('/api/products', (req, res) => {
  const productsWithImages = products.map(product => ({
    ...product,
    imageUrl: product.imageUrl || null
  }));
  res.json(productsWithImages);
});

// Получить товар по ID
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: 'Товар не найден' });
  }
  
  res.json({
    ...product,
    imageUrl: product.imageUrl || null
  });
});

// Создать товар 
app.post('/api/products', authMiddleware, (req, res) => {
  const { title, category, description, price, imageUrl } = req.body;

  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: 'Все поля обязательны: title, category, description, price' });
  }

  const newProduct = {
    id: nanoid(),
    title,
    category,
    description,
    price: Number(price),
    imageUrl: imageUrl || null, 
    created_by: req.user.sub,
    created_at: new Date().toISOString()
  };

  products.push(newProduct);
  
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', authMiddleware, (req, res) => {
  const { title, category, description, price, imageUrl } = req.body;
  const productIndex = products.findIndex(p => p.id === req.params.id);

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Товар не найден' });
  }

  if (products[productIndex].created_by !== req.user.sub) {
    return res.status(403).json({ error: 'Нет прав на редактирование' });
  }

  const updatedProduct = {
    ...products[productIndex],
    ...(title && { title }),
    ...(category && { category }),
    ...(description && { description }),
    ...(price !== undefined && { price: Number(price) }),

    imageUrl: imageUrl !== undefined ? imageUrl : products[productIndex].imageUrl,
    updated_at: new Date().toISOString()
  };

  products[productIndex] = updatedProduct;
  res.json(updatedProduct);
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

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📝 Доступные маршруты:`);
  console.log(`   POST   /api/auth/register`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   POST   /api/auth/refresh`);
  console.log(`   GET    /api/auth/me`);
  console.log(`   GET    /api/products - список товаров (с фото)`);
  console.log(`   POST   /api/products - создать товар (с фото)`);
  console.log(`   GET    /api/products/:id - товар по ID (с фото)`);
  console.log(`   PUT    /api/products/:id - обновить товар (с фото)`);
  console.log(`   DELETE /api/products/:id - удалить товар`);
});