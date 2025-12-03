import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Courier.css';

const CourierHistory = () => {
    const { user } = useAuth();
    const [deliveryHistory, setDeliveryHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Тестовые данные для истории
    const mockHistory = [
        {
            id: 201,
            status: 'delivered',
            total: 1250.00,
            restaurant_name: 'Matreshka Центр',
            delivery_address: 'ул. Тверская, д. 15, кв. 45',
            user_name: 'Иванов Иван',
            user_phone: '+7 (999) 111-11-11',
            created_at: '2024-12-19T18:30:00',
            completed_at: '2024-12-19T19:15:00'
        },
        {
            id: 202,
            status: 'delivered',
            total: 890.00,
            restaurant_name: 'Matreshka Север',
            delivery_address: 'пр. Мира, д. 30, кв. 12',
            user_name: 'Петрова Мария',
            user_phone: '+7 (999) 222-22-22',
            created_at: '2024-12-18T20:00:00',
            completed_at: '2024-12-18T20:45:00'
        },
        {
            id: 203,
            status: 'cancelled',
            total: 1560.00,
            restaurant_name: 'Matreshka Центр',
            delivery_address: 'ул. Ленина, д. 8, кв. 67',
            user_name: 'Сидоров Алексей',
            user_phone: '+7 (999) 333-33-33',
            created_at: '2024-12-17T19:30:00',
            completed_at: '2024-12-17T20:00:00'
        }
    ];

    useEffect(() => {
        setLoading(true);
        // Имитация загрузки данных
        setTimeout(() => {
            setDeliveryHistory(mockHistory);
            setLoading(false);
        }, 1000);
    }, []);

    const getStatusText = (status) => {
        const statuses = {
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        };
        return statuses[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            'delivered': 'success',
            'cancelled': 'error'
        };
        return colors[status] || 'default';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Не указано';
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

    const calculateDeliveryTime = (created, completed) => {
        if (!created || !completed) return 'Н/Д';
        const start = new Date(created);
        const end = new Date(completed);
        const diff = Math.round((end - start) / 60000); // минуты
        return `${diff} мин`;
    };

    const stats = {
        total: deliveryHistory.length,
        delivered: deliveryHistory.filter(h => h.status === 'delivered').length,
        cancelled: deliveryHistory.filter(h => h.status === 'cancelled').length,
        totalEarnings: deliveryHistory
            .filter(h => h.status === 'delivered')
            .reduce((sum, h) => sum + parseFloat(h.total || 0), 0)
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Загрузка истории доставок...</p>
            </div>
        );
    }

    return (
        <div className="courier-history">
            {/* Заголовок */}
            <div className="courier-header">
                <h2>📜 История доставок</h2>
                <p className="courier-name">
                    Курьер: <strong>{user?.name}</strong>
                </p>
                <div className="demo-badge">Демо-режим</div>
            </div>

            {/* Статистика */}
            <div className="history-stats">
                <div className="stat-card">
                    <span className="stat-number">{stats.total}</span>
                    <span className="stat-label">Всего доставок</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{stats.delivered}</span>
                    <span className="stat-label">Успешных</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{stats.cancelled}</span>
                    <span className="stat-label">Отменено</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{formatCurrency(stats.totalEarnings)}</span>
                    <span className="stat-label">Общий доход</span>
                </div>
            </div>

            {/* История доставок */}
            {deliveryHistory.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📜</div>
                    <h3>История доставок пуста</h3>
                    <p>У вас еще нет завершенных доставок</p>
                </div>
            ) : (
                <div className="history-list">
                    {deliveryHistory.map((history) => (
                        <div key={history.id} className="history-card">
                            <div className="history-header">
                                <div className="order-info">
                                    <h4>Доставка #{history.id}</h4>
                                    <span className="order-date">
                                        📅 {formatDate(history.completed_at)}
                                    </span>
                                </div>
                                <div className="order-status">
                                    <span className={`status-badge ${getStatusColor(history.status)}`}>
                                        {getStatusText(history.status)}
                                    </span>
                                    <span className="order-amount">
                                        {formatCurrency(history.total)}
                                    </span>
                                </div>
                            </div>

                            <div className="history-details">
                                <div className="detail-row">
                                    <span className="label">🏢 Ресторан:</span>
                                    <span>{history.restaurant_name}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">📍 Адрес:</span>
                                    <span>{history.delivery_address}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">👤 Клиент:</span>
                                    <span>{history.user_name}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">📞 Телефон:</span>
                                    <span>{history.user_phone}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">⏱️ Время доставки:</span>
                                    <span>
                                        {calculateDeliveryTime(history.created_at, history.completed_at)}
                                    </span>
                                </div>
                            </div>

                            <div className="history-actions">
                                <button 
                                    className="btn details-btn"
                                    onClick={() => {
                                        alert(
                                            `Детали доставки #${history.id}\n` +
                                            `Статус: ${getStatusText(history.status)}\n` +
                                            `Сумма: ${formatCurrency(history.total)}\n` +
                                            `Ресторан: ${history.restaurant_name}\n` +
                                            `Адрес: ${history.delivery_address}\n` +
                                            `Клиент: ${history.user_name}\n` +
                                            `Телефон: ${history.user_phone}\n` +
                                            `Создан: ${formatDate(history.created_at)}\n` +
                                            `Завершен: ${formatDate(history.completed_at)}\n` +
                                            `Время доставки: ${calculateDeliveryTime(history.created_at, history.completed_at)}`
                                        );
                                    }}
                                >
                                    📋 Подробнее
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Информация */}
            <div className="history-info">
                <p>
                    Показано {deliveryHistory.length} доставок (демо-данные)
                </p>
                <p className="earnings-info">
                    Общий доход: <strong>{formatCurrency(stats.totalEarnings)}</strong>
                </p>
            </div>
            
            {/* Демо-уведомление */}
            <div className="demo-notification">
                <p>⚠️ Это демонстрационная история доставок. Реальные данные будут загружаться с сервера.</p>
            </div>
        </div>
    );
};

export default CourierHistory;