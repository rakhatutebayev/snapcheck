import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Slides from './pages/Slides';
import PresentationsList from './pages/PresentationsList';
import AdminPanel from './pages/AdminPanel';
import EmailOAuthCallback from './pages/EmailOAuthCallback';
import DesignSystemDemo from './pages/DesignSystemDemo';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import HealthFrontend from './pages/HealthFrontend';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const RootRedirect = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  return <Navigate to={role === 'admin' ? '/admin' : '/presentations'} />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
        <Route path="/presentations" element={<PrivateRoute><PresentationsList /></PrivateRoute>} />
        <Route path="/slides" element={<PrivateRoute><Slides /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
        <Route path="/admin/email/callback" element={<EmailOAuthCallback />} />
        <Route path="/design" element={<DesignSystemDemo />} />
  <Route path="/health-frontend" element={<HealthFrontend />} />
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
