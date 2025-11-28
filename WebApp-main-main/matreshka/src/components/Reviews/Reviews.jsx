import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ReviewForm from './ReviewForm';
import './Reviews.css';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    // Загрузка отзывов из API
    const mockReviews = [
      {
        id: 1,
        userName: 'Анна Петрова',
        rating: 5,
        comment: 'Прекрасный ресторан! Пельмени просто объедение!',
        date: '2024-11-20',
        status: 'approved',
        restaurant: 'Matreshka Центр'
      },
      {
        id: 2,
        userName: 'Иван Сидоров',
        rating: 4,
        comment: 'Хорошая кухня, но обслуживание могло бы быть быстрее',
        date: '2024-11-18',
        status: 'approved',
        restaurant: 'Matreshka Север'
      },
      // Добавьте остальные отзывы
    ];
    setReviews(mockReviews);
  }, []);

  const filteredReviews = reviews.filter(review => 
    filter === 'all' ? true : review.status === filter
  );

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const handleSubmitReview = async (reviewData) => {
    // Отправка отзыва на модерацию
    const newReview = {
      id: reviews.length + 1,
      userName: user.name,
      ...reviewData,
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    
    setReviews(prev => [newReview, ...prev]);
    setShowForm(false);
  };

  return (
    <section className="reviews-section">
      <h2>Отзывы наших гостей</h2>
      
      <div className="reviews-header">
        <div className="rating-overview">
          <div className="average-rating">
            <span className="rating-number">{averageRating}</span>
            <div className="stars">
              {'★'.repeat(Math.round(averageRating))}
              {'☆'.repeat(5 - Math.round(averageRating))}
            </div>
            <span className="reviews-count">({reviews.length} отзывов)</span>
          </div>
        </div>

        <button 
          className="add-review-btn"
          onClick={() => setShowForm(true)}
          disabled={!user}
        >
          {user ? 'Написать отзыв' : 'Войдите, чтобы оставить отзыв'}
        </button>
      </div>

      <div className="reviews-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Все отзывы
        </button>
        <button 
          className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          Опубликованные
        </button>
        {user?.role === 'moderator' && (
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            На модерации
          </button>
        )}
      </div>

      <div className="reviews-list">
        {filteredReviews.map(review => (
          <div key={review.id} className={`review-card ${review.status}`}>
            <div className="review-header">
              <div className="reviewer-info">
                <strong>{review.userName}</strong>
                <span className="review-date">
                  {new Date(review.date).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <div className="review-rating">
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
              </div>
            </div>
            
            <p className="review-comment">{review.comment}</p>
            <p className="review-restaurant">📍 {review.restaurant}</p>
            
            {review.status === 'pending' && user?.role === 'moderator' && (
              <div className="moderation-actions">
                <button className="approve-btn">Одобрить</button>
                <button className="reject-btn">Отклонить</button>
              </div>
            )}
            
            {review.status === 'pending' && (
              <span className="pending-badge">На модерации</span>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <ReviewForm 
          onSubmit={handleSubmitReview}
          onClose={() => setShowForm(false)}
        />
      )}
    </section>
  );
};

export default Reviews;