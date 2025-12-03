import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../utils/api';
import './Staff.css';

const StaffTables = () => {
    const { user } = useAuth();
    const [tables, setTables] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [restaurantId, setRestaurantId] = useState(null);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    // Моковые данные для столиков (в реальном приложении нужно получить с сервера)
    const mockTables = [
        { id: 1, number: 'Столик 1', capacity: 2, location: 'У окна', is_available: true },
        { id: 2, number: 'Столик 2', capacity: 4, location: 'В центре', is_available: false },
        { id: 3, number: 'Столик 3', capacity: 2, location: 'У окна', is_available: true },
        { id: 4, number: 'Столик 4', capacity: 6, location: 'VIP зона', is_available: true },
        { id: 5, number: 'Столик 5', capacity: 4, location: 'На террасе', is_available: false },
        { id: 6, number: 'Столик 6', capacity: 2, location: 'Барная стойка', is_available: true },
        { id: 7, number: 'Столик 7', capacity: 8, location: 'Большой зал', is_available: true },
        { id: 8, number: 'Столик 8', capacity: 4, location: 'Уютный уголок', is_available: true },
    ];

    // Моковые данные для бронирований столиков
    const mockBookings = [
        { id: 1, table_id: 2, date: selectedDate, time: '19:00', customer_name: 'Иванов Иван', guests: 4, status: 'confirmed' },
        { id: 2, table_id: 5, date: selectedDate, time: '20:30', customer_name: 'Петрова Мария', guests: 3, status: 'confirmed' },
        { id: 3, table_id: 1, date: selectedDate, time: '18:00', customer_name: 'Сидоров Алексей', guests: 2, status: 'pending' },
    ];

    useEffect(() => {
        if (user) {
            loadRestaurantId();
        }
    }, [user]);

    useEffect(() => {
        if (restaurantId !== null) {
            loadTables();
            loadTableBookings();
        }
    }, [restaurantId, selectedDate]);

    const loadRestaurantId = async () => {
        if (!user?.restaurant) {
            setError('У вас не указан ресторан в профиле');
            setLoading(false);
            return;
        }

        try {
            const id = await ApiService.getRestaurantIdByName(user.restaurant);
            if (id) {
                setRestaurantId(id);
            } else {
                setError(`Ресторан "${user.restaurant}" не найден в базе данных`);
                setLoading(false);
            }
        } catch (err) {
            console.error('Error loading restaurant ID:', err);
            setError('Ошибка при загрузке данных ресторана');
            setLoading(false);
        }
    };

    const loadTables = async () => {
        setLoading(true);
        try {
            // В реальном приложении здесь был бы запрос к API
            // const data = await ApiService.getRestaurantTables(restaurantId);
            const data = mockTables; // Временно используем моковые данные
            setTables(data);
        } catch (err) {
            console.error('Error loading tables:', err);
            setError('Не удалось загрузить информацию о столиках');
        } finally {
            setLoading(false);
        }
    };

    const loadTableBookings = async () => {
        try {
            // В реальном приложении здесь был бы запрос к API
            // const data = await ApiService.getTableBookings(restaurantId, selectedDate);
            const data = mockBookings.filter(booking => booking.date === selectedDate);
            setBookings(data);
        } catch (err) {
            console.error('Error loading table bookings:', err);
        }
    };

    const getTableBookings = (tableId) => {
        return bookings.filter(booking => booking.table_id === tableId);
    };

    const getTableStatus = (table) => {
        const tableBookings = getTableBookings(table.id);
        if (tableBookings.length > 0) {
            const upcomingBooking = tableBookings.find(booking => booking.status === 'confirmed');
            return upcomingBooking ? 'booked' : 'available';
        }
        return table.is_available ? 'available' : 'unavailable';
    };

    const getStatusText = (status) => {
        const statusMap = {
            'available': 'Свободен',
            'booked': 'Забронирован',
            'unavailable': 'Недоступен'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            'available': 'success',
            'booked': 'warning',
            'unavailable': 'error'
        };
        return colors[status] || 'default';
    };

    const formatTime = (time) => {
        if (!time) return '';
        return time.substring(0, 5);
    };

    const handleTodayClick = () => {
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
    };

    const handleClearDate = () => {
        setSelectedDate('');
    };

    const handleUpdateTableStatus = async (tableId, newStatus) => {
        try {
            // В реальном приложении здесь был бы запрос к API
            // await ApiService.updateTableStatus(tableId, newStatus);
            
            const updatedTables = tables.map(table => 
                table.id === tableId 
                    ? { ...table, is_available: newStatus === 'available' } 
                    : table
            );
            setTables(updatedTables);
            
            alert(`Статус столика обновлен`);
        } catch (err) {
            console.error('Error updating table status:', err);
            alert('Ошибка при обновлении статуса столика');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Загрузка информации о столиках...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-icon">❌</div>
                <h3>Ошибка</h3>
                <p>{error}</p>
                <button 
                    className="retry-btn"
                    onClick={loadTables}
                >
                    Повторить попытку
                </button>
            </div>
        );
    }

    return (
        <div className="staff-tables">
            {/* Заголовок */}
            <div className="staff-header">
                <h2>🪑 Управление столиками</h2>
                <p className="restaurant-name">Ресторан: {user?.restaurant}</p>
            </div>

            {/* Фильтры */}
            <div className="filters-container">
                <div className="filters-row">
                    <div className="filter-group">
                        <label>Дата:</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="filter-date"
                        />
                    </div>

                    <div className="filter-actions">
                        <button 
                            className="filter-btn today-btn"
                            onClick={handleTodayClick}
                        >
                            📅 Сегодня
                        </button>
                        <button 
                            className="filter-btn clear-btn"
                            onClick={handleClearDate}
                        >
                            🗑️ Очистить
                        </button>
                        <button 
                            className="filter-btn refresh-btn"
                            onClick={loadTables}
                        >
                            🔄 Обновить
                        </button>
                    </div>
                </div>
            </div>

            {/* Статистика */}
            <div className="tables-stats">
                <div className="stat-card">
                    <span className="stat-number">{tables.length}</span>
                    <span className="stat-label">Всего столиков</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">
                        {tables.filter(t => getTableStatus(t) === 'available').length}
                    </span>
                    <span className="stat-label">Свободно</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">
                        {tables.filter(t => getTableStatus(t) === 'booked').length}
                    </span>
                    <span className="stat-label">Забронировано</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{bookings.length}</span>
                    <span className="stat-label">Бронирований {selectedDate && `на ${selectedDate}`}</span>
                </div>
            </div>

            {/* Сетка столиков */}
            <div className="tables-grid">
                {tables.map((table) => {
                    const status = getTableStatus(table);
                    const tableBookings = getTableBookings(table.id);
                    
                    return (
                        <div key={table.id} className={`table-card ${status}`}>
                            {/* Заголовок карточки */}
                            <div className="table-header">
                                <h4>{table.number}</h4>
                                <span className={`status-badge ${getStatusColor(status)}`}>
                                    {getStatusText(status)}
                                </span>
                            </div>

                            {/* Информация о столике */}
                            <div className="table-info">
                                <div className="info-row">
                                    <span className="info-label">Вместимость:</span>
                                    <span className="info-value">
                                        {table.capacity} человека
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Расположение:</span>
                                    <span className="info-value">
                                        {table.location}
                                    </span>
                                </div>
                            </div>

                            {/* Бронирования на этот столик */}
                            {tableBookings.length > 0 && (
                                <div className="table-bookings">
                                    <h5>Бронирования {selectedDate && `на ${selectedDate}`}:</h5>
                                    <ul className="bookings-list">
                                        {tableBookings.map((booking) => (
                                            <li key={booking.id} className="booking-item">
                                                <div className="booking-info">
                                                    <span className="booking-time">
                                                        {formatTime(booking.time)}
                                                    </span>
                                                    <span className="booking-name">
                                                        {booking.customer_name}
                                                    </span>
                                                </div>
                                                <div className="booking-details">
                                                    <span className="booking-guests">
                                                        {booking.guests} чел.
                                                    </span>
                                                    <span className={`booking-status ${booking.status}`}>
                                                        {booking.status === 'confirmed' ? '✓' : '?'}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Действия */}
                            <div className="table-actions">
                                {status === 'available' ? (
                                    <button 
                                        className="action-btn mark-unavailable-btn"
                                        onClick={() => handleUpdateTableStatus(table.id, 'unavailable')}
                                    >
                                        ❌ Сделать недоступным
                                    </button>
                                ) : status === 'unavailable' ? (
                                    <button 
                                        className="action-btn mark-available-btn"
                                        onClick={() => handleUpdateTableStatus(table.id, 'available')}
                                    >
                                        ✅ Сделать доступным
                                    </button>
                                ) : null}
                                
                                <button 
                                    className="action-btn details-btn"
                                    onClick={() => alert(`Детали столика:\n${table.number}\nВместимость: ${table.capacity} чел.\nРасположение: ${table.location}\nСтатус: ${getStatusText(status)}`)}
                                >
                                    📋 Подробности
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Легенда */}
            <div className="table-legend">
                <div className="legend-item">
                    <div className="legend-color available"></div>
                    <span>Свободен</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color booked"></div>
                    <span>Забронирован</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color unavailable"></div>
                    <span>Недоступен</span>
                </div>
            </div>

            {/* Информация */}
            <div className="data-info">
                <p>
                    Показано {tables.length} столиков
                    {selectedDate && `, бронирования на ${selectedDate}`}
                </p>
            </div>
        </div>
    );
};

export default StaffTables;