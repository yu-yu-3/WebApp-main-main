import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRoleDisplayName, getRoleIcon } from '../../utils/helpers';
import { USER_ROLES } from '../../utils/constants';
import ApiService from '../../utils/api';
import './UserManagement.css';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: USER_ROLES.USER,
    phone: '',
    restaurant: '',
    position: '',
    vehicle: '',
    delivery_zone: ''
  });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Загрузка пользователей
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await ApiService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Ошибка при загрузке пользователей: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === USER_ROLES.ADMIN) {
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    filterUsers();
  }, [users, filter, searchTerm]);

  const filterUsers = () => {
    let result = [...users];

    // Фильтрация по роли
    if (filter !== 'all') {
      result = result.filter(u => u.role === filter);
    }

    // Поиск по имени или email
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(term) || 
        u.email.toLowerCase().includes(term)
      );
    }

    setFilteredUsers(result);
  };

  const handleRoleChange = async (userId, newRole) => {
    if (window.confirm(`Вы уверены, что хотите изменить роль пользователя на "${getRoleDisplayName(newRole)}"?`)) {
      try {
        setActionLoading(true);
        await ApiService.updateUserRole(userId, newRole);
        alert('Роль пользователя успешно изменена!');
        // Обновляем список пользователей
        await fetchUsers();
      } catch (error) {
        console.error('Error updating user role:', error);
        alert('Ошибка при изменении роли: ' + error.message);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await ApiService.createUser(newUser);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: USER_ROLES.USER,
        phone: '',
        restaurant: '',
        position: '',
        vehicle: '',
        delivery_zone: ''
      });
      setShowCreateForm(false);
      alert('Пользователь успешно создан!');
      // Обновляем список пользователей
      await fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Ошибка при создании пользователя: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (userId === user.id) {
      alert('Вы не можете удалить свой собственный аккаунт!');
      return;
    }

    if (window.confirm(`Вы уверены, что хотите удалить пользователя "${userName}"?`)) {
      try {
        setActionLoading(true);
        await ApiService.deleteUser(userId);
        alert('Пользователь успешно удален!');
        // Обновляем список пользователей
        await fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Ошибка при удалении пользователя: ' + error.message);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleUpdateUser = async (userId, updatedData) => {
    try {
      setActionLoading(true);
      await ApiService.updateUser(userId, updatedData);
      alert('Данные пользователя успешно обновлены!');
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Ошибка при обновлении пользователя: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getUsersCountByRole = (role) => {
    return users.filter(u => u.role === role).length;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    try {
      return new Date(dateString).toLocaleDateString('ru-RU');
    } catch {
      return 'Неверная дата';
    }
  };

  if (user?.role !== USER_ROLES.ADMIN) {
    return (
      <div className="user-management">
        <div className="access-denied">
          <h3>⛔ Доступ запрещен</h3>
          <p>У вас недостаточно прав для управления пользователями.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h3>👥 Управление пользователями</h3>
        <div className="user-stats">
          <div className="stat-card">
            <span className="stat-number">{users.length}</span>
            <span className="stat-label">Всего пользователей</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{getUsersCountByRole(USER_ROLES.ADMIN)}</span>
            <span className="stat-label">Администраторов</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{getUsersCountByRole(USER_ROLES.USER)}</span>
            <span className="stat-label">Посетителей</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{getUsersCountByRole(USER_ROLES.STAFF)}</span>
            <span className="stat-label">Сотрудников</span>
          </div>
        </div>
      </div>

      <div className="management-actions">
        <div className="filters">
          <input
            type="text"
            placeholder="🔍 Поиск по имени или email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="role-filter"
          >
            <option value="all">Все роли</option>
            <option value={USER_ROLES.ADMIN}>Администраторы</option>
            <option value={USER_ROLES.MODERATOR}>Модераторы</option>
            <option value={USER_ROLES.STAFF}>Сотрудники</option>
            <option value={USER_ROLES.COURIER}>Курьеры</option>
            <option value={USER_ROLES.USER}>Посетители</option>
          </select>
        </div>

        <div className="action-buttons">
          <button 
            className="create-user-btn"
            onClick={() => setShowCreateForm(true)}
            disabled={loading || actionLoading}
          >
            ➕ Создать пользователя
          </button>
          <button 
            className="refresh-btn"
            onClick={fetchUsers}
            disabled={loading}
          >
            🔄 Обновить
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="create-user-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Создание нового пользователя</h4>
              <button 
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
                disabled={actionLoading}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="form-row">
                <div className="form-group">
                  <label>Имя *:</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    required
                    disabled={actionLoading}
                    placeholder="Введите полное имя"
                  />
                </div>
                <div className="form-group">
                  <label>Email *:</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    required
                    disabled={actionLoading}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Пароль *:</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    required
                    minLength="6"
                    disabled={actionLoading}
                    placeholder="Минимум 6 символов"
                  />
                </div>
                <div className="form-group">
                  <label>Роль *:</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    disabled={actionLoading}
                  >
                    <option value={USER_ROLES.USER}>Посетитель</option>
                    <option value={USER_ROLES.ADMIN}>Администратор</option>
                    <option value={USER_ROLES.MODERATOR}>Модератор</option>
                    <option value={USER_ROLES.STAFF}>Сотрудник</option>
                    <option value={USER_ROLES.COURIER}>Курьер</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Телефон:</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={actionLoading}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
                <div className="form-group">
                  <label>Ресторан (для сотрудника):</label>
                  <input
                    type="text"
                    value={newUser.restaurant}
                    onChange={(e) => setNewUser(prev => ({ ...prev, restaurant: e.target.value }))}
                    placeholder="Matreshka Центр"
                    disabled={actionLoading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Должность (для сотрудника):</label>
                  <input
                    type="text"
                    value={newUser.position}
                    onChange={(e) => setNewUser(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Менеджер зала"
                    disabled={actionLoading}
                  />
                </div>
                <div className="form-group">
                  <label>Транспорт (для курьера):</label>
                  <input
                    type="text"
                    value={newUser.vehicle}
                    onChange={(e) => setNewUser(prev => ({ ...prev, vehicle: e.target.value }))}
                    placeholder="Велосипед"
                    disabled={actionLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Зона доставки (для курьера):</label>
                <input
                  type="text"
                  value={newUser.delivery_zone}
                  onChange={(e) => setNewUser(prev => ({ ...prev, delivery_zone: e.target.value }))}
                  placeholder="Центральный район"
                  disabled={actionLoading}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)}
                  disabled={actionLoading}
                  className="cancel-btn"
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className="submit-btn" 
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Создание...' : 'Создать пользователя'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <p>Загрузка пользователей...</p>
        </div>
      ) : (
        <div className="users-list">
          {filteredUsers.length === 0 ? (
            <div className="no-users">
              <p>Пользователи не найдены</p>
            </div>
          ) : (
            <div className="users-grid">
              {filteredUsers.map(userItem => (
                <div key={userItem.id} className="user-card">
                  <div className="user-header">
                    <div className="user-avatar">
                      {userItem.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="user-info">
                      <h4>{userItem.name}</h4>
                      <p className="user-email">{userItem.email}</p>
                      <span className={`role-badge role-${userItem.role}`}>
                        {getRoleIcon(userItem.role)} {getRoleDisplayName(userItem.role)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="user-details">
                    <p><strong>Телефон:</strong> {userItem.phone || 'Не указан'}</p>
                    <p><strong>Регистрация:</strong> {formatDate(userItem.registration_date || userItem.created_at)}</p>
                    {userItem.restaurant && (
                      <p><strong>Ресторан:</strong> {userItem.restaurant}</p>
                    )}
                    {userItem.position && (
                      <p><strong>Должность:</strong> {userItem.position}</p>
                    )}
                    {userItem.vehicle && (
                      <p><strong>Транспорт:</strong> {userItem.vehicle}</p>
                    )}
                    {userItem.delivery_zone && (
                      <p><strong>Зона доставки:</strong> {userItem.delivery_zone}</p>
                    )}
                    {userItem.loyalty_points > 0 && (
                      <p><strong>Баллы лояльности:</strong> {userItem.loyalty_points}</p>
                    )}
                  </div>

                  <div className="user-actions">
                    <div className="action-group">
                      <label>Изменение роли:</label>
                      <select
                        value={userItem.role}
                        onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                        className="role-select"
                        disabled={actionLoading || userItem.id === user.id}
                      >
                        <option value={USER_ROLES.USER}>Посетитель</option>
                        <option value={USER_ROLES.ADMIN}>Администратор</option>
                        <option value={USER_ROLES.MODERATOR}>Модератор</option>
                        <option value={USER_ROLES.STAFF}>Сотрудник</option>
                        <option value={USER_ROLES.COURIER}>Курьер</option>
                      </select>
                    </div>
                    
                    <div className="danger-actions">
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteUser(userItem.id, userItem.name)}
                        disabled={actionLoading || userItem.id === user.id}
                        title={userItem.id === user.id ? "Нельзя удалить свой аккаунт" : "Удалить пользователя"}
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserManagement;