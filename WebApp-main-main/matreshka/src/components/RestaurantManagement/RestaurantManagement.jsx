import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import ApiService from '../../utils/api';
import './RestaurantManagement.css'; // Исправлено: RestaurantManagement.css вместо RestaurantMap.css

const RestaurantManagement = () => {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    openingHours: '',
    capacity: '',
    description: '',
    image: '',
    isActive: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const restaurantsData = await ApiService.getAllRestaurants();
      setRestaurants(restaurantsData);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      alert('Ошибка при загрузке ресторанов');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingRestaurant) {
        await ApiService.updateRestaurant(editingRestaurant.id, formData);
      } else {
        await ApiService.createRestaurant(formData);
      }

      await loadRestaurants();
      setShowForm(false);
      setEditingRestaurant(null);
      resetForm();
      
      alert(editingRestaurant ? 'Ресторан обновлен!' : 'Ресторан создан!');
    } catch (error) {
      console.error('Error saving restaurant:', error);
      alert('Ошибка при сохранении ресторана');
    }
  };

  const handleEdit = (restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      address: restaurant.address,
      phone: restaurant.phone,
      email: restaurant.email || '',
      openingHours: restaurant.opening_hours || '',
      capacity: restaurant.capacity || '',
      description: restaurant.description || '',
      image: restaurant.image || '',
      isActive: restaurant.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (restaurantId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот ресторан?')) {
      try {
        await ApiService.deleteRestaurant(restaurantId);
        await loadRestaurants();
        alert('Ресторан удален!');
      } catch (error) {
        console.error('Error deleting restaurant:', error);
        alert('Ошибка при удалении ресторана');
      }
    }
  };

  const toggleRestaurantStatus = async (restaurantId) => {
    try {
      const restaurant = restaurants.find(r => r.id === restaurantId);
      await ApiService.updateRestaurant(restaurantId, {
        ...restaurant,
        isActive: !restaurant.is_active
      });
      await loadRestaurants();
    } catch (error) {
      console.error('Error updating restaurant status:', error);
      alert('Ошибка при обновлении статуса ресторана');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      openingHours: '',
      capacity: '',
      description: '',
      image: '',
      isActive: true
    });
  };

  if (user?.role !== USER_ROLES.ADMIN) {
    return (
      <div className="restaurant-management">
        <div className="access-denied">
          <h3>⛔ Доступ запрещен</h3>
          <p>У вас недостаточно прав для управления ресторанами.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="restaurant-management">
        <div className="loading">Загрузка ресторанов...</div>
      </div>
    );
  }

  return (
    <div className="restaurant-management">
      <div className="management-header">
        <h3>🏢 Управление ресторанами</h3>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{restaurants.length}</span>
            <span className="stat-label">Всего ресторанов</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{restaurants.filter(r => r.is_active).length}</span>
            <span className="stat-label">Активных</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{restaurants.filter(r => !r.is_active).length}</span>
            <span className="stat-label">Неактивных</span>
          </div>
        </div>
      </div>

      <div className="management-actions">
        <button 
          className="create-btn"
          onClick={() => setShowForm(true)}
        >
          ➕ Добавить ресторан
        </button>
        <button 
          className="refresh-btn"
          onClick={loadRestaurants}
        >
          🔄 Обновить данные
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>{editingRestaurant ? 'Редактировать ресторан' : 'Добавить новый ресторан'}</h4>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowForm(false);
                  setEditingRestaurant(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Название ресторана:</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Адрес:</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Телефон:</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Часы работы:</label>
                  <input
                    type="text"
                    value={formData.openingHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, openingHours: e.target.value }))}
                    placeholder="10:00 - 23:00"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Вместимость (чел.):</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group full-width">
                <label>Описание:</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>URL изображения:</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="/img/restaurants/example.jpg"
                />
              </div>

              {editingRestaurant && (
                <div className="form-group full-width">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    Активный ресторан
                  </label>
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={() => {
                  setShowForm(false);
                  setEditingRestaurant(null);
                  resetForm();
                }}>
                  Отмена
                </button>
                <button type="submit" className="submit-btn">
                  {editingRestaurant ? 'Сохранить изменения' : 'Создать ресторан'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="restaurants-grid">
        {restaurants.map(restaurant => (
          <div key={restaurant.id} className={`restaurant-card ${!restaurant.is_active ? 'inactive' : ''}`}>
            <div className="restaurant-image">
              <img src={restaurant.image || '/img/restaurants/default.jpg'} alt={restaurant.name} />
              <div className="restaurant-status">
                <span className={`status-badge ${restaurant.is_active ? 'active' : 'inactive'}`}>
                  {restaurant.is_active ? '✅ Активен' : '⛔ Неактивен'}
                </span>
              </div>
            </div>
            
            <div className="restaurant-info">
              <h4>{restaurant.name}</h4>
              <p className="restaurant-address">📍 {restaurant.address}</p>
              <p className="restaurant-phone">📞 {restaurant.phone}</p>
              <p className="restaurant-email">📧 {restaurant.email}</p>
              <p className="restaurant-hours">🕒 {restaurant.opening_hours}</p>
              <p className="restaurant-capacity">👥 Вместимость: {restaurant.capacity} чел.</p>
              <p className="restaurant-description">{restaurant.description}</p>
            </div>

            <div className="restaurant-actions">
              <button 
                className="edit-btn"
                onClick={() => handleEdit(restaurant)}
              >
                ✏️ Редактировать
              </button>
              <button 
                className={`status-btn ${restaurant.is_active ? 'deactivate' : 'activate'}`}
                onClick={() => toggleRestaurantStatus(restaurant.id)}
              >
                {restaurant.is_active ? '⛔ Деактивировать' : '✅ Активировать'}
              </button>
              <button 
                className="delete-btn"
                onClick={() => handleDelete(restaurant.id)}
              >
                🗑️ Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      {restaurants.length === 0 && (
        <div className="no-restaurants">
          <p>Рестораны не найдены</p>
        </div>
      )}
    </div>
  );
};

export default RestaurantManagement;