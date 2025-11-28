import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import './ReviewForm.css';

const ReviewForm = () => {
  const { user } = useAuth();
  const { showReviewForm, closeReviewForm } = useModal();
  const [formData, setFormData] = useState({
    restaurant: '',
    rating: 0,
    comment: '',
    visitDate: ''
  });
  const [restaurants, setRestaurants] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // Загружаем рестораны из localStorage
  useEffect(() => {
    if (showReviewForm) {
      const savedRestaurants = localStorage.getItem('restaurants');
      if (savedRestaurants) {
        const parsedRestaurants = JSON.parse(savedRestaurants);
        // Фильтруем только активные рестораны
        const activeRestaurants = parsedRestaurants.filter(restaurant => restaurant.isActive !== false);
        setRestaurants(activeRestaurants);
      } else {
        // Если нет в localStorage, используем моковые данные
        const defaultRestaurants = [
          'Matreshka Центр',
          'Matreshka Север', 
          'Matreshka Юг',
          'Matreshka Запад'
        ];
        setRestaurants(defaultRestaurants);
      }
    }
  }, [showReviewForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Пожалуйста, войдите в систему чтобы оставить отзыв');
      closeReviewForm();
      return;
    }

    if (formData.rating === 0) {
      alert('Пожалуйста, поставьте оценку');
      return;
    }

    if (!formData.restaurant) {
      alert('Пожалуйста, выберите ресторан');
      return;
    }

    setIsSubmitting(true);

    try {
      // Создаем объект отзыва
      const newReview = {
        id: Date.now(),
        userId: user.id,
        userName: user.name,
        restaurant: formData.restaurant,
        rating: formData.rating,
        comment: formData.comment,
        visitDate: formData.visitDate || new Date().toISOString().split('T')[0],
        status: 'pending', // На модерации
        createdAt: new Date().toISOString(),
        likes: 0,
        dislikes: 0
      };

      console.log('Saving review:', newReview);

      // Сохраняем в localStorage
      const userReviews = JSON.parse(localStorage.getItem(`user_reviews_${user.id}`)) || [];
      userReviews.unshift(newReview);
      localStorage.setItem(`user_reviews_${user.id}`, JSON.stringify(userReviews));

      // Также сохраняем в общий список отзывов для модерации
      const allReviews = JSON.parse(localStorage.getItem('all_reviews')) || [];
      allReviews.unshift(newReview);
      localStorage.setItem('all_reviews', JSON.stringify(allReviews));

      // Показываем уведомление
      alert('Спасибо за ваш отзыв! Он будет опубликован после проверки модератором.');
      
      // Сбрасываем форму
      setFormData({
        restaurant: '',
        rating: 0,
        comment: '',
        visitDate: ''
      });
      
      closeReviewForm();
      
      // Отправляем событие обновления
      window.dispatchEvent(new Event('reviewsUpdated'));
      
    } catch (error) {
      console.error('Review submission error:', error);
      alert('Произошла ошибка при отправке отзыва. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStarClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleStarHover = (rating) => {
    setHoverRating(rating);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  const getStarClassName = (starNumber) => {
    const displayRating = hoverRating || formData.rating;
    return starNumber <= displayRating ? 'star filled' : 'star';
  };

  // Если модальное окно не должно показываться, возвращаем null
  if (!showReviewForm) return null;

  return (
    <div className="review-modal">
      <div className="review-content">
        <button className="close-btn" onClick={closeReviewForm}>×</button>
        <h2>Оставить отзыв</h2>
        
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
              <p className="warning-text">Нет доступных ресторанов для отзывов</p>
            )}
          </div>

          <div className="form-group">
            <label>Дата посещения:</label>
            <input
              type="date"
              value={formData.visitDate}
              onChange={(e) => handleChange('visitDate', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label>Оценка:</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <span
                  key={star}
                  className={getStarClassName(star)}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                >
                  ★
                </span>
              ))}
              <span className="rating-text">
                {formData.rating ? `${formData.rating} из 5 звезд` : 'Поставьте оценку'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Ваш отзыв:</label>
            <textarea
              value={formData.comment}
              onChange={(e) => handleChange('comment', e.target.value)}
              rows="5"
              placeholder="Поделитесь вашими впечатлениями о посещении ресторана..."
              required
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={closeReviewForm}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting || restaurants.length === 0}
            >
              {isSubmitting ? 'Отправка...' : restaurants.length === 0 ? 'Нет доступных ресторанов' : 'Отправить отзыв'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;