const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const dbPath = path.join(__dirname, 'shop.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к БД:', err);
    } else {
        console.log('✅ Подключено к базе данных SQLite');
    }
});

db.run(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL,
        rating REAL DEFAULT 0,
        image TEXT
    )
`, (err) => {
    if (err) {
        console.error('Ошибка создания таблицы:', err);
    } else {
        console.log('✅ Таблица products готова');
        
        db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
            if (err) {
                console.error('Ошибка проверки товаров:', err);
            } else if (row.count === 0) {
                console.log('📦 Добавляем начальные товары...');
                const initialProducts = [
                    ['iPhone 15', 'Смартфоны', '6.1-дюймовый дисплей, камера 48 МП, чип A16', 89990, 15, 4.8, 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch_GEO_EMEA?wid=512&hei=512&fmt=png-alpha'],
                    ['MacBook Air M2', 'Ноутбуки', '13.6 дюймов, 8GB RAM, 256GB SSD', 129990, 8, 4.9, 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-midnight-select-20220606?wid=512&hei=512&fmt=png-alpha'],
                    ['Samsung Galaxy S24', 'Смартфоны', 'Dynamic AMOLED 2X, 120Hz, Snapdragon 8 Gen 3', 89990, 12, 4.7, 'https://images.samsung.com/is/image/samsung/p6pim/ru/2401/gallery/ru-galaxy-s24-s928-sm-s928bzaacau-539323800?$130_130_PNG$'],
                    ['iPad Pro M2', 'Планшеты', '12.9 дюймов, 128GB, Wi-Fi', 119990, 6, 4.8, 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/ipad-pro-12-11-select-202212?wid=512&hei=512&fmt=png-alpha']
                ];

                const stmt = db.prepare('INSERT INTO products (name, category, description, price, stock, rating, image) VALUES (?, ?, ?, ?, ?, ?, ?)');
                
                initialProducts.forEach(product => {
                    stmt.run(product, (err) => {
                        if (err) console.error('Ошибка добавления товара:', err);
                    });
                });
                
                stmt.finalize();
                console.log('✅ Начальные товары добавлены');
            }
        });
    }
});

app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM products ORDER BY id', [], (err, rows) => {
        if (err) {
            console.error('Ошибка получения товаров:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        } else {
            res.json(rows);
        }
    });
});

app.get('/api/products/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Ошибка получения товара:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        } else if (!row) {
            res.status(404).json({ error: 'Товар не найден' });
        } else {
            res.json(row);
        }
    });
});

app.post('/api/products', (req, res) => {
    const { name, category, description, price, stock, rating, image } = req.body;
    
    if (!name || !category || !description || !price || !stock) {
        return res.status(400).json({ error: 'Заполните обязательные поля' });
    }

    db.run(
        'INSERT INTO products (name, category, description, price, stock, rating, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, category, description, Number(price), Number(stock), rating ? Number(rating) : 0, image || 'https://via.placeholder.com/512'],
        function(err) {
            if (err) {
                console.error('Ошибка создания товара:', err);
                res.status(500).json({ error: 'Ошибка сервера' });
            } else {
                db.get('SELECT * FROM products WHERE id = ?', [this.lastID], (err, row) => {
                    if (err) {
                        res.status(500).json({ error: 'Ошибка получения созданного товара' });
                    } else {
                        res.status(201).json(row);
                    }
                });
            }
        }
    );
});

app.patch('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const { name, category, description, price, stock, rating, image } = req.body;

    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Ошибка проверки товара:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        const updates = [];
        const values = [];

        if (name) { updates.push('name = ?'); values.push(name); }
        if (category) { updates.push('category = ?'); values.push(category); }
        if (description) { updates.push('description = ?'); values.push(description); }
        if (price) { updates.push('price = ?'); values.push(Number(price)); }
        if (stock) { updates.push('stock = ?'); values.push(Number(stock)); }
        if (rating) { updates.push('rating = ?'); values.push(Number(rating)); }
        if (image) { updates.push('image = ?'); values.push(image); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Нет данных для обновления' });
        }

        values.push(id);
        
        db.run(
            `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
            values,
            function(err) {
                if (err) {
                    console.error('Ошибка обновления товара:', err);
                    res.status(500).json({ error: 'Ошибка сервера' });
                } else {
                    db.get('SELECT * FROM products WHERE id = ?', [id], (err, updatedRow) => {
                        if (err) {
                            res.status(500).json({ error: 'Ошибка получения обновлённого товара' });
                        } else {
                            res.json(updatedRow);
                        }
                    });
                }
            }
        );
    });
});

app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;
    
    db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Ошибка удаления товара:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Товар не найден' });
        } else {
            res.status(204).send();
        }
    });
});

app.listen(port, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${port}`);
});

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Ошибка при закрытии БД:', err);
        } else {
            console.log('📁 База данных закрыта');
        }
        process.exit(0);
    });
});