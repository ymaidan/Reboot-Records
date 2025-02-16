import { API_ENDPOINTS } from './constants.js';

export async function graphqlRequest(query, variables = {}) {
    const token = localStorage.getItem('jwt_token');
    
    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(API_ENDPOINTS.GRAPHQL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            query,
            variables
        })
    });

    if (!response.ok) {
        throw new Error('GraphQL request failed');
    }

    return response.json();
}

export function getUserIdFromToken() {
    const token = localStorage.getItem('jwt_token');
    if (!token) return null;
    
    try {
        // JWT is in format header.payload.signature
        const payload = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        return decodedPayload.user_id;
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
}