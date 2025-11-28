// src/pages/Restaurant.jsx
import React from 'react';
import { useParams } from 'react-router-dom';

const Restaurant = () => {
  const { id } = useParams();
  
  return (
    <div>
      <h2>Ресторан {id}</h2>
      <p>Информация о конкретном ресторане</p>
    </div>
  );
};

export default Restaurant;