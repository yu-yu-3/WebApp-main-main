import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ModalProvider } from './context/ModalContext';
import { BookingProvider } from './context/BookingContext';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import ProtectedRoute from './components/Common/ProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import MenuPage from './pages/MenuPage';
import Contacts from './pages/Contacts';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Profile from './components/Profile/Profile';
import EventsManagement from './components/Events/EventsManagement';
import OrderDetails from './components/Orders/OrderDetails';
import StaffBookings from './components/Staff/StaffBookings';
import StaffOrders from './components/Staff/StaffOrders';
import MenuManagement from './components/MenuManagement/MenuManagement';
import RestaurantManagement from './components/RestaurantManagement/RestaurantManagement';
import UserManagement from './components/UserManagement/UserManagement';
import EventRegistration from './components/Events/EventRegistration';
import BookingForm from './components/Booking/BookingForm';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <ModalProvider>
            <BookingProvider>
              <div className="App">
                <Header />
                <main>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/menu" element={<MenuPage />} />
                    <Route path="/contacts" element={<Contacts />} />
                    
                    {/* Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* Protected Routes - User */}
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/orders/:id" element={
                      <ProtectedRoute allowedRoles={['user', 'admin', 'staff', 'courier']}>
                        <OrderDetails />
                      </ProtectedRoute>
                    } />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/events" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <EventsManagement />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/admin/menu" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <MenuManagement />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/admin/restaurants" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <RestaurantManagement />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/admin/users" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <UserManagement />
                      </ProtectedRoute>
                    } />
                    
                    {/* Staff Routes */}
                    <Route path="/staff/bookings" element={
                      <ProtectedRoute allowedRoles={['staff', 'admin']}>
                        <StaffBookings />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/staff/orders" element={
                      <ProtectedRoute allowedRoles={['staff', 'admin']}>
                        <StaffOrders />
                      </ProtectedRoute>
                    } />
                    
                    {/* Redirects */}
                    <Route path="/admin" element={<Navigate to="/admin/events" replace />} />
                    <Route path="/staff" element={<Navigate to="/staff/bookings" replace />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <Footer />
                
                {/* Modal Components */}
                <EventRegistration />
                <BookingForm />
              </div>
            </BookingProvider>
          </ModalProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;