// backend/server.js - COMPLETE ALLTOWNZ SUPABASE VERSION
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// --- YOUR SUPABASE DETAILS ---
const supabaseUrl = 'https://jzsqfkshdmsdpwjmukav.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6c3Fma3NoZG1zZHB3am11a2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNTg2MzEsImV4cCI6MjA5ODczNDYzMX0.5s5CCzry7ZBkp_Nrhk8q0bb9ALJwchqZ5bxTjLCK95U';
const supabase = createClient(supabaseUrl, supabaseKey);

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
const server = http.createServer(async (req, res) => {
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

    // ============================================================
    // 1. AUTH ROUTES
    // ============================================================
    if (req.method === 'POST' && url === '/api/auth/login') {
        return parseBody(req, async (data) => {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', data.email)
                .eq('password', data.password)
                .single();
            
            if (error || !user) return sendJSON(res, { error: 'Invalid credentials' }, 401);
            if (!user.verified) return sendJSON(res, { error: 'Account disabled by Admin' }, 403);
            
            const { data: shop } = await supabase
                .from('shops')
                .select('*')
                .eq('owner_id', user.id)
                .maybeSingle();

            sendJSON(res, { 
                token: 'demo-token-' + Date.now(), 
                user: { ...user, password: undefined, shop: shop || null } 
            });
        });
    }

    // ============================================================
    // 2. SELLER ROUTES
    // ============================================================
    if (req.method === 'POST' && url === '/api/shops/register') {
        return parseBody(req, async (data) => {
            const { data: existing } = await supabase
                .from('shops')
                .select('*')
                .eq('owner_id', data.owner_id);
            
            if (existing && existing.length > 0) {
                return sendJSON(res, { error: 'You already have a shop' }, 400);
            }

            const { data: newShop, error } = await supabase
                .from('shops')
                .insert({
                    owner_id: data.owner_id,
                    name: data.name,
                    description: data.description,
                    approved: false
                })
                .select();

            if (error) return sendJSON(res, { error: error.message }, 400);
            
            sendJSON(res, { message: 'Shop registered! Waiting for admin approval.', shop: newShop[0] });
        });
    }

    if (req.method === 'POST' && url === '/api/products') {
        return parseBody(req, async (data) => {
            // Check if shop is approved
            const { data: shop } = await supabase
                .from('shops')
                .select('*')
                .eq('id', data.shop_id)
                .single();

            if (!shop || !shop.approved) return sendJSON(res, { error: 'Your shop is not approved yet' }, 403);

            const { data: newProduct, error } = await supabase
                .from('products')
                .insert({
                    shop_id: data.shop_id,
                    name: data.name,
                    price: data.price,
                    stock: data.stock || 0,
                    category: data.category || 'General',
                    image: data.image || ''
                })
                .select();

            if (error) return sendJSON(res, { error: error.message }, 400);
            sendJSON(res, newProduct[0]);
        });
    }

    // ============================================================
    // 3. CUSTOMER ROUTES
    // ============================================================
    if (req.method === 'GET' && url === '/api/products') {
        const { data: products, error } = await supabase
            .from('products')
            .select('*');
        
        if (error) return sendJSON(res, { error: error.message }, 500);
        return sendJSON(res, products || []);
    }

    if (req.method === 'GET' && url === '/api/products/search') {
        const q = new URL(req.url, `http://${req.headers.host}`).searchParams.get('q') || '';
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .ilike('name', `%${q}%`);
        
        if (error) return sendJSON(res, { error: error.message }, 500);
        return sendJSON(res, products || []);
    }

    // ============================================================
    // 4. ORDERS (WITH STOCK DEDUCTION)
    // ============================================================
    if (req.method === 'POST' && url === '/api/orders') {
        return parseBody(req, async (data) => {
            let shop_id = null;

            // 1. Reduce stock for each item
            for (const item of data.items) {
                const { data: product } = await supabase
                    .from('products')
                    .select('stock, shop_id')
                    .eq('id', item.product_id)
                    .single();

                if (product) {
                    shop_id = product.shop_id;
                    const newStock = Math.max(0, product.stock - (item.quantity || 1));
                    await supabase
                        .from('products')
                        .update({ stock: newStock })
                        .eq('id', item.product_id);
                }
            }

            // 2. Create the order
            const { data: newOrder, error } = await supabase
                .from('orders')
                .insert({
                    order_id: 'ALL-' + Date.now().toString(36).toUpperCase(),
                    user_id: data.user_id,
                    shop_id: shop_id,
                    total: data.total,
                    status: 'pending'
                })
                .select();

            if (error) return sendJSON(res, { error: error.message }, 400);

            sendJSON(res, { 
                order_id: newOrder[0].order_id, 
                id: newOrder[0].id, 
                status: 'pending', 
                message: 'Order placed successfully!' 
            });
        });
    }

    if (req.method === 'GET' && url.startsWith('/api/orders/user/')) {
        const userId = parseInt(url.split('/').pop());
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId);
        
        if (error) return sendJSON(res, { error: error.message }, 500);
        return sendJSON(res, orders || []);
    }

    // ============================================================
    // 5. ADMIN: USER MANAGEMENT
    // ============================================================
    if (req.method === 'GET' && url === '/api/admin/users') {
        const { data: users, error } = await supabase
            .from('users')
            .select('*');
        
        if (error) return sendJSON(res, { error: error.message }, 500);
        return sendJSON(res, users || []);
    }

    if (req.method === 'PUT' && url.startsWith('/api/admin/toggle-user/')) {
        const userId = parseInt(url.split('/').pop());
        const { data: user, error } = await supabase
            .from('users')
            .update({ verified: false })
            .eq('id', userId)
            .select();
        
        if (error) return sendJSON(res, { error: error.message }, 500);
        return sendJSON(res, { message: 'User status toggled', user: user[0] });
    }

    // ============================================================
    // 6. ADMIN: SHOP MANAGEMENT
    // ============================================================
    if (req.method === 'GET' && url === '/api/shops/all') {
        const { data: shops, error } = await supabase
            .from('shops')
            .select('*');
        
        if (error) return sendJSON(res, { error: error.message }, 500);
        return sendJSON(res, shops || []);
    }

    if (req.method === 'PUT' && url.startsWith('/api/admin/approve-shop/')) {
        const shopId = parseInt(url.split('/').pop());
        const { data: shop, error } = await supabase
            .from('shops')
            .update({ approved: true })
            .eq('id', shopId)
            .select();
        
        if (error) return sendJSON(res, { error: error.message }, 500);
        return sendJSON(res, { message: 'Shop approved successfully!', shop: shop[0] });
    }

    // ============================================================
    // 7. SERVE STATIC FILES
    // ============================================================
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
    console.log(`✅ AllTownz Marketplace (Supabase) running on port ${PORT}`);
});