const express = require('express');
const router = express.Router();
const db = require('../db');

// Create order
router.post('/', (req, res) => {
    const { user_id, items, total, payment_method, delivery_address } = req.body;
    const order_id = 'ALL-' + Date.now().toString(36).toUpperCase();
    
    db.run(
        'INSERT INTO orders (order_id, user_id, total, payment_method, delivery_address) VALUES (?, ?, ?, ?, ?)',
        [order_id, user_id, total, payment_method, delivery_address],
        function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            
            const orderId = this.lastID;
            
            // Insert order items
            const stmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
            items.forEach(item => {
                stmt.run(orderId, item.product_id, item.quantity, item.price);
            });
            stmt.finalize();
            
            res.json({ order_id, id: orderId, status: 'pending' });
        }
    );
});

// Get user orders
router.get('/user/:userId', (req, res) => {
    db.all(
        'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
        [req.params.userId],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});

// Update order status
router.put('/:id/status', (req, res) => {
    const { status } = req.body;
    
    db.run(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ status: 'updated' });
        }
    );
});

module.exports = router;