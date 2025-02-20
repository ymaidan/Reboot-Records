// Function to check if user is authenticated
export function checkAuth() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = '/views/index.html';
        return false;
    }
    return true;
}

// Function to handle logout
export function logout(event) {
    // Prevent form default submission if event exists
    if (event) {
        event.preventDefault();
    }
    
    try {
        // Clear the JWT token
        localStorage.removeItem('jwt_token');
        
        // Clear any other stored data if needed
        localStorage.clear();
        
        // Redirect to login page
        window.location.href = '/views/index.html';
    } catch (error) {
        console.error('Error during logout:', error);
    }
}

// Add event listener to logout form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const logoutForm = document.getElementById('logoutForm');
    if (logoutForm) {
        logoutForm.addEventListener('submit', logout);
    }
});

// Export for use in window object if needed
window.logout = logout;
window.checkAuth = checkAuth;