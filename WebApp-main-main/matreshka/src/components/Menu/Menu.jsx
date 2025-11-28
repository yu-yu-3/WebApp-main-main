import React, { useState, useEffect } from 'react';
import MenuItem from './MenuItem';
import { useCart } from '../../context/CartContext';
import ApiService from '../../utils/api';
import './Menu.css';

const Menu = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [filters, setFilters] = useState({
    vegetarian: false,
    spicy: false,
    glutenFree: false,
    sortBy: 'default'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  // Категории меню (соответствуют ID в базе данных)
  const categories = [
    { id: 'all', name: 'Все блюда', dbId: null },
    { id: 'appetizers', name: 'Закуски', dbId: 1 },
    { id: 'soups', name: 'Супы', dbId: 2 },
    { id: 'main', name: 'Основные блюда', dbId: 3 },
    { id: 'desserts', name: 'Десерты', dbId: 4 },
    { id: 'drinks', name: 'Напитки', dbId: 5 }
  ];

  useEffect(() => {
    loadMenuItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [menuItems, activeCategory, filters]);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const itemsData = await ApiService.getMenu();
      
      // Преобразуем данные из API в формат, который ожидает компонент
      const formattedItems = itemsData.map(item => ({
        id: item.id,
        name: item.name,
        category: getCategorySlug(item.category_id),
        price: item.price,
        calories: item.calories,
        description: item.description,
        image: item.image || '/img/menu/default.jpg',
        ingredients: item.ingredients ? item.ingredients.split(', ') : [],
        cookingTime: item.cooking_time,
        isVegetarian: Boolean(item.is_vegetarian),
        isSpicy: Boolean(item.is_spicy),
        isGlutenFree: Boolean(item.is_gluten_free),
        isAvailable: Boolean(item.is_available)
      }));

      setMenuItems(formattedItems);
    } catch (error) {
      console.error('Error loading menu from API:', error);
      setError('Ошибка при загрузке меню. Пожалуйста, попробуйте позже.');
      // В случае ошибки можно показать моковые данные
      setMenuItems(getMockMenu());
    } finally {
      setLoading(false);
    }
  };

  // Функция для получения slug категории по ID из базы данных
  const getCategorySlug = (categoryId) => {
    const category = categories.find(cat => cat.dbId === categoryId);
    return category ? category.id : 'main';
  };

  // Функция для получения мокового меню (на случай если API не работает)
  const getMockMenu = () => {
    return [
      {
        id: 1,
        name: 'Пельмени домашние',
        category: 'main',
        price: 450,
        calories: 320,
        description: 'Традиционные русские пельмени с говядиной и свининой',
        image: '/img/menu/pelmeni.jpg',
        ingredients: ['мука', 'говядина', 'свинина', 'лук', 'специи'],
        cookingTime: 25,
        isVegetarian: false,
        isSpicy: false,
        isGlutenFree: false,
        isAvailable: true
      },
      {
        id: 2,
        name: 'Борщ украинский',
        category: 'soups',
        price: 350,
        calories: 180,
        description: 'Наваристый борщ со сметаной и зеленью',
        image: '/img/menu/borshch.jpg',
        ingredients: ['свекла', 'капуста', 'картофель', 'мясо', 'сметана'],
        cookingTime: 40,
        isVegetarian: false,
        isSpicy: false,
        isGlutenFree: true,
        isAvailable: true
      },
      {
        id: 3,
        name: 'Салат Оливье',
        category: 'appetizers',
        price: 280,
        calories: 210,
        description: 'Классический салат с колбасой, овощами и майонезом',
        image: '/img/menu/olivye.jpg',
        ingredients: ['колбаса', 'картофель', 'морковь', 'огурцы', 'горошек', 'майонез'],
        cookingTime: 20,
        isVegetarian: false,
        isSpicy: false,
        isGlutenFree: false,
        isAvailable: true
      },
      {
        id: 4,
        name: 'Овощной салат',
        category: 'appetizers',
        price: 220,
        calories: 120,
        description: 'Свежие овощи с оливковым маслом',
        image: '/img/menu/vegetable-salad.jpg',
        ingredients: ['помидоры', 'огурцы', 'перец', 'лук', 'оливковое масло'],
        cookingTime: 10,
        isVegetarian: true,
        isSpicy: false,
        isGlutenFree: true,
        isAvailable: true
      },
      {
        id: 5,
        name: 'Сырники',
        category: 'desserts',
        price: 320,
        calories: 280,
        description: 'Нежные творожные сырники со сметаной',
        image: '/img/menu/syrniki.jpg',
        ingredients: ['творог', 'мука', 'яйца', 'сахар', 'сметана'],
        cookingTime: 15,
        isVegetarian: true,
        isSpicy: false,
        isGlutenFree: false,
        isAvailable: true
      },
      {
        id: 6,
        name: 'Компот из сухофруктов',
        category: 'drinks',
        price: 150,
        calories: 80,
        description: 'Освежающий напиток из сушеных фруктов',
        image: '/img/menu/kompot.jpg',
        ingredients: ['сушеные яблоки', 'груши', 'чернослив', 'изюм', 'сахар'],
        cookingTime: 30,
        isVegetarian: true,
        isSpicy: false,
        isGlutenFree: true,
        isAvailable: true
      }
    ];
  };

  const filterItems = () => {
    let result = [...menuItems];

    // Фильтрация по категории
    if (activeCategory !== 'all') {
      const category = categories.find(cat => cat.id === activeCategory);
      if (category && category.dbId) {
        result = result.filter(item => {
          const itemCategory = categories.find(cat => cat.id === item.category);
          return itemCategory && itemCategory.dbId === category.dbId;
        });
      }
    }

    // Фильтрация по диетическим предпочтениям
    if (filters.vegetarian) {
      result = result.filter(item => item.isVegetarian);
    }
    if (filters.spicy) {
      result = result.filter(item => item.isSpicy);
    }
    if (filters.glutenFree) {
      result = result.filter(item => item.isGlutenFree);
    }

    // Сортировка
    switch (filters.sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'calories':
        result.sort((a, b) => (a.calories || 0) - (b.calories || 0));
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // По умолчанию - порядок как в массиве
        break;
    }

    setFilteredItems(result);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleAddToCart = (item) => {
    if (!item.isAvailable) {
      alert('Это блюдо временно недоступно для заказа');
      return;
    }
    addToCart(item);
  };

  const getItemsCountByCategory = (categoryId) => {
    if (categoryId === 'all') return menuItems.length;
    
    const category = categories.find(cat => cat.id === categoryId);
    if (!category || !category.dbId) return 0;
    
    return menuItems.filter(item => {
      const itemCategory = categories.find(cat => cat.id === item.category);
      return itemCategory && itemCategory.dbId === category.dbId;
    }).length;
  };

  if (loading) {
    return (
      <section id="menu" className="menu-section">
        <div className="loading">Загрузка меню...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="menu" className="menu-section">
        <div className="error-message">
          <h2>Наше меню</h2>
          <p>{error}</p>
          <button onClick={loadMenuItems} className="retry-btn">
            Попробовать снова
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" className="menu-section">
      <h2>Наше меню</h2>
      
      <div className="menu-categories">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.name} ({getItemsCountByCategory(category.id)})
          </button>
        ))}
      </div>

      <div className="menu-filters">
        <div className="filter-group">
          <label className="filter-checkbox">
            <input 
              type="checkbox" 
              checked={filters.vegetarian}
              onChange={(e) => handleFilterChange('vegetarian', e.target.checked)}
            />
            <span className="checkmark"></span>
            🥬 Вегетарианские
          </label>
          
          <label className="filter-checkbox">
            <input 
              type="checkbox" 
              checked={filters.spicy}
              onChange={(e) => handleFilterChange('spicy', e.target.checked)}
            />
            <span className="checkmark"></span>
            🌶️ Острые
          </label>
          
          <label className="filter-checkbox">
            <input 
              type="checkbox" 
              checked={filters.glutenFree}
              onChange={(e) => handleFilterChange('glutenFree', e.target.checked)}
            />
            <span className="checkmark"></span>
            🌾 Без глютена
          </label>
        </div>
        
        <div className="filter-group">
          <label>Сортировка:</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="default">По умолчанию</option>
            <option value="price-asc">По цене (возр.)</option>
            <option value="price-desc">По цене (убыв.)</option>
            <option value="calories">По калориям</option>
            <option value="name">По названию</option>
          </select>
        </div>
      </div>

      <div className="menu-stats">
        <p>Найдено блюд: <strong>{filteredItems.length}</strong></p>
        {(filters.vegetarian || filters.spicy || filters.glutenFree || activeCategory !== 'all' || filters.sortBy !== 'default') && (
          <button 
            className="reset-filters-btn"
            onClick={() => {
              setActiveCategory('all');
              setFilters({
                vegetarian: false,
                spicy: false,
                glutenFree: false,
                sortBy: 'default'
              });
            }}
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <div className="no-results">
          <h3>Ничего не найдено</h3>
          <p>Попробуйте изменить параметры фильтрации</p>
          <button 
            className="reset-filters-btn"
            onClick={() => {
              setActiveCategory('all');
              setFilters({
                vegetarian: false,
                spicy: false,
                glutenFree: false,
                sortBy: 'default'
              });
            }}
          >
            Показать все блюда
          </button>
        </div>
      ) : (
        <div className="menu-grid">
          {filteredItems.map(item => (
            <MenuItem 
              key={item.id} 
              item={item} 
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Menu;