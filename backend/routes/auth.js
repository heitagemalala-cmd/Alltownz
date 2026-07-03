const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'alltownz-secret-key-2026';

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // In production, use bcrypt.compare()
        if (password === 'password123') { // Demo check
            const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY);
            res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// OTP verification (demo)
router.post('/verify-otp', (req, res) => {
    const { phone, otp } = req.body;
    
    if (otp === '123456') { // Demo OTP
        const token = jwt.sign({ phone }, SECRET_KEY);
        res.json({ token, user: { phone, verified: true } });
    } else {
        res.status(401).json({ error: 'Invalid OTP' });
    }
});

// Register
router.post('/register', (req, res) => {
    const { email, phone, password, name } = req.body;
    
    db.run(
        'INSERT INTO users (email, phone, password, name) VALUES (?, ?, ?, ?)',
        [email, phone, password, name],
        function(err) {
            if (err) {
                return res.status(400).json({ error: 'Email or phone already exists' });
            }
            res.json({ id: this.lastID, email, phone, name });
        }
    );
});

module.exports = router;