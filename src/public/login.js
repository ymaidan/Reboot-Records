document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    try {
        // Clear previous error messages
        errorMessage.textContent = '';
        
        // Basic validation
        if (!username || !password) {
            throw new Error('Please fill in all fields');
        }

        // Create base64 encoded credentials
        const credentials = btoa(`${username}:${password}`);
        
        // Make signin request
        const response = await fetch('https://learn.reboot01.com/api/auth/signin', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Login response:', response);

        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        // Get JWT token from response
        const data = await response.text();
        console.log('Response data:', data);
        
        if (!data) {
            throw new Error('No token received from the server');
        }
        
        // Store the token without extra quotes
        localStorage.setItem('jwt_token', data.replace(/"/g, ''));
        console.log('Stored JWT Token:', localStorage.getItem('jwt_token'));
        
        // Use absolute path for redirect in production environments
        if (window.location.hostname.includes('vercel.app')) {
            window.location.href = '/views/home.html';
        } else {
            window.location.href = '/views/home.html';
        }
        
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = error.message;
    }
}); 