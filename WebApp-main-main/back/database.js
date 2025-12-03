const sqlite3 = require('sqlite3').verbose();

const database = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err);
        return;
    }
    console.log('Подключение к базе данных установлено');
    
    initializeTables(database);
});

// Функция для инициализации таблиц
function initializeTables(db) {
    db.serialize(() => {
        // Создание таблицы roles
        db.run(`
            CREATE TABLE IF NOT EXISTS roles (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL
            )`, (err) => {
            if (err) {
                console.error('Ошибка создания таблицы roles:', err);
            }
        });

        // Создание таблицы users
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role_id INTEGER DEFAULT 2,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (role_id) REFERENCES roles(id)
            )`, (err) => {
            if (err) {
                console.error('Ошибка создания таблицы users:', err);
            }
        });

        // Вставка стандартных ролей
        db.run(`
            INSERT OR IGNORE INTO roles (id, name)
            VALUES (1, 'admin'), (2, 'user')
        `, (err) => {
            if (err) {
                console.error('Ошибка вставки данных в таблицу roles:', err);
            } else {
                console.log('Таблицы инициализированы успешно');
            }
        });
    });
}

// Экспортируем только объект database
module.exports = database;