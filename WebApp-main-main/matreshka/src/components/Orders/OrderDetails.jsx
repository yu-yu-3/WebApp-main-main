import React from 'react';
import { useModal } from '../../context/ModalContext';
import './OrderDetails.css';

const OrderDetails = () => {
  const { showOrderDetails, closeOrderDetails, currentOrder } = useModal();

  if (!showOrderDetails || !currentOrder) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'processing':
        return { text: '📦 Обрабатывается', color: '#2196F3', description: 'Ваш заказ принят и готовится' };
      case 'cooking':
        return { text: '👨‍🍳 Готовится', color: '#FF9800', description: 'Повара готовят ваши блюда' };
      case 'on_way':
        return { text: '🚗 В пути', color: '#4CAF50', description: 'Курьер уже везет ваш заказ' };
      case 'delivered':
        return { text: '✅ Доставлен', color: '#8B0000', description: 'Заказ успешно доставлен' };
      default:
        return { text: '📦 Обрабатывается', color: '#666', description: 'Статус заказа обновляется' };
    }
  };

  const statusInfo = getStatusInfo(currentOrder.status);

  return (
    <div className="order-details-modal">
      <div className="order-details-content">
        <button className="close-btn" onClick={closeOrderDetails}>×</button>
        
        <div className="order-header">
          <h2>Детали заказа</h2>
          <div className="order-number">Заказ #{currentOrder.id}</div>
        </div>

        <div className="order-status-section">
          <div className="status-badge" style={{ backgroundColor: statusInfo.color }}>
            {statusInfo.text}
          </div>
          <p className="status-description">{statusInfo.description}</p>
          
          {currentOrder.estimatedDelivery && (
            <p className="delivery-estimate">
              🕐 Примерное время доставки: {formatDate(currentOrder.estimatedDelivery)}
            </p>
          )}
        </div>

        <div className="order-sections">
          {/* Информация о заказе */}
          <div className="order-section">
            <h3>📋 Состав заказа</h3>
            <div className="order-items-list">
              {currentOrder.items && currentOrder.items.map((item, index) => (
                <div key={index} className="order-item-detail">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">× {item.quantity}</span>
                  </div>
                  <div className="item-price">{item.price * item.quantity} ₽</div>
                </div>
              ))}
            </div>
            <div className="order-total-section">
              <div className="total-line">
                <span>Сумма заказа:</span>
                <span>{currentOrder.total} ₽</span>
              </div>
              {currentOrder.deliveryCost > 0 && (
                <div className="total-line">
                  <span>Доставка:</span>
                  <span>{currentOrder.deliveryCost} ₽</span>
                </div>
              )}
              <div className="total-line final">
                <span>Итого к оплате:</span>
                <span>{currentOrder.total + (currentOrder.deliveryCost || 0)} ₽</span>
              </div>
            </div>
          </div>

          {/* Информация о доставке */}
          <div className="order-section">
            <h3>🚚 Информация о доставке</h3>
            <div className="delivery-info">
              <p><strong>Адрес:</strong> {currentOrder.deliveryAddress || 'Не указан'}</p>
              {currentOrder.customerInfo && (
                <>
                  <p><strong>Получатель:</strong> {currentOrder.customerInfo.firstName} {currentOrder.customerInfo.lastName}</p>
                  <p><strong>Телефон:</strong> {currentOrder.customerInfo.phone}</p>
                  <p><strong>Email:</strong> {currentOrder.customerInfo.email}</p>
                </>
              )}
            </div>
          </div>

          {/* Информация об оплате */}
          <div className="order-section">
            <h3>💳 Оплата</h3>
            <div className="payment-info">
              <p>
                <strong>Способ оплаты:</strong> {
                  currentOrder.paymentMethod === 'card' ? '💳 Банковская карта' :
                  currentOrder.paymentMethod === 'cash' ? '💵 Наличными при получении' :
                  'Не указан'
                }
              </p>
              <p><strong>Статус оплаты:</strong> {currentOrder.paymentStatus === 'paid' ? '✅ Оплачено' : '⏳ Ожидает оплаты'}</p>
            </div>
          </div>

          {/* Дополнительная информация */}
          {(currentOrder.comment || currentOrder.createdAt) && (
            <div className="order-section">
              <h3>📝 Дополнительная информация</h3>
              <div className="additional-info">
                {currentOrder.comment && (
                  <div className="comment-section">
                    <p><strong>Комментарий к заказу:</strong></p>
                    <p className="comment-text">{currentOrder.comment}</p>
                  </div>
                )}
                {currentOrder.createdAt && (
                  <p><strong>Дата заказа:</strong> {formatDate(currentOrder.createdAt)}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="order-actions">
          <button className="help-btn" onClick={() => alert('Свяжитесь с нами по телефону +7 (XXX) XXX-XX-XX')}>
            🆘 Нужна помощь?
          </button>
          <button className="repeat-order-btn" onClick={() => alert('Функция повторения заказа скоро будет доступна!')}>
            🔄 Повторить заказ
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;