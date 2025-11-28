// components/Reviews/EditReviewForm.jsx
import React, { useState, useEffect } from 'react';
import { useModal } from '../../context/ModalContext';
import './EditReviewForm.css';

const EditReviewForm = () => {
  const { showEditReview, closeEditReview, currentReview } = useModal();
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    visitDate: ''
  });
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (currentReview && showEditReview) {
      setFormData({
        rating: currentReview.rating,
        comment: currentReview.comment,
        visitDate: currentReview.visitDate || ''
      });
    }
  }, [currentReview, showEditReview]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Логика обновления отзыва
    alert('Функция редактирования отзыва скоро будет доступна!');
    closeEditReview();
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

  if (!showEditReview || !currentReview) return null;

  return (
    <div className="edit-review-modal">
      <div className="edit-review-content">
        <button className="close-btn" onClick={closeEditReview}>×</button>
        <h2>Редактировать отзыв</h2>
        
        <div className="restaurant-info">
          <h3>{currentReview.restaurant}</h3>
        </div>

        <form onSubmit={handleSubmit}>
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
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              rows="5"
              placeholder="Поделитесь вашими впечатлениями..."
              required
            />
          </div>

          <div className="form-group">
            <label>Дата посещения:</label>
            <input
              type="date"
              value={formData.visitDate}
              onChange={(e) => setFormData(prev => ({ ...prev, visitDate: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={closeEditReview}>
              Отмена
            </button>
            <button type="submit" className="submit-btn">
              Сохранить изменения
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditReviewForm;