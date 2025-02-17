function logout() {
    localStorage.removeItem('jwt_token');
    window.location.href = '/views/index.html';
}

// Export for use in other files if needed
window.logout = logout;