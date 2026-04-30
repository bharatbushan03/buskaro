import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Drivers } from './pages/Drivers';
import { Buses } from './pages/Buses';
import { Routes as RoutesPage } from './pages/Routes';
import { Payments } from './pages/Payments';
import { Analytics } from './pages/Analytics';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="buses" element={<Buses />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="payments" element={<Payments />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
    </Routes>
  );
};

export default App;
