import { gql } from '@apollo/client';
import client from '../utils/apolloClient.js';
import { createProfileHeader } from '../utils/graphs.js'; // Import the function
import { checkAuth as validateAuth } from '/src/public/logout.js';

// Check if user is authenticated
function handleAuth() {
    const token = localStorage.getItem('jwt_token');
    console.log('JWT Token:', token); // Log the token to check its format
    if (!token) {
        window.location.href = '/index.html';
    }
}

// Fetch user data using Apollo Client
async function fetchUserData() {
    const token = localStorage.getItem('jwt_token');
    console.log('JWT Token:', token); // Log the token to check its format

    // Check if the token is valid (not null or empty)
    if (!token || token.startsWith('"') || token.endsWith('"')) {
        console.error('Invalid JWT token found. User is not authenticated.');
        return; // Exit if no valid token is found
    }

    const USER_DATA_QUERY = gql`
query getUserInfo {
		user(limit: 1) {
			id
			firstName
			lastName
			email
			auditRatio
			attrs
			events {
				level
				event {
					id
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
            context: {
                headers: {
                    Authorization: `Bearer ${token}`, // Ensure the token is sent correctly
                },
            },
        });

        console.log('User data received:', data); // Log the received data

        // Check if user data is present
        if (!data || !data.user || !data.user.length) {
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
            cohort: user.labels.find(label => label.labelName.startsWith('Cohort'))?.labelName || 'N/A',
            latestProject: user.events[0]?.event.path.split('/').pop() || 'N/A',
            imageId: user.attrs["pro-picUploadId"]
        };

        updateProfileHeader(userData);
        
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

// Update the profile header with user data
function updateProfileHeader(userData) {
    // Ensure userData is valid before updating the UI
    if (!userData) {
        console.error('No user data available to update the profile header.');
        return;
    }
    
    document.getElementById('namePlc').textContent = userData.name || 'N/A';
    document.getElementById('emailPlc').textContent = userData.email || 'N/A';
    document.getElementById('auditRatioPlc').textContent = userData.auditRatio?.toFixed(2) || 'N/A';
    document.getElementById('campusPlc').textContent = userData.campus || 'N/A';
    document.getElementById('levelPlc').textContent = userData.level || 'N/A';
    document.getElementById('xpPlc').textContent = userData.xp || 'N/A';
    document.getElementById('cohortPlc').textContent = userData.cohort || 'N/A';
    document.getElementById('rankPlc').textContent = 'N/A'; // Set rank to N/A if not used
    document.getElementById('latestProjPlc').textContent = userData.latestProject || 'N/A';

    const imgContainer = document.getElementById('imgContainer');
    if (imgContainer) {
        imgContainer.innerHTML = ''; // Clear any existing content
        if (userData.imageId) {
            const img = document.createElement("img");
            img.src = `https://learn.reboot01.com/api/storage?token=${localStorage.getItem("jwt_token")}&fileId=${userData.imageId}`;
            img.alt = "Personal Image";
            img.style.width = '100%'; // Ensure the image fits the container
            img.style.borderRadius = '50%'; // Make the image circular
            imgContainer.appendChild(img);
        } else {
            console.error('Image ID missing.');
        }
    } else {
        console.error('Image container not found.');
    }
}


// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    handleAuth();
    fetchUserData();
});
