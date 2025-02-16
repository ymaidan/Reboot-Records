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

        // Here we'll add the actual authentication logic later
        console.log('Login attempted with:', { username, password });
        
    } catch (error) {
        errorMessage.textContent = error.message;
    }
}); 