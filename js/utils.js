// Utility functions for AllTownz

// Format currency (UGX)
function formatCurrency(amount) {
    return `UGX ${Number(amount).toLocaleString()}`;
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-UG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Validate phone number (Uganda)
function validatePhone(phone) {
    // MTN/Airtel: 07XXXXXXXX or 07X XXXXXXX
    return /^07[0-9]{8}$/.test(phone);
}

// Validate email
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Generate unique order ID
function generateOrderId() {
    const prefix = 'ALL';
    const date = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}-${date}-${random}`;
}

// Debounce function (for search)
function debounce(func, wait = 300) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Toast notification
function showToast(message, type = 'success') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500'
    };
    
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Local storage helpers
const storage = {
    get: (key) => JSON.parse(localStorage.getItem(key)),
    set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    remove: (key) => localStorage.removeItem(key),
    clear: () => localStorage.clear()
};

// Export utilities
if (typeof module !== 'undefined') {
    module.exports = {
        formatCurrency,
        formatDate,
        validatePhone,
        validateEmail,
        generateOrderId,
        debounce,
        showToast,
        storage
    };
}