import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import './EventRegistration.css';

const EventRegistration = () => {
  const { user } = useAuth();
  const { showEventRegistration, closeEventRegistration, currentEvent } = useModal();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    guests: 1,
    comments: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Пожалуйста, войдите в систему чтобы зарегистрироваться на мероприятие');
      closeEventRegistration();
      return;
    }

    setIsSubmitting(true);

    try {
      // Создаем объект регистрации
      const registration = {
        id: Date.now(),
        eventId: currentEvent.id,
        eventName: currentEvent.title,
        eventDate: currentEvent.date,
        eventTime: currentEvent.time,
        userName: formData.name || user.name,
        userEmail: formData.email || user.email,
        userPhone: formData.phone,
        guests: formData.guests,
        comments: formData.comments,
        status: 'registered',
        registeredAt: new Date().toISOString()
      };

      // Сохраняем регистрацию в localStorage
      const userRegistrations = JSON.parse(localStorage.getItem(`user_event_registrations_${user.id}`)) || [];
      userRegistrations.unshift(registration);
      localStorage.setItem(`user_event_registrations_${user.id}`, JSON.stringify(userRegistrations));

      // Показываем уведомление
      alert(`Вы успешно зарегистрировались на мероприятие "${currentEvent.title}"!`);
      
      // Сбрасываем форму
      setFormData({
        name: '',
        email: '',
        phone: '',
        guests: 1,
        comments: ''
      });
      
      closeEventRegistration();
      
    } catch (error) {
      console.error('Registration error:', error);
      alert('Произошла ошибка при регистрации. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Заполняем данные пользователя при открытии формы
  React.useEffect(() => {
    if (user && showEventRegistration) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user, showEventRegistration]);

  if (!showEventRegistration || !currentEvent) return null;

  return (
    <div className="event-registration-modal">
      <div className="event-registration-content">
        <button className="close-btn" onClick={closeEventRegistration}>×</button>
        <h2>Регистрация на мероприятие</h2>
        
        <div className="event-info">
          <h3>{currentEvent.title}</h3>
          <p className="event-date">
            📅 {new Date(currentEvent.date).toLocaleDateString('ru-RU')}
            {currentEvent.time && ` в ${currentEvent.time}`}
          </p>
          {currentEvent.location && (
            <p className="event-location">📍 {currentEvent.location}</p>
          )}
          {currentEvent.price && (
            <p className="event-price">💰 Стоимость: {currentEvent.price} ₽</p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              placeholder="Введите ваше имя"
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
            <label>Количество гостей (включая вас)</label>
            <select
              value={formData.guests}
              onChange={(e) => handleChange('guests', parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'человек' : num < 5 ? 'человека' : 'человек'}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Дополнительные пожелания или комментарии</label>
            <textarea
              value={formData.comments}
              onChange={(e) => handleChange('comments', e.target.value)}
              rows="3"
              placeholder="Например: пищевые ограничения, особые пожелания..."
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={closeEventRegistration}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventRegistration;