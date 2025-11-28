import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useModal } from '../../context/ModalContext';
import './CheckoutForm.css';

const CheckoutForm = () => {
  const { user } = useAuth();
  const { cartItems, getCartTotal, clearCart, setIsCartOpen } = useCart();
  const { showCheckout, closeCheckout } = useModal();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    apartment: '',
    entrance: '',
    floor: '',
    intercom: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: '',
    comment: '',
    paymentMethod: 'card'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Пожалуйста, войдите в систему чтобы оформить заказ');
      closeCheckout();
      return;
    }

    if (cartItems.length === 0) {
      alert('Корзина пуста');
      return;
    }

    setIsSubmitting(true);

    try {
      // Создаем объект заказа
      const newOrder = {
        id: Date.now(),
        userId: user.id,
        items: [...cartItems], // копируем массив items
        total: getCartTotal(),
        deliveryAddress: `${formData.address}${formData.apartment ? ', кв. ' + formData.apartment : ''}${formData.entrance ? ', подъезд ' + formData.entrance : ''}${formData.floor ? ', этаж ' + formData.floor : ''}${formData.intercom ? ', домофон ' + formData.intercom : ''}`,
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email
        },
        paymentMethod: formData.paymentMethod,
        comment: formData.comment,
        status: 'processing',
        createdAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 45 * 60000).toISOString() // +45 минут
      };

      console.log('Creating order:', newOrder);

      // Сохраняем заказ в localStorage
      const userOrders = JSON.parse(localStorage.getItem(`user_orders_${user.id}`)) || [];
      userOrders.unshift(newOrder);
      localStorage.setItem(`user_orders_${user.id}`, JSON.stringify(userOrders));

      // Очищаем корзину
      clearCart();
      setIsCartOpen(false);
      closeCheckout();

      // Показываем уведомление
      alert(`Заказ #${newOrder.id} успешно оформлен! Ожидайте доставку в течение 45 минут.`);
      
      // Отправляем событие обновления
      window.dispatchEvent(new Event('ordersUpdated'));
      
    } catch (error) {
      console.error('Order submission error:', error);
      alert('Произошла ошибка при оформлении заказа. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const matches = cleaned.match(/\d{1,4}/g);
    return matches ? matches.join(' ') : '';
  };

  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + (cleaned.length > 2 ? '/' + cleaned.slice(2, 4) : '');
    }
    return cleaned;
  };

  if (!showCheckout) return null;

  return (
    <div className="checkout-modal">
      <div className="checkout-content">
        <button className="close-btn" onClick={closeCheckout}>×</button>
        <h2>Оформление заказа</h2>
        
        <div className="order-summary">
          <h3>Ваш заказ</h3>
          <div className="order-items">
            {cartItems.map(item => (
              <div key={item.id} className="order-item">
                <span className="item-name">{item.name}</span>
                <span className="item-quantity">×{item.quantity}</span>
                <span className="item-price">{item.price * item.quantity} ₽</span>
              </div>
            ))}
          </div>
          <div className="order-total">
            <strong>Итого: {getCartTotal()} ₽</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Контактная информация</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Имя *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                  placeholder="Введите имя"
                />
              </div>
              <div className="form-group">
                <label>Фамилия *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                  placeholder="Введите фамилию"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Телефон *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  required
                  placeholder="+7 (XXX) XXX-XX-XX"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Адрес доставки</h3>
            <div className="form-group">
              <label>Адрес *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                required
                placeholder="Улица, дом"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Квартира</label>
                <input
                  type="text"
                  value={formData.apartment}
                  onChange={(e) => handleChange('apartment', e.target.value)}
                  placeholder="Номер квартиры"
                />
              </div>
              <div className="form-group">
                <label>Подъезд</label>
                <input
                  type="text"
                  value={formData.entrance}
                  onChange={(e) => handleChange('entrance', e.target.value)}
                  placeholder="Номер подъезда"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Этаж</label>
                <input
                  type="text"
                  value={formData.floor}
                  onChange={(e) => handleChange('floor', e.target.value)}
                  placeholder="Этаж"
                />
              </div>
              <div className="form-group">
                <label>Домофон</label>
                <input
                  type="text"
                  value={formData.intercom}
                  onChange={(e) => handleChange('intercom', e.target.value)}
                  placeholder="Код домофона"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Способ оплаты</h3>
            <div className="payment-methods">
              <label className="payment-method">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={formData.paymentMethod === 'card'}
                  onChange={(e) => handleChange('paymentMethod', e.target.value)}
                />
                <span className="checkmark"></span>
                Банковская карта
              </label>
              <label className="payment-method">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={formData.paymentMethod === 'cash'}
                  onChange={(e) => handleChange('paymentMethod', e.target.value)}
                />
                <span className="checkmark"></span>
                Наличными при получении
              </label>
            </div>

            {formData.paymentMethod === 'card' && (
              <div className="card-details">
                <div className="form-group">
                  <label>Номер карты *</label>
                  <input
                    type="text"
                    value={formData.cardNumber}
                    onChange={(e) => handleChange('cardNumber', formatCardNumber(e.target.value))}
                    maxLength={19}
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Срок действия *</label>
                    <input
                      type="text"
                      value={formData.cardExpiry}
                      onChange={(e) => handleChange('cardExpiry', formatExpiry(e.target.value))}
                      maxLength={5}
                      placeholder="ММ/ГГ"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>CVC *</label>
                    <input
                      type="text"
                      value={formData.cardCvc}
                      onChange={(e) => handleChange('cardCvc', e.target.value.replace(/\D/g, ''))}
                      maxLength={3}
                      placeholder="123"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Имя на карте *</label>
                  <input
                    type="text"
                    value={formData.cardName}
                    onChange={(e) => handleChange('cardName', e.target.value)}
                    placeholder="IVAN IVANOV"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          <div className="form-section">
            <h3>Комментарий к заказу</h3>
            <div className="form-group">
              <textarea
                value={formData.comment}
                onChange={(e) => handleChange('comment', e.target.value)}
                rows="3"
                placeholder="Например: позвоните за 15 минут до доставки, оставьте у двери и т.д."
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={closeCheckout}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting || cartItems.length === 0}
            >
              {isSubmitting ? 'Оформление...' : `Оплатить ${getCartTotal()} ₽`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutForm;