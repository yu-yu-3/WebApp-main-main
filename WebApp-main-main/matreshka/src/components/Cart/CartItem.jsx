import React from 'react';
import { useCart } from '../../context/CartContext';
import './Cart.css';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="cart-item">
      <img src={item.image} alt={item.name} className="item-image" />
      
      <div className="item-details">
        <h4>{item.name}</h4>
        <p className="item-price">{item.price} ₽</p>
      </div>

      <div className="quantity-controls">
        <button 
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="quantity-btn"
        >
          -
        </button>
        <span className="quantity">{item.quantity}</span>
        <button 
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="quantity-btn"
        >
          +
        </button>
      </div>

      <div className="item-total">
        {item.price * item.quantity} ₽
      </div>

      <button 
        onClick={() => removeFromCart(item.id)}
        className="remove-btn"
      >
        ×
      </button>
    </div>
  );
};

export default CartItem;