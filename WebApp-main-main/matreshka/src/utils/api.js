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

    // ==============================
    // STAFF SPECIFIC METHODS
    // ==============================

    static async getStaffBookings(restaurantId, status = 'all') {
        return this.makeRequest(`/staff/bookings?restaurant_id=${restaurantId}&status=${status}`);
    }

    static async getStaffOrders(restaurantId, status = 'all') {
        return this.makeRequest(`/staff/orders?restaurant_id=${restaurantId}&status=${status}`);
    }

    static async updateBookingStatus(bookingId, status) {
        return this.makeRequest(`/bookings/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    static async updateOrderStatus(orderId, status, courierId = null) {
        return this.makeRequest(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, courier_id: courierId })
        });
    }

    // ==============================
    // BOOKING METHODS
    // ==============================

    static async getBookings() {
        return this.makeRequest('/bookings');
    }

    static async getUserBookings(userId) {
        return this.makeRequest(`/bookings/user/${userId}`);
    }

    static async createBooking(bookingData) {
    return this.makeRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
    });
}

    // ==============================
    // ORDER METHODS
    // ==============================

    static async getOrders() {
        return this.makeRequest('/orders');
    }

    static async getUserOrders(userId) {
        return this.makeRequest(`/orders/user/${userId}`);
    }

    static async getOrderById(orderId) {
        return this.makeRequest(`/orders/${orderId}`);
    }

    static async getOrderItems(orderId) {
        return this.makeRequest(`/orders/${orderId}/items`);
    }

    static async createOrder(orderData) {
        return this.makeRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    // Courier methods
static async getCourierOrders(courierId) {
    return this.makeRequest(`/orders/courier/${courierId}`);
}

static async getAvailableOrdersForCourier() {
    return this.makeRequest('/orders/available');
}

static async getCourierStats(courierId) {
    return this.makeRequest(`/courier/${courierId}/stats`);
}

static async updateOrderCourierStatus(orderId, status, courierId) {
    return this.makeRequest(`/orders/${orderId}/courier-status`, {
        method: 'PUT',
        body: JSON.stringify({ status, courier_id: courierId })
    });
}

// ==============================
// EVENTS MANAGEMENT METHODS
// ==============================

static async getEvents(type = 'all', active = true) {
    const url = `/events?type=${type}&active=${active}`;
    return this.makeRequest(url);
}

static async getEventById(id) {
    return this.makeRequest(`/events/${id}`);
}

static async createEvent(eventData) {
    return this.makeRequest('/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
    });
}

static async updateEvent(id, eventData) {
    return this.makeRequest(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(eventData)
    });
}

static async deleteEvent(id) {
    return this.makeRequest(`/events/${id}`, {
        method: 'DELETE'
    });
}

// Event registrations
static async getEventRegistrations(eventId) {
    return this.makeRequest(`/events/${eventId}/registrations`);
}

static async registerForEvent(eventId, registrationData) {
    return this.makeRequest(`/events/${eventId}/register`, {
        method: 'POST',
        body: JSON.stringify(registrationData)
    });
}

static async getUserRegistrations(userId) {
    return this.makeRequest(`/user/${userId}/registrations`);
}

static async updateRegistrationStatus(registrationId, status, eventId) {
    return this.makeRequest(`/registrations/${registrationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, event_id: eventId })
    });
}

    // ==============================
    // AUTH METHODS
    // ==============================

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

    // ==============================
    // USER MANAGEMENT
    // ==============================

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

    // ==============================
    // RESTAURANT METHODS
    // ==============================

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

    // ==============================
    // MENU MANAGEMENT
    // ==============================

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

    // ==============================
    // REVIEWS
    // ==============================

    static async getReviews() {
        return this.makeRequest('/reviews');
    }

    static async getUserReviews(userId) {
        return this.makeRequest(`/reviews/user/${userId}`);
    }

    // ==============================
    // ANALYTICS
    // ==============================

    static async getAnalyticsData() {
        return this.makeRequest('/analytics');
    }

    // ==============================
    // TEST & HEALTH
    // ==============================

    static async testConnection() {
        return this.makeRequest('/test');
    }

    static async healthCheck() {
        return this.makeRequest('/health');
    }

    // ==============================
    // HELPER METHODS
    // ==============================

    static async getRestaurantIdByName(restaurantName) {
        try {
            const restaurants = await this.getAllRestaurants();
            const restaurant = restaurants.find(r => r.name === restaurantName);
            return restaurant ? restaurant.id : null;
        } catch (error) {
            console.error('Error getting restaurant ID:', error);
            return null;
        }
    }

    static async getRestaurantBookings(restaurantId) {
        try {
            const allBookings = await this.getBookings();
            return allBookings.filter(booking => 
                booking.restaurant_id === restaurantId || 
                booking.restaurant_id === parseInt(restaurantId)
            );
        } catch (error) {
            console.error('Error getting restaurant bookings:', error);
            return [];
        }
    }

    static async getRestaurantOrders(restaurantId) {
        try {
            const allOrders = await this.getOrders();
            return allOrders.filter(order => 
                order.restaurant_id === restaurantId || 
                order.restaurant_id === parseInt(restaurantId)
            );
        } catch (error) {
            console.error('Error getting restaurant orders:', error);
            return [];
        }
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

            const restaurants = await ApiService.getRestaurants();
            console.log('✅ Restaurants:', restaurants);

            const bookings = await ApiService.getBookings();
            console.log('✅ Bookings:', bookings);

            const orders = await ApiService.getOrders();
            console.log('✅ Orders:', orders);

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

    window.testStaffAPI = async function () {
        try {
            console.log('🧪 Testing Staff API...');
            
            // Найдем ID ресторана для теста
            const restaurants = await ApiService.getAllRestaurants();
            const restaurant = restaurants[0];
            
            if (restaurant) {
                const staffBookings = await ApiService.getStaffBookings(restaurant.id);
                console.log('✅ Staff bookings:', staffBookings);
                
                const staffOrders = await ApiService.getStaffOrders(restaurant.id);
                console.log('✅ Staff orders:', staffOrders);
            }
        } catch (error) {
            console.error('❌ Staff API test failed:', error);
        }
    };
}

export default ApiService;