import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [piedraIdInput, setPiedraIdInput] = useState('');
  const [loteIdInput, setLoteIdInput] = useState('');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl print:hidden">
      <div 
        onClick={() => navigate('/recepcion')}
        className="p-8 rounded-2xl bg-card border border-border shadow-2xl hover:border-blue-500/50 transition-all duration-300 group cursor-pointer"
      >
         <h2 className="text-2xl font-bold mb-4 text-primary group-hover:text-blue-400 transition-colors">Recepción de Lotes</h2>
         <p className="text-gray-400 leading-relaxed">Registrar un nuevo lote de piedras, asignar cliente, responsable y generar códigos QR.</p>
      </div>
      
       <div className="p-8 rounded-2xl bg-card border border-border shadow-2xl hover:border-emerald-500/50 transition-all duration-300 group">
         <h2 className="text-2xl font-bold mb-4 text-primary group-hover:text-emerald-400 transition-colors">Visor de Trazabilidad</h2>
         <p className="text-gray-400 leading-relaxed mb-4">Ingresa el ID de la piedra (ej. GSX-2026-001-001) escaneado desde el QR.</p>
          <div className="flex flex-col gap-4">
             <div className="flex gap-2">
                <input 
                  type="text" 
                  value={piedraIdInput}
                  onChange={(e) => setPiedraIdInput(e.target.value)}
                  placeholder="ID de la Piedra"
                  className="flex-1 bg-input border border-border rounded-lg p-2 outline-none focus:border-emerald-500 transition text-foreground"
                />
                <button 
                  onClick={() => navigate(`/trazabilidad/${piedraIdInput}`)}
                  disabled={!piedraIdInput.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 rounded-lg transition cursor-pointer"
                >
                  Buscar Piedra
                </button>
             </div>
             <div className="flex gap-2 border-t border-gray-700 pt-4">
                <input 
                  type="text" 
                  value={loteIdInput}
                  onChange={(e) => setLoteIdInput(e.target.value)}
                  placeholder="ID del Lote"
                  className="flex-1 bg-input border border-border rounded-lg p-2 outline-none focus:border-emerald-500 transition text-foreground"
                />
                <button 
                  onClick={() => navigate(`/lotes/${loteIdInput}`)}
                  disabled={!loteIdInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-4 rounded-lg transition cursor-pointer"
                >
                  Buscar Lote
                </button>
             </div>
          </div>
      </div>

      <div 
        onClick={() => navigate('/dashboard')}
        className="md:col-span-2 p-8 rounded-2xl bg-card border border-border shadow-2xl hover:border-purple-500/50 transition-all duration-300 group cursor-pointer flex flex-col items-center text-center"
      >
         <h2 className="text-2xl font-bold mb-2 text-primary group-hover:text-purple-400 transition-colors">Dashboard de Operaciones</h2>
         <p className="text-gray-400 leading-relaxed">Ver estadísticas, métricas, y supervisar el volumen general de procesamiento de la planta.</p>
      </div>
    </div>
  );
}
