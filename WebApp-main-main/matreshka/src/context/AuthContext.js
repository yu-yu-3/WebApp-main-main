import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      // Тестовые пользователи
      const testUsers = [
        { id: 1, name: 'Тестовый Пользователь', email: 'user@test.com', password: 'user123', role: 'user', phone: '+7 (999) 678-90-12' },
        { id: 2, name: 'Администратор', email: 'admin@matreshka.ru', password: 'admin123', role: 'admin', phone: '+7 (999) 123-45-67' },
        { id: 3, name: 'Сотрудник Ресторана', email: 'staff@matreshka.ru', password: 'staff123', role: 'staff', phone: '+7 (999) 345-67-89', restaurant: 'Matreshka Центр' },
        { id: 4, name: 'Курьер Доставкин', email: 'courier@matreshka.ru', password: 'courier123', role: 'courier', phone: '+7 (999) 567-89-01', vehicle: 'Велосипед' }
      ];

      const foundUser = testUsers.find(
        u => u.email === credentials.email && u.password === credentials.password
      );

      if (!foundUser) {
        throw new Error('Неверный email или пароль');
      }

      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('userData', JSON.stringify(userWithoutPassword));
      return userWithoutPassword;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      // Создаем нового пользователя
      const newUser = {
        id: Date.now(),
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        role: 'user',
        loyalty_points: 0,
        created_at: new Date().toISOString()
      };

      setUser(newUser);
      localStorage.setItem('userData', JSON.stringify(newUser));
      return newUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userData');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};