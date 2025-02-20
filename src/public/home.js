import { gql } from '@apollo/client';
import client from '../utils/apolloClient.js';
import { createProfileHeader } from '../utils/graphs.js'; // Import the function
import { checkAuth } from '/src/public/logout.js';
import { getUserInfo } from '/src/utils/graphql.js';

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

// Function to hide loading overlay
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Function to show loading overlay
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

async function initializePage() {
    try {
        showLoading();
        // Check authentication
        if (!checkAuth()) {
            return;
        }

        // Fetch user data
        const userData = await getUserInfo(client);
        if (userData) {
            // Update profile section
            document.getElementById('userName').textContent = userData.login || 'N/A';
            document.getElementById('userEmail').textContent = userData.email || 'N/A';
            document.getElementById('userLevel').textContent = userData.level || 'N/A';
            document.getElementById('userXP').textContent = `${Math.round((userData.totalXP || 0) / 1000)}K`;
            document.getElementById('auditRatio').textContent = userData.auditRatio?.toFixed(2) || 'N/A';
            
            // Set profile image
            const profileImage = document.getElementById('profileImage');
            if (profileImage) {
                profileImage.src = userData.image || '/assets/default-avatar.png';
            }
        }
    } catch (error) {
        console.error('Error initializing page:', error);
    } finally {
        hideLoading();
    }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);
