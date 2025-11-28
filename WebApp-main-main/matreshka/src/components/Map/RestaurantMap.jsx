import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import ApiService from '../../utils/api';
import './RestaurantMap.css';

const RestaurantMap = () => {
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { openBooking, openLogin } = useModal();

  // Загружаем активные рестораны из базы данных
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoading(true);
        const activeRestaurants = await ApiService.getRestaurants();
        console.log('Загружены активные рестораны:', activeRestaurants);
        setRestaurants(activeRestaurants);
      } catch (error) {
        console.error('Ошибка при загрузке ресторанов:', error);
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, []);

  const handleRestaurantClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const handleBookingClick = () => {
    if (!user) {
      alert('Пожалуйста, войдите в систему чтобы забронировать стол');
      openLogin();
      return;
    }
    openBooking();
  };

  const generateMapUrl = (coordinates) => {
    if (!coordinates) {
      return `https://static-maps.yandex.ru/1.x/?ll=37.6173,55.7558&size=650,400&z=10&l=map`;
    }
    
    const [lat, lon] = coordinates.split(',');
    return `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&size=650,400&z=12&l=map&pt=${lon},${lat},pm2rdm`;
  };

  // Функция для получения координат по умолчанию, если у ресторана нет координат
  const getRestaurantCoordinates = (restaurant) => {
    if (restaurant.coordinates) {
      return restaurant.coordinates;
    }
    
    // Координаты по умолчанию для Москвы в зависимости от названия
    const defaultCoordinates = {
      'Matreshka Центр': '55.7558,37.6173',
      'Matreshka Север': '55.8358,37.6173', 
      'Matreshka Юг': '55.6758,37.6173',
      'Matreshka Запад': '55.7558,37.4173'
    };
    
    return defaultCoordinates[restaurant.name] || '55.7558,37.6173';
  };

  if (loading) {
    return (
      <div className="restaurant-map">
        <h2>Наши рестораны</h2>
        <div className="loading">Загрузка ресторанов...</div>
      </div>
    );
  }

  return (
    <div className="restaurant-map">
      <h2>Наши рестораны</h2>
      
      {restaurants.length === 0 ? (
        <div className="no-restaurants">
          <p>В настоящее время все наши рестораны закрыты. Приносим извинения за неудобства.</p>
          <p>Следите за обновлениями в наших социальных сетях!</p>
        </div>
      ) : (
        <>
          <div className="map-container">
            <div className="map-image">
              <img 
                src={generateMapUrl(selectedRestaurant ? getRestaurantCoordinates(selectedRestaurant) : '55.7558,37.6173')} 
                alt="Карта ресторанов Matreshka" 
              />
            </div>
            
            <div className="restaurants-list">
              <h3>Адреса ресторанов ({restaurants.length} активных)</h3>
              <div className="restaurants-grid">
                {restaurants.map(restaurant => (
                  <div 
                    key={restaurant.id}
                    className={`restaurant-item ${selectedRestaurant?.id === restaurant.id ? 'active' : ''}`}
                    onClick={() => handleRestaurantClick(restaurant)}
                  >
                    <h4>{restaurant.name}</h4>
                    <p className="address">📍 {restaurant.address}</p>
                    <p className="phone">📞 {restaurant.phone}</p>
                    <p className="email">📧 {restaurant.email}</p>
                    <p className="hours">🕒 {restaurant.opening_hours}</p>
                    {restaurant.description && (
                      <p className="description">{restaurant.description}</p>
                    )}
                    <button 
                      className="show-on-map-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestaurantClick(restaurant);
                      }}
                    >
                      Показать на карте
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {selectedRestaurant && (
            <div className="restaurant-info">
              <h3>{selectedRestaurant.name}</h3>
              <p><strong>Адрес:</strong> {selectedRestaurant.address}</p>
              <p><strong>Телефон:</strong> {selectedRestaurant.phone}</p>
              <p><strong>Email:</strong> {selectedRestaurant.email}</p>
              <p><strong>Часы работы:</strong> {selectedRestaurant.opening_hours}</p>
              {selectedRestaurant.description && (
                <p><strong>Описание:</strong> {selectedRestaurant.description}</p>
              )}
              
              <div className="action-buttons">
                <button className="booking-btn" onClick={handleBookingClick}>
                  🍽️ Забронировать стол
                </button>
                <button className="route-btn">
                  <a 
                    href={`https://yandex.ru/maps/?pt=${getRestaurantCoordinates(selectedRestaurant).split(',').reverse().join(',')}&z=15&l=map`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{textDecoration: 'none', color: 'inherit'}}
                  >
                    🗺️ Построить маршрут
                  </a>
                </button>
                <button className="call-btn">
                  <a 
                    href={`tel:${selectedRestaurant.phone.replace(/\D/g, '')}`}
                    style={{textDecoration: 'none', color: 'inherit'}}
                  >
                    📞 Позвонить
                  </a>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RestaurantMap;