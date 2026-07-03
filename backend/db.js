const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize SQLite database
const db = new sqlite3.Database(path.join(__dirname, '../data/alltownz.db'));

// Create tables
db.serialize(() => {
    // Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            phone TEXT UNIQUE,
            password TEXT,
            name TEXT,
            verified BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Products table
    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            seller_id INTEGER,
            name TEXT,
            price INTEGER,
            stock INTEGER,
            category TEXT,
            image TEXT,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (seller_id) REFERENCES users(id)
        )
    `);

    // Orders table
    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT UNIQUE,
            user_id INTEGER,
            total INTEGER,
            status TEXT DEFAULT 'pending',
            payment_method TEXT,
            delivery_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Order items
    db.run(`
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            product_id INTEGER,
            quantity INTEGER,
            price INTEGER,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    `);

    // Seed demo data
    db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
        if (row.count === 0) {
            const demoProducts = [
                ['1', 'Samsung Galaxy A54', 850000, 15, 'Electronics', 'https://via.placeholder.com/150'],
                ['1', 'Nike Air Max', 350000, 7, 'Fashion', 'https://via.placeholder.com/150'],
                ['1', 'Wireless Earbuds', 120000, 30, 'Electronics', 'https://via.placeholder.com/150'],
                ['1', 'Smart Watch', 250000, 12, 'Electronics', 'https://via.placeholder.com/150']
            ];
            
            const stmt = db.prepare('INSERT INTO products (seller_id, name, price, stock, category, image) VALUES (?, ?, ?, ?, ?, ?)');
            demoProducts.forEach(p => stmt.run(p));
            stmt.finalize();
            console.log('✅ Demo products seeded');
        }
    });
});

console.log('✅ Database initialized');

module.exports = db;