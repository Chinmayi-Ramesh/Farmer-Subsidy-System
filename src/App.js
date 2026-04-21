import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Admin Routes
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';

// Farmer Routes
import FarmerLogin from './components/farmer/FarmerLogin';
import FarmerDashboard from './components/farmer/FarmerDashboard';
import FarmerRequests from './components/farmer/FarmerRequests';
import FarmerTokens from './components/farmer/FarmerTokens';

// Government Shop Routes
import ShopLogin from './components/shop/ShopLogin';
import ShopDashboard from './components/shop/ShopDashboard';

function App() {
  return (
    <Router>
      <div style={styles.app}>
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/admin/login" />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          
          {/* Farmer Routes */}
          <Route path="/farmer/login" element={<FarmerLogin />} />
          <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
          <Route path="/farmer/requests" element={<FarmerRequests />} />
          <Route path="/farmer/tokens" element={<FarmerTokens />} />
          
          {/* Government Shop Routes */}
          <Route path="/shop/login" element={<ShopLogin />} />
          <Route path="/shop/dashboard" element={<ShopDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  }
};

export default App;