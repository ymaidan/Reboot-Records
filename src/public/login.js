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

        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        // Get JWT token from response
        const data = await response.json();
        
        // Store JWT in localStorage
        localStorage.setItem('jwt_token', data.token);
        
        // Redirect to profile or dashboard page
        window.location.href = '/views/home.html';
        
    } catch (error) {
        errorMessage.textContent = error.message;
    }
}); 