import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <img src="/img/зал1.jpg" alt="Интерьер ресторана Matreshka" />
      <div className="hero-text">
        <h4>Ресторан Matreshka — это место, где оживают старинные рецепты, а каждый уголок пропитан духом русского
          гостеприимства.
          Мы собрали для вас самые любимые блюда из разных уголков России, чтобы вы могли насладиться настоящим
          вкусом домашней кухни
          в самом сердце города</h4>
      </div>
    </section>
  );
};

export default Hero;