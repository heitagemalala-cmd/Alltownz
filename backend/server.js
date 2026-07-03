// backend/server.js - ZERO DEPENDENCIES + PERMANENT JSON STORAGE
const http = require('http');
const fs = require('fs');
const path = require('path');

// Path to JSON database file
const DATA_FILE = path.join(__dirname, 'data.json');

// Load data from file (or create default if missing)
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(raw);
        }
    } catch (err) {
        console.log('📄 Creating new data file...');
    }
    
    // Default data if file doesn't exist
    const defaultData = {
        users: [
            {id: 1, email: 'admin@alltownz.com', password: 'admin123', name: 'System Admin', role: 'admin', verified: true},
            {id: 2, email: 'seller@gmail.com', password: 'seller123', name: 'John Doe', role: 'seller', verified: true},
            {id: 3, email: 'buyer@gmail.com', password: 'buyer123', name: 'Jane Customer', role: 'customer', verified: true}
        ],
        shops: [
            {id: 1, owner_id: 2, name: "Kampala Electronics Hub", description: "Best gadgets in town", approved: true}
        ],
        products: [
            {id: 1, shop_id: 1, name: 'Samsung Galaxy A54', price: 850000, stock: 15, category: 'Electronics', image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200&h=200&fit=crop'},
            {id: 2, shop_id: 1, name: 'Nike Air Max', price: 350000, stock: 7, category: 'Fashion', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop'},
            {id: 3, shop_id: 1, name: 'Wireless Earbuds', price: 120000, stock: 30, category: 'Electronics', image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=200&h=200&fit=crop'},
            {id: 4, shop_id: 1, name: 'Smart Watch Pro', price: 250000, stock: 12, category: 'Electronics', image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=200&h=200&fit=crop'}
        ],
        orders: []
    };
    
    // Save default data to file
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
}

// Save data to file
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Load the database
let DB = loadData();

// Helper functions
function parseBody(req, callback) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try { callback(JSON.parse(body)); } catch { callback({}); }
    });
}

function sendJSON(res, data, status = 200) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

function serveStatic(res, filePath, mimeType) {
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('File not found'); return; }
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(data);
    });
}

// Create HTTP server
const server = http.createServer((req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, { 
            'Access-Control-Allow-Origin': '*', 
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 
            'Access-Control-Allow-Headers': 'Content-Type' 
        });
        res.end(); 
        return;
    }

    const url = req.url.split('?')[0];

    // --- AUTH LOGIN ---
    if (req.method === 'POST' && url === '/api/auth/login') {
        return parseBody(req, (data) => {
            const user = DB.users.find(u => u.email === data.email && u.password === data.password);
            if (user) {
                const shop = DB.shops.find(s => s.owner_id === user.id);
                sendJSON(res, { 
                    token: 'demo-token-' + Date.now(), 
                    user: { ...user, password: undefined, shop: shop || null } 
                });
            } else {
                sendJSON(res, { error: 'Invalid credentials' }, 401);
            }
        });
    }

    // --- SELLER: REGISTER SHOP ---
    if (req.method === 'POST' && url === '/api/shops/register') {
        return parseBody(req, (data) => {
            const existing = DB.shops.find(s => s.owner_id === data.owner_id);
            if (existing) return sendJSON(res, { error: 'You already have a shop' }, 400);
            const newShop = { 
                id: DB.shops.length + 1, 
                owner_id: data.owner_id, 
                name: data.name, 
                description: data.description, 
                approved: false 
            };
            DB.shops.push(newShop);
            saveData(DB); // Save to JSON file
            sendJSON(res, { message: 'Shop registered! Waiting for admin approval.', shop: newShop });
        });
    }

    // --- SELLER: ADD PRODUCT ---
    if (req.method === 'POST' && url === '/api/products') {
        return parseBody(req, (data) => {
            const shop = DB.shops.find(s => s.id === data.shop_id);
            if (!shop || !shop.approved) return sendJSON(res, { error: 'Your shop is not approved yet' }, 403);
            const newProduct = { 
                id: DB.products.length + 1, 
                ...data,
                image: data.image || 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200&h=200&fit=crop'
            };
            DB.products.push(newProduct);
            saveData(DB); // Save to JSON file
            sendJSON(res, newProduct);
        });
    }

    // --- GET PRODUCTS ---
    if (req.method === 'GET' && url === '/api/products') {
        const activeProducts = DB.products.filter(p => {
            const shop = DB.shops.find(s => s.id === p.shop_id);
            return shop && shop.approved;
        });
        return sendJSON(res, activeProducts);
    }

    // --- SEARCH PRODUCTS ---
    if (req.method === 'GET' && url === '/api/products/search') {
        const q = new URL(req.url, `http://${req.headers.host}`).searchParams.get('q') || '';
        const results = DB.products.filter(p => 
            p.name.toLowerCase().includes(q.toLowerCase()) || 
            p.category.toLowerCase().includes(q.toLowerCase())
        );
        return sendJSON(res, results);
    }

    // --- ADMIN: GET ALL PENDING SHOPS ---
    if (req.method === 'GET' && url === '/api/admin/pending-shops') {
        return sendJSON(res, DB.shops.filter(s => !s.approved));
    }

    // --- ADMIN: APPROVE SHOP ---
    if (req.method === 'PUT' && url.startsWith('/api/admin/approve-shop/')) {
        const shopId = parseInt(url.split('/').pop());
        const shop = DB.shops.find(s => s.id === shopId);
        if (shop) { 
            shop.approved = true; 
            saveData(DB); // Save to JSON file
            return sendJSON(res, { message: 'Shop approved successfully!' }); 
        }
        return sendJSON(res, { error: 'Shop not found' }, 404);
    }

    // --- ADMIN: TOGGLE USER (Enable/Disable) ---
    if (req.method === 'PUT' && url.startsWith('/api/admin/toggle-user/')) {
        const userId = parseInt(url.split('/').pop());
        const user = DB.users.find(u => u.id === userId);
        if (user) { 
            user.verified = !user.verified; 
            saveData(DB); // Save to JSON file
            return sendJSON(res, { message: `User ${user.verified ? 'Enabled' : 'Disabled'}`, user }); 
        }
        return sendJSON(res, { error: 'User not found' }, 404);
    }

    // --- CREATE ORDER ---
    if (req.method === 'POST' && url === '/api/orders') {
        return parseBody(req, (data) => {
            const order = { 
                ...data, 
                id: Date.now(), 
                order_id: 'ALL-' + Date.now().toString(36).toUpperCase(), 
                created_at: new Date().toISOString(), 
                status: 'pending' 
            };
            DB.orders.push(order);
            saveData(DB); // Save to JSON file
            sendJSON(res, { 
                order_id: order.order_id, 
                id: order.id, 
                status: 'pending', 
                message: 'Order placed successfully!' 
            });
        });
    }

    // --- GET USER ORDERS ---
    if (req.method === 'GET' && url.startsWith('/api/orders/user/')) {
        const userId = parseInt(url.split('/').pop());
        const userOrders = DB.orders.filter(o => o.user_id === userId);
        return sendJSON(res, userOrders);
    }

    // --- SERVE STATIC FILES ---
    if (req.url === '/' || req.url === '/index.html') 
        return serveStatic(res, path.join(__dirname, '../index.html'), 'text/html');
    if (req.url.endsWith('.html')) 
        return serveStatic(res, path.join(__dirname, '..', req.url), 'text/html');
    if (req.url.endsWith('.css')) 
        return serveStatic(res, path.join(__dirname, '..', req.url), 'text/css');
    if (req.url.endsWith('.js')) 
        return serveStatic(res, path.join(__dirname, '..', req.url), 'application/javascript');
    
    sendJSON(res, { error: 'Not found' }, 404);
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ AllTownz Marketplace running on port ${PORT}`);
    console.log(`📁 Data saved permanently to ${DATA_FILE}`);
});