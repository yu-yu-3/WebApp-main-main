import React, { useState, useEffect } from 'react';
import { useModal } from '../../context/ModalContext';
import './Events.css';
import { useAuth } from '../../context/AuthContext';
import { canManageEvents } from '../../utils/helpers';

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const { openEventRegistration, openPromoCode, setIsCartOpen } = useModal();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/events?active=true');
        const data = await response.json();
        
        // Преобразуем данные из API в формат, который ожидает компонент
        const formattedEvents = data.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          type: event.type,
          date: event.date || event.start_date,
          endDate: event.end_date,
          time: event.time,
          end_time: event.end_time,
          location: event.location,
          price: event.price,
          // Используем promo_code из API вместо code
          code: event.promo_code,
          // Используем discount_percent из API вместо discount
          discount: event.discount_percent,
          // Используем min_order_amount из API вместо minOrder
          minOrder: event.min_order_amount,
          image: event.image,
          max_participants: event.max_participants,
          current_participants: event.current_participants,
          // Вычисляем доступные места
          availableSpots: event.max_participants ? 
            event.max_participants - (event.current_participants || 0) : 
            null
        }));
        
        setEvents(formattedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
        // Используем моковые данные в случае ошибки
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
          }
        ];
        setEvents(mockEvents);
      }
    };
    
    loadEvents();
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
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isEventUpcoming = (eventDate) => {
    if (!eventDate) return false;
    return new Date(eventDate) >= new Date();
  };

  const getDaysUntilEvent = (eventDate) => {
    if (!eventDate) return 0;
    const today = new Date();
    const event = new Date(eventDate);
    const diffTime = event - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Функция для проверки, активна ли акция
  const isPromotionActive = (event) => {
    if (event.type !== 'promotion') return true;
    
    const today = new Date();
    const startDate = event.date ? new Date(event.date) : null;
    const endDate = event.endDate ? new Date(event.endDate) : null;
    
    if (startDate && endDate) {
      return today >= startDate && today <= endDate;
    } else if (startDate) {
      return today >= startDate;
    } else if (endDate) {
      return today <= endDate;
    }
    
    return true;
  };

  // Фильтруем события: для мероприятий - будущие, для акций - активные
  const displayEvents = filteredEvents.filter(event => {
    if (event.type === 'event') {
      return isEventUpcoming(event.date);
    } else if (event.type === 'promotion') {
      return isPromotionActive(event);
    }
    return true;
  });

  return (
    <section className="events-section">
      <div className="events-header">
        <h2>События и Акции</h2>
        
        {canManageEvents(user) && (
          <button 
            className="btn-manage-events"
            onClick={() => window.location.href = '/admin/events'}
          >
            ⚙️ Управление
          </button>
        )}
      </div>
      
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
        {displayEvents.map(event => (
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
                    {event.endDate && event.type === 'promotion' && ` - ${formatDate(event.endDate)}`}
                  </p>
                )}
                
                {event.location && event.type === 'event' && (
                  <p className="event-location">📍 {event.location}</p>
                )}
                
                {event.price && event.price > 0 && event.type === 'event' && (
                  <p className="event-price">💰 {event.price} ₽ с человека</p>
                )}
                
                {event.availableSpots !== null && event.availableSpots !== undefined && event.type === 'event' && (
                  <p className="event-spots">👥 Осталось мест: {event.availableSpots}</p>
                )}
                
                {event.code && event.type === 'promotion' && (
                  <div className="promo-code">
                    <p className="promo-code-text">🎟 Промокод: <strong>{event.code}</strong></p>
                    {event.discount && event.discount > 0 && (
                      <p className="discount-info">🎯 Скидка: {event.discount}%</p>
                    )}
                    {event.minOrder && event.minOrder > 0 && (
                      <p className="min-order">📦 Минимальный заказ: {event.minOrder} ₽</p>
                    )}
                  </div>
                )}
              </div>

              {event.type === 'event' ? (
                <button 
                  className="event-register-btn"
                  onClick={() => handleEventRegister(event)}
                  disabled={event.availableSpots !== null && event.availableSpots <= 0}
                >
                  {event.availableSpots !== null && event.availableSpots <= 0 ? 
                    '❌ Мест нет' : '📝 Зарегистрироваться'}
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

      {displayEvents.length === 0 && (
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