const sqlite3 = require('sqlite3').verbose();

class Database {
    constructor() {
        this.db = new sqlite3.Database('./database.db', (err) => {
            if (err) {
                console.error('Error opening database:', err);
            } else {
                console.log('Connected to SQLite database');
                this.init();
            }
        });
    }

    init() {
        this.db.serialize(() => {
            // Таблица пользователей
            this.db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'user',
                    phone TEXT,
                    restaurant TEXT,
                    position TEXT,
                    vehicle TEXT,
                    delivery_zone TEXT,
                    loyalty_points INTEGER DEFAULT 0,
                    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Таблица ресторанов
            this.db.run(`
                CREATE TABLE IF NOT EXISTS restaurants (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    address TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    email TEXT,
                    opening_hours TEXT,
                    capacity INTEGER,
                    description TEXT,
                    image TEXT,
                    coordinates TEXT,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Таблица категорий меню
            this.db.run(`
                CREATE TABLE IF NOT EXISTS menu_categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    icon TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Таблица блюд
            this.db.run(`
                CREATE TABLE IF NOT EXISTS menu_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    category_id INTEGER,
                    price DECIMAL(10,2) NOT NULL,
                    calories INTEGER,
                    description TEXT,
                    ingredients TEXT,
                    cooking_time INTEGER,
                    is_vegetarian BOOLEAN DEFAULT 0,
                    is_spicy BOOLEAN DEFAULT 0,
                    is_gluten_free BOOLEAN DEFAULT 0,
                    image TEXT,
                    is_available BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (category_id) REFERENCES menu_categories(id)
                )
            `);

            // Таблица бронирований
            this.db.run(`
                CREATE TABLE IF NOT EXISTS bookings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    restaurant_id INTEGER,
                    date TEXT NOT NULL,
                    time TEXT NOT NULL,
                    guests INTEGER NOT NULL,
                    customer_name TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    special_requests TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
                )
            `);

            // Таблица заказов (ОБНОВЛЕНА - добавлены courier_id и completed_at)
            this.db.run(`
                CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    restaurant_id INTEGER,
                    courier_id INTEGER,
                    total DECIMAL(10,2) NOT NULL,
                    status TEXT DEFAULT 'pending',
                    delivery_address TEXT,
                    completed_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
                    FOREIGN KEY (courier_id) REFERENCES users(id)
                )
            `);

            // Таблица элементов заказа
            this.db.run(`
                CREATE TABLE IF NOT EXISTS order_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_id INTEGER,
                    menu_item_id INTEGER,
                    quantity INTEGER NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (order_id) REFERENCES orders(id),
                    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
                )
            `);

            // Таблица отзывов
            this.db.run(`
                CREATE TABLE IF NOT EXISTS reviews (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    restaurant_id INTEGER,
                    rating INTEGER NOT NULL,
                    comment TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    visit_date TEXT,
                    likes INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
                )
            `);

            // Таблица мероприятий
           this.db.run(`
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        time TEXT,
        end_time TEXT,
        location TEXT,
        max_participants INTEGER,
        current_participants INTEGER DEFAULT 0,
        price DECIMAL(10,2) DEFAULT 0,
        type TEXT DEFAULT 'event', -- 'event' или 'promotion'
        promo_code TEXT,
        discount_percent INTEGER DEFAULT 0,
        min_order_amount DECIMAL(10,2) DEFAULT 0,
        image TEXT,
        is_active BOOLEAN DEFAULT 1,
        start_date TEXT,
        end_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Таблица регистраций на мероприятия
this.db.run(`
    CREATE TABLE IF NOT EXISTS event_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        user_id INTEGER,
        user_name TEXT NOT NULL,
        user_email TEXT NOT NULL,
        user_phone TEXT NOT NULL,
        guests INTEGER DEFAULT 1,
        comments TEXT,
        status TEXT DEFAULT 'registered', -- 'registered', 'attended', 'cancelled'
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`);

            // Таблица столиков
            this.db.run(`
    CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id INTEGER,
        table_number TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        is_available BOOLEAN DEFAULT 1,
        location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    )
`);

            console.log('All tables created successfully');
            this.insertSampleData();
        });
    }

    async insertSampleData() {
        // Вставляем тестовые данные
        this.db.serialize(() => {
            // Тестовые пользователи
            const users = [
                ['Администратор Системы', 'admin@matreshka.ru', 'admin123', 'admin', '+7 (999) 123-45-67', null, null, null, null, 0],
                ['Мария Модераторова', 'moderator@matreshka.ru', 'moderator123', 'moderator', '+7 (999) 234-56-78', null, null, null, null, 0],
                ['Иван Сотрудников', 'staff.center@matreshka.ru', 'staff123', 'staff', '+7 (999) 345-67-89', 'Matreshka Центр', 'Менеджер зала', null, null, 0],
                ['Ольга Северова', 'staff.north@matreshka.ru', 'staff123', 'staff', '+7 (999) 456-78-90', 'Matreshka Север', 'Администратор', null, null, 0],
                ['Курьер Доставкин', 'courier@matreshka.ru', 'courier123', 'courier', '+7 (999) 567-89-01', null, null, 'Велосипед', 'Центральный район', 0],
                ['Тестовый Пользователь', 'user@test.com', 'user123', 'user', '+7 (999) 678-90-12', null, null, null, null, 150],
                ['Анна Гостьева', 'anna@test.com', 'anna123', 'user', '+7 (999) 789-01-23', null, null, null, null, 75],
                ['Петр Курьерский', 'courier2@matreshka.ru', 'courier123', 'courier', '+7 (999) 890-12-34', null, null, 'Автомобиль', 'Северный район', 0]
            ];

            const userStmt = this.db.prepare(`
                INSERT INTO users (name, email, password, role, phone, restaurant, position, vehicle, delivery_zone, loyalty_points)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            users.forEach(user => {
                userStmt.run(user);
            });
            userStmt.finalize();

            // Рестораны
            const restaurants = [
                ['Matreshka Центр', 'ул. Тверская, д. 10, Москва', '+7 (495) 123-45-67', 'center@matreshka.ru', '10:00 - 23:00', 80, 'Главный ресторан сети в центре Москвы с панорамным видом', '/img/restaurants/center.jpg', '55.7558,37.6173', 1],
                ['Matreshka Север', 'пр. Мира, д. 25, Москва', '+7 (495) 234-56-78', 'north@matreshka.ru', '10:00 - 22:00', 60, 'Уютный ресторан в северной части города', '/img/restaurants/north.jpg', '55.8358,37.6173', 1],
                ['Matreshka Юг', 'ул. Профсоюзная, д. 15, Москва', '+7 (495) 345-67-89', 'south@matreshka.ru', '10:00 - 22:00', 70, 'Современный ресторан в южном округе', '/img/restaurants/south.jpg', '55.6758,37.6173', 1],
                ['Matreshka Запад', 'ул. Кутузовский проспект, д. 30, Москва', '+7 (495) 456-78-90', 'west@matreshka.ru', '10:00 - 00:00', 90, 'Премиальный ресторан в западной части Москвы', '/img/restaurants/west.jpg', '55.7558,37.4173', 1]
            ];

            const restaurantStmt = this.db.prepare(`
                INSERT INTO restaurants (name, address, phone, email, opening_hours, capacity, description, image, coordinates, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            restaurants.forEach(restaurant => {
                restaurantStmt.run(restaurant);
            });
            restaurantStmt.finalize();

            // Категории меню
            const categories = [
                ['appetizers', 'Закуски', '🥗'],
                ['soups', 'Супы', '🍲'],
                ['main', 'Основные блюда', '🍽️'],
                ['desserts', 'Десерты', '🍰'],
                ['drinks', 'Напитки', '🥤']
            ];

            const categoryStmt = this.db.prepare(`
                INSERT INTO menu_categories (id, name, icon) VALUES (?, ?, ?)
            `);

            categories.forEach(category => {
                categoryStmt.run(category);
            });
            categoryStmt.finalize();

            // Блюда
            const menuItems = [
                ['Пельмени домашние', 3, 450, 320, 'Традиционные русские пельмени с говядиной и свининой', 'мука, говядина, свинина, лук, специи', 25, 0, 0, 0, '/img/menu/pelmeni.jpg', 1],
                ['Борщ украинский', 2, 350, 180, 'Наваристый борщ со сметаной и зеленью', 'свекла, капуста, картофель, мясо, сметана', 40, 0, 0, 1, '/img/menu/borshch.jpg', 1],
                ['Салат Оливье', 1, 280, 210, 'Классический салат с колбасой, овощами и майонезом', 'колбаса, картофель, морковь, огурцы, горошек, майонез', 20, 0, 0, 0, '/img/menu/olivye.jpg', 1],
                ['Овощной салат', 1, 220, 120, 'Свежие овощи с оливковым маслом', 'помидоры, огурцы, перец, лук, оливковое масло', 10, 1, 0, 1, '/img/menu/vegetable-salad.jpg', 1],
                ['Сырники', 4, 320, 280, 'Нежные творожные сырники со сметаной', 'творог, мука, яйца, сахар, сметана', 15, 1, 0, 0, '/img/menu/syrniki.jpg', 1],
                ['Компот из сухофруктов', 5, 150, 80, 'Освежающий напиток из сушеных фруктов', 'сушеные яблоки, груши, чернослив, изюм, сахар', 30, 1, 0, 1, '/img/menu/kompot.jpg', 1]
            ];

            const menuStmt = this.db.prepare(`
                INSERT INTO menu_items (name, category_id, price, calories, description, ingredients, cooking_time, is_vegetarian, is_spicy, is_gluten_free, image, is_available)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            menuItems.forEach(item => {
                menuStmt.run(item);
            });
            menuStmt.finalize();

            // Тестовые заказы для курьеров
            const orders = [
                [6, 1, null, 1250.00, 'pending', 'ул. Тверская, д. 15, кв. 45, Москва', null],
                [7, 2, 5, 890.00, 'accepted', 'пр. Мира, д. 30, кв. 12, Москва', null],
                [6, 1, 5, 1560.00, 'on_way', 'ул. Ленина, д. 8, кв. 67, Москва', null],
                [7, 3, 8, 740.00, 'delivered', 'ул. Гагарина, д. 25, кв. 34, Москва', '2024-01-15 14:30:00'],
                [6, 2, 8, 1120.00, 'delivered', 'пр. Вернадского, д. 42, кв. 89, Москва', '2024-01-14 18:45:00'],
                [7, 1, null, 680.00, 'preparing', 'ул. Пушкина, д. 10, кв. 23, Москва', null]
            ];

            const orderStmt = this.db.prepare(`
                INSERT INTO orders (user_id, restaurant_id, courier_id, total, status, delivery_address, completed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            orders.forEach(order => {
                orderStmt.run(order);
            });
            orderStmt.finalize();

            // Элементы заказов
            const orderItems = [
                [1, 1, 2, 450],
                [1, 3, 1, 280],
                [1, 6, 3, 150],
                [2, 2, 1, 350],
                [2, 4, 1, 220],
                [2, 5, 2, 320],
                [3, 1, 3, 450],
                [3, 3, 2, 280],
                [3, 5, 1, 320],
                [4, 2, 1, 350],
                [4, 4, 1, 220],
                [4, 6, 2, 150],
                [5, 1, 2, 450],
                [5, 3, 1, 280],
                [5, 5, 1, 320],
                [6, 4, 2, 220],
                [6, 6, 2, 150]
            ];

            const orderItemStmt = this.db.prepare(`
                INSERT INTO order_items (order_id, menu_item_id, quantity, price)
                VALUES (?, ?, ?, ?)
            `);

            orderItems.forEach(item => {
                orderItemStmt.run(item);
            });
            orderItemStmt.finalize();

            console.log('Sample data inserted successfully');
        });
    }

    // === USER METHODS ===
    getUsers(callback) {
        this.db.all("SELECT * FROM users ORDER BY created_at DESC", callback);
    }

    getUserById(id, callback) {
        this.db.get("SELECT * FROM users WHERE id = ?", [id], callback);
    }

    getUserByEmail(email, callback) {
        this.db.get("SELECT * FROM users WHERE email = ?", [email], callback);
    }

    createUser(userData, callback) {
        const { name, email, password, role, phone, restaurant, position, vehicle, delivery_zone } = userData;
        this.db.run(
            "INSERT INTO users (name, email, password, role, phone, restaurant, position, vehicle, delivery_zone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [name, email, password, role, phone, restaurant, position, vehicle, delivery_zone],
            callback
        );
    }

    updateUserRole(userId, newRole, callback) {
        this.db.run(
            "UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [newRole, userId],
            callback
        );
    }

    deleteUser(userId, callback) {
        this.db.run("DELETE FROM users WHERE id = ?", [userId], callback);
    }

    updateUser(userId, userData, callback) {
        const { name, email, phone, restaurant, position, vehicle, delivery_zone } = userData;
        this.db.run(
            "UPDATE users SET name = ?, email = ?, phone = ?, restaurant = ?, position = ?, vehicle = ?, delivery_zone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [name, email, phone, restaurant, position, vehicle, delivery_zone, userId],
            callback
        );
    }

    // === RESTAURANT METHODS ===
    getRestaurants(callback) {
        this.db.all("SELECT * FROM restaurants WHERE is_active = 1 ORDER BY name", callback);
    }

    getAllRestaurants(callback) {
        this.db.all("SELECT * FROM restaurants ORDER BY name", callback);
    }

    getRestaurantById(id, callback) {
        this.db.get("SELECT * FROM restaurants WHERE id = ?", [id], callback);
    }

    createRestaurant(restaurantData, callback) {
        const { name, address, phone, email, openingHours, capacity, description, image } = restaurantData;
        this.db.run(
            "INSERT INTO restaurants (name, address, phone, email, opening_hours, capacity, description, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [name, address, phone, email, openingHours, capacity, description, image],
            callback
        );
    }

    updateRestaurant(id, restaurantData, callback) {
        const { name, address, phone, email, openingHours, capacity, description, image, isActive } = restaurantData;
        this.db.run(
            "UPDATE restaurants SET name = ?, address = ?, phone = ?, email = ?, opening_hours = ?, capacity = ?, description = ?, image = ?, is_active = ? WHERE id = ?",
            [name, address, phone, email, openingHours, capacity, description, image, isActive, id],
            callback
        );
    }

    deleteRestaurant(id, callback) {
        this.db.run("DELETE FROM restaurants WHERE id = ?", [id], callback);
    }

    // === MENU METHODS ===
    getMenuCategories(callback) {
        this.db.all("SELECT * FROM menu_categories ORDER BY id", callback);
    }

    getMenuItems(callback) {
        this.db.all(`
            SELECT mi.*, mc.name as category_name, mc.icon as category_icon 
            FROM menu_items mi 
            LEFT JOIN menu_categories mc ON mi.category_id = mc.id 
            WHERE mi.is_available = 1 
            ORDER BY mc.name, mi.name
        `, callback);
    }

    getAllMenuItems(callback) {
        this.db.all(`
            SELECT mi.*, mc.name as category_name, mc.icon as category_icon 
            FROM menu_items mi 
            LEFT JOIN menu_categories mc ON mi.category_id = mc.id 
            ORDER BY mc.name, mi.name
        `, callback);
    }

    getMenuItemById(id, callback) {
        this.db.get(`
            SELECT mi.*, mc.name as category_name, mc.icon as category_icon 
            FROM menu_items mi 
            LEFT JOIN menu_categories mc ON mi.category_id = mc.id 
            WHERE mi.id = ?
        `, [id], callback);
    }

    createMenuItem(menuItemData, callback) {
        const { name, category_id, price, calories, description, ingredients, cooking_time, is_vegetarian, is_spicy, is_gluten_free, image } = menuItemData;
        this.db.run(
            "INSERT INTO menu_items (name, category_id, price, calories, description, ingredients, cooking_time, is_vegetarian, is_spicy, is_gluten_free, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [name, category_id, price, calories, description, ingredients, cooking_time, is_vegetarian, is_spicy, is_gluten_free, image],
            callback
        );
    }

    updateMenuItem(id, menuItemData, callback) {
        const { name, category_id, price, calories, description, ingredients, cooking_time, is_vegetarian, is_spicy, is_gluten_free, image, is_available } = menuItemData;
        this.db.run(
            "UPDATE menu_items SET name = ?, category_id = ?, price = ?, calories = ?, description = ?, ingredients = ?, cooking_time = ?, is_vegetarian = ?, is_spicy = ?, is_gluten_free = ?, image = ?, is_available = ? WHERE id = ?",
            [name, category_id, price, calories, description, ingredients, cooking_time, is_vegetarian, is_spicy, is_gluten_free, image, is_available, id],
            callback
        );
    }

    deleteMenuItem(id, callback) {
        this.db.run("DELETE FROM menu_items WHERE id = ?", [id], callback);
    }

    // === BOOKING METHODS ===
    getBookings(callback) {
        this.db.all(`
            SELECT b.*, u.name as user_name, r.name as restaurant_name 
            FROM bookings b 
            LEFT JOIN users u ON b.user_id = u.id 
            LEFT JOIN restaurants r ON b.restaurant_id = r.id 
            ORDER BY b.created_at DESC
        `, callback);
    }

    getUserBookings(userId, callback) {
        this.db.all(`
            SELECT b.*, r.name as restaurant_name 
            FROM bookings b 
            LEFT JOIN restaurants r ON b.restaurant_id = r.id 
            WHERE b.user_id = ? 
            ORDER BY b.created_at DESC
        `, [userId], callback);
    }

    createBooking(bookingData, callback) {
        const { user_id, restaurant_id, date, time, guests, customer_name, phone, special_requests } = bookingData;
        this.db.run(
            "INSERT INTO bookings (user_id, restaurant_id, date, time, guests, customer_name, phone, special_requests) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [user_id, restaurant_id, date, time, guests, customer_name, phone, special_requests],
            callback
        );
    }

    // === ORDER METHODS (ОБНОВЛЕНЫ) ===
    getOrders(callback) {
        this.db.all(`
            SELECT o.*, 
                   u.name as user_name, 
                   u.phone as user_phone,
                   r.name as restaurant_name,
                   c.name as courier_name
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            LEFT JOIN restaurants r ON o.restaurant_id = r.id 
            LEFT JOIN users c ON o.courier_id = c.id 
            ORDER BY o.created_at DESC
        `, callback);
    }

    getOrdersByCourier(courierId, callback) {
        this.db.all(`
            SELECT o.*, 
                   u.name as user_name, 
                   u.phone as user_phone,
                   r.name as restaurant_name
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            LEFT JOIN restaurants r ON o.restaurant_id = r.id 
            WHERE o.courier_id = ? 
            ORDER BY o.created_at DESC
        `, [courierId], callback);
    }

    getUserOrders(userId, callback) {
        this.db.all(`
            SELECT o.*, r.name as restaurant_name 
            FROM orders o 
            LEFT JOIN restaurants r ON o.restaurant_id = r.id 
            WHERE o.user_id = ? 
            ORDER BY o.created_at DESC
        `, [userId], callback);
    }

    getOrderById(id, callback) {
        this.db.get(`
            SELECT o.*, 
                   u.name as user_name, 
                   u.phone as user_phone,
                   r.name as restaurant_name,
                   c.name as courier_name
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            LEFT JOIN restaurants r ON o.restaurant_id = r.id 
            LEFT JOIN users c ON o.courier_id = c.id 
            WHERE o.id = ?
        `, [id], callback);
    }

    updateOrderStatus(orderId, status, courierId = null, callback) {
        let query, params;

        if (status === 'delivered') {
            query = "UPDATE orders SET status = ?, courier_id = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
            params = [status, courierId, orderId];
        } else {
            query = "UPDATE orders SET status = ?, courier_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
            params = [status, courierId, orderId];
        }

        this.db.run(query, params, callback);
    }

    getOrderItems(orderId, callback) {
        this.db.all(`
            SELECT oi.*, mi.name as item_name, mi.image as item_image
            FROM order_items oi 
            LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id 
            WHERE oi.order_id = ?
        `, [orderId], callback);
    }

    createOrder(orderData, callback) {
        const { user_id, restaurant_id, total, delivery_address } = orderData;
        this.db.run(
            "INSERT INTO orders (user_id, restaurant_id, total, delivery_address) VALUES (?, ?, ?, ?)",
            [user_id, restaurant_id, total, delivery_address],
            callback
        );
    }

    createOrderItem(orderItemData, callback) {
        const { order_id, menu_item_id, quantity, price } = orderItemData;
        this.db.run(
            "INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)",
            [order_id, menu_item_id, quantity, price],
            callback
        );
    }

    // === REVIEW METHODS ===
    getReviews(callback) {
        this.db.all(`
            SELECT r.*, u.name as user_name, res.name as restaurant_name 
            FROM reviews r 
            LEFT JOIN users u ON r.user_id = u.id 
            LEFT JOIN restaurants res ON r.restaurant_id = res.id 
            ORDER BY r.created_at DESC
        `, callback);
    }

    getUserReviews(userId, callback) {
        this.db.all(`
            SELECT r.*, res.name as restaurant_name 
            FROM reviews r 
            LEFT JOIN restaurants res ON r.restaurant_id = res.id 
            WHERE r.user_id = ? 
            ORDER BY r.created_at DESC
        `, [userId], callback);
    }

    // === ANALYTICS METHODS ===
    getAnalyticsData(callback) {
        const analytics = {};

        // Получаем статистику пользователей
        this.db.get("SELECT COUNT(*) as total_users FROM users", (err, userCount) => {
            if (err) return callback(err);
            analytics.users = userCount.total_users;

            // Статистика по ролям
            this.db.all("SELECT role, COUNT(*) as count FROM users GROUP BY role", (err, roles) => {
                if (err) return callback(err);
                analytics.usersByRole = roles;

                // Статистика ресторанов
                this.db.get("SELECT COUNT(*) as total_restaurants FROM restaurants", (err, restaurantCount) => {
                    if (err) return callback(err);
                    analytics.restaurants = restaurantCount.total_restaurants;

                    this.db.get("SELECT COUNT(*) as active_restaurants FROM restaurants WHERE is_active = 1", (err, activeCount) => {
                        if (err) return callback(err);
                        analytics.activeRestaurants = activeCount.active_restaurants;

                        // Статистика заказов
                        this.db.get("SELECT COUNT(*) as total_orders FROM orders", (err, orderCount) => {
                            if (err) return callback(err);
                            analytics.orders = orderCount.total_orders;

                            this.db.all("SELECT status, COUNT(*) as count FROM orders GROUP BY status", (err, orderStatuses) => {
                                if (err) return callback(err);
                                analytics.ordersByStatus = orderStatuses;

                                callback(null, analytics);
                            });
                        });
                    });
                });
            });
        });
    }

    // === COURIER SPECIFIC METHODS ===
    getCourierStats(courierId, callback) {
        const stats = {};

        // Общее количество доставок
        this.db.get("SELECT COUNT(*) as total_deliveries FROM orders WHERE courier_id = ?", [courierId], (err, total) => {
            if (err) return callback(err);
            stats.totalDeliveries = total.total_deliveries;

            // Успешные доставки
            this.db.get("SELECT COUNT(*) as completed_deliveries FROM orders WHERE courier_id = ? AND status = 'delivered'", [courierId], (err, completed) => {
                if (err) return callback(err);
                stats.completedDeliveries = completed.completed_deliveries;

                // Текущие доставки
                this.db.get("SELECT COUNT(*) as active_deliveries FROM orders WHERE courier_id = ? AND status IN ('accepted', 'on_way')", [courierId], (err, active) => {
                    if (err) return callback(err);
                    stats.activeDeliveries = active.active_deliveries;

                    // Общая сумма доставок
                    this.db.get("SELECT SUM(total) as total_earnings FROM orders WHERE courier_id = ? AND status = 'delivered'", [courierId], (err, earnings) => {
                        if (err) return callback(err);
                        stats.totalEarnings = earnings.total_earnings || 0;

                        callback(null, stats);
                    });
                });
            });
        });
    }

    getAvailableOrdersForCourier(callback) {
        this.db.all(`
            SELECT o.*, 
                   u.name as user_name, 
                   u.phone as user_phone,
                   r.name as restaurant_name
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            LEFT JOIN restaurants r ON o.restaurant_id = r.id 
            WHERE o.courier_id IS NULL 
            AND o.status IN ('pending', 'preparing')
            ORDER BY o.created_at ASC
        `, callback);
    }

    // Закрытие соединения с базой данных
    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
            } else {
                console.log('Database connection closed');
            }
        });
    }
}

module.exports = Database;