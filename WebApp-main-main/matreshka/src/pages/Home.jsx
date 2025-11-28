import React from 'react';
import Hero from '../components/Hero/Hero';
import RestaurantMap from '../components/Map/RestaurantMap';
import Events from '../components/Events/Events';

const Home = () => {
  return (
    <div>
      <Hero />
      <RestaurantMap />
      <Events />
    </div>
  );
};

export default Home;