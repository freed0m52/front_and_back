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
      last_name: user.last_name,
      role: user.role,
      isBlocked: user.isBlocked || false
    },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
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
    
    const user = users.find(u => u.id === payload.sub);
    if (user && user.isBlocked) {
      return res.status(403).json({ error: 'Аккаунт заблокирован' });
    }
    
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Неверный или просроченный токен' });
  }
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Не авторизован' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Доступ запрещен. Требуется роль: ${allowedRoles.join(' или ')}`,
        yourRole: req.user.role
      });
    }
    
    next();
  };
}

app.post('/api/auth/register', async (req, res) => {
  const { email, password, first_name, last_name, role } = req.body;

  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'Email уже используется' });
  }

  let userRole = 'user';
  
  const hasAdmin = users.some(u => u.role === 'admin');
  
  if (role === 'admin' && !hasAdmin) {
    userRole = 'admin';
  } else if (role === 'seller') {
    userRole = 'seller';
  } else {
    userRole = 'user';
  }

  const hashedPassword = await hashPassword(password);
  const newUser = {
    id: nanoid(),
    email,
    first_name,
    last_name,
    hashedPassword,
    role: userRole,
    isBlocked: false,
    created_at: new Date().toISOString()
  };

  users.push(newUser);
  
  res.status(201).json({
    id: newUser.id,
    email: newUser.email,
    first_name: newUser.first_name,
    last_name: newUser.last_name,
    role: newUser.role
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Неверные учетные данные' });
  }

  if (user.isBlocked) {
    return res.status(403).json({ error: 'Ваш аккаунт заблокирован. Обратитесь к администратору.' });
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
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role
    }
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

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Аккаунт заблокирован' });
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
    last_name: user.last_name,
    role: user.role,
    isBlocked: user.isBlocked
  });
});

app.get('/api/users', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const usersList = users.map(user => ({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    isBlocked: user.isBlocked,
    created_at: user.created_at
  }));
  res.json(usersList);
});

app.get('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  res.json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    isBlocked: user.isBlocked,
    created_at: user.created_at
  });
});

app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { role, isBlocked, first_name, last_name } = req.body;
  const userIndex = users.findIndex(u => u.id === req.params.id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  if (users[userIndex].role === 'admin' && role !== 'admin') {
    const adminCount = users.filter(u => u.role === 'admin' && !u.isBlocked).length;
    if (adminCount === 1 && !users[userIndex].isBlocked) {
      return res.status(400).json({ error: 'Нельзя изменить роль последнего активного администратора' });
    }
  }

  const updatedUser = {
    ...users[userIndex],
    ...(first_name && { first_name }),
    ...(last_name && { last_name }),
    ...(role && { role }),
    ...(isBlocked !== undefined && { isBlocked }),
    updated_at: new Date().toISOString()
  };

  users[userIndex] = updatedUser;

  res.json({
    id: updatedUser.id,
    email: updatedUser.email,
    first_name: updatedUser.first_name,
    last_name: updatedUser.last_name,
    role: updatedUser.role,
    isBlocked: updatedUser.isBlocked
  });
});

app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.params.id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  if (users[userIndex].role === 'admin') {
    const adminCount = users.filter(u => u.role === 'admin' && !u.isBlocked).length;
    if (adminCount === 1 && !users[userIndex].isBlocked) {
      return res.status(400).json({ error: 'Нельзя заблокировать последнего активного администратора' });
    }
  }

  users[userIndex].isBlocked = true;
  users[userIndex].blocked_at = new Date().toISOString();

  for (const token of refreshTokens) {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
      if (decoded.sub === req.params.id) {
        refreshTokens.delete(token);
      }
    } catch (e) {
    }
  }

  res.json({ 
    message: 'Пользователь заблокирован',
    user: {
      id: users[userIndex].id,
      email: users[userIndex].email,
      isBlocked: users[userIndex].isBlocked
    }
  });
});

app.post('/api/users/:id/unblock', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.params.id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  users[userIndex].isBlocked = false;
  users[userIndex].unblocked_at = new Date().toISOString();

  res.json({ 
    message: 'Пользователь разблокирован',
    user: {
      id: users[userIndex].id,
      email: users[userIndex].email,
      isBlocked: users[userIndex].isBlocked
    }
  });
});

app.get('/api/products', authMiddleware, (req, res) => {
  const productsWithImages = products.map(product => ({
    ...product,
    imageUrl: product.imageUrl || null
  }));
  res.json(productsWithImages);
});

app.get('/api/products/:id', authMiddleware, (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: 'Товар не найден' });
  }
  
  res.json({
    ...product,
    imageUrl: product.imageUrl || null
  });
});

app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
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

app.put('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
  const { title, category, description, price, imageUrl } = req.body;
  const productIndex = products.findIndex(p => p.id === req.params.id);

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Товар не найден' });
  }

  if (req.user.role !== 'admin' && products[productIndex].created_by !== req.user.sub) {
    return res.status(403).json({ error: 'Нет прав на редактирование этого товара' });
  }

  const updatedProduct = {
    ...products[productIndex],
    ...(title && { title }),
    ...(category && { category }),
    ...(description && { description }),
    ...(price !== undefined && { price: Number(price) }),
    ...(imageUrl !== undefined && { imageUrl }),
    updated_at: new Date().toISOString()
  };

  products[productIndex] = updatedProduct;
  res.json(updatedProduct);
});

app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const productIndex = products.findIndex(p => p.id === req.params.id);

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Товар не найден' });
  }

  products.splice(productIndex, 1);
  res.json({ message: 'Товар удален' });
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📝 Доступные маршруты:`);
  console.log(`\n🔐 Аутентификация:`);
  console.log(`   POST   /api/auth/register - регистрация`);
  console.log(`   POST   /api/auth/login - вход`);
  console.log(`   POST   /api/auth/refresh - обновление токенов`);
  console.log(`   POST   /api/auth/logout - выход`);
  console.log(`   GET    /api/auth/me - текущий пользователь`);
  console.log(`\n👥 Управление пользователями (только admin):`);
  console.log(`   GET    /api/users - список пользователей`);
  console.log(`   GET    /api/users/:id - пользователь по ID`);
  console.log(`   PUT    /api/users/:id - обновить пользователя`);
  console.log(`   DELETE /api/users/:id - заблокировать пользователя`);
  console.log(`   POST   /api/users/:id/unblock - разблокировать пользователя`);
  console.log(`\n📦 Управление товарами:`);
  console.log(`   GET    /api/products - список товаров (user, seller, admin)`);
  console.log(`   GET    /api/products/:id - товар по ID (user, seller, admin)`);
  console.log(`   POST   /api/products - создать товар (seller, admin)`);
  console.log(`   PUT    /api/products/:id - обновить товар (seller-свои, admin-любые)`);
  console.log(`   DELETE /api/products/:id - удалить товар (только admin)`);
  console.log(`\n👑 Роли: user, seller, admin`);
});