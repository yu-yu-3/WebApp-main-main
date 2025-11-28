import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import ApiService from '../../utils/api';
import './MenuManagement.css';

const MenuManagement = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    category_id: 3,
    price: '',
    calories: '',
    description: '',
    ingredients: '',
    cooking_time: '',
    is_vegetarian: false,
    is_spicy: false,
    is_gluten_free: false,
    image: '',
    is_available: true
  });
  const [loading, setLoading] = useState(true);

  // Категории меню
  const menuCategories = [
    { id: 1, name: 'Закуски', icon: '🥗' },
    { id: 2, name: 'Супы', icon: '🍲' },
    { id: 3, name: 'Основные блюда', icon: '🍽️' },
    { id: 4, name: 'Десерты', icon: '🍰' },
    { id: 5, name: 'Напитки', icon: '🥤' }
  ];

  useEffect(() => {
    loadMenuItems();
    setCategories(menuCategories);
  }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const itemsData = await ApiService.getAllMenuItems();
      setMenuItems(itemsData);
    } catch (error) {
      console.error('Error loading menu items:', error);
      alert('Ошибка при загрузке меню');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = activeCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category_id === parseInt(activeCategory));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await ApiService.updateMenuItem(editingItem.id, formData);
      } else {
        await ApiService.createMenuItem(formData);
      }

      await loadMenuItems();
      setShowForm(false);
      setEditingItem(null);
      resetForm();
      
      alert(editingItem ? 'Блюдо обновлено!' : 'Блюдо добавлено в меню!');
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Ошибка при сохранении блюда');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category_id: item.category_id,
      price: item.price.toString(),
      calories: item.calories?.toString() || '',
      description: item.description || '',
      ingredients: item.ingredients || '',
      cooking_time: item.cooking_time?.toString() || '',
      is_vegetarian: item.is_vegetarian || false,
      is_spicy: item.is_spicy || false,
      is_gluten_free: item.is_gluten_free || false,
      image: item.image || '',
      is_available: item.is_available
    });
    setShowForm(true);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Вы уверены, что хотите удалить это блюдо из меню?')) {
      try {
        await ApiService.deleteMenuItem(itemId);
        await loadMenuItems();
        alert('Блюдо удалено из меню!');
      } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('Ошибка при удалении блюда');
      }
    }
  };

  const toggleAvailability = async (itemId) => {
    try {
      const item = menuItems.find(i => i.id === itemId);
      await ApiService.updateMenuItem(itemId, {
        ...item,
        is_available: !item.is_available
      });
      await loadMenuItems();
    } catch (error) {
      console.error('Error updating menu item availability:', error);
      alert('Ошибка при обновлении доступности блюда');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category_id: 3,
      price: '',
      calories: '',
      description: '',
      ingredients: '',
      cooking_time: '',
      is_vegetarian: false,
      is_spicy: false,
      is_gluten_free: false,
      image: '',
      is_available: true
    });
  };

  const getCategoryIcon = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.icon : '🍽️';
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Блюдо';
  };

  if (user?.role !== USER_ROLES.ADMIN) {
    return (
      <div className="menu-management">
        <div className="access-denied">
          <h3>⛔ Доступ запрещен</h3>
          <p>У вас недостаточно прав для управления меню.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="menu-management">
        <div className="loading">Загрузка меню...</div>
      </div>
    );
  }

  return (
    <div className="menu-management">
      <div className="management-header">
        <h3>📋 Управление меню</h3>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{menuItems.length}</span>
            <span className="stat-label">Всего блюд</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{menuItems.filter(item => item.is_available).length}</span>
            <span className="stat-label">Доступно</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{menuItems.filter(item => !item.is_available).length}</span>
            <span className="stat-label">Недоступно</span>
          </div>
        </div>
      </div>

      <div className="management-actions">
        <button 
          className="create-btn"
          onClick={() => setShowForm(true)}
        >
          ➕ Добавить блюдо
        </button>
        <button 
          className="refresh-btn"
          onClick={loadMenuItems}
        >
          🔄 Обновить данные
        </button>
      </div>

      <div className="categories-filter">
        <button 
          className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          🍽️ Все блюда ({menuItems.length})
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${activeCategory === category.id.toString() ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id.toString())}
          >
            {category.icon} {category.name} ({menuItems.filter(item => item.category_id === category.id).length})
          </button>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>{editingItem ? 'Редактировать блюдо' : 'Добавить новое блюдо'}</h4>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Название блюда:</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Категория:</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: parseInt(e.target.value) }))}
                    required
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Цена (₽):</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Калории:</label>
                  <input
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Время приготовления (мин):</label>
                  <input
                    type="number"
                    value={formData.cooking_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, cooking_time: e.target.value }))}
                    min="1"
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
                <label>Ингредиенты (через запятую):</label>
                <textarea
                  value={formData.ingredients}
                  onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
                  rows="2"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>URL изображения:</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="/img/menu/example.jpg"
                />
              </div>

              <div className="dietary-preferences">
                <h5>Особенности блюда:</h5>
                <div className="preferences-grid">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_vegetarian}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_vegetarian: e.target.checked }))}
                    />
                    🥬 Вегетарианское
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_spicy}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_spicy: e.target.checked }))}
                    />
                    🌶️ Острое
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_gluten_free}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_gluten_free: e.target.checked }))}
                    />
                    🌾 Без глютена
                  </label>
                </div>
              </div>

              {editingItem && (
                <div className="form-group full-width">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                    />
                    Доступно для заказа
                  </label>
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  resetForm();
                }}>
                  Отмена
                </button>
                <button type="submit" className="submit-btn">
                  {editingItem ? 'Сохранить изменения' : 'Добавить в меню'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="menu-grid">
        {filteredItems.map(item => (
          <div key={item.id} className={`menu-item-card ${!item.is_available ? 'unavailable' : ''}`}>
            <div className="item-image">
              <img src={item.image || '/img/menu/default.jpg'} alt={item.name} />
              <div className="item-badges">
                {item.is_vegetarian && <span className="badge vegetarian">🥬 Вегетарианское</span>}
                {item.is_spicy && <span className="badge spicy">🌶️ Острое</span>}
                {item.is_gluten_free && <span className="badge gluten-free">🌾 Без глютена</span>}
                {!item.is_available && <span className="badge unavailable">⛔ Недоступно</span>}
              </div>
            </div>
            
            <div className="item-info">
              <div className="item-header">
                <h4>{item.name}</h4>
                <span className="item-category">
                  {getCategoryIcon(item.category_id)} {getCategoryName(item.category_id)}
                </span>
              </div>
              
              <p className="item-description">{item.description}</p>
              
              <div className="item-details">
                <p className="item-ingredients">
                  <strong>Ингредиенты:</strong> {item.ingredients}
                </p>
                <div className="item-stats">
                  <span className="item-price">{item.price} ₽</span>
                  {item.calories && <span className="item-calories">{item.calories} ккал</span>}
                  {item.cooking_time && <span className="item-time">⏱️ {item.cooking_time} мин</span>}
                </div>
              </div>
            </div>

            <div className="item-actions">
              <button 
                className="edit-btn"
                onClick={() => handleEdit(item)}
              >
                ✏️ Редактировать
              </button>
              <button 
                className={`status-btn ${item.is_available ? 'disable' : 'enable'}`}
                onClick={() => toggleAvailability(item.id)}
              >
                {item.is_available ? '⛔ Снять с продажи' : '✅ Вернуть в продажу'}
              </button>
              <button 
                className="delete-btn"
                onClick={() => handleDelete(item.id)}
              >
                🗑️ Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="no-items">
          <p>Блюда не найдены</p>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;