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

        // Log the response
        console.log('Login response:', response); // Log the response

        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        // Get JWT token from response
        const data = await response.text(); // Use text() instead of json()
        console.log('Response data:', data); // Log the response data
        if (!data) {
            throw new Error('No token received from the server');
        }
        
        // Store the token without extra quotes
        localStorage.setItem('jwt_token', data.replace(/"/g, '')); // Remove any extra quotes
        console.log('Stored JWT Token:', localStorage.getItem('jwt_token')); // Log the stored token
        
        // Redirect to profile or dashboard page
        window.location.href = '/views/home.html';
        
    } catch (error) {
        errorMessage.textContent = error.message;
    }
}); 