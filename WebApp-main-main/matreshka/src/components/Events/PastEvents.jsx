import React, { useState, useEffect } from 'react';
import './PastEvents.css';

const PastEvents = () => {
  const [pastEvents, setPastEvents] = useState([]);

  useEffect(() => {
    // Моковые данные прошедших мероприятий
    const mockPastEvents = [
      {
        id: 101,
        title: 'Фестиваль русской кухни',
        type: 'event',
        date: '2024-10-15',
        time: '18:00',
        location: 'Matreshka Центр',
        description: 'Грандиозный фестиваль с дегустацией блюд со всех регионов России. Гости могли попробовать уральские пельмени, сибирские пироги и кавказские шашлыки.',
        image: '/img/events/russian-festival.jpg',
        price: 2000,
        participants: 80,
        photos: ['/img/events/festival1.jpg', '/img/events/festival2.jpg']
      },
      {
        id: 102,
        title: 'Осенний кулинарный мастер-класс',
        type: 'event',
        date: '2024-09-20',
        time: '16:00',
        location: 'Matreshka Юг',
        description: 'Мастер-класс по приготовлению осенних блюд русской кухни. Участники научились готовить грибной суп, капустные пироги и клюквенный морс.',
        image: '/img/events/autumn-masterclass.jpg',
        price: 1800,
        participants: 15,
        photos: ['/img/events/masterclass1.jpg']
      },
      {
        id: 103,
        title: 'День рождения ресторана',
        type: 'event',
        date: '2024-08-05',
        time: '19:00',
        location: 'Matreshka Центр',
        description: 'Празднование 5-летия нашего ресторана. Гостей ждала специальная программа, живая музыка и сюрпризы от шеф-повара.',
        image: '/img/events/birthday.jpg',
        price: 0,
        participants: 120,
        photos: ['/img/events/birthday1.jpg', '/img/events/birthday2.jpg', '/img/events/birthday3.jpg']
      },
      {
        id: 104,
        title: 'Летний пикник в парке',
        type: 'event',
        date: '2024-07-12',
        time: '14:00',
        location: 'Парк Горького',
        description: 'Специальное выездное мероприятие с русскими угощениями на свежем воздухе. Гости наслаждались шашлыками, окрошкой и традиционными напитками.',
        image: '/img/events/picnic.jpg',
        price: 1500,
        participants: 60,
        photos: ['/img/events/picnic1.jpg', '/img/events/picnic2.jpg']
      }
    ];
    
    setPastEvents(mockPastEvents);
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <section className="past-events-section">
      <h2>Прошедшие мероприятия</h2>
      <p className="past-events-intro">
        За годы работы мы провели множество незабываемых мероприятий. 
        Здесь вы можете увидеть архив наших самых ярких событий.
      </p>
      
      <div className="past-events-grid">
        {pastEvents.map(event => (
          <div key={event.id} className="past-event-card">
            {event.image && (
              <img src={event.image} alt={event.title} className="past-event-image" />
            )}
            
            <div className="past-event-content">
              <h3>{event.title}</h3>
              <p className="past-event-description">{event.description}</p>
              
              <div className="past-event-details">
                <p className="past-event-date">
                  📅 {formatDate(event.date)}
                  {event.time && ` в ${event.time}`}
                </p>
                
                {event.location && (
                  <p className="past-event-location">📍 {event.location}</p>
                )}
                
                {event.price > 0 ? (
                  <p className="past-event-price">💰 Стоимость: {event.price} ₽</p>
                ) : (
                  <p className="past-event-price">🎁 Бесплатное мероприятие</p>
                )}
                
                {event.participants && (
                  <p className="past-event-participants">👥 Участников: {event.participants}</p>
                )}
              </div>

              {event.photos && event.photos.length > 0 && (
                <div className="event-photos">
                  <p className="photos-label">📸 Фотографии с мероприятия:</p>
                  <div className="photos-grid">
                    {event.photos.map((photo, index) => (
                      <div key={index} className="photo-thumbnail">
                        <img src={photo} alt={`Фото ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {pastEvents.length === 0 && (
        <div className="no-past-events">
          <p>Пока нет прошедших мероприятий в архиве</p>
        </div>
      )}
    </section>
  );
};

export default PastEvents;