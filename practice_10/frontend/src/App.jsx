import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import Register from './components/Register'
import Products from './components/Products'
import ProductDetail from './components/ProductDetail'

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Загрузка...</div>
  }

  return user ? children : <Navigate to="/login" />
}

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
          <Route path="/" element={<Navigate to="/products" />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App