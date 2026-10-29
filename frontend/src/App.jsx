import React from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import StoneViewer from './components/StoneViewer';
import LoteViewer from './components/LoteViewer';
import DashboardViewer from './components/DashboardViewer';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import Recepcion from './pages/Recepcion';

import { useAuthStore } from './store/useAuthStore';

// ProtectedRoute Component
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-start pt-24 p-4">
      <Navbar />
      {/* Header */}
      <div className="text-center mb-12 print:hidden flex flex-col items-center">
        <img 
          src="/mainLogoGreen.png" 
          alt="GemStoneX" 
          onClick={() => navigate('/')}
          className="h-20 mb-4 cursor-pointer hover:opacity-80 transition object-contain"
        />
        <p className="text-xl text-gray-400 font-medium flex items-center justify-center gap-3">
          <img src="/Logo.png" alt="Icon" className="h-6 w-6 object-contain" />
          Sistema Premium de Trazabilidad de Inventario
        </p>
      </div>
      
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/recepcion" element={<ProtectedRoute><Recepcion /></ProtectedRoute>} />
          <Route path="/trazabilidad/:id" element={<ProtectedRoute><div className="w-full max-w-4xl"><StoneViewer /></div></ProtectedRoute>} />
          <Route path="/lotes/:id" element={<ProtectedRoute><div className="w-full max-w-6xl"><LoteViewer /></div></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><div className="w-full"><DashboardViewer /></div></ProtectedRoute>} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;
