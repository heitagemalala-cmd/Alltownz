// Cart management functions

// Get cart from localStorage
function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

// Add item to cart
function addToCart(item) {
    const cart = getCart();
    cart.push(item);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    return cart;
}

// Remove item from cart
function removeFromCart(index) {
    const cart = getCart();
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    return cart;
}

// Clear cart
function clearCart() {
    localStorage.removeItem('cart');
    updateCartCount();
}

// Get cart total
function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => {
        const price = parseInt(item.price.replace(/,/g, ''));
        return total + price;
    }, 0);
}

// Update cart count badge
function updateCartCount() {
    const cart = getCart();
    const badges = document.querySelectorAll('[x-model="cartCount"]');
    badges.forEach(el => {
        if(el.__x) el.__x.$data.cartCount = cart.length;
    });
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', updateCartCount);