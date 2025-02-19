import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { API_ENDPOINTS } from './constants.js';

// Create an HTTP link to the GraphQL endpoint
const httpLink = createHttpLink({
    uri: API_ENDPOINTS.GRAPHQL,
});

// Set up authentication context
const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('jwt_token');
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : "",
        }
    };
});

// Initialize Apollo Client
const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
});

export default client; 