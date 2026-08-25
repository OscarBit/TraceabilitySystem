import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, UserCircle } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); // Force re-render on route change
  
  // Extract user info from JWT (sub and rol)
  const token = localStorage.getItem('token');
  let user = null;
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      user = { username: payload.sub, rol: payload.rol };
    } catch (e) {
      console.error("Invalid token format");
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSwitchUser = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) return null; // Don't render if not logged in

  return (
    <nav className="w-full bg-card border-b border-border shadow-md px-6 py-4 flex justify-between items-center fixed top-0 z-50 print:hidden">
      <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
        <img src="/Logo.png" alt="GemStoneX Logo" className="h-8" />
        <span className="text-xl font-bold text-emerald-500 tracking-wider">GemStoneX</span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-full border border-gray-700">
          <UserCircle className="text-gray-400" size={20} />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-tight">{user.username}</span>
            <span className="text-xs text-emerald-400 leading-tight">{user.rol}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {user.rol === 'Administrador' && (
            <button 
              onClick={() => navigate('/register')}
              className="text-sm bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer mr-2"
            >
              + Crear Usuario
            </button>
          )}

          <button 
            onClick={handleSwitchUser}
            className="text-sm text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            Cambiar Usuario
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg transition-all cursor-pointer"
          >
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}
