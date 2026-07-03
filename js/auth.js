// Authentication functions

// Login form handler
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const identifier = document.getElementById('identifier').value;
    const password = document.getElementById('password').value;
    
    if(!identifier || !password) {
        return alert('Please enter email/phone and password');
    }
    
    // Simulate API call
    if(identifier.includes('@') && password.length >= 6) {
        localStorage.setItem('token', 'demo-jwt-token-123');
        localStorage.setItem('user', JSON.stringify({email: identifier, name: 'User'}));
        alert('✅ Login successful!');
        window.location.href = '/';
    } else {
        alert('❌ Invalid credentials. Try demo@email.com / password123');
    }
});

// OTP Login
function sendOTP() {
    const phone = prompt('Enter your MTN/Airtel phone number (e.g., 07XXXXXXXX):');
    if(phone && phone.length === 10) {
        alert(`📱 OTP sent to ${phone}! (Demo: 123456)`);
        const otp = prompt('Enter the OTP received:');
        if(otp === '123456') {
            localStorage.setItem('token', 'otp-token-456');
            localStorage.setItem('user', JSON.stringify({phone, name: 'Mobile User'}));
            alert('✅ Verified! Redirecting...');
            window.location.href = '/';
        } else {
            alert('❌ Invalid OTP. Try again.');
        }
    }
}

// Google Login (simulated)
function googleLogin() {
    alert('🔴 Google login redirect... (Demo)');
    localStorage.setItem('token', 'google-token-789');
    localStorage.setItem('user', JSON.stringify({email: 'user@gmail.com', name: 'Google User'}));
    window.location.href = '/';
}

// Apple Login (simulated)
function appleLogin() {
    alert('🍎 Apple login redirect... (Demo)');
    localStorage.setItem('token', 'apple-token-101');
    localStorage.setItem('user', JSON.stringify({email: 'user@icloud.com', name: 'Apple User'}));
    window.location.href = '/';
}

// Check if logged in
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Redirect if not logged in (add to pages that need auth)
if(!isLoggedIn() && window.location.pathname.includes('seller.html')) {
    alert('Please login to access seller dashboard');
    window.location.href = '/login.html';
}