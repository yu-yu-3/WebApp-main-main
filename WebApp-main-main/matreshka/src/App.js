import React from 'react';
import { USER_ROLES } from './utils/constants';
import { hasRole, canManageUsers } from './utils/helpers';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ModalProvider } from './context/ModalContext';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Cart from './components/Cart/Cart';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import BookingForm from './components/Booking/BookingForm';
import ReviewForm from './components/Reviews/ReviewForm';
import CheckoutForm from './components/Checkout/CheckoutForm';
import EventRegistration from './components/Events/EventRegistration';
import Home from './pages/Home';
import About from './pages/About';
import MenuPage from './pages/MenuPage';
import Contacts from './pages/Contacts';
import Restaurant from './pages/Restaurant';
import Profile from './components/Profile/Profile';
import OrderDetails from './components/Orders/OrderDetails';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ModalProvider>
          <Router>
            <div className="App">
              <Header />
              <Cart />
              {/* Модальные окна на уровне App */}
              <Login />
              <Register />
              <BookingForm />
              <ReviewForm />
              <CheckoutForm />
              <EventRegistration />
              <OrderDetails />
              <main>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/menu" element={<MenuPage />} />
                  <Route path="/contacts" element={<Contacts />} />
                  <Route path="/restaurant/:id" element={<Restaurant />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </ModalProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;