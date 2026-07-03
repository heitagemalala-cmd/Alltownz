// Payment processing functions

// Mobile Money (MTN/Airtel Uganda)
async function payWithMobileMoney(phone, amount, provider) {
    // Use Flutterwave or Paystack APIs
    const payload = {
        tx_ref: 'ALL-'+Date.now(),
        amount: amount,
        currency: 'UGX',
        payment_type: 'mobile_money',
        customer: {
            phone_number: phone,
            email: 'customer@email.com'
        }
    };
    
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            const success = Math.random() > 0.1; // 90% success rate
            if(success) {
                resolve({
                    status: 'success',
                    transaction_id: 'TRX-'+Math.random().toString(36).substr(2, 9)
                });
            } else {
                resolve({
                    status: 'failed',
                    message: 'Insufficient balance'
                });
            }
        }, 2000);
    });
}

// Card payment (Stripe)
async function payWithCard(cardDetails) {
    // In production, use Stripe.js
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                status: 'success',
                card_last4: '4242',
                transaction_id: 'CARD-'+Math.random().toString(36).substr(2, 9)
            });
        }, 1500);
    });
}

// PayPal payment
async function payWithPayPal(email, amount) {
    // Redirect to PayPal
    window.location.href = `https://www.paypal.com/checkout?amount=${amount}&currency=UGX`;
    return { status: 'redirect' };
}

// Bank transfer
function generateBankReference() {
    return 'BANK-'+Date.now().toString(36).toUpperCase();
}

// Process payment (unified handler)
async function processPayment(method, details, amount) {
    let result;
    switch(method) {
        case 'mtn':
        case 'airtel':
            result = await payWithMobileMoney(details.phone, amount, method);
            break;
        case 'card':
            result = await payWithCard(details.card);
            break;
        case 'paypal':
            result = await payWithPayPal(details.email, amount);
            break;
        case 'bank':
            result = { reference: generateBankReference(), status: 'pending' };
            break;
        default:
            result = { status: 'failed', message: 'Invalid payment method' };
    }
    
    // Store transaction
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions.push({
        id: Date.now(),
        method,
        amount,
        status: result.status,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    return result;
}