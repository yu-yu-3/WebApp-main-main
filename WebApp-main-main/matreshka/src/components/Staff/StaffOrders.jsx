import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../utils/api';
import './Staff.css';

const StaffOrders = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [orderDetails, setOrderDetails] = useState({});
    
    // Фильтры
    const [statusFilter, setStatusFilter] = useState('all');
    const [showDetails, setShowDetails] = useState({});

    // Статистика
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        preparing: 0,
        ready: 0,
        on_way: 0,
        delivered: 0,
        cancelled: 0,
        totalAmount: 0
    });

    useEffect(() => {
        loadOrders();
    }, [user]);

    useEffect(() => {
        filterOrders();
    }, [orders, statusFilter]);

    const loadOrders = async () => {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Loading orders for staff:', user);
        
        try {
            let data = [];
            
            // Сначала пробуем получить все заказы
            try {
                console.log('📡 Fetching all orders from API...');
                const allOrders = await ApiService.getOrders();
                console.log('✅ All orders loaded:', allOrders);
                
                if (user?.restaurant) {
                    // Фильтруем по ресторану сотрудника
                    data = allOrders.filter(order => {
                        const matches = order.restaurant_name === user.restaurant || 
                                       order.restaurant === user.restaurant;
                        console.log(`   Order ${order.id}: ${order.restaurant_name} vs ${user.restaurant} -> ${matches}`);
                        return matches;
                    });
                    console.log(`✅ Filtered ${data.length} orders for ${user.restaurant}`);
                } else {
                    data = allOrders;
                    console.log('⚠️ No restaurant specified, showing all orders');
                }
                
            } catch (apiError) {
                console.error('API error:', apiError);
                // Пробуем альтернативный метод
                data = await loadOrdersAlternative();
            }
            
            setOrders(data);
            calculateStats(data);
            
        } catch (err) {
            console.error('Error in loadOrders:', err);
            setError(`Ошибка загрузки заказов: ${err.message || 'Неизвестная ошибка'}`);
        } finally {
            setLoading(false);
        }
    };


    
    const loadOrdersAlternative = async () => {
        try {
            console.log('🔄 Using alternative method to load orders...');
            
            // Пробуем получить ресторан по названию
            const restaurants = await ApiService.getAllRestaurants();
            const userRestaurant = restaurants.find(r => r.name === user?.restaurant);
            
            if (userRestaurant) {
                try {
                    // Пробуем staff endpoint
                    const staffOrders = await ApiService.getStaffOrders(userRestaurant.id, 'all');
                    console.log('✅ Staff orders:', staffOrders);
                    return staffOrders;
                } catch (staffError) {
                    console.log('Staff endpoint failed');
                }
            }
            
            // Если все провалилось, возвращаем пустой массив
            return [];
            
        } catch (err) {
            console.error('Alternative method failed:', err);
            return [];
        }
    };

    const filterOrders = () => {
        if (statusFilter === 'all') {
            setFilteredOrders(orders);
        } else {
            const filtered = orders.filter(order => order.status === statusFilter);
            setFilteredOrders(filtered);
        }
    };

    const calculateStats = (ordersList) => {
        const stats = {
            total: ordersList.length,
            pending: ordersList.filter(o => o.status === 'pending').length,
            preparing: ordersList.filter(o => o.status === 'preparing').length,
            ready: ordersList.filter(o => o.status === 'ready').length,
            on_way: ordersList.filter(o => o.status === 'on_way').length,
            delivered: ordersList.filter(o => o.status === 'delivered').length,
            cancelled: ordersList.filter(o => o.status === 'cancelled').length,
            totalAmount: ordersList.reduce((sum, order) => sum + parseFloat(order.total || 0), 0)
        };
        setStats(stats);
    };

    const loadOrderItems = async (orderId) => {
        try {
            console.log(`📦 Loading items for order ${orderId}...`);
            const items = await ApiService.getOrderItems(orderId);
            console.log(`✅ Items loaded for order ${orderId}:`, items);
            
            setOrderDetails(prev => ({
                ...prev,
                [orderId]: items
            }));
        } catch (err) {
            console.error(`Error loading items for order ${orderId}:`, err);
            setOrderDetails(prev => ({
                ...prev,
                [orderId]: []
            }));
        }
    };

    const toggleOrderDetails = (orderId) => {
        const newShowDetails = { ...showDetails };
        newShowDetails[orderId] = !newShowDetails[orderId];
        setShowDetails(newShowDetails);
        
        // Загружаем items если еще не загружены
        if (newShowDetails[orderId] && !orderDetails[orderId]) {
            loadOrderItems(orderId);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            console.log(`🔄 Updating order ${orderId} status to ${newStatus}`);
            
            await ApiService.updateOrderStatus(orderId, newStatus);
            alert(`Статус заказа #${orderId} обновлен на: ${getStatusText(newStatus)}`);
            
            // Обновляем локальные данные
            const updatedOrders = orders.map(order => 
                order.id === orderId 
                    ? { ...order, status: newStatus } 
                    : order
            );
            
            setOrders(updatedOrders);
            calculateStats(updatedOrders);
            
        } catch (err) {
            console.error('Error updating order status:', err);
            alert('Ошибка при обновлении статуса заказа');
        }
    };

    const getStatusText = (status) => {
        const statusMap = {
            'pending': 'Ожидает подтверждения',
            'confirmed': 'Подтвержден',
            'preparing': 'Готовится',
            'ready': 'Готов к выдаче',
            'on_way': 'В пути',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'warning',
            'confirmed': 'info',
            'preparing': 'preparing',
            'ready': 'ready',
            'on_way': 'primary',
            'delivered': 'success',
            'cancelled': 'error'
        };
        return colors[status] || 'default';
    };

    const getAvailableStatuses = (currentStatus) => {
        const statusFlow = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['preparing', 'cancelled'],
            'preparing': ['ready', 'cancelled'],
            'ready': ['on_way', 'delivered'],
            'on_way': ['delivered', 'cancelled'],
            'delivered': [],
            'cancelled': []
        };
        return statusFlow[currentStatus] || [];
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Не указана';
        try {
            return new Date(dateString).toLocaleString('ru-RU');
        } catch {
            return dateString;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const handleClearFilters = () => {
        setStatusFilter('all');
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Загрузка заказов...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-icon">❌</div>
                <h3>Ошибка загрузки заказов</h3>
                <p>{error}</p>
                <button 
                    className="retry-btn"
                    onClick={loadOrders}
                >
                    🔄 Повторить попытку
                </button>
            </div>
        );
    }

    return (
        <div className="staff-orders">
            {/* Заголовок */}
            <div className="staff-header">
                <h2>🍽️ Управление заказами</h2>
                <p className="restaurant-name">
                    Ресторан: <strong>{user?.restaurant || 'Не указан'}</strong>
                </p>
                <p className="orders-count">
                    Найдено заказов: <strong>{orders.length}</strong>
                </p>
            </div>

            {/* Статистика */}
            <div className="stats-grid">
                <div className="stat-card total">
                    <span className="stat-number">{stats.total}</span>
                    <span className="stat-label">Всего</span>
                </div>
                <div className="stat-card pending">
                    <span className="stat-number">{stats.pending}</span>
                    <span className="stat-label">Ожидают</span>
                </div>
                <div className="stat-card preparing">
                    <span className="stat-number">{stats.preparing}</span>
                    <span className="stat-label">Готовятся</span>
                </div>
                <div className="stat-card ready">
                    <span className="stat-number">{stats.ready}</span>
                    <span className="stat-label">Готовы</span>
                </div>
                <div className="stat-card on_way">
                    <span className="stat-number">{stats.on_way}</span>
                    <span className="stat-label">В пути</span>
                </div>
                <div className="stat-card delivered">
                    <span className="stat-number">{stats.delivered}</span>
                    <span className="stat-label">Доставлено</span>
                </div>
                <div className="stat-card cancelled">
                    <span className="stat-number">{stats.cancelled}</span>
                    <span className="stat-label">Отменено</span>
                </div>
                <div className="stat-card total-amount">
                    <span className="stat-number">{formatCurrency(stats.totalAmount)}</span>
                    <span className="stat-label">Общая сумма</span>
                </div>
            </div>

            {/* Фильтры и управление */}
            <div className="controls-section">
                <div className="filters">
                    <div className="filter-group">
                        <label htmlFor="status-filter">Фильтр по статусу:</label>
                        <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">Все статусы</option>
                            <option value="pending">Ожидают подтверждения</option>
                            <option value="confirmed">Подтверждены</option>
                            <option value="preparing">Готовятся</option>
                            <option value="ready">Готовы к выдаче</option>
                            <option value="on_way">В пути</option>
                            <option value="delivered">Доставлены</option>
                            <option value="cancelled">Отменены</option>
                        </select>
                    </div>
                </div>

                <div className="action-buttons">
                    <button 
                        className="btn refresh-btn"
                        onClick={loadOrders}
                    >
                        🔄 Обновить список
                    </button>
                    <button 
                        className="btn clear-btn"
                        onClick={handleClearFilters}
                    >
                        🗑️ Очистить фильтры
                    </button>
                    <button 
                        className="btn debug-btn"
                        onClick={() => console.log('Orders data:', orders)}
                    >
                        🐛 Отладка
                    </button>
                </div>
            </div>

            {/* Список заказов */}
            {filteredOrders.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🍽️</div>
                    <h3>Заказы не найдены</h3>
                    <p>
                        {orders.length === 0 
                            ? 'В вашем ресторане пока нет заказов'
                            : `Нет заказов со статусом "${getStatusText(statusFilter)}"`}
                    </p>
                </div>
            ) : (
                <div className="orders-list">
                    {filteredOrders.map((order) => {
                        const availableStatuses = getAvailableStatuses(order.status);
                        const isExpanded = showDetails[order.id];
                        const items = orderDetails[order.id] || [];
                        
                        return (
                            <div key={order.id} className="order-card">
                                {/* Заголовок заказа */}
                                <div className="order-header">
                                    <div className="order-title">
                                        <h4>Заказ #{order.id}</h4>
                                        <span className="order-date">
                                            📅 {formatDate(order.created_at)}
                                        </span>
                                    </div>
                                    <span className={`status-badge ${getStatusColor(order.status)}`}>
                                        {getStatusText(order.status)}
                                    </span>
                                </div>

                                {/* Основная информация */}
                                <div className="order-main-info">
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <span className="info-label">👤 Клиент:</span>
                                            <span className="info-value">
                                                {order.user_name || 'Неизвестный'}
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">📞 Телефон:</span>
                                            <span className="info-value">
                                                {order.user_phone || order.phone || 'Не указан'}
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">📍 Адрес:</span>
                                            <span className="info-value">
                                                {order.delivery_address || 'Самовывоз'}
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">💰 Сумма:</span>
                                            <span className="info-value amount">
                                                {formatCurrency(order.total)}
                                            </span>
                                        </div>
                                        {order.courier_name && (
                                            <div className="info-item">
                                                <span className="info-label">🚴 Курьер:</span>
                                                <span className="info-value">
                                                    {order.courier_name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Кнопка деталей */}
                                <div className="order-details-toggle">
                                    <button 
                                        className="toggle-details-btn"
                                        onClick={() => toggleOrderDetails(order.id)}
                                    >
                                        {isExpanded ? '▲ Скрыть детали' : '▼ Показать детали'}
                                    </button>
                                </div>

                                {/* Детали заказа (раскрывающиеся) */}
                                {isExpanded && (
                                    <div className="order-details-expanded">
                                        <h5>Состав заказа:</h5>
                                        
                                        {items.length > 0 ? (
                                            <div className="order-items-list">
                                                {items.map((item, index) => (
                                                    <div key={index} className="order-item">
                                                        <div className="item-info">
                                                            <span className="item-name">
                                                                {item.item_name || item.name || `Блюдо #${item.menu_item_id}`}
                                                            </span>
                                                            <span className="item-quantity">
                                                                × {item.quantity}
                                                            </span>
                                                        </div>
                                                        <div className="item-price">
                                                            {formatCurrency(item.price * item.quantity)}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="order-total">
                                                    <strong>Итого:</strong>
                                                    <strong>{formatCurrency(order.total)}</strong>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="loading-items">
                                                <div className="small-spinner"></div>
                                                <span>Загрузка состава заказа...</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Действия */}
                                <div className="order-actions">
                                    {availableStatuses.length > 0 ? (
                                        <div className="status-selector">
                                            <select
                                                defaultValue=""
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        updateOrderStatus(order.id, e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                                className="status-select"
                                            >
                                                <option value="" disabled>
                                                    Изменить статус...
                                                </option>
                                                {availableStatuses.map(status => (
                                                    <option key={status} value={status}>
                                                        {getStatusText(status)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <span className="no-actions">
                                            Действия недоступны
                                        </span>
                                    )}
                                    
                                    <button 
                                        className="btn details-btn"
                                        onClick={() => toggleOrderDetails(order.id)}
                                    >
                                        {isExpanded ? '📋 Скрыть' : '📋 Подробности'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Статистика отображения */}
            <div className="display-info">
                <p>
                    Показано: <strong>{filteredOrders.length}</strong> из <strong>{orders.length}</strong> заказов
                    {statusFilter !== 'all' && ` (фильтр: ${getStatusText(statusFilter)})`}
                </p>
            </div>

            {/* Отладочная информация */}
            <div className="debug-info">
                <details>
                    <summary>Отладочная информация</summary>
                    <div className="debug-content">
                        <p><strong>Пользователь:</strong> {user?.name} ({user?.role})</p>
                        <p><strong>Ресторан:</strong> {user?.restaurant}</p>
                        <p><strong>Заказов загружено:</strong> {orders.length}</p>
                        <p><strong>Отфильтровано:</strong> {filteredOrders.length}</p>
                        <button 
                            className="btn test-api-btn"
                            onClick={async () => {
                                try {
                                    const result = await ApiService.testConnection();
                                    alert(`API доступен: ${result.message}`);
                                } catch (err) {
                                    alert(`API недоступен: ${err.message}`);
                                }
                            }}
                        >
                            Проверить API
                        </button>
                    </div>
                </details>
            </div>
        </div>
    );
};

export default StaffOrders;