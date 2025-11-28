import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const { openLogin, openRegister, openBooking } = useModal();

  const handleBookingClick = () => {
    if (!user) {
      alert('Пожалуйста, войдите в систему чтобы забронировать стол');
      openLogin();
      return;
    }
    openBooking();
  };

  return (
    <header>
      <div className="headLeft">
        <div className="logo-container">
          <img src="/img/logo/matreshka-logo.png" alt="Логотип Matreshka" />
          <h1>Matreshka</h1>
        </div>
        <p className="tagline"><em>Вкус детства, подаренный бабушкой</em></p>
      </div>
      
      <nav className="headRight">
        <div className="links">
          <Link to="/">главная</Link>
          <Link to="/about">о ресторане</Link>
          <Link to="/menu">меню</Link>
          <Link to="/contacts">контакты</Link>
        </div>
        
        <div className="auth-section">
          {user ? (
            <div className="user-menu">
              <span>Добро пожаловать, {user.name}</span>
              <Link to="/profile" className="profile-btn">Личный кабинет</Link>
              <button onClick={logout} className="logout-btn">Выйти</button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button onClick={openLogin}>Войти</button>
              <button onClick={openRegister}>Регистрация</button>
            </div>
          )}
          
          <div className="but">
            <button className="booking-btn" onClick={handleBookingClick}>
              забронировать стол
            </button>
            
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;