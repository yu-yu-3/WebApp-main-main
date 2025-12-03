import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { useCart } from '../../context/CartContext';
import { USER_ROLES } from '../../utils/constants';
import { 
  shouldShowStaffPanel, 
  shouldShowCourierPanel, 
  canManageUsers, 
  canManageMenu, 
  canManageRestaurants 
} from '../../utils/helpers';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const { openLogin, openRegister, openBooking, openCart } = useModal();
  const { getCartItemsCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const handleBookingClick = () => {
    if (!user) {
      alert('Пожалуйста, войдите в систему чтобы забронировать стол');
      openLogin();
      return;
    }
    openBooking();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
    setRoleMenuOpen(false);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    setRoleMenuOpen(false);
  };

  const handleRoleMenuToggle = () => {
    setRoleMenuOpen(!roleMenuOpen);
  };

  const closeAllMenus = () => {
    setMobileMenuOpen(false);
    setRoleMenuOpen(false);
  };

  const cartItemsCount = getCartItemsCount();

  // Проверки для отображения панелей по ролям
  const showStaffPanel = shouldShowStaffPanel(user);
  const showCourierPanel = shouldShowCourierPanel(user);
  const showAdminUsers = canManageUsers(user);
  const showAdminMenu = canManageMenu(user);
  const showAdminRestaurants = canManageRestaurants(user);

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="logo-container">
            <Link to="/" onClick={closeAllMenus}>
              <img src="/img/logo/matreshka-logo.png" alt="Логотип Matreshka" />
              <h1>Matreshka</h1>
            </Link>
          </div>
          <p className="tagline"><em>Вкус детства, подаренный бабушкой</em></p>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="header-nav desktop-nav">
          <div className="main-links">
            <Link to="/" className="nav-link">Главная</Link>
            <Link to="/about" className="nav-link">О ресторане</Link>
            <Link to="/menu" className="nav-link">Меню</Link>
            <Link to="/contacts" className="nav-link">Контакты</Link>
          </div>
          
          {/* Role-based Navigation - Desktop */}
          {user && (
            <div className="role-navigation">
              {/* Staff Panel */}
              {showStaffPanel && (
                <div className="role-section">
                  <span className="role-badge staff">Сотрудник</span>
                  <div className="role-links">
                    <Link to="/staff/bookings" className="role-link">
                      <span className="icon">📅</span>
                      Бронирования
                    </Link>
                    <Link to="/staff/orders" className="role-link">
                      <span className="icon">🍽️</span>
                      Заказы
                    </Link>
                    <Link to="/staff/tables" className="role-link">
                      <span className="icon">🪑</span>
                      Столики
                    </Link>
                  </div>
                </div>
              )}
              
              {/* Courier Panel */}
              {showCourierPanel && (
                <div className="role-section">
                  <span className="role-badge courier">Курьер</span>
                  <div className="role-links">
                    <Link to="/courier/deliveries" className="role-link">
                      <span className="icon">🚴</span>
                      Доставки
                    </Link>
                    <Link to="/courier/history" className="role-link">
                      <span className="icon">📜</span>
                      История
                    </Link>
                  </div>
                </div>
              )}
              
              {/* Admin Panel */}
              {(showAdminUsers || showAdminMenu || showAdminRestaurants) && (
                <div className="role-section">
                  <span className="role-badge admin">Админ</span>
                  <div className="role-links">
                    {showAdminUsers && (
                      <Link to="/admin/users" className="role-link">
                        <span className="icon">👥</span>
                        Пользователи
                      </Link>
                    )}
                    {showAdminMenu && (
                      <Link to="/admin/menu" className="role-link">
                        <span className="icon">📋</span>
                        Меню
                      </Link>
                    )}
                    {showAdminRestaurants && (
                      <Link to="/admin/restaurants" className="role-link">
                        <span className="icon">🏢</span>
                        Рестораны
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="header-actions">
            {/* Cart */}
            <button 
              className="cart-btn" 
              onClick={openCart}
              aria-label="Корзина"
            >
              <span className="cart-icon">🛒</span>
              {cartItemsCount > 0 && (
                <span className="cart-count">{cartItemsCount}</span>
              )}
            </button>
            
            {/* Auth Section */}
            <div className="auth-section">
              {user ? (
                <div className="user-menu">
                  <div className="user-greeting">
                    <span className="user-name">{user.name}</span>
                    <span className="user-role">{user.role === 'staff' ? 'Сотрудник' : 
                                                user.role === 'courier' ? 'Курьер' : 
                                                user.role === 'admin' ? 'Админ' : 
                                                'Пользователь'}</span>
                  </div>
                  <div className="user-actions">
                    <Link to="/profile" className="profile-btn">
                      <span className="icon">👤</span>
                      Профиль
                    </Link>
                    <button onClick={handleLogout} className="logout-btn">
                      <span className="icon">🚪</span>
                      Выйти
                    </button>
                  </div>
                </div>
              ) : (
                <div className="auth-buttons">
                  <button onClick={openLogin} className="login-btn">
                    Войти
                  </button>
                  <button onClick={openRegister} className="register-btn">
                    Регистрация
                  </button>
                </div>
              )}
              
              {/* Booking Button */}
              <button className="booking-btn" onClick={handleBookingClick}>
                <span className="icon">📅</span>
                Забронировать стол
              </button>
            </div>
          </div>
        </nav>
        
        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={handleMobileMenuToggle}
          aria-label="Меню"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeAllMenus}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <h3>Меню</h3>
              <button 
                className="close-menu-btn"
                onClick={closeAllMenus}
                aria-label="Закрыть меню"
              >
                ✕
              </button>
            </div>
            
            <div className="mobile-main-links">
              <Link to="/" className="mobile-nav-link" onClick={closeAllMenus}>
                Главная
              </Link>
              <Link to="/about" className="mobile-nav-link" onClick={closeAllMenus}>
                О ресторане
              </Link>
              <Link to="/menu" className="mobile-nav-link" onClick={closeAllMenus}>
                Меню
              </Link>
              <Link to="/contacts" className="mobile-nav-link" onClick={closeAllMenus}>
                Контакты
              </Link>
            </div>
            
            {/* Mobile Role Menu Toggle */}
            {user && (
              <div className="mobile-role-section">
                <button 
                  className="mobile-role-toggle"
                  onClick={handleRoleMenuToggle}
                >
                  Панель управления
                  <span className="toggle-icon">{roleMenuOpen ? '▲' : '▼'}</span>
                </button>
                
                {roleMenuOpen && (
                  <div className="mobile-role-links">
                    {/* Staff Links */}
                    {showStaffPanel && (
                      <>
                        <Link to="/staff/bookings" className="mobile-role-link" onClick={closeAllMenus}>
                          <span className="icon">📅</span>
                          Бронирования
                        </Link>
                        <Link to="/staff/orders" className="mobile-role-link" onClick={closeAllMenus}>
                          <span className="icon">🍽️</span>
                          Заказы
                        </Link>
                        <Link to="/staff/tables" className="mobile-role-link" onClick={closeAllMenus}>
                          <span className="icon">🪑</span>
                          Столики
                        </Link>
                      </>
                    )}
                    
                    {/* Courier Links */}
                    {showCourierPanel && (
                      <>
                        <Link to="/courier/deliveries" className="mobile-role-link" onClick={closeAllMenus}>
                          <span className="icon">🚴</span>
                          Доставки
                        </Link>
                        <Link to="/courier/history" className="mobile-role-link" onClick={closeAllMenus}>
                          <span className="icon">📜</span>
                          История
                        </Link>
                      </>
                    )}
                    
                    {/* Admin Links */}
                    {(showAdminUsers || showAdminMenu || showAdminRestaurants) && (
                      <>
                        {showAdminUsers && (
                          <Link to="/admin/users" className="mobile-role-link" onClick={closeAllMenus}>
                            <span className="icon">👥</span>
                            Пользователи
                          </Link>
                        )}
                        {showAdminMenu && (
                          <Link to="/admin/menu" className="mobile-role-link" onClick={closeAllMenus}>
                            <span className="icon">📋</span>
                            Меню
                          </Link>
                        )}
                        {showAdminRestaurants && (
                          <Link to="/admin/restaurants" className="mobile-role-link" onClick={closeAllMenus}>
                            <span className="icon">🏢</span>
                            Рестораны
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="mobile-actions">
              {/* Cart in Mobile */}
              <button 
                className="mobile-cart-btn"
                onClick={() => {
                  openCart();
                  closeAllMenus();
                }}
              >
                <span className="icon">🛒</span>
                Корзина
                {cartItemsCount > 0 && (
                  <span className="mobile-cart-count">{cartItemsCount}</span>
                )}
              </button>
              
              {/* Booking in Mobile */}
              <button 
                className="mobile-booking-btn"
                onClick={() => {
                  handleBookingClick();
                  closeAllMenus();
                }}
              >
                <span className="icon">📅</span>
                Забронировать стол
              </button>
              
              {/* Auth in Mobile */}
              <div className="mobile-auth-section">
                {user ? (
                  <>
                    <div className="mobile-user-info">
                      <span className="mobile-user-name">{user.name}</span>
                      <span className="mobile-user-role">
                        {user.role === 'staff' ? 'Сотрудник' : 
                         user.role === 'courier' ? 'Курьер' : 
                         user.role === 'admin' ? 'Админ' : 
                         'Пользователь'}
                      </span>
                    </div>
                    <Link 
                      to="/profile" 
                      className="mobile-profile-btn"
                      onClick={closeAllMenus}
                    >
                      Профиль
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="mobile-logout-btn"
                    >
                      Выйти
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        openLogin();
                        closeAllMenus();
                      }}
                      className="mobile-login-btn"
                    >
                      Войти
                    </button>
                    <button 
                      onClick={() => {
                        openRegister();
                        closeAllMenus();
                      }}
                      className="mobile-register-btn"
                    >
                      Регистрация
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;