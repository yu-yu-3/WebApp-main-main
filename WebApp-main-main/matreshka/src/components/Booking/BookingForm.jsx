import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import ApiService from '../../utils/api';
import './Booking.css';

const BookingForm = () => {
  const { user } = useAuth();
  const { showBooking, closeBooking } = useModal();
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    guests: 2,
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    specialRequests: '',
    restaurant: ''
  });
  const [restaurants, setRestaurants] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Загружаем рестораны из localStorage
  useEffect(() => {
    if (showBooking) {
      const savedRestaurants = localStorage.getItem('restaurants');
      if (savedRestaurants) {
        const parsedRestaurants = JSON.parse(savedRestaurants);
        // Фильтруем только активные рестораны
        const activeRestaurants = parsedRestaurants.filter(restaurant => restaurant.isActive !== false);
        setRestaurants(activeRestaurants);
        
        // Устанавливаем первый активный ресторан по умолчанию
        if (activeRestaurants.length > 0 && !formData.restaurant) {
          setFormData(prev => ({ ...prev, restaurant: activeRestaurants[0].name }));
        }
      } else {
        // Если нет в localStorage, используем моковые данные
        const defaultRestaurants = [
          'Matreshka Центр',
          'Matreshka Север', 
          'Matreshka Юг',
          'Matreshka Запад'
        ];
        setRestaurants(defaultRestaurants);
        if (!formData.restaurant) {
          setFormData(prev => ({ ...prev, restaurant: defaultRestaurants[0] }));
        }
      }
    }
  }, [showBooking, formData.restaurant]);

  const timeSlots = [
    '12:00', '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!user) {
    alert('Пожалуйста, войдите в систему чтобы забронировать стол');
    closeBooking();
    return;
  }

  setIsSubmitting(true);

  try {
    // 1. Получаем ID ресторана по названию
    let restaurantId = null;
    try {
      const restaurants = await ApiService.getRestaurants();
      const selectedRestaurant = restaurants.find(r => r.name === formData.restaurant);
      
      if (selectedRestaurant) {
        restaurantId = selectedRestaurant.id;
        console.log('Found restaurant ID:', restaurantId);
      } else {
        console.error('Restaurant not found:', formData.restaurant);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }

    // 2. Создаем объект бронирования для базы данных
    const bookingData = {
      user_id: user.id,
      restaurant_id: restaurantId || 1, // По умолчанию первый ресторан
      date: formData.date,
      time: formData.time,
      guests: parseInt(formData.guests),
      customer_name: formData.name || user.name,
      phone: formData.phone,
      special_requests: formData.specialRequests || '',
      status: 'pending' // Статус "ожидает подтверждения"
    };

    console.log('Sending booking to API:', bookingData);

    // 3. Сохраняем в базу данных через API
    let apiResponse;
    try {
      // Пробуем использовать API
      apiResponse = await ApiService.createBooking(bookingData);
      console.log('API response:', apiResponse);
    } catch (apiError) {
      console.error('API error, saving to localStorage:', apiError);
      
      // Если API не работает, сохраняем в localStorage как резервный вариант
      const newBooking = {
        id: Date.now(),
        ...bookingData,
        restaurantName: formData.restaurant,
        customerName: formData.name || user.name,
        email: formData.email || user.email,
        createdAt: new Date().toISOString()
      };

      const userBookings = JSON.parse(localStorage.getItem(`user_bookings_${user.id}`)) || [];
      userBookings.unshift(newBooking);
      localStorage.setItem(`user_bookings_${user.id}`, JSON.stringify(userBookings));
      
      apiResponse = { id: newBooking.id, message: 'Saved to localStorage' };
    }

    // 4. Показываем уведомление
    if (apiResponse.id) {
      alert(`Стол успешно забронирован в ресторане "${formData.restaurant}" на ${formData.date} в ${formData.time}!`);
    } else {
      alert('Бронирование создано, но возникли проблемы с сохранением.');
    }
    
    // 5. Сбрасываем форму
    setFormData({
      date: '',
      time: '',
      guests: 2,
      name: user.name || '',
      phone: '',
      email: user.email || '',
      specialRequests: '',
      restaurant: restaurants.length > 0 ? restaurants[0].name || restaurants[0] : ''
    });
    
    closeBooking();
    
    // 6. Отправляем событие обновления
    window.dispatchEvent(new Event('bookingUpdated'));
    
  } catch (error) {
    console.error('Booking error:', error);
    alert('Произошла ошибка при бронировании. Попробуйте снова.');
  } finally {
    setIsSubmitting(false);
  }
};

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Минимальная дата - сегодня
  const today = new Date().toISOString().split('T')[0];

  if (!showBooking) return null;

  return (
    <div className="booking-modal">
      <div className="booking-content">
        <button className="close-btn" onClick={closeBooking}>×</button>
        <h2>Бронирование стола</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Ресторан:</label>
            <select
              value={formData.restaurant}
              onChange={(e) => handleChange('restaurant', e.target.value)}
              required
            >
              <option value="">Выберите ресторан</option>
              {restaurants.map(restaurant => (
                <option key={restaurant.id || restaurant} value={restaurant.name || restaurant}>
                  {restaurant.name || restaurant}
                  {restaurant.isActive === false && ' (Недоступен)'}
                </option>
              ))}
            </select>
            {restaurants.length === 0 && (
              <p className="warning-text">Нет доступных ресторанов для бронирования</p>
            )}
          </div>

          <div className="form-group">
            <label>Дата:</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
              min={today}
            />
          </div>

          <div className="form-group">
            <label>Время:</label>
            <select
              value={formData.time}
              onChange={(e) => handleChange('time', e.target.value)}
              required
            >
              <option value="">Выберите время</option>
              {timeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Количество гостей:</label>
            <select
              value={formData.guests}
              onChange={(e) => handleChange('guests', parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'гость' : num < 5 ? 'гостя' : 'гостей'}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Имя:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              placeholder="Введите ваше имя"
            />
          </div>

          <div className="form-group">
            <label>Телефон:</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              required
              placeholder="+7 (XXX) XXX-XX-XX"
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label>Особые пожелания:</label>
            <textarea
              value={formData.specialRequests}
              onChange={(e) => handleChange('specialRequests', e.target.value)}
              rows="3"
              placeholder="Например: стол у окна, детский стульчик, аллергия на..."
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting || restaurants.length === 0}
          >
            {isSubmitting ? 'Бронируем...' : restaurants.length === 0 ? 'Нет доступных ресторанов' : 'Забронировать стол'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;