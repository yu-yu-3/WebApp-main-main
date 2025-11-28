import React, { useState } from 'react';
import './Menu.css';

const MenuItem = ({ item, onAddToCart }) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(item);
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div className={`menu-item ${!item.isAvailable ? 'unavailable' : ''}`}>
      <div className="item-image">
        <img src={item.image || '/img/menu/default.jpg'} alt={item.name} />
        {!item.isAvailable && (
          <div className="unavailable-overlay">
            <span>Недоступно</span>
          </div>
        )}
        <div className="item-badges">
          {item.isVegetarian && <span className="badge vegetarian">🥬</span>}
          {item.isSpicy && <span className="badge spicy">🌶️</span>}
          {item.isGlutenFree && <span className="badge gluten-free">🌾</span>}
        </div>
      </div>
      
      <div className="item-info">
        <div className="item-header">
          <h3>{item.name}</h3>
          <span className="item-price">{item.price} ₽</span>
        </div>
        
        <p className="item-description">{item.description}</p>
        
        <div className="item-meta">
          {item.calories && (
            <span className="item-calories">🔥 {item.calories} ккал</span>
          )}
          {item.cookingTime && (
            <span className="item-time">⏱️ {item.cookingTime} мин</span>
          )}
        </div>
        
        <div className="item-footer">
          <button 
            className={`add-to-cart-btn ${!item.isAvailable ? 'disabled' : ''}`}
            onClick={handleAddToCart}
            disabled={!item.isAvailable}
          >
            {!item.isAvailable ? 'Недоступно' : 'В корзину'}
          </button>
          
          <button 
            className="details-btn"
            onClick={toggleDetails}
          >
            {showDetails ? 'Скрыть' : 'Подробнее'}
          </button>
        </div>

        {showDetails && (
          <div className="item-details-panel">
            {item.ingredients && item.ingredients.length > 0 && (
              <div className="detail-section">
                <h4>Ингредиенты:</h4>
                <p>{Array.isArray(item.ingredients) ? item.ingredients.join(', ') : item.ingredients}</p>
              </div>
            )}
            
            <div className="dietary-info">
              {item.isVegetarian && <span className="dietary-tag vegetarian">Вегетарианское</span>}
              {item.isSpicy && <span className="dietary-tag spicy">Острое</span>}
              {item.isGlutenFree && <span className="dietary-tag gluten-free">Без глютена</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuItem;