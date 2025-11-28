import React, { useState, useEffect } from 'react';
import { useModal } from '../../context/ModalContext';
import './Events.css';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const { openEventRegistration, openPromoCode, setIsCartOpen } = useModal();

  useEffect(() => {
    // Моковые данные с будущими мероприятиями и акциями
    const mockEvents = [
      {
        id: 1,
        title: 'Русские вечера с живой музыкой',
        type: 'event',
        date: '2024-12-15',
        time: '19:00',
        location: 'Matreshka Центр',
        description: 'Живая народная музыка, традиционные танцы и угощения. Незабываемая атмосфера русского гостеприимства!',
        image: '/img/events/folk-evening.jpg',
        price: 1500,
        availableSpots: 25,
        isActive: true
      },
      {
        id: 2,
        title: 'Мастер-класс по приготовлению пельменей',
        type: 'event',
        date: '2024-12-20',
        time: '15:00',
        location: 'Matreshka Север',
        description: 'Научитесь готовить настоящие русские пельмени от нашего шеф-повара. Все участники получат сертификат и заберут домой свои кулинарные творения!',
        image: '/img/events/pelmeni-masterclass.jpg',
        price: 2000,
        availableSpots: 12,
        isActive: true
      },
      {
        id: 3,
        title: 'Скидка 20% на все блюда',
        type: 'promotion',
        date: '2024-12-01',
        endDate: '2024-12-31',
        description: 'Специальное предложение декабря для всех гостей наших ресторанов. Действует на все блюда из меню, включая напитки и десерты.',
        code: 'DECEMBER20',
        discount: 20,
        minOrder: 0,
        isActive: true
      },
      {
        id: 4,
        title: 'Бесплатная доставка',
        type: 'promotion',
        date: '2024-12-01',
        endDate: '2024-12-31',
        description: 'Бесплатная доставка при заказе от 1000 рублей. Быстрая доставка в течение 30-45 минут по всему городу.',
        code: 'FREEDELIVERY',
        discount: 0,
        minOrder: 1000,
        isActive: true
      },
      {
        id: 5,
        title: 'Дегустация русских настоек',
        type: 'event',
        date: '2025-01-10',
        time: '20:00',
        location: 'Matreshka Центр',
        description: 'Эксклюзивная дегустация традиционных русских настоек в сопровождении закусок и интересных историй от нашего сомелье',
        image: '/img/events/nastoyka-tasting.jpg',
        price: 2500,
        availableSpots: 15,
        isActive: true
      },
      {
        id: 6,
        title: 'Новогодний ужин',
        type: 'event',
        date: '2024-12-31',
        time: '22:00',
        location: 'Matreshka Центр',
        description: 'Специальный новогодний ужин с праздничной программой, живой музыкой и фейерверком. Встречаем Новый год в русских традициях!',
        image: '/img/events/new-year.jpg',
        price: 5000,
        availableSpots: 50,
        isActive: true
      },
      {
        id: 7,
        title: 'Скидка 15% на выпечку',
        type: 'promotion',
        date: '2024-12-01',
        endDate: '2024-12-25',
        description: 'Специальная скидка на всю свежую выпечку: пироги, расстегаи, кулебяки и традиционные русские десерты.',
        code: 'BAKERY15',
        discount: 15,
        minOrder: 500,
        isActive: true
      },
      {
        id: 8,
        title: 'Кулинарный вечер "Вкусы России"',
        type: 'event',
        date: '2025-01-25',
        time: '18:30',
        location: 'Matreshka Юг',
        description: 'Путешествие по регионам России через кухню. От карельских калиток до дальневосточных морепродуктов.',
        image: '/img/events/russian-tastes.jpg',
        price: 3000,
        availableSpots: 20,
        isActive: true
      }
    ];
    
 // Фильтруем мероприятия по активным ресторанам
    const filterEventsByActiveRestaurants = (events) => {
      const savedRestaurants = localStorage.getItem('restaurants');
      if (savedRestaurants) {
        const parsedRestaurants = JSON.parse(savedRestaurants);
        const activeRestaurantNames = parsedRestaurants
          .filter(restaurant => restaurant.isActive !== false)
          .map(restaurant => restaurant.name);
        
        return events.filter(event => 
          !event.location || activeRestaurantNames.includes(event.location)
        );
      }
      return events;
    };

    const filteredEvents = filterEventsByActiveRestaurants(mockEvents);

      // Фильтруем только активные мероприятия (будущие и текущие)
    const activeEvents = filteredEvents.filter(event => {
      if (event.type === 'promotion') {
        // Для акций проверяем дату окончания
        return new Date(event.endDate) >= new Date();
      } else {
        // Для мероприятий проверяем дату проведения
        return new Date(event.date) >= new Date();
      }
    });
    
    setEvents(activeEvents);
  }, []);

  const filteredEvents = events.filter(event => 
    activeTab === 'upcoming' ? event.type === 'event' : event.type === 'promotion'
  );

  const handleEventRegister = (event) => {
    openEventRegistration(event);
  };

  const handlePromoUse = (promotion) => {
    openPromoCode(promotion.code);
    setIsCartOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isEventUpcoming = (eventDate) => {
    return new Date(eventDate) >= new Date();
  };

  const getDaysUntilEvent = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);
    const diffTime = event - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <section className="events-section">
      <h2>События и Акции</h2>
      
      <div className="events-tabs">
        <button 
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          🎭 Предстоящие ивенты
        </button>
        <button 
          className={`tab-btn ${activeTab === 'promotions' ? 'active' : ''}`}
          onClick={() => setActiveTab('promotions')}
        >
          🎁 Акции и скидки
        </button>
      </div>

      <div className="events-grid">
        {filteredEvents.map(event => (
          <div key={event.id} className={`event-card ${event.type}`}>
            {event.image && (
              <div className="event-image-container">
                <img src={event.image} alt={event.title} className="event-image" />
                {event.type === 'event' && isEventUpcoming(event.date) && (
                  <div className="event-badge">
                    Через {getDaysUntilEvent(event.date)} {getDaysUntilEvent(event.date) === 1 ? 'день' : 
                    getDaysUntilEvent(event.date) < 5 ? 'дня' : 'дней'}
                  </div>
                )}
                {event.type === 'promotion' && (
                  <div className="promo-badge">
                    🔥 Акция
                  </div>
                )}
              </div>
            )}
            
            <div className="event-content">
              <h3>{event.title}</h3>
              <p className="event-description">{event.description}</p>
              
              <div className="event-details">
                {event.date && (
                  <p className="event-date">
                    📅 {formatDate(event.date)}
                    {event.time && ` в ${event.time}`}
                    {event.endDate && ` - ${formatDate(event.endDate)}`}
                  </p>
                )}
                
                {event.location && (
                  <p className="event-location">📍 {event.location}</p>
                )}
                
                {event.price && event.price > 0 && (
                  <p className="event-price">💰 {event.price} ₽ с человека</p>
                )}
                
                {event.availableSpots && (
                  <p className="event-spots">👥 Осталось мест: {event.availableSpots}</p>
                )}
                
                {event.code && (
                  <div className="promo-code">
                    <p className="promo-code-text">🎟 Промокод: <strong>{event.code}</strong></p>
                    {event.discount > 0 && (
                      <p className="discount-info">🎯 Скидка: {event.discount}%</p>
                    )}
                    {event.minOrder > 0 && (
                      <p className="min-order">📦 Минимальный заказ: {event.minOrder} ₽</p>
                    )}
                  </div>
                )}
              </div>

              {event.type === 'event' ? (
                <button 
                  className="event-register-btn"
                  onClick={() => handleEventRegister(event)}
                >
                  📝 Зарегистрироваться
                </button>
              ) : (
                <button 
                  className="promo-use-btn"
                  onClick={() => handlePromoUse(event)}
                >
                  🛒 Использовать акцию
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="no-events">
          <div className="no-events-icon">📅</div>
          <h3>Пока нет доступных мероприятий</h3>
          <p>Следите за обновлениями, скоро появятся новые события!</p>
          <button 
            className="view-all-btn"
            onClick={() => window.location.href = '/about'}
          >
            Посмотреть прошедшие мероприятия
          </button>
        </div>
      )}
    </section>
  );
};

export default Events;