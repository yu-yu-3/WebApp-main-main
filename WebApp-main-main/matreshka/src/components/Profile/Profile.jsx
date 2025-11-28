import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import UserManagement from '../UserManagement/UserManagement';
import Analytics from '../Analytics/Analytics';
import MenuManagement from '../MenuManagement/MenuManagement';
import CourierDeliveries from '../Courier/CourierDeliveries';
import CourierHistory from '../Courier/CourierHistory';
import CourierStatus from '../Courier/CourierStatus';
import RestaurantManagement from '../RestaurantManagement/RestaurantManagement';
import { useModal } from '../../context/ModalContext';
import {
    getRoleDisplayName,
    getRoleIcon,
    canModerateReviews
} from '../../utils/helpers';
import { USER_ROLES } from '../../utils/constants';
import './Profile.css';

const Profile = () => {
    const { user, logout } = useAuth();
    const { openBooking, openReviewForm, openOrderDetails } = useModal();
    const [activeTab, setActiveTab] = useState('bookings');
    const [bookings, setBookings] = useState([]);
    const [orders, setOrders] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loyaltyPoints] = useState(user?.loyaltyPoints || 150);

    // Состояние для настроек
    const [settings, setSettings] = useState({
        name: '',
        email: '',
        phone: '',
        preferences: {
            vegetarian: false,
            spicy: false,
            glutenFree: false
        },
        notifications: {
            email: true,
            sms: true,
            promotions: true
        }
    });
    const [isSaving, setIsSaving] = useState(false);

    // Функции для работы с отзывами
    const handleEditReview = (review) => {
        alert(`Редактирование отзыва для ресторана "${review.restaurant}" скоро будет доступно!`);
    };

    const handleDeleteReview = (reviewId) => {
        if (window.confirm('Вы уверены, что хотите удалить этот отзыв?')) {
            const updatedReviews = reviews.filter(review => review.id !== reviewId);
            setReviews(updatedReviews);
            localStorage.setItem(`user_reviews_${user.id}`, JSON.stringify(updatedReviews));
            alert('Отзыв успешно удален');
        }
    };

    // Функция для отображения звезд рейтинга
    const renderStars = (rating) => {
        return '★'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    // Функция для получения текста статуса отзыва
    const getReviewStatusText = (status) => {
        switch (status) {
            case 'approved':
                return '✅ Опубликован';
            case 'pending':
                return '⏳ На модерации';
            case 'rejected':
                return '❌ Отклонен';
            default:
                return '⏳ На модерации';
        }
    };

    // Загружаем данные пользователя
    useEffect(() => {
        const loadUserData = () => {
            if (user) {
                try {
                    const userBookings = JSON.parse(localStorage.getItem(`user_bookings_${user.id}`)) || [];
                    const userOrders = JSON.parse(localStorage.getItem(`user_orders_${user.id}`)) || [];
                    const userReviews = JSON.parse(localStorage.getItem(`user_reviews_${user.id}`)) || [];
                    const userSettings = JSON.parse(localStorage.getItem(`user_settings_${user.id}`)) || {};

                    setBookings(userBookings);
                    setOrders(userOrders);
                    setReviews(userReviews);

                    // Загружаем настройки или используем значения по умолчанию
                    setSettings({
                        name: userSettings.name || user.name || '',
                        email: userSettings.email || user.email || '',
                        phone: userSettings.phone || user.phone || '',
                        preferences: {
                            vegetarian: userSettings.preferences?.vegetarian || false,
                            spicy: userSettings.preferences?.spicy || false,
                            glutenFree: userSettings.preferences?.glutenFree || false
                        },
                        notifications: {
                            email: userSettings.notifications?.email !== false,
                            sms: userSettings.notifications?.sms !== false,
                            promotions: userSettings.notifications?.promotions !== false
                        }
                    });
                } catch (error) {
                    console.error('Error loading user data:', error);
                    setBookings([]);
                    setOrders([]);
                    setReviews([]);
                }
            }
        };

        loadUserData();

        const handleBookingUpdate = () => {
            loadUserData();
        };

        const handleReviewsUpdate = () => {
            loadUserData();
        };

        window.addEventListener('bookingUpdated', handleBookingUpdate);
        window.addEventListener('reviewsUpdated', handleReviewsUpdate);

        return () => {
            window.removeEventListener('bookingUpdated', handleBookingUpdate);
            window.removeEventListener('reviewsUpdated', handleReviewsUpdate);
        };
    }, [user]);

    const handleCancelBooking = (bookingId) => {
        const updatedBookings = bookings.filter(booking => booking.id !== bookingId);
        setBookings(updatedBookings);
        localStorage.setItem(`user_bookings_${user.id}`, JSON.stringify(updatedBookings));
        alert('Бронирование отменено');
    };

    const handleBookingClick = () => {
        openBooking();
    };

    // Функции для обработки настроек
    const handleSettingsChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePreferenceChange = (preference, value) => {
        setSettings(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                [preference]: value
            }
        }));
    };

    const handleNotificationChange = (notification, value) => {
        setSettings(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [notification]: value
            }
        }));
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Сохраняем настройки в localStorage
            localStorage.setItem(`user_settings_${user.id}`, JSON.stringify(settings));

            // Обновляем данные пользователя в AuthContext если изменилось имя или email
            if (settings.name !== user.name || settings.email !== user.email) {
                const updatedUser = {
                    ...user,
                    name: settings.name,
                    email: settings.email
                };

                // Обновляем в localStorage
                localStorage.setItem('userData', JSON.stringify(updatedUser));

                console.log('User data updated:', updatedUser);
            }

            // Имитация задержки сохранения
            await new Promise(resolve => setTimeout(resolve, 1000));

            alert('Настройки успешно сохранены!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Произошла ошибка при сохранении настроек');
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    // ==================== КОМПОНЕНТЫ ДЛЯ РАЗНЫХ РОЛЕЙ ====================

    // Панель администратора
    const AdminPanel = () => (
        <div className="role-panel admin-panel">
            <h4>👑 Панель администратора</h4>
            <div className="admin-actions">
                <button className="admin-btn" onClick={() => setActiveTab('user-management')}>
                    👥 Управление пользователями
                </button>
                <button className="admin-btn" onClick={() => setActiveTab('restaurant-management')}>
                    🏢 Управление ресторанами
                </button>
                <button className="admin-btn" onClick={() => setActiveTab('menu-management')}>
                    📋 Управление меню
                </button>
                <button className="admin-btn" onClick={() => setActiveTab('analytics')}>
                    📊 Просмотр аналитики
                </button>
                <button className="admin-btn" onClick={() => setActiveTab('moderation')}>
                    📝 Модерация отзывов
                </button>
            </div>
        </div>
    );

    // Панель модератора
    const ModeratorPanel = () => (
        <div className="role-panel moderator-panel">
            <h4>📝 Панель модератора</h4>
            <div className="moderator-actions">
                <button className="moderator-btn" onClick={() => setActiveTab('moderation')}>
                    🔍 Модерация отзывов
                </button>
                <button className="moderator-btn" onClick={() => alert('Отчеты - скоро!')}>
                    📈 Просмотр отчетов
                </button>
            </div>
        </div>
    );

    // Панель сотрудника
    const StaffPanel = () => (
        <div className="role-panel staff-panel">
            <h4>👨‍🍳 Панель сотрудника - {user.restaurant}</h4>
            <div className="staff-actions">
                <button className="staff-btn" onClick={() => alert('Бронирования ресторана - скоро!')}>
                    📅 Управление бронированиями
                </button>
                <button className="staff-btn" onClick={() => alert('Заказы ресторана - скоро!')}>
                    🍽️ Управление заказами
                </button>
                <button className="staff-btn" onClick={() => alert('Столики - скоро!')}>
                    🪑 Управление столиками
                </button>
            </div>
            <p className="staff-info">
                <strong>Должность:</strong> {user.position || 'Сотрудник'}
            </p>
        </div>
    );

    // Панель курьера
    const CourierPanel = () => (
        <div className="role-panel courier-panel">
            <h4>🚴 Панель курьера</h4>
            <div className="courier-actions">
                <button
                    className={`courier-btn ${activeTab === 'current-deliveries' ? 'active' : ''}`}
                    onClick={() => setActiveTab('current-deliveries')}
                >
                    📦 Текущие доставки
                </button>
                <button
                    className={`courier-btn ${activeTab === 'delivery-history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('delivery-history')}
                >
                    📋 История доставок
                </button>
                <button
                    className={`courier-btn ${activeTab === 'update-status' ? 'active' : ''}`}
                    onClick={() => setActiveTab('update-status')}
                >
                    🔄 Обновить статус
                </button>
            </div>
            <div className="courier-info">
                <p><strong>Транспорт:</strong> {user.vehicle || 'Не указан'}</p>
                <p><strong>Зона доставки:</strong> {user.delivery_zone || 'Не указана'}</p>
            </div>
        </div>
    );

    // Вкладка модерации отзывов
    const ModerationTab = () => {
        const [allReviews, setAllReviews] = useState([]);
        const [moderationFilter, setModerationFilter] = useState('pending');

        useEffect(() => {
            // Загружаем все отзывы для модерации
            const allReviewsData = JSON.parse(localStorage.getItem('all_reviews')) || [];
            setAllReviews(allReviewsData);
        }, []);

        const handleApproveReview = (reviewId) => {
            const updatedReviews = allReviews.map(review =>
                review.id === reviewId ? { ...review, status: 'approved' } : review
            );
            setAllReviews(updatedReviews);
            localStorage.setItem('all_reviews', JSON.stringify(updatedReviews));
            alert('Отзыв одобрен и опубликован!');
        };

        const handleRejectReview = (reviewId) => {
            const updatedReviews = allReviews.map(review =>
                review.id === reviewId ? { ...review, status: 'rejected' } : review
            );
            setAllReviews(updatedReviews);
            localStorage.setItem('all_reviews', JSON.stringify(updatedReviews));
            alert('Отзыв отклонен!');
        };

        const filteredReviews = allReviews.filter(review =>
            moderationFilter === 'all' ? true : review.status === moderationFilter
        );

        return (
            <div className="moderation-tab">
                <div className="moderation-header">
                    <h3>Модерация отзывов</h3>
                    <div className="moderation-filters">
                        <button
                            className={`filter-btn ${moderationFilter === 'pending' ? 'active' : ''}`}
                            onClick={() => setModerationFilter('pending')}
                        >
                            ⏳ На модерации ({allReviews.filter(r => r.status === 'pending').length})
                        </button>
                        <button
                            className={`filter-btn ${moderationFilter === 'approved' ? 'active' : ''}`}
                            onClick={() => setModerationFilter('approved')}
                        >
                            ✅ Одобренные ({allReviews.filter(r => r.status === 'approved').length})
                        </button>
                        <button
                            className={`filter-btn ${moderationFilter === 'rejected' ? 'active' : ''}`}
                            onClick={() => setModerationFilter('rejected')}
                        >
                            ❌ Отклоненные ({allReviews.filter(r => r.status === 'rejected').length})
                        </button>
                        <button
                            className={`filter-btn ${moderationFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setModerationFilter('all')}
                        >
                            📊 Все отзывы ({allReviews.length})
                        </button>
                    </div>
                </div>

                <div className="moderation-list">
                    {filteredReviews.map(review => (
                        <div key={review.id} className="moderation-review-card">
                            <div className="review-header">
                                <div className="reviewer-info">
                                    <strong>{review.userName}</strong>
                                    <span className="review-date">{formatDate(review.createdAt)}</span>
                                </div>
                                <div className="review-rating">
                                    {renderStars(review.rating)}
                                </div>
                            </div>

                            <p className="review-restaurant">📍 {review.restaurant}</p>
                            <p className="review-comment">{review.comment}</p>

                            <div className="moderation-actions">
                                <span className={`status-badge ${review.status}`}>
                                    {getReviewStatusText(review.status)}
                                </span>

                                {review.status === 'pending' && (
                                    <>
                                        <button
                                            className="approve-btn"
                                            onClick={() => handleApproveReview(review.id)}
                                        >
                                            ✅ Одобрить
                                        </button>
                                        <button
                                            className="reject-btn"
                                            onClick={() => handleRejectReview(review.id)}
                                        >
                                            ❌ Отклонить
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredReviews.length === 0 && (
                    <div className="no-reviews">
                        <p>Нет отзывов для отображения</p>
                    </div>
                )}
            </div>
        );
    };

    // Определяем доступные вкладки в зависимости от роли
    const getAvailableTabs = () => {
        const baseTabs = [
            { id: 'bookings', name: `Мои бронирования (${bookings.length})`, show: true },
            { id: 'orders', name: `Мои заказы (${orders.length})`, show: true },
            { id: 'reviews', name: `Мои отзывы (${reviews.length})`, show: true },
            { id: 'settings', name: 'Настройки', show: true }
        ];

        // Добавляем вкладки для модераторов и админов
        if (canModerateReviews(user)) {
            baseTabs.push({
                id: 'moderation',
                name: 'Модерация отзывов',
                show: true
            });
        }

        if (user?.role === USER_ROLES.ADMIN) {
            baseTabs.push({
                id: 'user-management',
                name: '👥 Управление пользователями',
                show: true
            });
        }

        if (user?.role === USER_ROLES.ADMIN) {
            baseTabs.push({
                id: 'restaurant-management',
                name: '🏢 Управление ресторанами',
                show: true
            });
        }
        if (user?.role === USER_ROLES.ADMIN) {
            baseTabs.push({
                id: 'menu-management',
                name: '📋 Управление меню',
                show: true
            });
        }

        if (user?.role === USER_ROLES.ADMIN) {
            baseTabs.push({
                id: 'analytics',
                name: '📊 Аналитика',
                show: true
            });
        }

        if (user?.role === USER_ROLES.COURIER) {
            baseTabs.push(
                { id: 'current-deliveries', name: '📦 Текущие доставки', show: true },
                { id: 'delivery-history', name: '📋 История доставок', show: true },
                { id: 'update-status', name: '🔄 Обновить статус', show: true }
            );
        }

        return baseTabs.filter(tab => tab.show);
    };



    const availableTabs = getAvailableTabs();

    return (
        <div className="profile-page">
            <div className="profile-header">
                <h2>Личный кабинет</h2>
                <div className="user-info">
                    <div className="user-avatar">
                        {settings.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="user-details">
                        <h3>{settings.name || user?.name || 'Пользователь'}</h3>
                        <p>{settings.email || user?.email || ''}</p>
                        <p className="user-role">
                            <span className={`role-badge role-${user?.role}`}>
                                {getRoleIcon(user?.role)} {getRoleDisplayName(user?.role)}
                            </span>
                        </p>
                        {user?.restaurant && (
                            <p className="user-restaurant">🏢 Ресторан: {user.restaurant}</p>
                        )}
                        {user?.position && (
                            <p className="user-position">💼 Должность: {user.position}</p>
                        )}
                        <p className="registration-date">
                            Дата регистрации: {user?.registrationDate ? formatDate(user.registrationDate) : 'Неизвестно'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Отображаем панели в зависимости от роли */}
            {user?.role === USER_ROLES.ADMIN && <AdminPanel />}
            {user?.role === USER_ROLES.MODERATOR && <ModeratorPanel />}
            {user?.role === USER_ROLES.STAFF && <StaffPanel />}
            {user?.role === USER_ROLES.COURIER && <CourierPanel />}

            {/* Программа лояльности только для пользователей */}
            {user?.role === USER_ROLES.USER && (
                <div className="loyalty-program">
                    <h4>Программа лояльности</h4>
                    <div className="points-balance">
                        <span className="points">{loyaltyPoints} баллов</span>
                        <p>Каждый рубль = 1 балл</p>
                        <p className="points-info">Используйте баллы для получения скидок!</p>
                    </div>
                </div>
            )}

            <div className="profile-tabs">
                {availableTabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.name}
                    </button>
                ))}
            </div>

            <div className="tab-content">
                {activeTab === 'bookings' && (
                    <div className="bookings-list">
                        <h3>Мои бронирования</h3>

                        {bookings.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📅</div>
                                <h4>У вас пока нет бронирований</h4>
                                <p>Забронируйте столик в одном из наших ресторанов</p>
                                <button className="primary-btn" onClick={handleBookingClick}>
                                    Забронировать стол
                                </button>
                            </div>
                        ) : (
                            <div className="bookings-grid">
                                {bookings.map(booking => (
                                    <div key={booking.id} className="booking-card">
                                        <div className="booking-info">
                                            <h4>{booking.restaurantName || 'Ресторан Matreshka'}</h4>
                                            <p className="booking-date">
                                                📅 {formatDate(booking.date)} в {booking.time || '--:--'}
                                            </p>
                                            <p className="booking-guests">
                                                👥 {booking.guests || 0} {booking.guests === 1 ? 'гость' :
                                                    booking.guests < 5 ? 'гостя' : 'гостей'}
                                            </p>
                                            <p className="booking-name">👤 {booking.customerName || 'Не указано'}</p>
                                            <p className="booking-phone">📞 {booking.phone || 'Не указан'}</p>
                                            {booking.specialRequests && (
                                                <p className="booking-requests">💬 Особые пожелания: {booking.specialRequests}</p>
                                            )}
                                            <p className="booking-id">🆔 Номер брони: {booking.id}</p>
                                            <span className={`status ${booking.status || 'confirmed'}`}>
                                                {booking.status === 'confirmed' ? '✅ Подтверждено' :
                                                    booking.status === 'pending' ? '⏳ Ожидание подтверждения' :
                                                        '✅ Подтверждено'}
                                            </span>
                                        </div>
                                        <div className="booking-actions">
                                            <button
                                                className="cancel-btn"
                                                onClick={() => handleCancelBooking(booking.id)}
                                            >
                                                Отменить
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="orders-list">
                        <h3>История заказов</h3>

                        {orders.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🍽️</div>
                                <h4>У вас пока нет заказов</h4>
                                <p>Сделайте свой первый заказ из нашего меню</p>
                                <button className="primary-btn" onClick={() => window.location.href = '/menu'}>
                                    Перейти к меню
                                </button>
                            </div>
                        ) : (
                            <div className="orders-grid">
                                {orders.map(order => (
                                    <div key={order.id} className="order-card">
                                        <div className="order-info">
                                            <h4>Заказ #{order.id}</h4>
                                            <div className="order-items">
                                                <strong>Блюда:</strong>
                                                <ul>
                                                    {order.items && order.items.map((item, index) => (
                                                        <li key={index}>{item.name} × {item.quantity}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <p className="order-total">💰 Сумма: {order.total || 0} ₽</p>
                                            <p className="order-date">📅 {order.date ? formatDate(order.date) : 'Неизвестно'}</p>
                                            <p className="order-address">🏠 Адрес доставки: {order.deliveryAddress || 'Не указан'}</p>
                                            <span className={`status ${order.status || 'processing'}`}>
                                                {order.status === 'delivered' ? '✅ Доставлен' :
                                                    order.status === 'cooking' ? '👨‍🍳 Готовится' :
                                                        order.status === 'on_way' ? '🚗 В пути' :
                                                            '📦 Обрабатывается'}
                                            </span>
                                        </div>
                                        <div className="order-actions">
                                            <button
                                                className="details-btn"
                                                onClick={() => openOrderDetails(order)}
                                            >
                                                Подробнее
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="reviews-tab">
                        <div className="reviews-header">
                            <h3>Мои отзывы</h3>
                            <button className="write-review-btn" onClick={openReviewForm}>
                                ✏️ Написать новый отзыв
                            </button>
                        </div>

                        {reviews.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">⭐</div>
                                <h4>У вас пока нет отзывов</h4>
                                <p>Поделитесь своим мнением о посещении наших ресторанов</p>
                                <button className="primary-btn" onClick={openReviewForm}>
                                    Написать отзыв
                                </button>
                            </div>
                        ) : (
                            <div className="reviews-content">
                                <div className="reviews-stats">
                                    <p>Всего отзывов: <strong>{reviews.length}</strong></p>
                                    <p>
                                        Опубликовано: <strong>{reviews.filter(r => r.status === 'approved').length}</strong> |
                                        На модерации: <strong>{reviews.filter(r => r.status === 'pending').length}</strong>
                                    </p>
                                </div>

                                <div className="reviews-grid">
                                    {reviews.map(review => (
                                        <div key={review.id} className="review-card">
                                            <div className="review-header">
                                                <div className="review-title">
                                                    <h4>{review.restaurant}</h4>
                                                    <div className="review-rating">
                                                        <span className="stars">{renderStars(review.rating)}</span>
                                                        <span className="rating-number">({review.rating}/5)</span>
                                                    </div>
                                                </div>
                                                <div className="review-status">
                                                    <span className={`status-badge ${review.status}`}>
                                                        {getReviewStatusText(review.status)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="review-content">
                                                <p className="review-comment">{review.comment}</p>
                                                <div className="review-meta">
                                                    <span className="review-date">
                                                        📅 {formatDate(review.visitDate || review.createdAt)}
                                                    </span>
                                                    {review.likes > 0 && (
                                                        <span className="review-likes">👍 {review.likes}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="review-actions">
                                                {review.status === 'pending' && (
                                                    <button
                                                        className="edit-btn"
                                                        onClick={() => handleEditReview(review)}
                                                    >
                                                        ✏️ Редактировать
                                                    </button>
                                                )}
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleDeleteReview(review.id)}
                                                >
                                                    🗑️ Удалить
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'moderation' && (
                    <ModerationTab />
                )}

                {activeTab === 'user-management' && <UserManagement />}

                {activeTab === 'restaurant-management' && <RestaurantManagement />}

                {activeTab === 'menu-management' && <MenuManagement />}

                {activeTab === 'analytics' && <Analytics />}

                {activeTab === 'current-deliveries' && <CourierDeliveries />}
                {activeTab === 'delivery-history' && <CourierHistory />}
                {activeTab === 'update-status' && <CourierStatus />}

                {activeTab === 'settings' && (
                    <div className="settings-form">
                        <h3>Настройки профиля</h3>
                        <form onSubmit={handleSaveSettings}>
                            <div className="form-group">
                                <label>Имя:</label>
                                <input
                                    type="text"
                                    value={settings.name}
                                    onChange={(e) => handleSettingsChange('name', e.target.value)}
                                    placeholder="Введите ваше имя"
                                />
                            </div>

                            <div className="form-group">
                                <label>Email:</label>
                                <input
                                    type="email"
                                    value={settings.email}
                                    onChange={(e) => handleSettingsChange('email', e.target.value)}
                                    placeholder="Введите ваш email"
                                />
                            </div>

                            <div className="form-group">
                                <label>Телефон:</label>
                                <input
                                    type="tel"
                                    value={settings.phone}
                                    onChange={(e) => handleSettingsChange('phone', e.target.value)}
                                    placeholder="+7 (XXX) XXX-XX-XX"
                                />
                            </div>

                            <div className="form-group">
                                <label>Предпочтения в еде:</label>
                                <div className="preferences">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={settings.preferences.vegetarian}
                                            onChange={(e) => handlePreferenceChange('vegetarian', e.target.checked)}
                                        />
                                        Вегетарианские блюда
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={settings.preferences.spicy}
                                            onChange={(e) => handlePreferenceChange('spicy', e.target.checked)}
                                        />
                                        Острые блюда
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={settings.preferences.glutenFree}
                                            onChange={(e) => handlePreferenceChange('glutenFree', e.target.checked)}
                                        />
                                        Без глютена
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Уведомления:</label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.email}
                                        onChange={(e) => handleNotificationChange('email', e.target.checked)}
                                    />
                                    Email уведомления
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.sms}
                                        onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                                    />
                                    SMS уведомления
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.promotions}
                                        onChange={(e) => handleNotificationChange('promotions', e.target.checked)}
                                    />
                                    Уведомления об акциях
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="save-btn"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                            </button>
                        </form>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Profile;