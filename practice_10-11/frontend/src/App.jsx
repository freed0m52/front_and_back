import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Products from './components/Products';
import ProductDetail from './components/ProductDetail';
import Users from './components/Users';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={styles.loading}>Загрузка...</div>;
  }

  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={styles.loading}>Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return user.role === 'admin' ? children : <Navigate to="/products" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/products" 
            element={
              <PrivateRoute>
                <Products />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/products/:id" 
            element={
              <PrivateRoute>
                <ProductDetail />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/products/:id/edit" 
            element={
              <PrivateRoute>
                <ProductDetail />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/products" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

const styles = {
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    color: '#666',
  },
};

export default App;