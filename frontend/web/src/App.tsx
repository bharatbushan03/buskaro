import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { Routes as RoutesPage } from './pages/Routes';
import { Payments } from './pages/Payments';
import { Analytics } from './pages/Analytics';
import { StudentsPage } from './pages/admin/StudentsPage';
import { DriversPage } from './pages/admin/DriversPage';
import { BusesPage } from './pages/admin/BusesPage';
import { Login } from './pages/Login';

// Mock Protected Route
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="drivers" element={<DriversPage />} />
        <Route path="buses" element={<BusesPage />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="payments" element={<Payments />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
    </Routes>
  );
};

export default App;
