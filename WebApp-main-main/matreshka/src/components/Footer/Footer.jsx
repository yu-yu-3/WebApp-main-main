import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer>
      <div className="rightBottom">
        <nav className="links2">
          <Link to="/">главная</Link>
          <Link to="/about">о ресторане</Link>
          <Link to="/menu">меню</Link>
          <Link to="/contacts">контакты</Link>
        </nav>
      </div>
      <div className="leftBottom">
        <h3>Свяжитесь с нами</h3>
        <p>Телефон: +7 (XXX) XXX-XX-XX</p>
        <p>Адрес: ул. Примерная, д. 123, Москва</p>
        <div className="social-icons">
          <a href="#" aria-label="Instagram">📷</a>
          <a href="#" aria-label="Facebook">📘</a>
          <a href="#" aria-label="Telegram">📱</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;