import React from 'react';
import { useCart } from '../../context/CartContext';
import { useModal } from '../../context/ModalContext';
import CartItem from './CartItem';
import './Cart.css';

const Cart = () => {
  const { 
    cartItems, 
    isCartOpen, 
    setIsCartOpen, 
    getCartTotal, 
    clearCart 
  } = useCart();
  
  const { openCheckout } = useModal();

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Корзина пуста');
      return;
    }
    openCheckout();
  };

  if (!isCartOpen) return null;

  return (
    <div className="cart-overlay">
      <div className="cart-sidebar">
        <div className="cart-header">
          <h3>Корзина</h3>
          <button className="close-btn" onClick={() => setIsCartOpen(false)}>
            ×
          </button>
        </div>

        <div className="cart-content">
          {cartItems.length === 0 ? (
            <p className="empty-cart">Корзина пуста</p>
          ) : (
            <>
              <div className="cart-items">
                {cartItems.map(item => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
              
              <div className="cart-summary">
                <div className="total">
                  <span>Итого:</span>
                  <span>{getCartTotal()} ₽</span>
                </div>
                
                <div className="cart-actions">
                  <button className="clear-btn" onClick={clearCart}>
                    Очистить корзину
                  </button>
                  <button className="checkout-btn" onClick={handleCheckout}>
                    Оформить заказ
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="delivery-info">
          <p>🚚 Бесплатная доставка от 1000 ₽</p>
          <p>⏱ Время доставки: 30-60 минут</p>
        </div>
      </div>
    </div>
  );
};

export default Cart;