const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Инициализация базы данных
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('❌ Database error:', err);
    } else {
        console.log('✅ Connected to SQLite database');
        initDatabase();
    }
});

function initDatabase() {
    db.serialize(() => {
        // Удаляем старую таблицу если существует
        db.run(`DROP TABLE IF EXISTS users`, (err) => {
            if (err) {
                console.error('Error dropping table:', err);
            } else {
                console.log('✅ Old users table dropped');
            }
        });

        // Создаем новую таблицу пользователей с правильной структурой
        db.run(`
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                phone TEXT,
                restaurant TEXT,
                position TEXT,
                vehicle TEXT,
                delivery_zone TEXT,
                loyalty_points INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('❌ Error creating users table:', err);
            } else {
                console.log('✅ Users table created successfully');
                addTestUsers();
            }
        });
    });
}

function addTestUsers() {
    console.log('👥 Adding test users...');
    
    const testUsers = [
        ['Тестовый Пользователь', 'user@test.com', 'user123', 'user', '+7 (999) 678-90-12', null, null, null, null, 150],
        ['Администратор Системы', 'admin@matreshka.ru', 'admin123', 'admin', '+7 (999) 123-45-67', null, null, null, null, 0],
        ['Мария Модераторова', 'moderator@matreshka.ru', 'moderator123', 'moderator', '+7 (999) 234-56-78', null, null, null, null, 0],
        ['Иван Сотрудников', 'staff.center@matreshka.ru', 'staff123', 'staff', '+7 (999) 345-67-89', 'Matreshka Центр', 'Менеджер зала', null, null, 0],
        ['Курьер Доставкин', 'courier@matreshka.ru', 'courier123', 'courier', '+7 (999) 567-89-01', null, null, 'Велосипед', 'Центральный район', 0]
    ];

    const stmt = db.prepare(`
        INSERT INTO users (name, email, password, role, phone, restaurant, position, vehicle, delivery_zone, loyalty_points)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    testUsers.forEach((user, index) => {
        stmt.run(user, function(err) {
            if (err) {
                console.error(`❌ Error inserting user ${user[1]}:`, err);
            } else {
                console.log(`✅ Added user: ${user[1]} (ID: ${this.lastID})`);
            }
            
            // После добавления последнего пользователя
            if (index === testUsers.length - 1) {
                stmt.finalize();
                console.log('🎉 All test users added successfully');
                
                // Показываем всех пользователей для проверки
                db.all("SELECT id, name, email, role FROM users", (err, rows) => {
                    if (err) {
                        console.error('Error fetching users:', err);
                    } else {
                        console.log('📋 Current users in database:');
                        rows.forEach(user => {
                            console.log(`   ${user.id}. ${user.name} (${user.email}) - ${user.role}`);
                        });
                    }
                });
            }
        });
    });
}

// API Routes
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Server is working!', 
        timestamp: new Date().toISOString(),
        status: 'OK'
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: 'Connected'
    });
});

// Get all users (for testing)
app.get('/api/users', (req, res) => {
    db.all("SELECT id, name, email, role, phone, restaurant, position, created_at FROM users", (err, rows) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get all active restaurants
app.get('/api/restaurants', (req, res) => {
    console.log('🍽️ Fetching active restaurants');
    db.all("SELECT * FROM restaurants WHERE is_active = 1 ORDER BY name", (err, rows) => {
        if (err) {
            console.error('❌ Error fetching restaurants:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(rows || []);
    });
});

// Get all restaurants (including inactive)
app.get('/api/restaurants/all', (req, res) => {
    console.log('🍽️ Fetching all restaurants');
    db.all("SELECT * FROM restaurants ORDER BY name", (err, rows) => {
        if (err) {
            console.error('❌ Error fetching all restaurants:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(rows || []);
    });
});

// Get restaurant by ID
app.get('/api/restaurants/:id', (req, res) => {
    const { id } = req.params;
    console.log(`🍽️ Fetching restaurant: ${id}`);
    
    db.get("SELECT * FROM restaurants WHERE id = ?", [id], (err, row) => {
        if (err) {
            console.error('❌ Error fetching restaurant:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        
        res.json(row);
    });
});

// Create new restaurant
app.post('/api/restaurants', (req, res) => {
    const { name, address, phone, email, openingHours, capacity, description, image } = req.body;
    
    console.log('🍽️ Creating new restaurant:', name);
    
    if (!name || !address || !phone) {
        return res.status(400).json({ error: 'Name, address and phone are required' });
    }

    const restaurantData = {
        name,
        address,
        phone,
        email: email || '',
        opening_hours: openingHours || '',
        capacity: capacity ? parseInt(capacity) : 0,
        description: description || '',
        image: image || '/img/restaurants/default.jpg',
        coordinates: '55.7558,37.6173', // Default coordinates
        is_active: 1
    };

    db.run(
        `INSERT INTO restaurants (name, address, phone, email, opening_hours, capacity, description, image, coordinates, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [restaurantData.name, restaurantData.address, restaurantData.phone, restaurantData.email, 
         restaurantData.opening_hours, restaurantData.capacity, restaurantData.description, 
         restaurantData.image, restaurantData.coordinates, restaurantData.is_active],
        function(err) {
            if (err) {
                console.error('❌ Error creating restaurant:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            console.log('✅ Restaurant created successfully:', name, '(ID:', this.lastID + ')');
            res.json({ 
                id: this.lastID,
                ...restaurantData,
                message: 'Restaurant created successfully'
            });
        }
    );
});

// Update restaurant
app.put('/api/restaurants/:id', (req, res) => {
    const { id } = req.params;
    const { name, address, phone, email, openingHours, capacity, description, image, isActive } = req.body;
    
    console.log(`🍽️ Updating restaurant: ${id}`);
    
    if (!name || !address || !phone) {
        return res.status(400).json({ error: 'Name, address and phone are required' });
    }

    const restaurantData = {
        name,
        address,
        phone,
        email: email || '',
        opening_hours: openingHours || '',
        capacity: capacity ? parseInt(capacity) : 0,
        description: description || '',
        image: image || '/img/restaurants/default.jpg',
        is_active: isActive ? 1 : 0
    };

    db.run(
        `UPDATE restaurants SET name = ?, address = ?, phone = ?, email = ?, opening_hours = ?, 
         capacity = ?, description = ?, image = ?, is_active = ? WHERE id = ?`,
        [restaurantData.name, restaurantData.address, restaurantData.phone, restaurantData.email,
         restaurantData.opening_hours, restaurantData.capacity, restaurantData.description,
         restaurantData.image, restaurantData.is_active, id],
        function(err) {
            if (err) {
                console.error('❌ Error updating restaurant:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Restaurant not found' });
            }
            
            console.log('✅ Restaurant updated successfully:', name);
            res.json({ 
                message: 'Restaurant updated successfully',
                id: parseInt(id),
                ...restaurantData
            });
        }
    );
});

// Delete restaurant
app.delete('/api/restaurants/:id', (req, res) => {
    const { id } = req.params;
    
    console.log(`🍽️ Deleting restaurant: ${id}`);
    
    db.run("DELETE FROM restaurants WHERE id = ?", [id], function(err) {
        if (err) {
            console.error('❌ Error deleting restaurant:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        
        console.log('✅ Restaurant deleted successfully');
        res.json({ 
            message: 'Restaurant deleted successfully',
            id: parseInt(id)
        });
    });
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('🔑 Login attempt for:', email);
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ error: 'User not found' });
        }
        
        console.log('🔍 Found user:', user.name, 'Password in DB:', user.password);
        console.log('🔍 Provided password:', password);
        
        if (user.password !== password) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        console.log('✅ Login successful:', userWithoutPassword.name);
        res.json(userWithoutPassword);
    });
});

// Simple login for testing (without database)
app.post('/api/auth/login-simple', (req, res) => {
    const { email, password } = req.body;
    
    console.log('🔑 Simple login attempt:', email);
    
    // Hardcoded test users
    const testUsers = [
        { id: 1, name: 'Тестовый Пользователь', email: 'user@test.com', password: 'user123', role: 'user', phone: '+7 (999) 678-90-12' },
        { id: 2, name: 'Администратор', email: 'admin@matreshka.ru', password: 'admin123', role: 'admin', phone: '+7 (999) 123-45-67' },
        { id: 3, name: 'Модератор', email: 'moderator@matreshka.ru', password: 'moderator123', role: 'moderator', phone: '+7 (999) 234-56-78' }
    ];
    
    const user = testUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
        const { password: _, ...userWithoutPassword } = user;
        console.log('✅ Simple login successful:', userWithoutPassword.name);
        return res.json(userWithoutPassword);
    }
    
    res.status(401).json({ error: 'User not found or invalid password' });
});

// Create user
app.post('/api/users', (req, res) => {
    const { name, email, password, role, phone, restaurant, position } = req.body;
    
    console.log('👤 Creating new user:', email);
    
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const userData = {
        name,
        email,
        password,
        role: role || 'user',
        phone: phone || '',
        restaurant: restaurant || null,
        position: position || null,
        vehicle: null,
        delivery_zone: null,
        loyalty_points: 0
    };

    db.run(
        `INSERT INTO users (name, email, password, role, phone, restaurant, position, vehicle, delivery_zone, loyalty_points) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userData.name, userData.email, userData.password, userData.role, userData.phone, 
         userData.restaurant, userData.position, userData.vehicle, userData.delivery_zone, userData.loyalty_points],
        function(err) {
            if (err) {
                console.error('❌ Error creating user:', err);
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'User with this email already exists' });
                }
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            const { password: _, ...userWithoutPassword } = userData;
            console.log('✅ User created successfully:', userWithoutPassword.email, '(ID:', this.lastID + ')');
            res.json({ 
                id: this.lastID, 
                ...userWithoutPassword,
                message: 'User created successfully'
            });
        }
    );
});

// Update user
app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, role, phone, restaurant, position } = req.body;
    
    console.log('✏️ Updating user:', id);
    
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    db.run(
        `UPDATE users SET name = ?, email = ?, role = ?, phone = ?, restaurant = ?, position = ? WHERE id = ?`,
        [name, email, role, phone, restaurant, position, id],
        function(err) {
            if (err) {
                console.error('❌ Error updating user:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            console.log('✅ User updated successfully:', email);
            res.json({ 
                message: 'User updated successfully',
                id: parseInt(id),
                name,
                email,
                role,
                phone,
                restaurant,
                position
            });
        }
    );
});

// Update user role
app.put('/api/users/:id/role', (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    
    console.log('🔄 Updating user role:', id, '->', role);
    
    if (!role) {
        return res.status(400).json({ error: 'Role is required' });
    }

    db.run("UPDATE users SET role = ? WHERE id = ?", [role, id], function(err) {
        if (err) {
            console.error('❌ Error updating user role:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('✅ User role updated successfully');
        res.json({ 
            message: 'User role updated successfully',
            id: parseInt(id),
            role
        });
    });
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    
    console.log('🗑️ Deleting user:', id);
    
    // Не позволяем удалить самого себя
    if (req.headers['user-id'] === id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    db.run("DELETE FROM users WHERE id = ?", [id], function(err) {
        if (err) {
            console.error('❌ Error deleting user:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('✅ User deleted successfully');
        res.json({ 
            message: 'User deleted successfully',
            id: parseInt(id)
        });
    });
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
    const { id } = req.params;
    
    db.get("SELECT id, name, email, role, phone, restaurant, position, created_at FROM users WHERE id = ?", [id], (err, row) => {
        if (err) {
            console.error('❌ Error fetching user:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(row);
    });
});

app.get('/api/restaurants', (req, res) => {
    console.log('🍽️ Fetching active restaurants');
    db.all("SELECT * FROM restaurants WHERE is_active = 1 ORDER BY name", (err, rows) => {
        if (err) {
            console.error('❌ Error fetching restaurants:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.log(`✅ Found ${rows ? rows.length : 0} restaurants`);
        res.json(rows || []);
    });
});

// Get all restaurants (including inactive)
app.get('/api/restaurants/all', (req, res) => {
    console.log('🍽️ Fetching all restaurants');
    db.all("SELECT * FROM restaurants ORDER BY name", (err, rows) => {
        if (err) {
            console.error('❌ Error fetching all restaurants:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.log(`✅ Found ${rows ? rows.length : 0} restaurants total`);
        res.json(rows || []);
    });
});

// Get restaurant by ID
app.get('/api/restaurants/:id', (req, res) => {
    const { id } = req.params;
    console.log(`🍽️ Fetching restaurant: ${id}`);
    
    db.get("SELECT * FROM restaurants WHERE id = ?", [id], (err, row) => {
        if (err) {
            console.error('❌ Error fetching restaurant:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        
        res.json(row);
    });
});

// Create new restaurant
app.post('/api/restaurants', (req, res) => {
    const { name, address, phone, email, openingHours, capacity, description, image } = req.body;
    
    console.log('🍽️ Creating new restaurant:', name);
    
    if (!name || !address || !phone) {
        return res.status(400).json({ error: 'Name, address and phone are required' });
    }

    const restaurantData = {
        name,
        address,
        phone,
        email: email || '',
        opening_hours: openingHours || '',
        capacity: capacity ? parseInt(capacity) : 0,
        description: description || '',
        image: image || '/img/restaurants/default.jpg',
        coordinates: '55.7558,37.6173',
        is_active: 1
    };

    db.run(
        `INSERT INTO restaurants (name, address, phone, email, opening_hours, capacity, description, image, coordinates, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [restaurantData.name, restaurantData.address, restaurantData.phone, restaurantData.email, 
         restaurantData.opening_hours, restaurantData.capacity, restaurantData.description, 
         restaurantData.image, restaurantData.coordinates, restaurantData.is_active],
        function(err) {
            if (err) {
                console.error('❌ Error creating restaurant:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            console.log('✅ Restaurant created successfully:', name, '(ID:', this.lastID + ')');
            res.json({ 
                id: this.lastID,
                ...restaurantData,
                message: 'Restaurant created successfully'
            });
        }
    );
});

// Update restaurant
app.put('/api/restaurants/:id', (req, res) => {
    const { id } = req.params;
    const { name, address, phone, email, openingHours, capacity, description, image, isActive } = req.body;
    
    console.log(`🍽️ Updating restaurant: ${id}`);
    
    if (!name || !address || !phone) {
        return res.status(400).json({ error: 'Name, address and phone are required' });
    }

    const restaurantData = {
        name,
        address,
        phone,
        email: email || '',
        opening_hours: openingHours || '',
        capacity: capacity ? parseInt(capacity) : 0,
        description: description || '',
        image: image || '/img/restaurants/default.jpg',
        is_active: isActive ? 1 : 0
    };

    db.run(
        `UPDATE restaurants SET name = ?, address = ?, phone = ?, email = ?, opening_hours = ?, 
         capacity = ?, description = ?, image = ?, is_active = ? WHERE id = ?`,
        [restaurantData.name, restaurantData.address, restaurantData.phone, restaurantData.email,
         restaurantData.opening_hours, restaurantData.capacity, restaurantData.description,
         restaurantData.image, restaurantData.is_active, id],
        function(err) {
            if (err) {
                console.error('❌ Error updating restaurant:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Restaurant not found' });
            }
            
            console.log('✅ Restaurant updated successfully:', name);
            res.json({ 
                message: 'Restaurant updated successfully',
                id: parseInt(id),
                ...restaurantData
            });
        }
    );
});

// Delete restaurant
app.delete('/api/restaurants/:id', (req, res) => {
    const { id } = req.params;
    
    console.log(`🍽️ Deleting restaurant: ${id}`);
    
    db.run("DELETE FROM restaurants WHERE id = ?", [id], function(err) {
        if (err) {
            console.error('❌ Error deleting restaurant:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        
        console.log('✅ Restaurant deleted successfully');
        res.json({ 
            message: 'Restaurant deleted successfully',
            id: parseInt(id)
        });
    });
});

// === MENU MANAGEMENT ROUTES ===

// Get all menu items
app.get('/api/menu', (req, res) => {
    console.log('📋 Fetching menu items');
    db.all(`
        SELECT mi.*, mc.name as category_name, mc.icon as category_icon 
        FROM menu_items mi 
        LEFT JOIN menu_categories mc ON mi.category_id = mc.id 
        WHERE mi.is_available = 1 
        ORDER BY mc.name, mi.name
    `, (err, rows) => {
        if (err) {
            console.error('❌ Error fetching menu:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.log(`✅ Found ${rows ? rows.length : 0} menu items`);
        res.json(rows || []);
    });
});

// Get all menu items (including unavailable)
app.get('/api/menu/all', (req, res) => {
    console.log('📋 Fetching all menu items');
    db.all(`
        SELECT mi.*, mc.name as category_name, mc.icon as category_icon 
        FROM menu_items mi 
        LEFT JOIN menu_categories mc ON mi.category_id = mc.id 
        ORDER BY mc.name, mi.name
    `, (err, rows) => {
        if (err) {
            console.error('❌ Error fetching all menu items:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.log(`✅ Found ${rows ? rows.length : 0} menu items total`);
        res.json(rows || []);
    });
});

// Get menu item by ID
app.get('/api/menu/:id', (req, res) => {
    const { id } = req.params;
    console.log(`📋 Fetching menu item: ${id}`);
    
    db.get(`
        SELECT mi.*, mc.name as category_name, mc.icon as category_icon 
        FROM menu_items mi 
        LEFT JOIN menu_categories mc ON mi.category_id = mc.id 
        WHERE mi.id = ?
    `, [id], (err, row) => {
        if (err) {
            console.error('❌ Error fetching menu item:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        
        res.json(row);
    });
});

// Create new menu item
app.post('/api/menu', (req, res) => {
    const { 
        name, category_id, price, calories, description, ingredients, 
        cooking_time, is_vegetarian, is_spicy, is_gluten_free, image, is_available 
    } = req.body;
    
    console.log('📋 Creating new menu item:', name);
    
    if (!name || !category_id || !price) {
        return res.status(400).json({ error: 'Name, category and price are required' });
    }

    const menuItemData = {
        name,
        category_id: parseInt(category_id),
        price: parseFloat(price),
        calories: calories ? parseInt(calories) : null,
        description: description || '',
        ingredients: ingredients || '',
        cooking_time: cooking_time ? parseInt(cooking_time) : null,
        is_vegetarian: is_vegetarian ? 1 : 0,
        is_spicy: is_spicy ? 1 : 0,
        is_gluten_free: is_gluten_free ? 1 : 0,
        image: image || '/img/menu/default.jpg',
        is_available: is_available ? 1 : 1
    };

    db.run(
        `INSERT INTO menu_items (name, category_id, price, calories, description, ingredients, 
         cooking_time, is_vegetarian, is_spicy, is_gluten_free, image, is_available) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [menuItemData.name, menuItemData.category_id, menuItemData.price, menuItemData.calories,
         menuItemData.description, menuItemData.ingredients, menuItemData.cooking_time,
         menuItemData.is_vegetarian, menuItemData.is_spicy, menuItemData.is_gluten_free,
         menuItemData.image, menuItemData.is_available],
        function(err) {
            if (err) {
                console.error('❌ Error creating menu item:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            console.log('✅ Menu item created successfully:', name, '(ID:', this.lastID + ')');
            res.json({ 
                id: this.lastID,
                ...menuItemData,
                message: 'Menu item created successfully'
            });
        }
    );
});

// Update menu item
app.put('/api/menu/:id', (req, res) => {
    const { id } = req.params;
    const { 
        name, category_id, price, calories, description, ingredients, 
        cooking_time, is_vegetarian, is_spicy, is_gluten_free, image, is_available 
    } = req.body;
    
    console.log(`📋 Updating menu item: ${id}`);
    
    if (!name || !category_id || !price) {
        return res.status(400).json({ error: 'Name, category and price are required' });
    }

    const menuItemData = {
        name,
        category_id: parseInt(category_id),
        price: parseFloat(price),
        calories: calories ? parseInt(calories) : null,
        description: description || '',
        ingredients: ingredients || '',
        cooking_time: cooking_time ? parseInt(cooking_time) : null,
        is_vegetarian: is_vegetarian ? 1 : 0,
        is_spicy: is_spicy ? 1 : 0,
        is_gluten_free: is_gluten_free ? 1 : 0,
        image: image || '/img/menu/default.jpg',
        is_available: is_available ? 1 : 0
    };

    db.run(
        `UPDATE menu_items SET name = ?, category_id = ?, price = ?, calories = ?, description = ?, 
         ingredients = ?, cooking_time = ?, is_vegetarian = ?, is_spicy = ?, is_gluten_free = ?, 
         image = ?, is_available = ? WHERE id = ?`,
        [menuItemData.name, menuItemData.category_id, menuItemData.price, menuItemData.calories,
         menuItemData.description, menuItemData.ingredients, menuItemData.cooking_time,
         menuItemData.is_vegetarian, menuItemData.is_spicy, menuItemData.is_gluten_free,
         menuItemData.image, menuItemData.is_available, id],
        function(err) {
            if (err) {
                console.error('❌ Error updating menu item:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Menu item not found' });
            }
            
            console.log('✅ Menu item updated successfully:', name);
            res.json({ 
                message: 'Menu item updated successfully',
                id: parseInt(id),
                ...menuItemData
            });
        }
    );
});

// Delete menu item
app.delete('/api/menu/:id', (req, res) => {
    const { id } = req.params;
    
    console.log(`📋 Deleting menu item: ${id}`);
    
    db.run("DELETE FROM menu_items WHERE id = ?", [id], function(err) {
        if (err) {
            console.error('❌ Error deleting menu item:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        
        console.log('✅ Menu item deleted successfully');
        res.json({ 
            message: 'Menu item deleted successfully',
            id: parseInt(id)
        });
    });
});

// Menu categories table
db.run(`
    CREATE TABLE IF NOT EXISTS menu_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error('❌ Error creating menu_categories table:', err);
    } else {
        console.log('✅ Menu categories table ready');
        addMenuCategories();
    }
});

// Menu items table
db.run(`
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
`, (err) => {
    if (err) {
        console.error('❌ Error creating menu_items table:', err);
    } else {
        console.log('✅ Menu items table ready');
        addSampleMenuItems();
    }
});

// Функции для добавления тестовых данных
function addMenuCategories() {
    const categories = [
        [1, 'Закуски', '🥗'],
        [2, 'Супы', '🍲'],
        [3, 'Основные блюда', '🍽️'],
        [4, 'Десерты', '🍰'],
        [5, 'Напитки', '🥤']
    ];

    const stmt = db.prepare("INSERT OR IGNORE INTO menu_categories (id, name, icon) VALUES (?, ?, ?)");
    
    categories.forEach(category => {
        stmt.run(category, (err) => {
            if (err) {
                console.error('Error inserting category:', err);
            }
        });
    });
    
    stmt.finalize();
    console.log('✅ Menu categories added');
}

function addSampleMenuItems() {
    db.get("SELECT COUNT(*) as count FROM menu_items", (err, row) => {
        if (err) {
            console.error('Error checking menu items:', err);
            return;
        }
        
        if (row.count === 0) {
            console.log('📋 Adding sample menu items...');
            
            const menuItems = [
                ['Пельмени домашние', 3, 450, 320, 'Традиционные русские пельмени с говядиной и свининой', 'мука, говядина, свинина, лук, специи', 25, 0, 0, 0, '/img/menu/pelmeni.jpg', 1],
                ['Борщ украинский', 2, 350, 180, 'Наваристый борщ со сметаной и зеленью', 'свекла, капуста, картофель, мясо, сметана', 40, 0, 0, 1, '/img/menu/borshch.jpg', 1],
                ['Салат Оливье', 1, 280, 210, 'Классический салат с колбасой, овощами и майонезом', 'колбаса, картофель, морковь, огурцы, горошек, майонез', 20, 0, 0, 0, '/img/menu/olivye.jpg', 1],
                ['Овощной салат', 1, 220, 120, 'Свежие овощи с оливковым маслом', 'помидоры, огурцы, перец, лук, оливковое масло', 10, 1, 0, 1, '/img/menu/vegetable-salad.jpg', 1],
                ['Сырники', 4, 320, 280, 'Нежные творожные сырники со сметаной', 'творог, мука, яйца, сахар, сметана', 15, 1, 0, 0, '/img/menu/syrniki.jpg', 1],
                ['Компот из сухофруктов', 5, 150, 80, 'Освежающий напиток из сушеных фруктов', 'сушеные яблоки, груши, чернослив, изюм, сахар', 30, 1, 0, 1, '/img/menu/kompot.jpg', 1]
            ];

            const stmt = db.prepare(`
                INSERT INTO menu_items (name, category_id, price, calories, description, ingredients, cooking_time, is_vegetarian, is_spicy, is_gluten_free, image, is_available)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            menuItems.forEach(item => {
                stmt.run(item, (err) => {
                    if (err) {
                        console.error('Error inserting menu item:', err);
                    } else {
                        console.log(`✅ Added menu item: ${item[0]}`);
                    }
                });
            });
            
            stmt.finalize();
            console.log('🎉 Sample menu items added successfully');
        }
    });
}

// В функции initDatabase() добавьте:
db.run(`
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
`, (err) => {
    if (err) {
        console.error('❌ Error creating restaurants table:', err);
    } else {
        console.log('✅ Restaurants table ready');
        addSampleRestaurants();
    }
});

// Получение всех заказов
app.get('/api/orders', (req, res) => {
  db.getOrders((err, orders) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(orders);
  });
});

// Обновление статуса заказа
app.put('/api/orders/:id/status', (req, res) => {
  const { status, courier_id } = req.body;
  const orderId = req.params.id;
  
  db.run(
    'UPDATE orders SET status = ?, courier_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, courier_id, orderId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Order status updated successfully' });
    }
  );
});

// Функция для добавления тестовых ресторанов
function addSampleRestaurants() {
    db.get("SELECT COUNT(*) as count FROM restaurants", (err, row) => {
        if (err) {
            console.error('Error checking restaurants:', err);
            return;
        }
        
        if (row.count === 0) {
            console.log('🍽️ Adding sample restaurants...');
            
            const restaurants = [
                ['Matreshka Центр', 'ул. Тверская, д. 10, Москва', '+7 (495) 123-45-67', 'center@matreshka.ru', '10:00 - 23:00', 80, 'Главный ресторан сети в центре Москвы с панорамным видом', '/img/restaurants/center.jpg', '55.7558,37.6173', 1],
                ['Matreshka Север', 'пр. Мира, д. 25, Москва', '+7 (495) 234-56-78', 'north@matreshka.ru', '10:00 - 22:00', 60, 'Уютный ресторан в северной части города', '/img/restaurants/north.jpg', '55.8358,37.6173', 1],
                ['Matreshka Юг', 'ул. Профсоюзная, д. 15, Москва', '+7 (495) 345-67-89', 'south@matreshka.ru', '10:00 - 22:00', 70, 'Современный ресторан в южном округе', '/img/restaurants/south.jpg', '55.6758,37.6173', 1],
                ['Matreshka Запад', 'ул. Кутузовский проспект, д. 30, Москва', '+7 (495) 456-78-90', 'west@matreshka.ru', '10:00 - 00:00', 90, 'Премиальный ресторан в западной части Москвы', '/img/restaurants/west.jpg', '55.7558,37.4173', 1]
            ];

            const stmt = db.prepare(`
                INSERT INTO restaurants (name, address, phone, email, opening_hours, capacity, description, image, coordinates, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            restaurants.forEach(restaurant => {
                stmt.run(restaurant, (err) => {
                    if (err) {
                        console.error('Error inserting restaurant:', err);
                    } else {
                        console.log(`✅ Added restaurant: ${restaurant[0]}`);
                    }
                });
            });
            
            stmt.finalize();
            console.log('🎉 Sample restaurants added successfully');
        }
    });
}

// 404 handler
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n=================================');
    console.log('🚀 SERVER STARTED SUCCESSFULLY');
    console.log('=================================');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🔗 Test: http://localhost:${PORT}/api/test`);
    console.log(`👥 Users: http://localhost:${PORT}/api/users`);
    console.log('=================================\n');
    console.log('📧 Test login credentials:');
    console.log('   User: user@test.com / user123');
    console.log('   Admin: admin@matreshka.ru / admin123');
    console.log('   Moderator: moderator@matreshka.ru / moderator123');
    console.log('=================================\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close();
    process.exit(0);
});