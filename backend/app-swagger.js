const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

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

// Начальные данные
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
  }
];

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Online Store API',
      version: '1.0.0',
      description: 'API для управления товарами интернет-магазина',
      contact: {
        name: 'API Support',
        email: 'support@onlinestore.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Локальный сервер'
      }
    ],
    components: {
      schemas: {
        Product: {
          type: 'object',
          required: ['name', 'description', 'price', 'category', 'stock'],
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор товара',
              example: 'abc123'
            },
            name: {
              type: 'string',
              description: 'Название товара',
              example: 'Смартфон Xiaomi Redmi Note 12'
            },
            description: {
              type: 'string',
              description: 'Описание товара',
              example: '6.67" AMOLED, 128 ГБ, 4G, Android 12'
            },
            price: {
              type: 'number',
              description: 'Цена товара в рублях',
              example: 18990
            },
            category: {
              type: 'string',
              description: 'Категория товара',
              example: 'Смартфоны'
            },
            stock: {
              type: 'integer',
              description: 'Количество на складе',
              example: 15
            },
            image: {
              type: 'string',
              description: 'URL изображения товара',
              example: 'https://via.placeholder.com/300x200?text=Product'
            }
          }
        },
        CreateProductDto: {
          type: 'object',
          required: ['name', 'description', 'price', 'category', 'stock'],
          properties: {
            name: {
              type: 'string',
              description: 'Название товара',
              example: 'Новый товар'
            },
            description: {
              type: 'string',
              description: 'Описание товара',
              example: 'Описание нового товара'
            },
            price: {
              type: 'number',
              description: 'Цена товара',
              example: 9990
            },
            category: {
              type: 'string',
              description: 'Категория товара',
              example: 'Электроника'
            },
            stock: {
              type: 'integer',
              description: 'Количество на складе',
              example: 10
            },
            image: {
              type: 'string',
              description: 'URL изображения (необязательно)',
              example: 'https://example.com/image.jpg'
            }
          }
        },
        UpdateProductDto: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Название товара',
              example: 'Обновленное название'
            },
            description: {
              type: 'string',
              description: 'Описание товара',
              example: 'Обновленное описание'
            },
            price: {
              type: 'number',
              description: 'Цена товара',
              example: 12990
            },
            category: {
              type: 'string',
              description: 'Категория товара',
              example: 'Новая категория'
            },
            stock: {
              type: 'integer',
              description: 'Количество на складе',
              example: 20
            },
            image: {
              type: 'string',
              description: 'URL изображения',
              example: 'https://example.com/new-image.jpg'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Сообщение об ошибке',
              example: 'Product not found'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Products',
        description: 'Управление товарами'
      }
    ]
  },
  apis: ['./app-swagger.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Функция для поиска товара
function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить все товары
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список всех товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (product) {
    res.json(product);
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductDto'
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/products', (req, res) => {
  const { name, description, price, category, stock, image } = req.body;
  
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

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductDto'
 *     responses:
 *       200:
 *         description: Товар успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет данных для обновления
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       204:
 *         description: Товар успешно удален (нет тела ответа)
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
  console.log(`Swagger documentation at http://localhost:${port}/api-docs`);
});