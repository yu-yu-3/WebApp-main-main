import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../utils/api';
import './Courier.css';

const CourierHistory = () => {
  const { user } = useAuth();
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadDeliveryHistory();
  }, []);

  const loadDeliveryHistory = async () => {
    try {
      setLoading(true);
      const orders = await ApiService.getOrders();
      const courierOrders = orders.filter(order => 
        order.courier_id === user.id
      );
      setDeliveryHistory(courierOrders);
    } catch (error) {
      console.error('Error loading delivery history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statuses = {
      'delivered': { text: 'Доставлен', color: 'success', icon: '📦' },
      'cancelled': { text: 'Отменен', color: 'error', icon: '❌' },
      'on_way': { text: 'В пути', color: 'primary', icon: '🚗' },
      'accepted': { text: 'Принят', color: 'info', icon: '✅' }
    };
    return statuses[status] || { text: status, color: 'warning', icon: '⏳' };
  };

  const filteredHistory = deliveryHistory.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return <div className="loading">Загрузка истории доставок...</div>;
  }

  return (
    <div className="courier-history">
      <div className="history-header">
        <h3>📋 История доставок</h3>
        <div className="history-filters">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все статусы</option>
            <option value="delivered">Доставленные</option>
            <option value="cancelled">Отмененные</option>
            <option value="on_way">В пути</option>
          </select>
          <button className="refresh-btn" onClick={loadDeliveryHistory}>
            🔄 Обновить
          </button>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h4>История доставок пуста</h4>
          <p>Здесь будут отображаться все ваши выполненные заказы</p>
        </div>
      ) : (
        <div className="history-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">
                {deliveryHistory.filter(o => o.status === 'delivered').length}
              </span>
              <span className="stat-label">Успешных доставок</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {deliveryHistory.length}
              </span>
              <span className="stat-label">Всего заказов</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {deliveryHistory.reduce((sum, order) => sum + parseFloat(order.total), 0)} ₽
              </span>
              <span className="stat-label">Общая сумма</span>
            </div>
          </div>

          <div className="history-list">
            {filteredHistory.map(order => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <div key={order.id} className="history-card">
                  <div className="card-header">
                    <h4>Заказ #{order.id}</h4>
                    <span className={`status-badge ${statusInfo.color}`}>
                      {statusInfo.icon} {statusInfo.text}
                    </span>
                  </div>
                  
                  <div className="card-content">
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">📍 Адрес:</span>
                        <span className="value">{order.delivery_address}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">👤 Клиент:</span>
                        <span className="value">{order.user_name}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">💰 Сумма:</span>
                        <span className="value">{order.total} ₽</span>
                      </div>
                      <div className="info-item">
                        <span className="label">🕒 Дата:</span>
                        <span className="value">
                          {new Date(order.created_at).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>
                    
                    {order.completed_at && (
                      <div className="completion-info">
                        <strong>Завершен:</strong> {new Date(order.completed_at).toLocaleString('ru-RU')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourierHistory;