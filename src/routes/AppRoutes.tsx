import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from '../pages/Home';
import { Orders } from '../pages/Orders';
import { Login } from '../pages/Login';
import { AdminDashboard } from '../pages/AdminDashboard';
import { NotFound } from '../pages/NotFound';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/menu" element={<Navigate to="/" replace />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/login" element={<Login isAdmin={true} />} />
      <Route path="/login" element={<Login isAdmin={false} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
export default AppRoutes;
