import React, { useState, useEffect } from 'react';
import { useStoneStore } from '../store/useStoneStore';
import DynamicActorSelect from './DynamicActorSelect';
import { Camera } from 'lucide-react';

const ESTADOS = ['Ingreso', 'Desbaste', 'Tallado', 'Entregado'];

export default function StoneViewer({ piedraId, onBack }) {
  const [activeTab, setActiveTab] = useState('Ingreso');
  const [formData, setFormData] = useState({});
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { estadosHistorial, setEstadosHistorial, updatePiedraState } = useStoneStore();

  useEffect(() => {
    // Mock fetch or actual fetch to load history
    fetchHistory();
  }, [piedraId]);

  const fetchHistory = async () => {
    try {
      setErrorMsg(null);
      const res = await fetch(`http://localhost:8000/piedras/${piedraId}/historial`, {
        headers: { 'X-Device-Code': 'dev_device_12345' }
      });
      if (res.ok) {
        const data = await res.json();
        setEstadosHistorial(data);
        // Find latest state to set active tab
        if (data.length > 0) {
          const latestState = data[data.length - 1].estado_registrado;
          setActiveTab(latestState);
          loadFormDataForState(latestState, data);
        } else {
          // If no history, it's just 'Ingreso'
          setActiveTab('Ingreso');
          loadFormDataForState('Ingreso', []);
        }
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || "Error al cargar la información");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Error de conexión con el servidor");
    }
  };

  const loadFormDataForState = (estadoName, historyArray = estadosHistorial) => {
    const record = historyArray.find(h => h.estado_registrado === estadoName);
    
    // Check if the state being viewed is older than the current actual state
    const currentActualState = historyArray.length > 0 ? historyArray[historyArray.length - 1].estado_registrado : 'Ingreso';
    const isPast = ESTADOS.indexOf(estadoName) < ESTADOS.indexOf(currentActualState);
    const isCompleted = record !== undefined;
    
    setIsReadOnly(isPast || isCompleted);
    
    if (record) {
      setFormData(record);
    } else {
      // Inherit if moving to a new state
      const previousStateRecord = historyArray.length > 0 ? historyArray[historyArray.length - 1] : {};
      setFormData({
        peso_ct: previousStateRecord.peso_ct || '',
        longitud_mm: previousStateRecord.longitud_mm || '',
        ancho_mm: previousStateRecord.ancho_mm || '',
        profundo_mm: previousStateRecord.profundo_mm || '',
        plan_corte: previousStateRecord.plan_corte || '',
        foto_url: previousStateRecord.foto_url || '',
        notas: ''
      });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formPayload = new FormData();
    formPayload.append('file', file);

    try {
      const res = await fetch(`http://localhost:8000/upload/image`, {
        method: 'POST',
        headers: { 'X-Device-Code': 'dev_device_12345' },
        body: formPayload
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, foto_url: data.url }));
      } else {
        alert("Error al subir la imagen");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión al subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTabClick = (estado) => {
    const currentActualStateIndex = estadosHistorial.length > 0 
      ? ESTADOS.indexOf(estadosHistorial[estadosHistorial.length - 1].estado_registrado)
      : 0;
    
    const targetIndex = ESTADOS.indexOf(estado);
    
    // Allow clicking past states, current state, or the exactly next valid state
    if (targetIndex <= currentActualStateIndex + 1) {
      setActiveTab(estado);
      loadFormDataForState(estado);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`http://localhost:8000/piedras/${piedraId}/estado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Code': 'dev_device_12345'
        },
        body: JSON.stringify({
          estado: activeTab,
          ...formData
        })
      });
      
      if (res.ok) {
        const updatedRecord = await res.json();
        setEstadosHistorial([...estadosHistorial, updatedRecord]);
        updatePiedraState(piedraId, activeTab);
        setIsReadOnly(true);
      } else {
        const error = await res.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-card rounded-2xl border border-border shadow-2xl p-6 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
          <button onClick={onBack} className="text-sm px-3 py-1 bg-border rounded hover:bg-gray-700 transition">Volver</button>
          {errorMsg ? 'Error de Búsqueda' : (
            <>Trazabilidad Piedra: <span className="text-blue-400">{piedraId}</span></>
          )}
        </h2>
      </div>

      {errorMsg ? (
        <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-lg text-center">
          <h3 className="text-xl font-bold text-red-400 mb-2">Piedra no encontrada</h3>
          <p className="text-gray-300">El ID <strong className="text-white">{piedraId}</strong> no pertenece a ninguna piedra registrada en el sistema. Asegúrate de estar escaneando el código QR de una piedra y no el de un lote.</p>
        </div>
      ) : (
        <>
          {/* Timeline Tabs */}
      <div className="flex w-full border-b border-border mb-4">
        {ESTADOS.map((estado, idx) => {
          const isActive = activeTab === estado;
          const isAvailable = idx <= (estadosHistorial.length > 0 ? ESTADOS.indexOf(estadosHistorial[estadosHistorial.length - 1].estado_registrado) + 1 : 0);
          const isCompleted = estadosHistorial.some(h => h.estado_registrado === estado);

          return (
            <button
              key={estado}
              onClick={() => handleTabClick(estado)}
              disabled={!isAvailable}
              className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 
                ${isActive ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}
                ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs
                  ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'}
                `}>
                  {idx + 1}
                </span>
                {estado}
              </div>
            </button>
          );
        })}
      </div>

      {/* Dynamic Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Dimensions Group */}
        <div className="col-span-1 md:col-span-2 flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-300">Peso (ct)</label>
              <input type="number" name="peso_ct" value={formData.peso_ct || ''} onChange={handleChange} disabled={isReadOnly || (activeTab === 'Entregado' && !isReadOnly)} className="w-full p-2.5 bg-input border border-border rounded-lg text-foreground disabled:opacity-50" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-300">Largo (mm)</label>
              <input type="number" name="longitud_mm" value={formData.longitud_mm || ''} onChange={handleChange} disabled={isReadOnly || (activeTab === 'Entregado' && !isReadOnly)} className="w-full p-2.5 bg-input border border-border rounded-lg text-foreground disabled:opacity-50" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-300">Ancho (mm)</label>
              <input type="number" name="ancho_mm" value={formData.ancho_mm || ''} onChange={handleChange} disabled={isReadOnly || (activeTab === 'Entregado' && !isReadOnly)} className="w-full p-2.5 bg-input border border-border rounded-lg text-foreground disabled:opacity-50" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-300">Alto (mm)</label>
              <input type="number" name="profundo_mm" value={formData.profundo_mm || ''} onChange={handleChange} disabled={isReadOnly || (activeTab === 'Entregado' && !isReadOnly)} className="w-full p-2.5 bg-input border border-border rounded-lg text-foreground disabled:opacity-50" />
            </div>
        </div>

        {/* Plan Corte - Readonly on everything except Ingreso */}
        <div className="col-span-1 md:col-span-2">
          <label className="text-sm font-semibold text-gray-300">Plan de Corte</label>
          <select 
             name="plan_corte" 
             value={formData.plan_corte || ''} 
             onChange={handleChange} 
             disabled={isReadOnly || activeTab !== 'Ingreso'} 
             className="w-full p-2.5 bg-input border border-border rounded-lg text-foreground disabled:opacity-50 outline-none focus:border-blue-500"
          >
             <option value="" disabled>Seleccione...</option>
             <option value="Corte Esmeralda">Corte Esmeralda</option>
             <option value="Ovalo">Ovalo</option>
             <option value="Cojín">Cojín</option>
             <option value="Pera">Pera</option>
             <option value="Redondo">Redondo</option>
             <option value="Asscher">Asscher</option>
             <option value="Octágono">Octágono</option>
             <option value="Corazón">Corazón</option>
             <option value="Cabujón">Cabujón</option>
             <option value="Trillion">Trillion</option>
             <option value="Fantasía">Fantasía</option>
          </select>
        </div>

        {/* Tallador - Only active from Desbaste onwards */}
        {ESTADOS.indexOf(activeTab) >= 1 && (
          <div className="col-span-1 md:col-span-2">
            {isReadOnly ? (
               <div>
                  <label className="text-sm font-semibold text-gray-300">Tallador Asignado (ID)</label>
                  <input type="text" value={formData.tallador_id || 'N/A'} disabled className="w-full p-2.5 bg-input border border-border rounded-lg text-foreground opacity-50" />
               </div>
            ) : (
               <DynamicActorSelect 
                 label="Tallador" 
                 role="Tallador" 
                 value={formData.tallador_id} 
                 onSelect={(val) => setFormData({...formData, tallador_id: val})} 
               />
            )}
          </div>
        )}

        {/* Foto */}
        <div className="col-span-1 md:col-span-2">
          <label className="text-sm font-semibold text-gray-300 mb-2 block">Fotografía del Estado</label>
          <div className="flex items-center gap-4">
            {formData.foto_url && (
              <img src={formData.foto_url} alt="Piedra" className="w-32 h-32 object-cover rounded-lg border border-border bg-black" />
            )}
            
            {(!isReadOnly && activeTab !== 'Entregado') && (
              <label className={`flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-600 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {isUploading ? (
                  <span className="text-sm text-gray-400">Subiendo...</span>
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-400 font-medium text-center px-2">Subir / Cambiar Foto</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            )}
          </div>
        </div>

        {/* Notas */}
        <div className="col-span-1 md:col-span-2">
          <label className="text-sm font-semibold text-gray-300">Notas Adicionales</label>
          <textarea name="notas" value={formData.notas || ''} onChange={handleChange} disabled={isReadOnly} className="w-full p-2.5 bg-input border border-border rounded-lg text-foreground h-24 resize-none disabled:opacity-50" />
        </div>

      </div>

      {/* Footer / Actions */}
      {!isReadOnly && (
        <div className="flex justify-end mt-4">
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20"
          >
            Guardar Estado: {activeTab}
          </button>
        </div>
      )}
        </>
      )}

    </div>
  );
}
