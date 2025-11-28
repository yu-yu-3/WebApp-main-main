import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../utils/api';
import './Courier.css';

const CourierStatus = () => {
  const { user } = useAuth();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAvailableOrders();
  }, []);

  const loadAvailableOrders = async () => {
    try {
      setLoading(true);
      const orders = await ApiService.getOrders();
      // Показываем заказы, которые могут быть назначены курьеру
      const available = orders.filter(order => 
        !order.courier_id && 
        ['pending', 'preparing'].includes(order.status)
      );
      setAvailableOrders(available);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) {
      setMessage('❌ Выберите заказ и новый статус');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      await ApiService.updateOrderStatus(selectedOrder, newStatus, user.id);
      
      setMessage('✅ Статус заказа успешно обновлен!');
      setSelectedOrder('');
      setNewStatus('');
      
      // Обновляем список заказов
      await loadAvailableOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      setMessage('❌ Ошибка при обновлении статуса');
    } finally {
      setLoading(false);
    }
  };

  const getStatusOptions = (currentStatus) => {
    const statusFlow = {
      'pending': [
        { value: 'accepted', label: '✅ Принят курьером' },
        { value: 'cancelled', label: '❌ Отменен' }
      ],
      'preparing': [
        { value: 'accepted', label: '✅ Принят курьером' },
        { value: 'on_way', label: '🚗 В пути' }
      ],
      'accepted': [
        { value: 'on_way', label: '🚗 В пути' },
        { value: 'cancelled', label: '❌ Отменен' }
      ],
      'on_way': [
        { value: 'delivered', label: '📦 Доставлен' }
      ]
    };
    
    return statusFlow[currentStatus] || [];
  };

  const selectedOrderData = availableOrders.find(order => order.id == selectedOrder);

  return (
    <div className="courier-status">
      <div className="status-header">
        <h3>🔄 Обновить статус доставки</h3>
        <button className="refresh-btn" onClick={loadAvailableOrders}>
          🔄 Обновить список
        </button>
      </div>

      <div className="status-form">
        <div className="form-group">
          <label>Выберите заказ:</label>
          <select
            value={selectedOrder}
            onChange={(e) => setSelectedOrder(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Выберите заказ --</option>
            {availableOrders.map(order => (
              <option key={order.id} value={order.id}>
                Заказ #{order.id} - {order.user_name} - {order.total} ₽
              </option>
            ))}
          </select>
        </div>

        {selectedOrderData && (
          <div className="order-details">
            <h4>Информация о заказе:</h4>
            <div className="details-grid">
              <div className="detail-item">
                <span>👤 Клиент:</span>
                <strong>{selectedOrderData.user_name}</strong>
              </div>
              <div className="detail-item">
                <span>📍 Адрес:</span>
                <strong>{selectedOrderData.delivery_address}</strong>
              </div>
              <div className="detail-item">
                <span>💰 Сумма:</span>
                <strong>{selectedOrderData.total} ₽</strong>
              </div>
              <div className="detail-item">
                <span>📊 Текущий статус:</span>
                <strong>{selectedOrderData.status}</strong>
              </div>
            </div>
          </div>
        )}

        {selectedOrder && (
          <div className="form-group">
            <label>Новый статус:</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Выберите статус --</option>
              {getStatusOptions(selectedOrderData?.status).map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {message && (
          <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <button
          className="update-btn"
          onClick={updateOrderStatus}
          disabled={loading || !selectedOrder || !newStatus}
        >
          {loading ? 'Обновление...' : '🔄 Обновить статус'}
        </button>
      </div>

      <div className="status-info">
        <h4>📋 Статусы доставки:</h4>
        <ul className="status-list">
          <li>⏳ <strong>Ожидание</strong> - заказ ожидает подтверждения</li>
          <li>✅ <strong>Принят</strong> - курьер принял заказ</li>
          <li>🚗 <strong>В пути</strong> - заказ доставляется</li>
          <li>📦 <strong>Доставлен</strong> - заказ успешно доставлен</li>
          <li>❌ <strong>Отменен</strong> - заказ отменен</li>
        </ul>
      </div>
    </div>
  );
};

export default CourierStatus;