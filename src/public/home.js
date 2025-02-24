import { gql } from '@apollo/client';
import client from '../utils/apolloClient.js';
import { createProfileHeader } from '../utils/graphs.js'; // Import the function
import { checkAuth as validateAuth } from '/src/public/logout.js';

// Check if user is authenticated
function handleAuth() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = '/index.html';
    }
}

// Fetch user data using Apollo Client
async function fetchUserData() {
    const USER_DATA_QUERY = gql`
        query getUserInfo {
            user(limit: 1) {
                id
                firstName
                lastName
                email
                auditRatio
                events {
                    level
                    event {
                        path
                    }
                }
                labels {
                    labelName
                }
                public {
                    campus
                }
                transactions_aggregate(
                    where: {
                        event: { path: { _eq: "/bahrain/bh-module" } }
                        type: { _eq: "xp" }
                    }
                ) {
                    aggregate {
                        sum {
                            amount
                        }
                    }
                }
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

        const user = data.user[0];
        const userData = {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            auditRatio: user.auditRatio,
            campus: user.public.campus,
            level: user.events[0]?.level || 'N/A',
            xp: user.transactions_aggregate.aggregate.sum.amount || 0,
            rank: user.labels.map(label => label.labelName).join(', ') || 'N/A',
            latestProject: user.events[0]?.event.path.split('/').pop() || 'N/A'
        };

        updateProfileHeader(userData);
        
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

// Update the profile header with user data
function updateProfileHeader(userData) {
    document.getElementById('namePlc').textContent = userData.name || 'N/A';
    document.getElementById('emailPlc').textContent = userData.email || 'N/A';
    document.getElementById('auditRatioPlc').textContent = userData.auditRatio?.toFixed(2) || 'N/A';
    document.getElementById('campusPlc').textContent = userData.campus || 'N/A';
    document.getElementById('levelPlc').textContent = userData.level || 'N/A';
    document.getElementById('xpPlc').textContent = userData.xp || 'N/A';
    document.getElementById('rankPlc').textContent = userData.rank || 'N/A';
    document.getElementById('latestProjPlc').textContent = userData.latestProject || 'N/A';
}


// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    handleAuth();
    fetchUserData();
});
