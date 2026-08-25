import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formPayload = new URLSearchParams();
      formPayload.append('username', username);
      formPayload.append('password', password);
      if (step === 2 && twoFactorCode) {
        formPayload.append('two_factor_code', twoFactorCode);
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formPayload,
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/'); // Redirect to Home
      } else if (res.status === 403) {
        const errData = await res.json();
        if (errData.detail === "2FA_REQUIRED") {
          setStep(2);
          setError("Se ha enviado un código de verificación a tu correo.");
        } else {
          setError(errData.detail);
        }
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error(error);
      setError('Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl border border-border shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <img src="/mainLogoGreen.png" alt="GemStoneX" className="h-16 mb-4 object-contain" />
          <h2 className="text-2xl font-bold text-primary">Iniciar Sesión</h2>
        </div>
        
        {error && (
          <div className={`p-4 rounded-lg mb-6 border ${step === 2 && error.includes('enviado') ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className={step === 2 ? "opacity-50 pointer-events-none" : ""}>
            <label className="text-sm font-semibold text-gray-300">Usuario</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-1 p-3 bg-input border border-border rounded-lg text-foreground outline-none focus:border-emerald-500 transition-colors" 
              placeholder="Ej. admin"
              disabled={step === 2}
            />
          </div>
          <div className={step === 2 ? "opacity-50 pointer-events-none" : ""}>
            <label className="text-sm font-semibold text-gray-300">Contraseña</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 p-3 bg-input border border-border rounded-lg text-foreground outline-none focus:border-emerald-500 transition-colors" 
              placeholder="••••••••"
              disabled={step === 2}
            />
          </div>
          
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <label className="text-sm font-semibold text-emerald-400">Código de Verificación (2FA)</label>
              <input 
                type="text" 
                required
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                className="w-full mt-1 p-3 bg-input border border-emerald-500/50 focus:border-emerald-500 rounded-lg text-foreground outline-none transition-colors text-center text-xl tracking-widest font-mono" 
                placeholder="123456"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-2 text-center">
                Revisa la consola del backend para ver el código simulado.
              </p>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
          >
            {isLoading ? 'Verificando...' : (step === 1 ? 'Continuar' : 'Verificar y Acceder')}
          </button>
        </form>

        {/* Removed public registration link */}
      </div>
    </div>
  );
}
