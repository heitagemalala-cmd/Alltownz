const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all products
router.get('/', (req, res) => {
    db.all('SELECT * FROM products ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Search products
router.get('/search', (req, res) => {
    const q = req.query.q || '';
    db.all(
        'SELECT * FROM products WHERE name LIKE ? OR category LIKE ?',
        [`%${q}%`, `%${q}%`],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});

// Get product by ID
router.get('/:id', (req, res) => {
    db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(row);
    });
});

// Add product (seller)
router.post('/', (req, res) => {
    const { seller_id, name, price, stock, category, image, description } = req.body;
    
    db.run(
        'INSERT INTO products (seller_id, name, price, stock, category, image, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [seller_id, name, price, stock, category, image, description],
        function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ id: this.lastID, name, price, stock });
        }
    );
});

// Update product
router.put('/:id', (req, res) => {
    const { name, price, stock } = req.body;
    
    db.run(
        'UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?',
        [name, price, stock, req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ updated: true });
        }
    );
});

// Delete product
router.delete('/:id', (req, res) => {
    db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ deleted: true });
    });
});

module.exports = router;