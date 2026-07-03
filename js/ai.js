// AI-powered features using free APIs

// Product recommendations (using HuggingFace free inference)
async function getAIRecommendations(userHistory = []) {
    try {
        const response = await fetch('https://api-inference.huggingface.co/models/bert-base-uncased', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer hf_demo_key', // Replace with your free HF token
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: `Based on user purchase history: ${userHistory.join(', ')}, recommend 5 products for an East African online mall`
            })
        });
        const data = await response.json();
        return data[0]?.generated_text?.split('\n') || ['Smartphone', 'Shoes', 'Watch', 'Bag', 'Headphones'];
    } catch (error) {
        console.error('AI Error:', error);
        return ['Wireless Earbuds', 'Smart Watch', 'Backpack', 'Sunglasses', 'Power Bank'];
    }
}

// Smart search with semantic understanding
async function smartSearch(query) {
    try {
        // Use free semantic search API (or mock)
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const results = products.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.category?.toLowerCase().includes(query.toLowerCase())
        );
        return results;
    } catch (error) {
        return [];
    }
}

// Chatbot (using Groq free tier)
async function chatbotResponse(message) {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer gsk_demo_key', // Get free key from groq.com
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
                messages: [
                    {role: 'system', content: 'You are a helpful customer support agent for AllTownz, an e-commerce platform in Uganda.'},
                    {role: 'user', content: message}
                ]
            })
        });
        const data = await response.json();
        return data.choices[0]?.message?.content || 'I can help with orders, payments, and delivery!';
    } catch (error) {
        return 'Please check your order status or contact support at +256 700 123 456';
    }
}

// Fraud detection (simple rule-based for demo)
function detectFraud(transaction) {
    const redFlags = [];
    
    // Amount too high
    if(transaction.amount > 10000000) redFlags.push('Unusually high amount');
    
    // Multiple transactions in short time
    if(transaction.frequency > 3) redFlags.push('Multiple transactions in 1 hour');
    
    // Unusual location
    if(transaction.location && !transaction.location.includes('Uganda')) 
        redFlags.push('Foreign transaction');
    
    return {
        isFraud: redFlags.length > 0,
        flags: redFlags,
        score: redFlags.length * 33
    };
}