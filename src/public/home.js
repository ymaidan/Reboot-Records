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
            {
                user {
                    id
                    login
                    email
                    campus
                    cohort
                    level
                    auditRatio
                    totalUp
                    totalDown
                }
                
                # Get XP transactions
                transaction(where: {type: {_eq: "xp"}}, order_by: {createdAt: asc}) {
                    amount
                    createdAt
                    path
                }
                
                # Get latest project
                progress(order_by: {createdAt: desc}, limit: 1) {
                    path
                    grade
                }
            }
        `;

        const response = await graphqlRequest(query);
        console.log('GraphQL Response:', response); // Debug log
        
        if (!response.data || !response.data.user || !response.data.user[0]) {
            throw new Error('No user data received');
        }

        const userData = {
            ...response.data.user[0],
            totalXP: calculateTotalXP(response.data.transaction),
            latestProject: getLatestProject(response.data.progress),
            auditRatio: calculateAuditRatio(response.data.user[0])
        };

        console.log('Processed User Data:', userData); // Debug log
        createProfileHeader(userData);
        
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

// Helper functions
function calculateTotalXP(transactions) {
    return transactions.reduce((total, t) => total + t.amount, 0);
}

function getLatestProject(progress) {
    if (!progress || !progress[0]) return 'N/A';
    return progress[0].path.split('/').pop();
}

function calculateAuditRatio(user) {
    if (!user.totalUp || !user.totalDown) return 0;
    return user.totalUp / user.totalDown;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    fetchUserData();
}); 
