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

// Get all bookings
app.get('/api/bookings', (req, res) => {
  db.getBookings((err, bookings) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(bookings);
  });
});

// Get user bookings
app.get('/api/bookings/user/:userId', (req, res) => {
  const userId = req.params.userId;
  db.getUserBookings(userId, (err, bookings) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(bookings);
  });
});

// Create booking
app.post('/api/bookings', (req, res) => {
  const bookingData = req.body;
  
  db.createBooking(bookingData, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ 
      id: this.lastID,
      message: 'Booking created successfully'
    });
  });
});

// Update booking status
app.put('/api/bookings/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  db.run("UPDATE bookings SET status = ? WHERE id = ?", [status, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ message: 'Booking status updated successfully' });
  });
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


// === STAFF SPECIFIC ROUTES ===

// Получить все бронирования для ресторана сотрудника
app.get('/api/staff/bookings', (req, res) => {
    const { restaurant_id, status } = req.query;
    
    let query = `
        SELECT b.*, 
               u.name as user_name, 
               u.email as user_email,
               u.phone as user_phone,
               r.name as restaurant_name
        FROM bookings b 
        LEFT JOIN users u ON b.user_id = u.id 
        LEFT JOIN restaurants r ON b.restaurant_id = r.id 
        WHERE 1=1
    `;
    let params = [];
    
    if (restaurant_id) {
        query += ` AND b.restaurant_id = ?`;
        params.push(restaurant_id);
    }
    
    if (status && status !== 'all') {
        query += ` AND b.status = ?`;
        params.push(status);
    }
    
    query += ` ORDER BY b.date, b.time`;
    
    db.all(query, params, (err, bookings) => {
        if (err) {
            console.error('❌ Error fetching staff bookings:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(bookings);
    });
});

// Получить все заказы для ресторана сотрудника
app.get('/api/staff/orders', (req, res) => {
    const { restaurant_id, status } = req.query;
    
    let query = `
        SELECT o.*, 
               u.name as user_name, 
               u.phone as user_phone,
               r.name as restaurant_name,
               c.name as courier_name
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        LEFT JOIN restaurants r ON o.restaurant_id = r.id 
        LEFT JOIN users c ON o.courier_id = c.id 
        WHERE 1=1
    `;
    let params = [];
    
    if (restaurant_id) {
        query += ` AND o.restaurant_id = ?`;
        params.push(restaurant_id);
    }
    
    if (status && status !== 'all') {
        query += ` AND o.status = ?`;
        params.push(status);
    }
    
    query += ` ORDER BY o.created_at DESC`;
    
    db.all(query, params, (err, orders) => {
        if (err) {
            console.error('❌ Error fetching staff orders:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(orders);
    });
});

// Обновить статус бронирования
app.put('/api/staff/bookings/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    
    db.run(
        "UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, id],
        function(err) {
            if (err) {
                console.error('❌ Error updating booking status:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Booking not found' });
            }
            
            res.json({ 
                message: 'Booking status updated successfully',
                booking_id: id,
                status: status
            });
        }
    );
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

// ==============================
// STAFF ENDPOINTS
// ==============================

// Получить бронирования для сотрудника ресторана
app.get('/api/staff/bookings', (req, res) => {
    const { restaurant_id, status } = req.query;
    
    console.log(`🔍 Staff bookings request: restaurant_id=${restaurant_id}, status=${status}`);
    
    let query = `
        SELECT b.*, 
               u.name as user_name, 
               u.email as user_email,
               u.phone as user_phone,
               r.name as restaurant_name
        FROM bookings b 
        LEFT JOIN users u ON b.user_id = u.id 
        LEFT JOIN restaurants r ON b.restaurant_id = r.id 
        WHERE 1=1
    `;
    let params = [];
    
    if (restaurant_id && restaurant_id !== 'null' && restaurant_id !== 'undefined') {
        query += ` AND b.restaurant_id = ?`;
        params.push(restaurant_id);
        console.log(`   Filtering by restaurant_id: ${restaurant_id}`);
    }
    
    if (status && status !== 'all' && status !== 'null' && status !== 'undefined') {
        query += ` AND b.status = ?`;
        params.push(status);
        console.log(`   Filtering by status: ${status}`);
    }
    
    query += ` ORDER BY b.date, b.time`;
    
    console.log(`   Query: ${query}`);
    console.log(`   Params:`, params);
    
    db.all(query, params, (err, bookings) => {
        if (err) {
            console.error('❌ Error fetching staff bookings:', err);
            return res.status(500).json({ error: 'Internal server error', details: err.message });
        }
        console.log(`✅ Found ${bookings ? bookings.length : 0} bookings`);
        res.json(bookings || []);
    });
});

// Получить заказы для сотрудника ресторана
app.get('/api/staff/orders', (req, res) => {
    const { restaurant_id, status } = req.query;
    
    console.log(`🔍 Staff orders request: restaurant_id=${restaurant_id}, status=${status}`);
    
    let query = `
        SELECT o.*, 
               u.name as user_name, 
               u.phone as user_phone,
               r.name as restaurant_name,
               c.name as courier_name
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        LEFT JOIN restaurants r ON o.restaurant_id = r.id 
        LEFT JOIN users c ON o.courier_id = c.id 
        WHERE 1=1
    `;
    let params = [];
    
    if (restaurant_id && restaurant_id !== 'null' && restaurant_id !== 'undefined') {
        query += ` AND o.restaurant_id = ?`;
        params.push(restaurant_id);
        console.log(`   Filtering by restaurant_id: ${restaurant_id}`);
    }
    
    if (status && status !== 'all' && status !== 'null' && status !== 'undefined') {
        query += ` AND o.status = ?`;
        params.push(status);
        console.log(`   Filtering by status: ${status}`);
    }
    
    query += ` ORDER BY o.created_at DESC`;
    
    console.log(`   Query: ${query}`);
    console.log(`   Params:`, params);
    
    db.all(query, params, (err, orders) => {
        if (err) {
            console.error('❌ Error fetching staff orders:', err);
            return res.status(500).json({ error: 'Internal server error', details: err.message });
        }
        console.log(`✅ Found ${orders ? orders.length : 0} orders`);
        res.json(orders || []);
    });
});

// Получить детали заказа (items)
app.get('/api/orders/:id/items', (req, res) => {
    const orderId = req.params.id;
    
    console.log(`🔍 Fetching items for order: ${orderId}`);
    
    db.all(`
        SELECT oi.*, mi.name as item_name, mi.image as item_image
        FROM order_items oi 
        LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id 
        WHERE oi.order_id = ?
        ORDER BY oi.id
    `, [orderId], (err, items) => {
        if (err) {
            console.error('❌ Error fetching order items:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.log(`✅ Found ${items ? items.length : 0} items for order ${orderId}`);
        res.json(items || []);
    });
});

// Получить все бронирования (для сотрудника через общий endpoint)
app.get('/api/bookings', (req, res) => {
    console.log('📅 Fetching all bookings');
    
    db.all(`
        SELECT b.*, 
               u.name as user_name, 
               u.email as user_email,
               u.phone as user_phone,
               r.name as restaurant_name
        FROM bookings b 
        LEFT JOIN users u ON b.user_id = u.id 
        LEFT JOIN restaurants r ON b.restaurant_id = r.id 
        ORDER BY b.created_at DESC
    `, (err, bookings) => {
        if (err) {
            console.error('❌ Error fetching bookings:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.log(`✅ Found ${bookings ? bookings.length : 0} bookings`);
        res.json(bookings || []);
    });
});

// Получить все заказы (для сотрудника через общий endpoint)
app.get('/api/orders', (req, res) => {
    console.log('🍽️ Fetching all orders');
    
    db.all(`
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
    `, (err, orders) => {
        if (err) {
            console.error('❌ Error fetching orders:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.log(`✅ Found ${orders ? orders.length : 0} orders`);
        res.json(orders || []);
    });
});

// Обновить статус бронирования
app.put('/api/bookings/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`🔄 Updating booking ${id} status to: ${status}`);
    
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    
    db.run(
        "UPDATE bookings SET status = ? WHERE id = ?",
        [status, id],
        function(err) {
            if (err) {
                console.error('❌ Error updating booking status:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Booking not found' });
            }
            
            console.log(`✅ Booking ${id} status updated to ${status}`);
            res.json({ 
                message: 'Booking status updated successfully',
                booking_id: id,
                status: status
            });
        }
    );
});

// Обновить статус заказа
app.put('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, courier_id } = req.body;
    
    console.log(`🔄 Updating order ${id} status to: ${status}, courier_id: ${courier_id}`);
    
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    
    let query, params;
    
    if (status === 'delivered') {
        query = "UPDATE orders SET status = ?, courier_id = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        params = [status, courier_id, id];
    } else {
        query = "UPDATE orders SET status = ?, courier_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        params = [status, courier_id, id];
    }
    
    db.run(query, params, function(err) {
        if (err) {
            console.error('❌ Error updating order status:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        console.log(`✅ Order ${id} status updated to ${status}`);
        res.json({ 
            message: 'Order status updated successfully',
            order_id: id,
            status: status
        });
    });
});

// ==============================
// BOOKINGS ENDPOINTS (дополнение)
// ==============================

app.get('/api/bookings', (req, res) => {
    console.log('📅 Fetching all bookings');
    
    const query = `
        SELECT b.*, 
               u.name as user_name, 
               u.email as user_email,
               u.phone as user_phone,
               r.name as restaurant_name
        FROM bookings b 
        LEFT JOIN users u ON b.user_id = u.id 
        LEFT JOIN restaurants r ON b.restaurant_id = r.id 
        ORDER BY b.date DESC, b.time DESC
    `;
    
    db.all(query, (err, bookings) => {
        if (err) {
            console.error('❌ Error fetching bookings:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.log(`✅ Found ${bookings?.length || 0} bookings`);
        res.json(bookings || []);
    });
});

app.get('/api/bookings/user/:userId', (req, res) => {
    const userId = req.params.userId;
    console.log(`📅 Fetching bookings for user ${userId}`);
    
    db.all(`
        SELECT b.*, r.name as restaurant_name 
        FROM bookings b 
        LEFT JOIN restaurants r ON b.restaurant_id = r.id 
        WHERE b.user_id = ? 
        ORDER BY b.created_at DESC
    `, [userId], (err, bookings) => {
        if (err) {
            console.error('❌ Error fetching user bookings:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(bookings || []);
    });
});

app.post('/api/bookings', (req, res) => {
    const bookingData = req.body;
    console.log('📅 Creating new booking:', bookingData);
    
    const { user_id, restaurant_id, date, time, guests, customer_name, phone, special_requests } = bookingData;
    
    if (!date || !time || !guests || !customer_name || !phone) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    db.run(
        `INSERT INTO bookings (user_id, restaurant_id, date, time, guests, customer_name, phone, special_requests) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, restaurant_id, date, time, guests, customer_name, phone, special_requests || ''],
        function(err) {
            if (err) {
                console.error('❌ Error creating booking:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            console.log(`✅ Booking created with ID: ${this.lastID}`);
            res.json({ 
                id: this.lastID,
                message: 'Booking created successfully'
            });
        }
    );
});

// ==============================
// ORDERS ENDPOINTS (дополнение)
// ==============================

app.get('/api/orders', (req, res) => {
    console.log('🍽️ Fetching all orders');
    
    const query = `
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
    `;
    
    db.all(query, (err, orders) => {
        if (err) {
            console.error('❌ Error fetching orders:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.log(`✅ Found ${orders?.length || 0} orders`);
        res.json(orders || []);
    });
});

app.get('/api/orders/user/:userId', (req, res) => {
    const userId = req.params.userId;
    console.log(`🍽️ Fetching orders for user ${userId}`);
    
    db.all(`
        SELECT o.*, r.name as restaurant_name 
        FROM orders o 
        LEFT JOIN restaurants r ON o.restaurant_id = r.id 
        WHERE o.user_id = ? 
        ORDER BY o.created_at DESC
    `, [userId], (err, orders) => {
        if (err) {
            console.error('❌ Error fetching user orders:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(orders || []);
    });
});

app.get('/api/orders/:id', (req, res) => {
    const orderId = req.params.id;
    console.log(`🍽️ Fetching order ${orderId}`);
    
    db.get(`
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
    `, [orderId], (err, order) => {
        if (err) {
            console.error('❌ Error fetching order:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json(order);
    });
});

app.get('/api/orders/:id/items', (req, res) => {
    const orderId = req.params.id;
    console.log(`🍽️ Fetching items for order ${orderId}`);
    
    db.all(`
        SELECT oi.*, 
               mi.name as item_name, 
               mi.description as item_description,
               mi.image as item_image
        FROM order_items oi 
        LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id 
        WHERE oi.order_id = ?
        ORDER BY oi.id
    `, [orderId], (err, items) => {
        if (err) {
            console.error('❌ Error fetching order items:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.log(`✅ Found ${items?.length || 0} items for order ${orderId}`);
        res.json(items || []);
    });
});

app.post('/api/orders', (req, res) => {
    const orderData = req.body;
    console.log('🍽️ Creating new order:', orderData);
    
    const { user_id, restaurant_id, total, delivery_address, items } = orderData;
    
    if (!user_id || !restaurant_id || !total || items?.length === 0) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Начинаем транзакцию
    db.serialize(() => {
        db.run(
            `INSERT INTO orders (user_id, restaurant_id, total, delivery_address) 
             VALUES (?, ?, ?, ?)`,
            [user_id, restaurant_id, total, delivery_address || ''],
            function(err) {
                if (err) {
                    console.error('❌ Error creating order:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                
                const orderId = this.lastID;
                console.log(`✅ Order created with ID: ${orderId}`);
                
                // Добавляем items
                if (items && items.length > 0) {
                    const stmt = db.prepare(`
                        INSERT INTO order_items (order_id, menu_item_id, quantity, price) 
                        VALUES (?, ?, ?, ?)
                    `);
                    
                    items.forEach(item => {
                        stmt.run([orderId, item.menu_item_id, item.quantity, item.price], (err) => {
                            if (err) {
                                console.error('❌ Error adding order item:', err);
                            }
                        });
                    });
                    
                    stmt.finalize();
                }
                
                res.json({ 
                    id: orderId,
                    message: 'Order created successfully'
                });
            }
        );
    });
});

// ==============================
// STAFF SPECIFIC ENDPOINTS
// ==============================

app.get('/api/staff/bookings', (req, res) => {
    const { restaurant_id, status } = req.query;
    
    console.log(`📅 Staff bookings request: restaurant_id=${restaurant_id}, status=${status}`);
    
    let query = `
        SELECT b.*, 
               u.name as user_name, 
               u.email as user_email,
               u.phone as user_phone,
               r.name as restaurant_name
        FROM bookings b 
        LEFT JOIN users u ON b.user_id = u.id 
        LEFT JOIN restaurants r ON b.restaurant_id = r.id 
        WHERE 1=1
    `;
    let params = [];
    
    if (restaurant_id && restaurant_id !== 'null' && restaurant_id !== 'undefined') {
        query += ` AND b.restaurant_id = ?`;
        params.push(restaurant_id);
    }
    
    if (status && status !== 'all' && status !== 'null' && status !== 'undefined') {
        query += ` AND b.status = ?`;
        params.push(status);
    }
    
    query += ` ORDER BY b.date DESC, b.time DESC`;
    
    db.all(query, params, (err, bookings) => {
        if (err) {
            console.error('❌ Error fetching staff bookings:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.log(`✅ Found ${bookings?.length || 0} staff bookings`);
        res.json(bookings || []);
    });
});

app.get('/api/staff/orders', (req, res) => {
    const { restaurant_id, status } = req.query;
    
    console.log(`🍽️ Staff orders request: restaurant_id=${restaurant_id}, status=${status}`);
    
    let query = `
        SELECT o.*, 
               u.name as user_name, 
               u.phone as user_phone,
               r.name as restaurant_name,
               c.name as courier_name
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        LEFT JOIN restaurants r ON o.restaurant_id = r.id 
        LEFT JOIN users c ON o.courier_id = c.id 
        WHERE 1=1
    `;
    let params = [];
    
    if (restaurant_id && restaurant_id !== 'null' && restaurant_id !== 'undefined') {
        query += ` AND o.restaurant_id = ?`;
        params.push(restaurant_id);
    }
    
    if (status && status !== 'all' && status !== 'null' && status !== 'undefined') {
        query += ` AND o.status = ?`;
        params.push(status);
    }
    
    query += ` ORDER BY o.created_at DESC`;
    
    db.all(query, params, (err, orders) => {
        if (err) {
            console.error('❌ Error fetching staff orders:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.log(`✅ Found ${orders?.length || 0} staff orders`);
        res.json(orders || []);
    });
});

app.put('/api/bookings/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`📅 Updating booking ${id} status to: ${status}`);
    
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    
    db.run(
        "UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, id],
        function(err) {
            if (err) {
                console.error('❌ Error updating booking status:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Booking not found' });
            }
            
            console.log(`✅ Booking ${id} status updated to ${status}`);
            res.json({ 
                message: 'Booking status updated successfully',
                booking_id: id,
                status: status
            });
        }
    );
});

app.put('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, courier_id } = req.body;
    
    console.log(`🍽️ Updating order ${id} status to: ${status}, courier_id: ${courier_id}`);
    
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    
    let query, params;
    
    if (status === 'delivered') {
        query = "UPDATE orders SET status = ?, courier_id = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        params = [status, courier_id, id];
    } else {
        query = "UPDATE orders SET status = ?, courier_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        params = [status, courier_id, id];
    }
    
    db.run(query, params, function(err) {
        if (err) {
            console.error('❌ Error updating order status:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        console.log(`✅ Order ${id} status updated to ${status}`);
        res.json({ 
            message: 'Order status updated successfully',
            order_id: id,
            status: status
        });
    });
});

// ==============================
// COURIER ENDPOINTS
// ==============================

app.get('/api/orders/available', (req, res) => {
    console.log('🚴 Fetching available orders for couriers');
    
    db.all(`
        SELECT o.*, 
               u.name as user_name, 
               u.phone as user_phone,
               r.name as restaurant_name
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        LEFT JOIN restaurants r ON o.restaurant_id = r.id 
        WHERE o.courier_id IS NULL 
        AND o.status IN ('pending', 'preparing', 'ready')
        ORDER BY o.created_at ASC
    `, (err, orders) => {
        if (err) {
            console.error('❌ Error fetching available orders:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(orders || []);
    });
});

app.get('/api/orders/courier/:courierId', (req, res) => {
    const courierId = req.params.courierId;
    console.log(`🚴 Fetching orders for courier ${courierId}`);
    
    db.all(`
        SELECT o.*, 
               u.name as user_name, 
               u.phone as user_phone,
               r.name as restaurant_name
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        LEFT JOIN restaurants r ON o.restaurant_id = r.id 
        WHERE o.courier_id = ? 
        ORDER BY o.created_at DESC
    `, [courierId], (err, orders) => {
        if (err) {
            console.error('❌ Error fetching courier orders:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(orders || []);
    });
});

// ==============================
// TEST DATA CREATION ENDPOINTS
// ==============================

// Создать тестовое бронирование
app.post('/api/test/booking', (req, res) => {
    const bookingData = {
        user_id: 6, // ID тестового пользователя
        restaurant_id: 1, // Matreshka Центр
        date: '2024-12-20',
        time: '19:00',
        guests: 4,
        customer_name: 'Тестовый Клиент',
        phone: '+7 (999) 999-99-99',
        special_requests: 'Тестовое бронирование от пользователя',
        status: 'pending'
    };
    
    console.log('📅 Creating test booking:', bookingData);
    
    db.run(
        `INSERT INTO bookings (user_id, restaurant_id, date, time, guests, customer_name, phone, special_requests, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [bookingData.user_id, bookingData.restaurant_id, bookingData.date, bookingData.time, 
         bookingData.guests, bookingData.customer_name, bookingData.phone, 
         bookingData.special_requests, bookingData.status],
        function(err) {
            if (err) {
                console.error('❌ Error creating test booking:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            console.log(`✅ Test booking created with ID: ${this.lastID}`);
            res.json({ 
                id: this.lastID,
                ...bookingData,
                message: 'Test booking created successfully'
            });
        }
    );
});

// Создать тестовый заказ
app.post('/api/test/order', (req, res) => {
    const orderData = {
        user_id: 6, // ID тестового пользователя
        restaurant_id: 1, // Matreshka Центр
        total: 1250.00,
        status: 'pending',
        delivery_address: 'ул. Тверская, д. 10, Москва'
    };
    
    console.log('🍽️ Creating test order:', orderData);
    
    db.run(
        `INSERT INTO orders (user_id, restaurant_id, total, status, delivery_address) 
         VALUES (?, ?, ?, ?, ?)`,
        [orderData.user_id, orderData.restaurant_id, orderData.total, 
         orderData.status, orderData.delivery_address],
        function(err) {
            if (err) {
                console.error('❌ Error creating test order:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            const orderId = this.lastID;
            console.log(`✅ Test order created with ID: ${orderId}`);
            
            // Добавляем тестовые позиции заказа
            const testItems = [
                { menu_item_id: 1, quantity: 2, price: 450 }, // Пельмени × 2
                { menu_item_id: 3, quantity: 1, price: 280 }, // Салат Оливье
                { menu_item_id: 6, quantity: 3, price: 150 }  // Компот × 3
            ];
            
            db.serialize(() => {
                const stmt = db.prepare(`
                    INSERT INTO order_items (order_id, menu_item_id, quantity, price) 
                    VALUES (?, ?, ?, ?)
                `);
                
                testItems.forEach(item => {
                    stmt.run([orderId, item.menu_item_id, item.quantity, item.price]);
                });
                
                stmt.finalize();
            });
            
            res.json({ 
                id: orderId,
                ...orderData,
                message: 'Test order created successfully'
            });
        }
    );
});

// ==============================
// EVENTS MANAGEMENT ENDPOINTS
// ==============================

// Получить все мероприятия и акции
app.get('/api/events', (req, res) => {
    const { type, active } = req.query;
    
    let query = 'SELECT * FROM events WHERE 1=1';
    let params = [];
    
    if (type && type !== 'all') {
        query += ' AND type = ?';
        params.push(type);
    }
    
    if (active === 'true') {
        query += ' AND is_active = 1';
    }
    
    query += ' ORDER BY created_at DESC';
    
    db.all(query, params, (err, events) => {
        if (err) {
            console.error('❌ Error fetching events:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(events);
    });
});

// Получить мероприятие по ID
app.get('/api/events/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM events WHERE id = ?', [id], (err, event) => {
        if (err) {
            console.error('❌ Error fetching event:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        res.json(event);
    });
});

// Создать новое мероприятие/акцию
app.post('/api/events', (req, res) => {
    const eventData = req.body;
    
    console.log('🎭 Creating new event:', eventData.title);
    
    const fields = [
        'title', 'description', 'date', 'time', 'end_time', 'location',
        'max_participants', 'price', 'type', 'promo_code', 'discount_percent',
        'min_order_amount', 'image', 'is_active', 'start_date', 'end_date'
    ];
    
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map(field => eventData[field] || null);
    
    const query = `
        INSERT INTO events (${fields.join(', ')}) 
        VALUES (${placeholders})
    `;
    
    db.run(query, values, function(err) {
        if (err) {
            console.error('❌ Error creating event:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        console.log('✅ Event created successfully:', eventData.title, '(ID:', this.lastID + ')');
        res.json({
            id: this.lastID,
            ...eventData,
            message: 'Event created successfully'
        });
    });
});

// Обновить мероприятие/акцию
app.put('/api/events/:id', (req, res) => {
    const { id } = req.params;
    const eventData = req.body;
    
    console.log(`🎭 Updating event: ${id}`);
    
    const fields = [
        'title', 'description', 'date', 'time', 'end_time', 'location',
        'max_participants', 'price', 'type', 'promo_code', 'discount_percent',
        'min_order_amount', 'image', 'is_active', 'start_date', 'end_date',
        'updated_at'
    ];
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => 
        field === 'updated_at' ? new Date().toISOString() : eventData[field] || null
    );
    values.push(id);
    
    const query = `
        UPDATE events 
        SET ${setClause}
        WHERE id = ?
    `;
    
    db.run(query, values, function(err) {
        if (err) {
            console.error('❌ Error updating event:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        console.log('✅ Event updated successfully:', eventData.title);
        res.json({
            message: 'Event updated successfully',
            id: parseInt(id),
            ...eventData
        });
    });
});

// Удалить мероприятие/акцию
app.delete('/api/events/:id', (req, res) => {
    const { id } = req.params;
    
    console.log(`🎭 Deleting event: ${id}`);
    
    db.run('DELETE FROM events WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('❌ Error deleting event:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        console.log('✅ Event deleted successfully');
        res.json({
            message: 'Event deleted successfully',
            id: parseInt(id)
        });
    });
});

// ==============================
// EVENT REGISTRATIONS ENDPOINTS
// ==============================

// Получить все регистрации на мероприятие
app.get('/api/events/:id/registrations', (req, res) => {
    const { id } = req.params;
    
    db.all(`
        SELECT er.*, u.name as user_full_name, u.email as user_email
        FROM event_registrations er
        LEFT JOIN users u ON er.user_id = u.id
        WHERE er.event_id = ?
        ORDER BY er.registered_at DESC
    `, [id], (err, registrations) => {
        if (err) {
            console.error('❌ Error fetching event registrations:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(registrations);
    });
});

// Зарегистрироваться на мероприятие
app.post('/api/events/:id/register', (req, res) => {
    const { id } = req.params;
    const registrationData = req.body;
    
    console.log(`🎟️ Registering for event ${id}:`, registrationData.user_name);
    
    // Проверяем, существует ли мероприятие
    db.get('SELECT * FROM events WHERE id = ? AND is_active = 1', [id], (err, event) => {
        if (err) {
            console.error('❌ Error checking event:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found or not active' });
        }
        
        // Проверяем, есть ли свободные места
        if (event.max_participants && event.current_participants >= event.max_participants) {
            return res.status(400).json({ error: 'No available spots' });
        }
        
        // Проверяем, не зарегистрирован ли уже пользователь
        db.get(`
            SELECT COUNT(*) as count 
            FROM event_registrations 
            WHERE event_id = ? AND user_email = ? AND status != 'cancelled'
        `, [id, registrationData.user_email], (err, result) => {
            if (err) {
                console.error('❌ Error checking existing registration:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            if (result.count > 0) {
                return res.status(400).json({ error: 'Already registered for this event' });
            }
            
            // Регистрируем пользователя
            const registrationFields = [
                'event_id', 'user_id', 'user_name', 'user_email', 
                'user_phone', 'guests', 'comments', 'status'
            ];
            
            const placeholders = registrationFields.map(() => '?').join(', ');
            const values = registrationFields.map(field => registrationData[field] || null);
            values[0] = id; // event_id
            
            db.run(`
                INSERT INTO event_registrations (${registrationFields.join(', ')}) 
                VALUES (${placeholders})
            `, values, function(err) {
                if (err) {
                    console.error('❌ Error creating registration:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                
                // Обновляем количество участников
                db.run(`
                    UPDATE events 
                    SET current_participants = current_participants + 1 
                    WHERE id = ?
                `, [id], (updateErr) => {
                    if (updateErr) {
                        console.error('❌ Error updating participants count:', updateErr);
                    }
                });
                
                console.log('✅ Registration successful:', registrationData.user_name);
                res.json({
                    id: this.lastID,
                    ...registrationData,
                    message: 'Registration successful'
                });
            });
        });
    });
});

// Обновить статус регистрации
app.put('/api/registrations/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, event_id } = req.body;
    
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    
    db.run(`
        UPDATE event_registrations 
        SET status = ? 
        WHERE id = ?
    `, [status, id], function(err) {
        if (err) {
            console.error('❌ Error updating registration status:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Registration not found' });
        }
        
        // Если отмена, уменьшаем количество участников
        if (status === 'cancelled' && event_id) {
            db.run(`
                UPDATE events 
                SET current_participants = GREATEST(current_participants - 1, 0) 
                WHERE id = ?
            `, [event_id]);
        }
        
        res.json({
            message: 'Registration status updated successfully',
            registration_id: id,
            status: status
        });
    });
});

// Получить регистрации пользователя
app.get('/api/user/:userId/registrations', (req, res) => {
    const { userId } = req.params;
    
    db.all(`
        SELECT er.*, e.title as event_title, e.date as event_date, 
               e.time as event_time, e.location as event_location,
               e.price as event_price
        FROM event_registrations er
        LEFT JOIN events e ON er.event_id = e.id
        WHERE er.user_id = ?
        ORDER BY er.registered_at DESC
    `, [userId], (err, registrations) => {
        if (err) {
            console.error('❌ Error fetching user registrations:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(registrations);
    });
});

// ==============================
// COURIER ENDPOINTS
// ==============================

// Получить заказы курьера
app.get('/api/orders/courier/:courierId', (req, res) => {
    const courierId = req.params.courierId;
    console.log(`🚴 Fetching orders for courier ${courierId}`);
    
    db.all(`
        SELECT o.*, 
               u.name as user_name, 
               u.phone as user_phone,
               r.name as restaurant_name,
               c.name as courier_name
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        LEFT JOIN restaurants r ON o.restaurant_id = r.id 
        LEFT JOIN users c ON o.courier_id = c.id 
        WHERE o.courier_id = ? 
        ORDER BY o.created_at DESC
    `, [courierId], (err, orders) => {
        if (err) {
            console.error('❌ Error fetching courier orders:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.log(`✅ Found ${orders?.length || 0} orders for courier ${courierId}`);
        res.json(orders || []);
    });
});

// Получить доступные заказы для курьеров
app.get('/api/orders/available', (req, res) => {
    console.log('🚴 Fetching available orders for couriers');
    
    db.all(`
        SELECT o.*, 
               u.name as user_name, 
               u.phone as user_phone,
               r.name as restaurant_name
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        LEFT JOIN restaurants r ON o.restaurant_id = r.id 
        WHERE o.courier_id IS NULL 
        AND o.status IN ('pending', 'preparing', 'ready')
        AND o.delivery_address IS NOT NULL
        AND o.delivery_address != ''
        ORDER BY o.created_at ASC
    `, (err, orders) => {
        if (err) {
            console.error('❌ Error fetching available orders:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.log(`✅ Found ${orders?.length || 0} available orders`);
        res.json(orders || []);
    });
});

// Получить статистику курьера
app.get('/api/courier/:courierId/stats', (req, res) => {
    const courierId = req.params.courierId;
    console.log(`📊 Fetching stats for courier ${courierId}`);
    
    const stats = {};
    
    // Общее количество доставок
    db.get("SELECT COUNT(*) as total_deliveries FROM orders WHERE courier_id = ?", [courierId], (err, total) => {
        if (err) {
            console.error('❌ Error fetching total deliveries:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        stats.totalDeliveries = total.total_deliveries;
        
        // Успешные доставки
        db.get("SELECT COUNT(*) as completed_deliveries FROM orders WHERE courier_id = ? AND status = 'delivered'", [courierId], (err, completed) => {
            if (err) {
                console.error('❌ Error fetching completed deliveries:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            stats.completedDeliveries = completed.completed_deliveries;
            
            // Текущие доставки
            db.get("SELECT COUNT(*) as active_deliveries FROM orders WHERE courier_id = ? AND status IN ('accepted', 'on_way')", [courierId], (err, active) => {
                if (err) {
                    console.error('❌ Error fetching active deliveries:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                stats.activeDeliveries = active.active_deliveries;
                
                // Общая сумма доставок
                db.get("SELECT SUM(total) as total_earnings FROM orders WHERE courier_id = ? AND status = 'delivered'", [courierId], (err, earnings) => {
                    if (err) {
                        console.error('❌ Error fetching total earnings:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    stats.totalEarnings = earnings.total_earnings || 0;
                    
                    // Среднее время доставки
                    db.get(`
                        SELECT AVG(
                            (strftime('%s', completed_at) - strftime('%s', created_at)) / 60.0
                        ) as avg_delivery_time 
                        FROM orders 
                        WHERE courier_id = ? 
                        AND status = 'delivered' 
                        AND completed_at IS NOT NULL
                    `, [courierId], (err, avgTime) => {
                        if (err) {
                            console.error('❌ Error fetching avg delivery time:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }
                        stats.avgDeliveryTime = avgTime.avg_delivery_time ? Math.round(avgTime.avg_delivery_time) : 0;
                        
                        console.log(`✅ Courier stats:`, stats);
                        res.json(stats);
                    });
                });
            });
        });
    });
});

// Обновить статус заказа курьером
app.put('/api/orders/:id/courier-status', (req, res) => {
    const orderId = req.params.id;
    const { status, courier_id } = req.body;
    
    console.log(`🔄 Courier updating order ${orderId} status to: ${status}, courier_id: ${courier_id}`);
    
    if (!status || !courier_id) {
        return res.status(400).json({ error: 'Status and courier_id are required' });
    }
    
    let query, params;
    
    if (status === 'delivered') {
        query = "UPDATE orders SET status = ?, courier_id = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        params = [status, courier_id, orderId];
    } else {
        query = "UPDATE orders SET status = ?, courier_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        params = [status, courier_id, orderId];
    }
    
    db.run(query, params, function(err) {
        if (err) {
            console.error('❌ Error updating order status:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        console.log(`✅ Order ${orderId} status updated to ${status} by courier ${courier_id}`);
        res.json({ 
            message: 'Order status updated successfully',
            order_id: orderId,
            status: status
        });
    });
});

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