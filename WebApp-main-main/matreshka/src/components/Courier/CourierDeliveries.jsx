import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../utils/api';
import './Courier.css';

const CourierDeliveries = () => {
    const { user } = useAuth();
    const [currentDeliveries, setCurrentDeliveries] = useState([]);
    const [availableOrders, setAvailableOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('current'); // 'current', 'available'
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [stats, setStats] = useState({
        active: 0,
        available: 0,
        today: 0
    });

    useEffect(() => {
        if (user && user.role === 'courier') {
            loadCourierData();
        }
    }, [user, activeTab]);

    const loadCourierData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('🚴 Loading courier data for:', user?.name);
            
            if (activeTab === 'current') {
                // Загружаем текущие доставки курьера
                try {
                    const courierOrders = await ApiService.getCourierOrders(user.id);
                    console.log('📦 Courier orders:', courierOrders);
                    
                    const current = courierOrders.filter(order => 
                        order.status === 'on_way' || order.status === 'accepted' || order.status === 'ready'
                    );
                    setCurrentDeliveries(current);
                    
                    // Обновляем статистику
                    setStats(prev => ({
                        ...prev,
                        active: current.length
                    }));
                    
                } catch (orderError) {
                    console.error('Error loading courier orders:', orderError);
                    // Используем тестовые данные если API недоступен
                    setCurrentDeliveries(getMockCurrentDeliveries());
                }
            } else {
                // Загружаем доступные заказы
                try {
                    const available = await ApiService.getAvailableOrdersForCourier();
                    console.log('🎯 Available orders:', available);
                    setAvailableOrders(available);
                    
                    // Обновляем статистику
                    setStats(prev => ({
                        ...prev,
                        available: available.length
                    }));
                    
                } catch (availableError) {
                    console.error('Error loading available orders:', availableError);
                    // Используем тестовые данные
                    setAvailableOrders(getMockAvailableOrders());
                }
            }
            
        } catch (err) {
            console.error('Error in loadCourierData:', err);
            setError('Не удалось загрузить данные доставок. Проверьте подключение к серверу.');
            
            // Показываем тестовые данные при ошибке
            if (activeTab === 'current') {
                setCurrentDeliveries(getMockCurrentDeliveries());
            } else {
                setAvailableOrders(getMockAvailableOrders());
            }
        } finally {
            setLoading(false);
        }
    };

    // Тестовые данные для демонстрации
    const getMockCurrentDeliveries = () => {
        return [
            {
                id: 101,
                status: 'on_way',
                total: 1250.00,
                restaurant_name: 'Matreshka Центр',
                delivery_address: 'ул. Тверская, д. 15, кв. 45',
                user_name: 'Иванов Иван',
                user_phone: '+7 (999) 111-11-11',
                created_at: new Date().toISOString()
            },
            {
                id: 102,
                status: 'accepted',
                total: 890.00,
                restaurant_name: 'Matreshka Север',
                delivery_address: 'пр. Мира, д. 30, кв. 12',
                user_name: 'Петрова Мария',
                user_phone: '+7 (999) 222-22-22',
                created_at: new Date().toISOString()
            }
        ];
    };

    const getMockAvailableOrders = () => {
        return [
            {
                id: 103,
                status: 'ready',
                total: 1560.00,
                restaurant_name: 'Matreshka Центр',
                delivery_address: 'ул. Ленина, д. 8, кв. 67',
                user_name: 'Сидоров Алексей',
                user_phone: '+7 (999) 333-33-33',
                created_at: new Date().toISOString()
            },
            {
                id: 104,
                status: 'preparing',
                total: 740.00,
                restaurant_name: 'Matreshka Юг',
                delivery_address: 'ул. Гагарина, д. 25, кв. 34',
                user_name: 'Козлова Анна',
                user_phone: '+7 (999) 444-44-44',
                created_at: new Date().toISOString()
            }
        ];
    };

    const acceptOrder = async (orderId) => {
        try {
            await ApiService.updateOrderCourierStatus(orderId, 'accepted', user.id);
            alert('Заказ принят в доставку!');
            loadCourierData(); // Перезагружаем данные
        } catch (err) {
            console.error('Error accepting order:', err);
            alert('Ошибка при принятии заказа. Заказ принят в демо-режиме.');
            
            // В демо-режиме просто обновляем локальные данные
            const updatedAvailable = availableOrders.filter(order => order.id !== orderId);
            setAvailableOrders(updatedAvailable);
            
            const acceptedOrder = availableOrders.find(order => order.id === orderId);
            if (acceptedOrder) {
                acceptedOrder.status = 'accepted';
                setCurrentDeliveries(prev => [...prev, acceptedOrder]);
            }
        }
    };

    const updateDeliveryStatus = async (orderId, newStatus) => {
        try {
            await ApiService.updateOrderCourierStatus(orderId, newStatus, user.id);
            
            if (newStatus === 'delivered') {
                alert('Заказ доставлен! Заказ завершен.');
            } else {
                alert(`Статус обновлен: ${getStatusText(newStatus)}`);
            }
            
            loadCourierData(); // Перезагружаем данные
            
        } catch (err) {
            console.error('Error updating delivery status:', err);
            alert('Ошибка при обновлении статуса. Обновлено в демо-режиме.');
            
            // В демо-режиме обновляем локальные данные
            const updatedDeliveries = currentDeliveries.map(order => 
                order.id === orderId ? { ...order, status: newStatus } : order
            );
            setCurrentDeliveries(updatedDeliveries);
            
            if (newStatus === 'delivered') {
                // Удаляем из текущих доставок
                setTimeout(() => {
                    const filteredDeliveries = currentDeliveries.filter(order => order.id !== orderId);
                    setCurrentDeliveries(filteredDeliveries);
                }, 1000);
            }
        }
    };

    const getStatusText = (status) => {
        const statuses = {
            'pending': 'Ожидает',
            'accepted': 'Принят курьером',
            'preparing': 'Готовится',
            'ready': 'Готов к выдаче',
            'on_way': 'В пути',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        };
        return statuses[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'warning',
            'accepted': 'info',
            'preparing': 'preparing',
            'ready': 'ready',
            'on_way': 'primary',
            'delivered': 'success',
            'cancelled': 'error'
        };
        return colors[status] || 'default';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Не указано';
        try {
            return new Date(dateString).toLocaleString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
            });
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

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Загрузка данных доставок...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-icon">⚠️</div>
                <h3>Внимание</h3>
                <p>{error}</p>
                <p className="demo-notice">Работаем в демо-режиме с тестовыми данными</p>
                <div className="action-buttons">
                    <button 
                        className="retry-btn"
                        onClick={loadCourierData}
                    >
                        🔄 Повторить попытку
                    </button>
                    <button 
                        className="demo-btn"
                        onClick={() => setError(null)}
                    >
                        Продолжить с тестовыми данными
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="courier-deliveries">
            {/* Заголовок */}
            <div className="courier-header">
                <h2>🚴 Мои доставки</h2>
                <p className="courier-name">
                    Курьер: <strong>{user?.name}</strong>
                    <span className="vehicle-badge">🚲 {user?.vehicle || 'Велосипед'}</span>
                </p>
                <p className="zone-info">
                    Зона доставки: <strong>{user?.delivery_zone || 'Все районы'}</strong>
                </p>
                <div className="demo-badge">Демо-режим</div>
            </div>

            {/* Статистика */}
            <div className="courier-stats">
                <div className="stat-card">
                    <span className="stat-number">{stats.active}</span>
                    <span className="stat-label">Активные доставки</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{stats.available}</span>
                    <span className="stat-label">Доступные заказы</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{stats.today || 0}</span>
                    <span className="stat-label">Сегодня доставлено</span>
                </div>
            </div>

            {/* Вкладки */}
            <div className="tabs-container">
                <div className="tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`}
                        onClick={() => setActiveTab('current')}
                    >
                        📦 Текущие доставки ({currentDeliveries.length})
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
                        onClick={() => setActiveTab('available')}
                    >
                        🎯 Доступные заказы ({availableOrders.length})
                    </button>
                </div>
            </div>

            {/* Контент вкладок */}
            <div className="tab-content">
                {activeTab === 'current' ? (
                    currentDeliveries.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📦</div>
                            <h3>Нет текущих доставок</h3>
                            <p>У вас нет активных заказов для доставки</p>
                            <button 
                                className="btn available-btn"
                                onClick={() => setActiveTab('available')}
                            >
                                Посмотреть доступные заказы
                            </button>
                        </div>
                    ) : (
                        <div className="deliveries-list">
                            {currentDeliveries.map((order) => (
                                <div key={order.id} className="delivery-card">
                                    <div className="delivery-header">
                                        <h4>Доставка #{order.id}</h4>
                                        <span className={`status-badge ${getStatusColor(order.status)}`}>
                                            {getStatusText(order.status)}
                                        </span>
                                    </div>

                                    <div className="delivery-info">
                                        <div className="info-row">
                                            <span className="label">💰 Сумма:</span>
                                            <span>{formatCurrency(order.total)}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">🏢 Из ресторана:</span>
                                            <span>{order.restaurant_name || 'Ресторан'}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">📍 Адрес доставки:</span>
                                            <span className="address">{order.delivery_address}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">👤 Получатель:</span>
                                            <span>{order.user_name}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">📞 Телефон:</span>
                                            <span>{order.user_phone}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">🕒 Время заказа:</span>
                                            <span>{formatDate(order.created_at)}</span>
                                        </div>
                                    </div>

                                    <div className="delivery-actions">
                                        {order.status === 'accepted' && (
                                            <button
                                                className="btn start-btn"
                                                onClick={() => updateDeliveryStatus(order.id, 'on_way')}
                                            >
                                                🚀 Начать доставку
                                            </button>
                                        )}
                                        
                                        {order.status === 'on_way' && (
                                            <button
                                                className="btn complete-btn"
                                                onClick={() => updateDeliveryStatus(order.id, 'delivered')}
                                            >
                                                ✅ Завершить доставку
                                            </button>
                                        )}
                                        
                                        {order.status === 'ready' && (
                                            <button
                                                className="btn accept-ready-btn"
                                                onClick={() => updateDeliveryStatus(order.id, 'accepted')}
                                            >
                                                📦 Забрать заказ
                                            </button>
                                        )}
                                        
                                        <button
                                            className="btn details-btn"
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            📋 Подробнее
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    availableOrders.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🎯</div>
                            <h3>Нет доступных заказов</h3>
                            <p>В данный момент нет новых заказов для доставки</p>
                            <button 
                                className="btn refresh-btn"
                                onClick={loadCourierData}
                            >
                                🔄 Обновить
                            </button>
                        </div>
                    ) : (
                        <div className="available-orders">
                            {availableOrders.map((order) => (
                                <div key={order.id} className="order-card available">
                                    <div className="order-header">
                                        <h4>Заказ #{order.id}</h4>
                                        <div className="order-meta">
                                            <span className="order-status">{getStatusText(order.status)}</span>
                                            <span className="order-distance">🚴 ~15-25 мин</span>
                                        </div>
                                    </div>

                                    <div className="order-info">
                                        <div className="info-row">
                                            <span className="label">💰 Сумма:</span>
                                            <span className="amount">{formatCurrency(order.total)}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">🏢 Ресторан:</span>
                                            <span>{order.restaurant_name}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">📍 Адрес:</span>
                                            <span className="address">{order.delivery_address}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">👤 Клиент:</span>
                                            <span>{order.user_name}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="label">🕒 Создан:</span>
                                            <span>{formatDate(order.created_at)}</span>
                                        </div>
                                    </div>

                                    <div className="order-actions">
                                        <button
                                            className="btn accept-btn"
                                            onClick={() => acceptOrder(order.id)}
                                        >
                                            ✅ Принять заказ
                                        </button>
                                        <button
                                            className="btn details-btn"
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            👁️ Посмотреть
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Модальное окно с деталями */}
            {selectedOrder && (
                <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Детали заказа #{selectedOrder.id}</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setSelectedOrder(null)}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="detail-section">
                                <h4>📦 Информация о заказе</h4>
                                <p><strong>Статус:</strong> {getStatusText(selectedOrder.status)}</p>
                                <p><strong>Сумма:</strong> {formatCurrency(selectedOrder.total)}</p>
                                <p><strong>Ресторан:</strong> {selectedOrder.restaurant_name}</p>
                                <p><strong>Адрес доставки:</strong> {selectedOrder.delivery_address}</p>
                                <p><strong>Клиент:</strong> {selectedOrder.user_name}</p>
                                <p><strong>Телефон:</strong> {selectedOrder.user_phone}</p>
                                <p><strong>Создан:</strong> {formatDate(selectedOrder.created_at)}</p>
                            </div>
                            
                            <div className="detail-section">
                                <h4>🚴 Инструкция для курьера</h4>
                                <ol className="instructions">
                                    <li>Подтвердите получение заказа в ресторане</li>
                                    <li>Проверьте целостность упаковки</li>
                                    <li>Сообщите клиенту о выезде</li>
                                    <li>Соблюдайте ПДД и правила доставки</li>
                                    <li>Получите подтверждение от клиента</li>
                                </ol>
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                className="btn close-modal-btn"
                                onClick={() => setSelectedOrder(null)}
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Панель управления */}
            <div className="courier-controls">
                <button 
                    className="btn refresh-btn"
                    onClick={loadCourierData}
                >
                    🔄 Обновить список
                </button>
                <button 
                    className="btn help-btn"
                    onClick={() => alert('Для работы с заказами:\n1. Примите доступный заказ\n2. Заберите его в ресторане\n3. Начните доставку\n4. Завершите при успешной доставке')}
                >
                    ❓ Помощь
                </button>
            </div>
            
            {/* Демо-уведомление */}
            <div className="demo-notification">
                <p>⚠️ Работа в демо-режиме. Данные не сохраняются в базу.</p>
            </div>
        </div>
    );
};

export default CourierDeliveries;