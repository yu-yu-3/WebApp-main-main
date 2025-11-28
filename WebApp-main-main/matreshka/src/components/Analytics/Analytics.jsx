import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import './Analytics.css';

const Analytics = () => {
  const { user, users } = useAuth();
  const [analyticsData, setAnalyticsData] = useState({
    users: {},
    orders: {},
    bookings: {},
    reviews: {},
    restaurants: {},
    revenue: {}
  });
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = () => {
    setLoading(true);
    
    // Загружаем данные из localStorage
    const allUsers = users || [];
    const allOrders = getAllOrders();
    const allBookings = getAllBookings();
    const allReviews = getAllReviews();
    const allRestaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
    const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];

    // Аналитика пользователей
    const usersByRole = allUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    // Аналитика заказов
    const totalOrders = allOrders.length;
    const completedOrders = allOrders.filter(order => order.status === 'delivered').length;
    const totalRevenue = allOrders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    // Аналитика бронирований
    const totalBookings = allBookings.length;
    const confirmedBookings = allBookings.filter(booking => booking.status === 'confirmed').length;

    // Аналитика отзывов
    const totalReviews = allReviews.length;
    const approvedReviews = allReviews.filter(review => review.status === 'approved').length;

    // Аналитика ресторанов
    const activeRestaurants = allRestaurants.filter(r => r.isActive).length;
    const totalRestaurants = allRestaurants.length;

    // Популярные блюда
    const popularItems = getPopularItems(allOrders, menuItems);

    setAnalyticsData({
      users: {
        total: allUsers.length,
        byRole: usersByRole,
        newThisWeek: allUsers.filter(u => isThisWeek(new Date(u.registrationDate))).length
      },
      orders: {
        total: totalOrders,
        completed: completedOrders,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(1) : 0
      },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        confirmationRate: totalBookings > 0 ? (confirmedBookings / totalBookings * 100).toFixed(1) : 0
      },
      reviews: {
        total: totalReviews,
        approved: approvedReviews,
        approvalRate: totalReviews > 0 ? (approvedReviews / totalReviews * 100).toFixed(1) : 0
      },
      restaurants: {
        total: totalRestaurants,
        active: activeRestaurants,
        inactive: totalRestaurants - activeRestaurants
      },
      revenue: {
        total: totalRevenue,
        averageOrder: completedOrders > 0 ? (totalRevenue / completedOrders).toFixed(2) : 0
      },
      popularItems: popularItems.slice(0, 5)
    });

    setLoading(false);
  };

  const getAllOrders = () => {
    try {
      const allOrders = [];
      users.forEach(user => {
        const userOrders = JSON.parse(localStorage.getItem(`user_orders_${user.id}`)) || [];
        allOrders.push(...userOrders.map(order => ({ ...order, userId: user.id })));
      });
      return allOrders;
    } catch (error) {
      console.error('Error loading orders:', error);
      return [];
    }
  };

  const getAllBookings = () => {
    try {
      const allBookings = [];
      users.forEach(user => {
        const userBookings = JSON.parse(localStorage.getItem(`user_bookings_${user.id}`)) || [];
        allBookings.push(...userBookings.map(booking => ({ ...booking, userId: user.id })));
      });
      return allBookings;
    } catch (error) {
      console.error('Error loading bookings:', error);
      return [];
    }
  };

  const getAllReviews = () => {
    try {
      const allReviews = [];
      users.forEach(user => {
        const userReviews = JSON.parse(localStorage.getItem(`user_reviews_${user.id}`)) || [];
        allReviews.push(...userReviews.map(review => ({ ...review, userId: user.id })));
      });
      return allReviews;
    } catch (error) {
      console.error('Error loading reviews:', error);
      return [];
    }
  };

  const getPopularItems = (orders, menuItems) => {
    const itemCount = {};
    
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          itemCount[item.name] = (itemCount[item.name] || 0) + item.quantity;
        });
      }
    });

    return Object.entries(itemCount)
      .map(([name, count]) => {
        const menuItem = menuItems.find(item => item.name === name);
        return {
          name,
          count,
          price: menuItem ? menuItem.price : 0,
          revenue: menuItem ? menuItem.price * count : 0
        };
      })
      .sort((a, b) => b.count - a.count);
  };

  const isThisWeek = (date) => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    return date >= startOfWeek;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount);
  };

  if (user?.role !== USER_ROLES.ADMIN) {
    return (
      <div className="analytics">
        <div className="access-denied">
          <h3>⛔ Доступ запрещен</h3>
          <p>У вас недостаточно прав для просмотра аналитики.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="analytics">
        <div className="loading">Загрузка аналитики...</div>
      </div>
    );
  }

  return (
    <div className="analytics">
      <div className="analytics-header">
        <h3>📊 Аналитика системы</h3>
        <div className="time-filter">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-select"
          >
            <option value="today">Сегодня</option>
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
            <option value="year">Год</option>
            <option value="all">Все время</option>
          </select>
        </div>
      </div>

      {/* Основные метрики */}
      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon">💰</div>
          <div className="metric-info">
            <h4>Общая выручка</h4>
            <div className="metric-value">{formatCurrency(analyticsData.revenue.total)}</div>
            <div className="metric-desc">Средний чек: {formatCurrency(analyticsData.revenue.averageOrder)}</div>
          </div>
        </div>

        <div className="metric-card users">
          <div className="metric-icon">👥</div>
          <div className="metric-info">
            <h4>Пользователи</h4>
            <div className="metric-value">{analyticsData.users.total}</div>
            <div className="metric-desc">+{analyticsData.users.newThisWeek} за неделю</div>
          </div>
        </div>

        <div className="metric-card orders">
          <div className="metric-icon">📦</div>
          <div className="metric-info">
            <h4>Заказы</h4>
            <div className="metric-value">{analyticsData.orders.total}</div>
            <div className="metric-desc">{analyticsData.orders.completionRate}% выполнено</div>
          </div>
        </div>

        <div className="metric-card bookings">
          <div className="metric-icon">📅</div>
          <div className="metric-info">
            <h4>Бронирования</h4>
            <div className="metric-value">{analyticsData.bookings.total}</div>
            <div className="metric-desc">{analyticsData.bookings.confirmationRate}% подтверждено</div>
          </div>
        </div>
      </div>

      {/* Детальная аналитика */}
      <div className="detailed-analytics">
        <div className="analytics-section">
          <h4>📈 Статистика пользователей</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Администраторы</span>
              <span className="stat-value">{analyticsData.users.byRole.admin || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Модераторы</span>
              <span className="stat-value">{analyticsData.users.byRole.moderator || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Сотрудники</span>
              <span className="stat-value">{analyticsData.users.byRole.staff || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Курьеры</span>
              <span className="stat-value">{analyticsData.users.byRole.courier || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Посетители</span>
              <span className="stat-value">{analyticsData.users.byRole.user || 0}</span>
            </div>
          </div>
        </div>

        <div className="analytics-section">
          <h4>🏢 Статистика ресторанов</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Всего ресторанов</span>
              <span className="stat-value">{analyticsData.restaurants.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Активных</span>
              <span className="stat-value">{analyticsData.restaurants.active}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Неактивных</span>
              <span className="stat-value">{analyticsData.restaurants.inactive}</span>
            </div>
          </div>
        </div>

        <div className="analytics-section">
          <h4>⭐ Статистика отзывов</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Всего отзывов</span>
              <span className="stat-value">{analyticsData.reviews.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Одобрено</span>
              <span className="stat-value">{analyticsData.reviews.approved}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Процент одобрения</span>
              <span className="stat-value">{analyticsData.reviews.approvalRate}%</span>
            </div>
          </div>
        </div>

        {analyticsData.popularItems.length > 0 && (
          <div className="analytics-section">
            <h4>🍽️ Популярные блюда</h4>
            <div className="popular-items">
              {analyticsData.popularItems.map((item, index) => (
                <div key={item.name} className="popular-item">
                  <span className="item-rank">#{index + 1}</span>
                  <span className="item-name">{item.name}</span>
                  <span className="item-count">{item.count} заказов</span>
                  <span className="item-revenue">{formatCurrency(item.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="analytics-section">
          <h4>📊 Ключевые показатели</h4>
          <div className="kpi-grid">
            <div className="kpi-item">
              <div className="kpi-value">{analyticsData.orders.completionRate}%</div>
              <div className="kpi-label">Выполнение заказов</div>
            </div>
            <div className="kpi-item">
              <div className="kpi-value">{analyticsData.bookings.confirmationRate}%</div>
              <div className="kpi-label">Подтверждение броней</div>
            </div>
            <div className="kpi-item">
              <div className="kpi-value">{analyticsData.reviews.approvalRate}%</div>
              <div className="kpi-label">Одобрение отзывов</div>
            </div>
            <div className="kpi-item">
              <div className="kpi-value">
                {analyticsData.restaurants.total > 0 
                  ? ((analyticsData.restaurants.active / analyticsData.restaurants.total) * 100).toFixed(1)
                  : 0}%
              </div>
              <div className="kpi-label">Активных ресторанов</div>
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-actions">
        <button className="export-btn" onClick={() => alert('Экспорт данных - скоро будет доступен!')}>
          📥 Экспорт данных
        </button>
        <button className="refresh-btn" onClick={loadAnalyticsData}>
          🔄 Обновить данные
        </button>
      </div>
    </div>
  );
};

export default Analytics;