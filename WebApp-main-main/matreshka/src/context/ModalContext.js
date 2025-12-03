import React, { createContext, useState, useContext } from 'react';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showCart, setShowCart] = useState(false); // ← ДОБАВИЛ
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showEventRegistration, setShowEventRegistration] = useState(false);
  const [showPromoCode, setShowPromoCode] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showEditReview, setShowEditReview] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [currentPromoCode, setCurrentPromoCode] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [currentReview, setCurrentReview] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false); // ← ДОБАВИЛ

  // Auth Modals
  const openLogin = () => setShowLogin(true);
  const closeLogin = () => setShowLogin(false);
  
  const openRegister = () => setShowRegister(true);
  const closeRegister = () => setShowRegister(false);
  
  // Booking Modal
  const openBooking = () => setShowBooking(true);
  const closeBooking = () => setShowBooking(false);
  
  // Cart Modal - ДОБАВИЛ
  const openCart = () => {
    setShowCart(true);
    setIsCartOpen(true);
  };
  const closeCart = () => {
    setShowCart(false);
    setIsCartOpen(false);
  };
  
  // Review Modals
  const openReviewForm = () => setShowReviewForm(true);
  const closeReviewForm = () => setShowReviewForm(false);
  
  const openEditReview = (review) => {
    setCurrentReview(review);
    setShowEditReview(true);
  };
  const closeEditReview = () => {
    setShowEditReview(false);
    setCurrentReview(null);
  };
  
  // Checkout Modal
  const openCheckout = () => setShowCheckout(true);
  const closeCheckout = () => setShowCheckout(false);
  
  // Event Registration Modal
  const openEventRegistration = (event) => {
    setCurrentEvent(event);
    setShowEventRegistration(true);
  };
  const closeEventRegistration = () => {
    setShowEventRegistration(false);
    setCurrentEvent(null);
  };
  
  // Promo Code Modal
  const openPromoCode = (promoCode = '') => {
    setCurrentPromoCode(promoCode);
    setShowPromoCode(true);
  };
  const closePromoCode = () => {
    setShowPromoCode(false);
    setCurrentPromoCode('');
  };
  
  // Order Details Modal
  const openOrderDetails = (order) => {
    setCurrentOrder(order);
    setShowOrderDetails(true);
  };
  const closeOrderDetails = () => {
    setShowOrderDetails(false);
    setCurrentOrder(null);
  };

  const value = {
    // State
    showLogin,
    showRegister,
    showBooking,
    showCart, // ← ДОБАВИЛ
    showReviewForm,
    showCheckout,
    showEventRegistration,
    showPromoCode,
    showOrderDetails,
    showEditReview,
    currentEvent,
    currentReview,
    currentPromoCode,
    currentOrder,
    isCartOpen, // ← ДОБАВИЛ
    
    // Auth Functions
    openLogin,
    closeLogin,
    openRegister,
    closeRegister,
    
    // Booking Functions
    openBooking,
    closeBooking,
    
    // Cart Functions - ДОБАВИЛ
    openCart,
    closeCart,
    setIsCartOpen,
    
    // Review Functions
    openReviewForm,
    closeReviewForm,
    openEditReview,
    closeEditReview,
    
    // Checkout Functions
    openCheckout,
    closeCheckout,
    
    // Event Functions
    openEventRegistration,
    closeEventRegistration,
    
    // Promo Functions
    openPromoCode,
    closePromoCode,
    
    // Order Functions
    openOrderDetails,
    closeOrderDetails,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};