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
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showEventRegistration, setShowEventRegistration] = useState(false);
  const [showPromoCode, setShowPromoCode] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [currentPromoCode, setCurrentPromoCode] = useState('');
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showEditReview, setShowEditReview] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);


  const openLogin = () => setShowLogin(true);
  const closeLogin = () => setShowLogin(false);
  
  const openRegister = () => setShowRegister(true);
  const closeRegister = () => setShowRegister(false);
  
  const openBooking = () => setShowBooking(true);
  const closeBooking = () => setShowBooking(false);
  
  const openReviewForm = () => setShowReviewForm(true);
  const closeReviewForm = () => setShowReviewForm(false);
  
  const openCheckout = () => setShowCheckout(true);
  const closeCheckout = () => setShowCheckout(false);
  
  const openEventRegistration = (event) => {
    setCurrentEvent(event);
    setShowEventRegistration(true);
  };
  const closeEventRegistration = () => {
    setShowEventRegistration(false);
    setCurrentEvent(null);
  };
  
  const openPromoCode = (promoCode = '') => {
    setCurrentPromoCode(promoCode);
    setShowPromoCode(true);
  };
  const closePromoCode = () => {
    setShowPromoCode(false);
    setCurrentPromoCode('');
  };
  const openOrderDetails = (order) => {
  setCurrentOrder(order);
  setShowOrderDetails(true);
};

const closeOrderDetails = () => {
  setShowOrderDetails(false);
  setCurrentOrder(null);
};
const openEditReview = (review) => {
  setCurrentReview(review);
  setShowEditReview(true);
};

const closeEditReview = () => {
  setShowEditReview(false);
  setCurrentReview(null);
};

  const value = {
    showLogin,
    showOrderDetails,
    showEditReview,
    showRegister,
    showBooking,
    showReviewForm,
    showCheckout,
    showEventRegistration,
    showPromoCode,
    currentEvent,
    currentReview,
    currentPromoCode,
    currentOrder,
    openLogin,
    closeLogin,
    openRegister,
    closeRegister,
    openBooking,
    closeBooking,
    openReviewForm,
    closeReviewForm,
    openCheckout,
    closeCheckout,
    openOrderDetails,
    closeOrderDetails,
    openEventRegistration,
    closeEventRegistration,
    openEditReview,
    closeEditReview,
    openPromoCode,
    closePromoCode
    
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};