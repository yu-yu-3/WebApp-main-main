// Роли пользователей
export const USER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator', 
  STAFF: 'staff',
  COURIER: 'courier',
  USER: 'user'
};

// Права доступа для каждой роли
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    'manage_users',
    'manage_restaurants', 
    'manage_menu',
    'manage_events',
    'moderate_reviews',
    'manage_bookings',
    'manage_orders',
    'view_analytics',
    'system_settings'
  ],
  [USER_ROLES.MODERATOR]: [
    'moderate_reviews',
    'view_reports',
    'manage_reviews'
  ],
  [USER_ROLES.STAFF]: [
    'manage_bookings',
    'manage_orders',
    'view_restaurant_data',
    'update_order_status'
  ],
  [USER_ROLES.COURIER]: [
    'view_orders',
    'update_order_status',
    'view_delivery_info'
  ],
  [USER_ROLES.USER]: [
    'view_restaurants',
    'make_bookings',
    'place_orders',
    'write_reviews',
    'view_profile'
  ]
};

// Названия ролей для отображения
export const ROLE_DISPLAY_NAMES = {
  [USER_ROLES.ADMIN]: 'Администратор',
  [USER_ROLES.MODERATOR]: 'Модератор отзывов',
  [USER_ROLES.STAFF]: 'Сотрудник ресторана', 
  [USER_ROLES.COURIER]: 'Курьер',
  [USER_ROLES.USER]: 'Посетитель'
};

// Рестораны для привязки сотрудников
export const RESTAURANTS = {
  CENTER: 'Matreshka Центр',
  NORTH: 'Matreshka Север',
  SOUTH: 'Matreshka Юг', 
  WEST: 'Matreshka Запад'
};

// Статусы для отзывов
export const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Статусы для заказов
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  ON_THE_WAY: 'on_way',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

// Статусы для бронирований
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};