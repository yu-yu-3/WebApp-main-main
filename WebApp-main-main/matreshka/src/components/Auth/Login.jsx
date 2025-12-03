import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email обязателен';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Некорректный формат email';
    if (!formData.password) newErrors.password = 'Пароль обязателен';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await login(formData);
      navigate('/'); // Перенаправляем на главную после входа
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (errors.submit) setErrors(prev => ({ ...prev, submit: '' }));
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-content">
          <h2>Вход в аккаунт</h2>
          
          {errors.submit && <div className="error-message">{errors.submit}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <input
                type="password"
                placeholder="Пароль"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="auth-switch">
            <p>Нет аккаунта? <Link to="/register" className="switch-link">Зарегистрироваться</Link></p>
          </div>

          {/* Тестовые данные */}
          <div className="test-credentials">
            <h4>Тестовые аккаунты:</h4>
            <p><strong>Админ:</strong> admin@matreshka.ru / admin123</p>
            <p><strong>Пользователь:</strong> user@test.com / user123</p>
            <p><strong>Сотрудник:</strong> staff@matreshka.ru / staff123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;