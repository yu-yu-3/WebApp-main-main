const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
    static async makeRequest(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            ...options
        };

        try {
            console.log(`🔷 API Call: ${options.method || 'GET'} ${url}`);
            const response = await fetch(url, config);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log(`✅ Success:`, data);
            return data;

        } catch (error) {
            console.error(`❌ API Error: ${error.message}`);
            throw new Error(`Network error: ${error.message}`);
        }
    }

    static async getOrders() {
        try {
            const response = await fetch('/api/orders');
            return await response.json();
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    }

    static async updateOrderStatus(orderId, status, courierId = null) {
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status, courier_id: courierId })
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    }

    // Test methods
    static async testConnection() {
        return this.makeRequest('/test');
    }

    static async healthCheck() {
        return this.makeRequest('/health');
    }

    // Auth methods
    static async login(credentials) {
        return this.makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    static async register(userData) {
        return this.makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // User Management methods
    static async getUsers() {
        return this.makeRequest('/users');
    }

    static async getUserById(userId) {
        return this.makeRequest(`/users/${userId}`);
    }

    static async createUser(userData) {
        return this.makeRequest('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    static async updateUser(userId, userData) {
        return this.makeRequest(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    static async updateUserRole(userId, newRole) {
        return this.makeRequest(`/users/${userId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role: newRole })
        });
    }

    static async deleteUser(userId) {
        return this.makeRequest(`/users/${userId}`, {
            method: 'DELETE'
        });
    }

    // Restaurant methods
    static async getRestaurants() {
        return this.makeRequest('/restaurants');
    }

    static async getAllRestaurants() {
        return this.makeRequest('/restaurants/all');
    }

    static async getRestaurantById(id) {
        return this.makeRequest(`/restaurants/${id}`);
    }

    // Menu methods
    static async getMenu() {
        return this.makeRequest('/menu');
    }

    static async getAllMenuItems() {
        return this.makeRequest('/menu/all');
    }

    static async getMenuItemById(id) {
        return this.makeRequest(`/menu/${id}`);
    }

    static async createMenuItem(menuItemData) {
        return this.makeRequest('/menu', {
            method: 'POST',
            body: JSON.stringify(menuItemData)
        });
    }

    static async updateMenuItem(id, menuItemData) {
        return this.makeRequest(`/menu/${id}`, {
            method: 'PUT',
            body: JSON.stringify(menuItemData)
        });
    }

    static async deleteMenuItem(id) {
        return this.makeRequest(`/menu/${id}`, {
            method: 'DELETE'
        });
    }

    static async getRestaurants() {
        return this.makeRequest('/restaurants');
    }

    static async getAllRestaurants() {
        return this.makeRequest('/restaurants/all');
    }

    static async getRestaurantById(id) {
        return this.makeRequest(`/restaurants/${id}`);
    }

    static async createRestaurant(restaurantData) {
        return this.makeRequest('/restaurants', {
            method: 'POST',
            body: JSON.stringify(restaurantData)
        });
    }

    static async updateRestaurant(id, restaurantData) {
        return this.makeRequest(`/restaurants/${id}`, {
            method: 'PUT',
            body: JSON.stringify(restaurantData)
        });
    }

    static async deleteRestaurant(id) {
        return this.makeRequest(`/restaurants/${id}`, {
            method: 'DELETE'
        });
    }

    // Menu Management methods
    static async getMenu() {
        return this.makeRequest('/menu');
    }

    static async getAllMenuItems() {
        return this.makeRequest('/menu/all');
    }

    static async getMenuItemById(id) {
        return this.makeRequest(`/menu/${id}`);
    }

    static async createMenuItem(menuItemData) {
        return this.makeRequest('/menu', {
            method: 'POST',
            body: JSON.stringify(menuItemData)
        });
    }

    static async updateMenuItem(id, menuItemData) {
        return this.makeRequest(`/menu/${id}`, {
            method: 'PUT',
            body: JSON.stringify(menuItemData)
        });
    }

    static async deleteMenuItem(id) {
        return this.makeRequest(`/menu/${id}`, {
            method: 'DELETE'
        });
    }

}

// Глобальная функция для тестирования из консоли браузера
if (typeof window !== 'undefined') {
    window.testAPI = async function () {
        try {
            console.log('🧪 Testing API connection...');

            const test = await ApiService.testConnection();
            console.log('✅ Test connection:', test);

            const health = await ApiService.healthCheck();
            console.log('✅ Health check:', health);

            const users = await ApiService.getUsers();
            console.log('✅ Users:', users);

        } catch (error) {
            console.error('❌ Test failed:', error);
        }
    };

    window.testCreateUser = async function () {
        try {
            const userData = {
                name: 'Тестовый Пользователь API',
                email: 'testapi@example.com',
                password: 'test123',
                role: 'user',
                phone: '+7 (999) 999-99-99'
            };

            const result = await ApiService.createUser(userData);
            console.log('✅ Create user test:', result);
            return result;
        } catch (error) {
            console.error('❌ Create user test failed:', error);
        }
    };
}

export default ApiService;