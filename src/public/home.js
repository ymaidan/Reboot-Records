// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = '/index.html';
    }
}

// Fetch user data using GraphQL
async function fetchUserData() {
    try {
        const query = `
            query {
                user {
                    id
                    login
                    firstName
                    lastName
                    email
                    auditRatio
                }
            }
        `;

        const response = await graphqlRequest(query);
        const userData = response.data.user;

        // Update UI with user data
        document.getElementById('username').textContent = userData.firstName || userData.login;
        
        const userInfo = document.getElementById('userInfo');
        userInfo.innerHTML = `
            <p><strong>Username:</strong> ${userData.login}</p>
            <p><strong>Full Name:</strong> ${userData.firstName} ${userData.lastName}</p>
            <p><strong>Email:</strong> ${userData.email}</p>
            <p><strong>Audit Ratio:</strong> ${userData.auditRatio.toFixed(2)}</p>
        `;
    } catch (error) {
        console.error('Error fetching user data:', error);
        // Handle error appropriately
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    fetchUserData();
}); 