import React, { createContext, useState, useContext, useEffect } from 'react';
import { USER_ROLES } from '../utils/constants';
import ApiService from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Загружаем пользователей при инициализации
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await ApiService.getUsers();
        setUsers(usersData);
        
        // Проверяем авторизацию
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          const parsedUserData = JSON.parse(userData);
          // Проверяем, существует ли пользователь в базе
          const userExists = usersData.some(u => u.id === parsedUserData.id);
          if (userExists) {
            setUser(parsedUserData);
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
          }
        }
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const login = async (credentials) => {
    try {
      const userData = await ApiService.login(credentials);
      
      localStorage.setItem('token', 'user-token-' + userData.id);
      localStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const newUser = await ApiService.register(userData);
      
      // Автоматически логиним после регистрации
      localStorage.setItem('token', 'user-token-' + newUser.id);
      localStorage.setItem('userData', JSON.stringify(newUser));
      setUser(newUser);

      // Обновляем список пользователей
      const updatedUsers = await ApiService.getUsers();
      setUsers(updatedUsers);

      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setUser(null);
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await ApiService.updateUserRole(userId, newRole);
      
      // Обновляем локальное состояние
      const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      );
      setUsers(updatedUsers);

      // Если обновляем текущего пользователя
      if (user && user.id === userId) {
        const updatedUser = { ...user, role: newRole };
        setUser(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
      }

      return updatedUsers.find(u => u.id === userId);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  const createUser = async (userData) => {
    try {
      const newUser = await ApiService.createUser(userData);
      
      // Обновляем список пользователей
      const updatedUsers = await ApiService.getUsers();
      setUsers(updatedUsers);

      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const value = {
    user,
    users,
    login,
    register,
    logout,
    loading,
    updateUserRole,
    createUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};