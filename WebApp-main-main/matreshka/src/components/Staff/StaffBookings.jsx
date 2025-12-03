import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../utils/api';
import './Staff.css';

const StaffBookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('🔍 StaffBookings mounted, user:', user);

        // Принудительно загружаем данные
        loadBookings();

        // Также делаем проверку API
        checkAPI();
    }, [user]);

    const checkAPI = async () => {
        try {
            console.log('🧪 Testing API connection...');
            const test = await ApiService.testConnection();
            console.log('✅ API test:', test);

            const bookings = await ApiService.getBookings();
            console.log('📋 Total bookings in DB:', bookings?.length || 0);

            if (user?.restaurant) {
                const filtered = bookings.filter(b =>
                    b.restaurant_name === user.restaurant
                );
                console.log(`📍 Bookings for ${user.restaurant}:`, filtered.length);
            }

        } catch (err) {
            console.error('❌ API check failed:', err);
        }
    };

    const loadBookings = async () => {
    setLoading(true);
    setError(null);
    
    console.log('🔍 Loading bookings for staff:', user);
    
    try {
        let data = [];
        
        // 1. Загружаем из базы данных через API
        try {
            console.log('📡 Fetching bookings from API...');
            const apiBookings = await ApiService.getBookings();
            console.log('✅ API bookings loaded:', apiBookings?.length || 0);
            
            if (user?.restaurant) {
                // Фильтруем по ресторану сотрудника
                const filteredApiBookings = apiBookings.filter(booking => 
                    booking.restaurant_name === user.restaurant || 
                    booking.restaurant === user.restaurant
                );
                console.log(`✅ Filtered API bookings for ${user.restaurant}:`, filteredApiBookings.length);
                data = filteredApiBookings;
            } else {
                data = apiBookings;
            }
        } catch (apiError) {
            console.error('API error:', apiError);
        }
        
        // 2. Дополняем данными из localStorage всех пользователей
        console.log('📂 Checking localStorage for bookings...');
        const localStorageBookings = [];
        
        // Получаем всех пользователей из localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            if (key.startsWith('user_bookings_')) {
                const userId = key.replace('user_bookings_', '');
                const userBookings = JSON.parse(localStorage.getItem(key)) || [];
                
                // Добавляем информацию о пользователе к каждому бронированию
                const userData = JSON.parse(localStorage.getItem('userData')) || 
                               JSON.parse(localStorage.getItem(`user_${userId}_data`)) || 
                               { name: 'Неизвестный пользователь', email: 'Не указан' };
                
                userBookings.forEach(booking => {
                    // Проверяем, соответствует ли ресторан
                    if (!user?.restaurant || 
                        booking.restaurantName === user.restaurant || 
                        booking.restaurant === user.restaurant) {
                        
                        localStorageBookings.push({
                            ...booking,
                            user_id: userId,
                            user_name: userData.name || 'Неизвестный пользователь',
                            user_email: userData.email || 'Не указан',
                            user_phone: booking.phone || userData.phone || 'Не указан',
                            restaurant_name: booking.restaurantName || booking.restaurant
                        });
                    }
                });
            }
        }
        
        console.log(`✅ Found ${localStorageBookings.length} bookings in localStorage`);
        
        // 3. Объединяем данные (убираем дубликаты)
        const allBookings = [...data];
        
        localStorageBookings.forEach(lsBooking => {
            // Проверяем, нет ли уже такого бронирования в данных API
            const exists = allBookings.some(apiBooking => 
                apiBooking.id === lsBooking.id || 
                (apiBooking.date === lsBooking.date && 
                 apiBooking.time === lsBooking.time && 
                 apiBooking.user_name === lsBooking.user_name)
            );
            
            if (!exists) {
                allBookings.push(lsBooking);
            }
        });
        
        console.log(`📊 Total bookings: ${allBookings.length} (API: ${data.length}, localStorage: ${localStorageBookings.length})`);
        setBookings(allBookings);
        
    } catch (err) {
        console.error('Error in loadBookings:', err);
        setError(`Ошибка загрузки: ${err.message || 'Неизвестная ошибка'}`);
    } finally {
        setLoading(false);
    }
};

    const loadBookingsAlternative = async () => {
        try {
            console.log('🔄 Using alternative method to load bookings...');

            // Пробуем получить ресторан по ID
            const restaurants = await ApiService.getAllRestaurants();
            console.log('Available restaurants:', restaurants);

            const userRestaurant = restaurants.find(r => r.name === user?.restaurant);
            console.log('Found user restaurant:', userRestaurant);

            if (userRestaurant) {
                try {
                    // Пробуем staff endpoint
                    const staffBookings = await ApiService.getStaffBookings(userRestaurant.id, 'all');
                    console.log('Staff bookings:', staffBookings);
                    return staffBookings;
                } catch (staffError) {
                    console.log('Staff endpoint failed, falling back to all bookings');
                }
            }

            // Последний вариант: получить все и отфильтровать
            const allBookings = await ApiService.getBookings();
            return allBookings.filter(booking =>
                booking.restaurant_name === user?.restaurant
            );

        } catch (err) {
            console.error('Alternative method failed:', err);
            return [];
        }
    };

    const updateBookingStatus = async (bookingId, newStatus) => {
        try {
            await ApiService.updateBookingStatus(bookingId, newStatus);
            alert(`Статус бронирования #${bookingId} обновлен`);

            // Обновляем локальные данные
            const updatedBookings = bookings.map(booking =>
                booking.id === bookingId
                    ? { ...booking, status: newStatus }
                    : booking
            );
            setBookings(updatedBookings);

        } catch (err) {
            console.error('Error updating booking:', err);
            alert('Ошибка при обновлении статуса');
        }
    };

    const getStatusText = (status) => {
        const statuses = {
            'pending': 'Ожидает подтверждения',
            'confirmed': 'Подтверждено',
            'cancelled': 'Отменено',
            'completed': 'Завершено'
        };
        return statuses[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'warning',
            'confirmed': 'success',
            'cancelled': 'error',
            'completed': 'info'
        };
        return colors[status] || 'default';
    };

    const formatDate = (dateString, timeString = '') => {
        if (!dateString) return 'Не указана';
        try {
            const date = new Date(dateString);
            const formattedDate = date.toLocaleDateString('ru-RU');
            return `${formattedDate} ${timeString}`.trim();
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Загрузка бронирований...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-icon">❌</div>
                <h3>Ошибка загрузки</h3>
                <p>{error}</p>
                <p>Попробуйте:</p>
                <ol>
                    <li>Проверить, запущен ли сервер (команда: <code>node server.js</code>)</li>
                    <li>Обновить страницу</li>
                    <li>Проверить консоль браузера (F12) для подробностей</li>
                </ol>
                <button
                    className="retry-btn"
                    onClick={loadBookings}
                >
                    🔄 Повторить попытку
                </button>
            </div>
        );
    }

    return (
        <div className="staff-bookings">
            <div className="staff-header">
                <h2>📅 Управление бронированиями</h2>
                <p className="restaurant-name">
                    Ресторан: <strong>{user?.restaurant || 'Не указан'}</strong>
                </p>
                <p className="bookings-count">
                    Найдено бронирований: <strong>{bookings.length}</strong>
                </p>
            </div>

            <div className="controls">
                <button
                    className="refresh-btn"
                    onClick={loadBookings}
                >
                    🔄 Обновить список
                </button>
                <button
                    className="debug-btn"
                    onClick={() => console.log('Current bookings:', bookings)}
                >
                    🐛 Отладка
                </button>
            </div>

            {bookings.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <h3>Бронирования не найдены</h3>
                    <p>В вашем ресторане пока нет бронирований</p>
                    <button
                        className="test-btn"
                        onClick={() => {
                            console.log('User:', user);
                            console.log('All localStorage:', Object.keys(localStorage));
                        }}
                    >
                        🔍 Проверить данные
                    </button>
                </div>
            ) : (
                <div className="bookings-list">
                    {bookings.map((booking) => (
                        <div key={booking.id} className="booking-card">
                            <div className="booking-header">
                                <h4>Бронирование #{booking.id}</h4>
                                <span className={`status-badge ${getStatusColor(booking.status)}`}>
                                    {getStatusText(booking.status)}
                                </span>
                            </div>

                            <div className="booking-info">
                                <div className="info-row">
                                    <span className="label">👤 Клиент:</span>
                                    <span>{booking.user_name || booking.customer_name || 'Не указан'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">📞 Телефон:</span>
                                    <span>{booking.user_phone || booking.phone || 'Не указан'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">📅 Дата:</span>
                                    <span>{formatDate(booking.date, booking.time)}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">👥 Гостей:</span>
                                    <span>{booking.guests || 1} чел.</span>
                                </div>
                                {booking.special_requests && (
                                    <div className="info-row">
                                        <span className="label">💬 Пожелания:</span>
                                        <span>{booking.special_requests}</span>
                                    </div>
                                )}
                            </div>

                            <div className="booking-actions">
                                {booking.status === 'pending' && (
                                    <>
                                        <button
                                            className="btn confirm-btn"
                                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                        >
                                            ✅ Подтвердить
                                        </button>
                                        <button
                                            className="btn cancel-btn"
                                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                        >
                                            ❌ Отклонить
                                        </button>
                                    </>
                                )}

                                {booking.status === 'confirmed' && (
                                    <>
                                        <button
                                            className="btn complete-btn"
                                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                                        >
                                            ✅ Завершить
                                        </button>
                                        <button
                                            className="btn cancel-btn"
                                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                        >
                                            ❌ Отменить
                                        </button>
                                    </>
                                )}

                                <button
                                    className="btn details-btn"
                                    onClick={() => {
                                        alert(`Детали бронирования #${booking.id}\nКлиент: ${booking.user_name}\nТелефон: ${booking.user_phone}\nДата: ${booking.date}\nВремя: ${booking.time}\nГостей: ${booking.guests}\nСтатус: ${getStatusText(booking.status)}`);
                                    }}
                                >
                                    📋 Подробности
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="debug-info">
                <details>
                    <summary>Отладочная информация</summary>
                    <pre>Пользователь: {JSON.stringify(user, null, 2)}</pre>
                    <pre>Бронирований загружено: {bookings.length}</pre>
                    <button onClick={() => {
                        // Проверяем доступность API
                        ApiService.testConnection()
                            .then(res => console.log('API test:', res))
                            .catch(err => console.error('API test error:', err));
                    }}>
                        Проверить API
                    </button>
                </details>
            </div>
        </div>
    );
};

export default StaffBookings;