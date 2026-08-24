import React, { useState, useEffect } from 'react';
import { PlusCircle, CheckCircle2, XCircle, X } from 'lucide-react';

export default function DynamicActorSelect({ label, role, onSelect, value, onIsCreatingChange }) {
  const [actors, setActors] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newActorName, setNewActorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    fetchActors();
  }, [role]);

  useEffect(() => {
    if (onIsCreatingChange) {
      onIsCreatingChange(isCreating);
    }
  }, [isCreating, onIsCreatingChange]);

  const fetchActors = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/personas`, {
        headers: { 'X-Device-Code': 'dev_device_12345' }
      });
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter(a => a.rol === role);
        setActors(filtered);
      }
    } catch (error) {
      console.error("Error fetching actors", error);
    }
  };

  const handleSelectChange = (e) => {
    const selectedVal = e.target.value;
    if (selectedVal === 'NEW') {
      setIsCreating(true);
    } else {
      onSelect(selectedVal);
    }
  };

  const handleCreate = async () => {
    if (!newActorName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/personas/rol/${role}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Device-Code': 'dev_device_12345'
        },
        body: JSON.stringify({ nombre: newActorName.trim(), rol: role })
      });
      if (res.ok) {
        const newActor = await res.json();
        setActors([...actors, newActor]);
        onSelect(newActor.id.toString());
        setIsCreating(false);
        setNewActorName('');
        
        // Show success briefly
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 2000);
      } else {
        alert("Error al crear " + label);
      }
    } catch (error) {
      console.error("Error creating actor", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-semibold text-gray-300 flex justify-between">
        {label}
        {successMsg && <span className="text-emerald-400 text-xs">¡Guardado con éxito!</span>}
      </label>
      
      <select 
        className={`bg-input border text-foreground text-sm rounded-lg focus:ring-blue-500 block w-full p-2.5 outline-none transition-all ${!value ? 'border-red-500/50' : 'border-border focus:border-blue-500'}`}
        value={value || ''}
        onChange={handleSelectChange}
      >
        <option value="" disabled>Seleccione {label}</option>
        {actors.map(actor => (
          <option key={actor.id} value={actor.id}>{actor.nombre}</option>
        ))}
        <option value="NEW" className="text-emerald-400 font-bold bg-background">+ Nuevo {label}...</option>
      </select>

      {/* MODAL OVERLAY FOR CREATION */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => { setIsCreating(false); onSelect(''); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={24} />
            </button>
            
            <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <PlusCircle className="text-emerald-500" />
              Crear Nuevo {label}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  className="bg-input border border-border text-foreground rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-3 outline-none transition-all"
                  placeholder={`Ej: Juan Pérez`}
                  value={newActorName}
                  onChange={(e) => setNewActorName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => { setIsCreating(false); onSelect(''); }}
                  className="px-4 py-2 bg-transparent text-gray-300 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleCreate}
                  disabled={loading || !newActorName.trim()}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  {loading ? 'Guardando...' : 'Guardar y Seleccionar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
