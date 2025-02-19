import { gql } from '@apollo/client';
import client from '../utils/apolloClient.js';
import { createProfileHeader } from '../utils/graphs.js'; // Import the function

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = '/index.html';
    }
}

// Fetch user data using Apollo Client
async function fetchUserData() {
    const USER_DATA_QUERY = gql`
        query GetUserData {
            user {
                id
                login
                email
                campus
                auditRatio
                totalUp
                totalDown
            }
            transaction(where: {type: {_eq: "xp"}}, order_by: {createdAt: asc}) {
                amount
                createdAt
                path
            }
            progress(order_by: {createdAt: desc}, limit: 1) {
                path
                grade
            }
        }
    `;

    try {
        const { data } = await client.query({
            query: USER_DATA_QUERY,
        });

        if (!data || !data.user || !data.user[0]) {
            throw new Error('No user data received');
        }

        const userData = {
            ...data.user[0],
            totalXP: calculateTotalXP(data.transaction),
            latestProject: getLatestProject(data.progress),
            auditRatio: calculateAuditRatio(data.user[0])
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
