import ApiService from './api';

export const testConnection = async () => {
    try {
        console.log('Testing connection to backend...');
        
        // Test basic connection
        const health = await ApiService.healthCheck();
        console.log('Health check:', health);
        
        // Test API endpoint
        const test = await ApiService.testConnection();
        console.log('Test endpoint:', test);
        
        // Test restaurants endpoint
        const restaurants = await ApiService.getRestaurants();
        console.log('Restaurants:', restaurants);
        
        return { success: true, health, test, restaurants };
    } catch (error) {
        console.error('Connection test failed:', error);
        return { success: false, error: error.message };
    }
};

export const testAuth = async () => {
    try {
        console.log('Testing authentication...');
        
        // Test login with test user
        const user = await ApiService.login({
            email: 'user@test.com',
            password: 'user123'
        });
        
        console.log('Login successful:', user);
        return { success: true, user };
    } catch (error) {
        console.error('Auth test failed:', error);
        return { success: false, error: error.message };
    }
};