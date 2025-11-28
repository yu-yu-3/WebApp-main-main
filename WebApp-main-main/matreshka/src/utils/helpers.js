import { USER_ROLES, ROLE_PERMISSIONS, ROLE_DISPLAY_NAMES } from './constants';

// ==================== ОСНОВНЫЕ ПРОВЕРКИ РОЛЕЙ ====================

/**
 * Проверяет, имеет ли пользователь указанную роль
 */
export const hasRole = (user, role) => {
  return user?.role === role;
};

/**
 * Проверяет, имеет ли пользователь любую из указанных ролей
 */
export const hasAnyRole = (user, roles) => {
  return roles.includes(user?.role);
};

/**
 * Проверяет, имеет ли пользователь право на действие
 */
export const hasPermission = (user, permission) => {
  if (!user) return false;
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

/**
 * Получает отображаемое название роли
 */
export const getRoleDisplayName = (role) => {
  return ROLE_DISPLAY_NAMES[role] || 'Пользователь';
};

// ==================== СПЕЦИФИЧНЫЕ ПРОВЕРКИ ДЛЯ ФУНКЦИОНАЛА ====================

/**
 * Может управлять пользователями (только админ)
 */
export const canManageUsers = (user) => {
  return hasPermission(user, 'manage_users');
};

/**
 * Может управлять ресторанами (только админ)
 */
export const canManageRestaurants = (user) => {
  return hasPermission(user, 'manage_restaurants');
};

/**
 * Может управлять меню (только админ)
 */
export const canManageMenu = (user) => {
  return hasPermission(user, 'manage_menu');
};

/**
 * Может управлять мероприятиями (только админ)
 */
export const canManageEvents = (user) => {
  return hasPermission(user, 'manage_events');
};

/**
 * Может модерировать отзывы (админ и модератор)
 */
export const canModerateReviews = (user) => {
  return hasAnyRole(user, [USER_ROLES.ADMIN, USER_ROLES.MODERATOR]);
};

/**
 * Может управлять бронированиями (админ и сотрудник)
 */
export const canManageBookings = (user) => {
  return hasAnyRole(user, [USER_ROLES.ADMIN, USER_ROLES.STAFF]);
};

/**
 * Может управлять заказами (админ, сотрудник, курьер)
 */
export const canManageOrders = (user) => {
  return hasAnyRole(user, [USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.COURIER]);
};

/**
 * Может просматривать аналитику (только админ)
 */
export const canViewAnalytics = (user) => {
  return hasPermission(user, 'view_analytics');
};

/**
 * Может изменять статус заказа (сотрудник и курьер)
 */
export const canUpdateOrderStatus = (user) => {
  return hasAnyRole(user, [USER_ROLES.STAFF, USER_ROLES.COURIER]);
};

/**
 * Может просматривать информацию о доставке (курьер)
 */
export const canViewDeliveryInfo = (user) => {
  return hasRole(user, USER_ROLES.COURIER);
};

// ==================== ПРОВЕРКИ ДЛЯ ИНТЕРФЕЙСА ====================

/**
 * Может ли пользователь создавать бронирования
 */
export const canMakeBookings = (user) => {
  return user && hasPermission(user, 'make_bookings');
};

/**
 * Может ли пользователь оставлять отзывы
 */
export const canWriteReviews = (user) => {
  return user && hasPermission(user, 'write_reviews');
};

/**
 * Может ли пользователь делать заказы
 */
export const canPlaceOrders = (user) => {
  return user && hasPermission(user, 'place_orders');
};

/**
 * Показывать ли панель администратора
 */
export const shouldShowAdminPanel = (user) => {
  return hasAnyRole(user, [USER_ROLES.ADMIN, USER_ROLES.MODERATOR, USER_ROLES.STAFF]);
};

/**
 * Показывать ли панель модератора
 */
export const shouldShowModeratorPanel = (user) => {
  return canModerateReviews(user);
};

/**
 * Показывать ли панель сотрудника
 */
export const shouldShowStaffPanel = (user) => {
  return hasAnyRole(user, [USER_ROLES.STAFF]);
};

/**
 * Показывать ли панель курьера
 */
export const shouldShowCourierPanel = (user) => {
  return hasRole(user, USER_ROLES.COURIER);
};

// ==================== УТИЛИТЫ ДЛЯ ФИЛЬТРАЦИИ ====================

/**
 * Фильтрует элементы по правам доступа пользователя
 */
export const filterByUserRole = (items, user, accessField = 'accessibleTo') => {
  if (!user) return items.filter(item => !item[accessField] || item[accessField].includes(USER_ROLES.USER));
  
  return items.filter(item => {
    if (!item[accessField]) return true;
    return item[accessField].includes(user.role);
  });
};

/**
 * Проверяет, может ли пользователь редактировать элемент
 */
export const canEditItem = (user, itemOwnerId) => {
  if (!user) return false;
  // Админ может редактировать всё
  if (hasRole(user, USER_ROLES.ADMIN)) return true;
  // Пользователь может редактировать только свои элементы
  return user.id === itemOwnerId;
};

/**
 * Проверяет, может ли пользователь удалять элемент
 */
export const canDeleteItem = (user, itemOwnerId) => {
  if (!user) return false;
  // Админ может удалять всё
  if (hasRole(user, USER_ROLES.ADMIN)) return true;
  // Пользователь может удалять только свои элементы
  return user.id === itemOwnerId;
};

// ==================== УТИЛИТЫ ДЛЯ ОТОБРАЖЕНИЯ ====================

/**
 * Получает CSS класс для отображения роли
 */
export const getRoleBadgeClass = (role) => {
  const roleClasses = {
    [USER_ROLES.ADMIN]: 'role-badge-admin',
    [USER_ROLES.MODERATOR]: 'role-badge-moderator',
    [USER_ROLES.STAFF]: 'role-badge-staff',
    [USER_ROLES.COURIER]: 'role-badge-courier',
    [USER_ROLES.USER]: 'role-badge-user'
  };
  
  return roleClasses[role] || 'role-badge-user';
};

/**
 * Получает иконку для роли
 */
export const getRoleIcon = (role) => {
  const roleIcons = {
    [USER_ROLES.ADMIN]: '👑',
    [USER_ROLES.MODERATOR]: '📝',
    [USER_ROLES.STAFF]: '👨‍🍳',
    [USER_ROLES.COURIER]: '🚴',
    [USER_ROLES.USER]: '👤'
  };
  
  return roleIcons[role] || '👤';
};

export default {
  hasRole,
  hasAnyRole,
  hasPermission,
  getRoleDisplayName,
  canManageUsers,
  canManageRestaurants,
  canManageMenu,
  canManageEvents,
  canModerateReviews,
  canManageBookings,
  canManageOrders,
  canViewAnalytics,
  canUpdateOrderStatus,
  canViewDeliveryInfo,
  canMakeBookings,
  canWriteReviews,
  canPlaceOrders,
  shouldShowAdminPanel,
  shouldShowModeratorPanel,
  shouldShowStaffPanel,
  shouldShowCourierPanel,
  filterByUserRole,
  canEditItem,
  canDeleteItem,
  getRoleBadgeClass,
  getRoleIcon
};