import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../utils/api';
import './Courier.css';

const CourierDeliveries = () => {
  const { user } = useAuth();
  const [currentDeliveries, setCurrentDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentDeliveries();
  }, []);

  const loadCurrentDeliveries = async () => {
    try {
      setLoading(true);
      // Получаем заказы со статусами "принят", "готовится", "в пути"
      const orders = await ApiService.getOrders();
      const courierOrders = orders.filter(order => 
        order.courier_id === user.id && 
        ['accepted', 'preparing', 'on_way'].includes(order.status)
      );
      setCurrentDeliveries(courierOrders);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptDelivery = async (orderId) => {
    try {
      await ApiService.updateOrderStatus(orderId, 'accepted', user.id);
      await loadCurrentDeliveries();
      alert('Заказ принят в доставку!');
    } catch (error) {
      console.error('Error accepting delivery:', error);
      alert('Ошибка при принятии заказа');
    }
  };

  const startDelivery = async (orderId) => {
    try {
      await ApiService.updateOrderStatus(orderId, 'on_way', user.id);
      await loadCurrentDeliveries();
      alert('Доставка начата!');
    } catch (error) {
      console.error('Error starting delivery:', error);
      alert('Ошибка при начале доставки');
    }
  };

  const completeDelivery = async (orderId) => {
    try {
      await ApiService.updateOrderStatus(orderId, 'delivered', user.id);
      await loadCurrentDeliveries();
      alert('Доставка завершена!');
    } catch (error) {
      console.error('Error completing delivery:', error);
      alert('Ошибка при завершении доставки');
    }
  };

  const getStatusInfo = (status) => {
    const statuses = {
      'pending': { text: 'Ожидает подтверждения', color: 'warning', icon: '⏳' },
      'accepted': { text: 'Принят курьером', color: 'info', icon: '✅' },
      'preparing': { text: 'Готовится', color: 'preparing', icon: '👨‍🍳' },
      'on_way': { text: 'В пути', color: 'primary', icon: '🚗' },
      'delivered': { text: 'Доставлен', color: 'success', icon: '📦' },
      'cancelled': { text: 'Отменен', color: 'error', icon: '❌' }
    };
    return statuses[status] || statuses.pending;
  };

  if (loading) {
    return <div className="loading">Загрузка текущих доставок...</div>;
  }

  return (
    <div className="courier-deliveries">
      <div className="deliveries-header">
        <h3>📦 Текущие доставки</h3>
        <button className="refresh-btn" onClick={loadCurrentDeliveries}>
          🔄 Обновить
        </button>
      </div>

      {currentDeliveries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h4>Нет текущих доставок</h4>
          <p>Все заказы доставлены или ожидают назначения</p>
        </div>
      ) : (
        <div className="deliveries-grid">
          {currentDeliveries.map(order => {
            const statusInfo = getStatusInfo(order.status);
            return (
              <div key={order.id} className="delivery-card">
                <div className="delivery-header">
                  <h4>Заказ #{order.id}</h4>
                  <span className={`status-badge ${statusInfo.color}`}>
                    {statusInfo.icon} {statusInfo.text}
                  </span>
                </div>

                <div className="delivery-info">
                  <div className="info-row">
                    <span className="label">📍 Адрес доставки:</span>
                    <span className="value">{order.delivery_address}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">👤 Клиент:</span>
                    <span className="value">{order.user_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">📞 Телефон:</span>
                    <span className="value">{order.user_phone || 'Не указан'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">💰 Сумма:</span>
                    <span className="value">{order.total} ₽</span>
                  </div>
                  <div className="info-row">
                    <span className="label">🕒 Создан:</span>
                    <span className="value">
                      {new Date(order.created_at).toLocaleString('ru-RU')}
                    </span>
                  </div>
                </div>

                <div className="delivery-actions">
                  {order.status === 'pending' && (
                    <button
                      className="action-btn accept-btn"
                      onClick={() => acceptDelivery(order.id)}
                    >
                      ✅ Принять заказ
                    </button>
                  )}
                  
                  {order.status === 'accepted' && (
                    <button
                      className="action-btn start-btn"
                      onClick={() => startDelivery(order.id)}
                    >
                      🚗 Начать доставку
                    </button>
                  )}
                  
                  {order.status === 'on_way' && (
                    <button
                      className="action-btn complete-btn"
                      onClick={() => completeDelivery(order.id)}
                    >
                      📦 Завершить доставку
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourierDeliveries;