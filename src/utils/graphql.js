import { API_ENDPOINTS } from './constants.js';

export async function graphqlRequest(query, variables = {}) {
    const token = localStorage.getItem('jwt_token');
    
    if (!token) {
        throw new Error('Not authenticated');
    }

    try {
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
            throw new Error('GraphQL request failed: ' + response.statusText);
        }

        const data = await response.json();
        
        if (data.errors) {
            throw new Error(data.errors[0].message);
        }

        return data;
    } catch (error) {
        console.error('GraphQL Request Error:', error);
        throw error;
    }
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

export async function getUserInfo() {
    const query = `
        query {
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
    
    return graphqlRequest(query);
}