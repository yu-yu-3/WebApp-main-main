// Утилиты для работы с ресторанами
export const getActiveRestaurants = () => {
  try {
    const savedRestaurants = localStorage.getItem('restaurants');
    if (savedRestaurants) {
      const parsedRestaurants = JSON.parse(savedRestaurants);
      return parsedRestaurants.filter(restaurant => restaurant.isActive !== false);
    }
    return [];
  } catch (error) {
    console.error('Error loading restaurants:', error);
    return [];
  }
};

export const isRestaurantActive = (restaurantName) => {
  const activeRestaurants = getActiveRestaurants();
  return activeRestaurants.some(restaurant => restaurant.name === restaurantName);
};

export const getRestaurantById = (restaurantId) => {
  try {
    const savedRestaurants = localStorage.getItem('restaurants');
    if (savedRestaurants) {
      const parsedRestaurants = JSON.parse(savedRestaurants);
      return parsedRestaurants.find(restaurant => restaurant.id === restaurantId);
    }
    return null;
  } catch (error) {
    console.error('Error getting restaurant:', error);
    return null;
  }
};

// Новая функция для получения всех ресторанов (включая неактивные)
export const getAllRestaurants = () => {
  try {
    const savedRestaurants = localStorage.getItem('restaurants');
    if (savedRestaurants) {
      return JSON.parse(savedRestaurants);
    }
    return [];
  } catch (error) {
    console.error('Error loading all restaurants:', error);
    return [];
  }
};