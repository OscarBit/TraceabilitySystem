import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import DynamicActorSelect from './components/DynamicActorSelect';
import StoneViewer from './components/StoneViewer';
import LoteViewer from './components/LoteViewer';
import DashboardViewer from './components/DashboardViewer';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './components/Navbar';
import { fetchAuth } from './utils/api';

// Home Component
function Home() {
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

// Recepcion Component
function Recepcion() {
  const navigate = useNavigate();
  const [clienteId, setClienteId] = useState('');
  const [responsableId, setResponsableId] = useState('');
  const [cantidadPiedras, setCantidadPiedras] = useState(1);
  const [pesoTotal, setPesoTotal] = useState('');
  const [loteGenerado, setLoteGenerado] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingCliente, setIsCreatingCliente] = useState(false);
  const [isCreatingOperador, setIsCreatingOperador] = useState(false);

  const isCreatingActors = isCreatingCliente || isCreatingOperador;

  const handleRegistrarLote = async () => {
    let missingFields = [];
    if (!clienteId) missingFields.push("Cliente (Dueño)");
    if (!responsableId) missingFields.push("Operador Responsable");
    if (cantidadPiedras < 1) missingFields.push("Cantidad de Piedras válida");
    if (!pesoTotal) missingFields.push("Peso Total Estimado");

    if (missingFields.length > 0) {
      alert(`Error al generar: Faltan los siguientes datos obligatorios:\n\n- ${missingFields.join('\n- ')}\n\nSi creaste un nuevo actor, asegúrate de haber presionado el botón verde (✔) o Enter para guardarlo antes de registrar el lote.`);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetchAuth(`${import.meta.env.VITE_API_URL}/lotes/`, {
        method: 'POST',
        body: JSON.stringify({
          cliente_id: parseInt(clienteId),
          responsable_id: parseInt(responsableId),
          cantidad_piedras: parseInt(cantidadPiedras),
          peso_total_ct: parseFloat(pesoTotal)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLoteGenerado(data);
      } else {
        alert("Error al crear el lote");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión con el backend");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loteGenerado) {
    return (
      <div className="w-full max-w-4xl bg-card rounded-2xl border border-border p-8 shadow-2xl">
         <div className="flex justify-between items-center mb-6 print:hidden">
            <h2 className="text-2xl font-bold text-primary">Lote Generado Exitosamente</h2>
            <div className="flex gap-2">
               <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer">
                  🖨️ Imprimir QRs
               </button>
               <button onClick={() => navigate('/')} className="bg-border px-4 py-2 rounded hover:bg-gray-700 cursor-pointer">
                  Finalizar
               </button>
            </div>
         </div>

         <div className="print-area">
           <div className="mb-8 border-b border-gray-700 pb-4">
             <h3 className="text-xl font-bold text-white print:text-black">Lote Principal: {loteGenerado.id}</h3>
             <p className="text-gray-400 print:text-gray-600">Este QR identifica el lote completo.</p>
             <div className="mt-4 p-4 bg-white inline-block rounded-lg">
               <QRCodeSVG value={`{"tipo":"lote", "id":"${loteGenerado.id}", "token":"${loteGenerado.qr_token}"}`} size={128} />
             </div>
           </div>

           <h3 className="text-lg font-bold text-white print:text-black mb-4">Códigos Individuales ({loteGenerado.piedras_generadas.length} piedras)</h3>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
             {loteGenerado.piedras_generadas.map((piedra) => (
               <div key={piedra.id} className="border border-gray-700 print:border-gray-300 p-4 rounded-xl flex flex-col items-center gap-2">
                 <p className="font-mono text-sm text-gray-300 print:text-black">{piedra.id}</p>
                 <div className="p-2 bg-white rounded-lg">
                   <QRCodeSVG value={`{"tipo":"piedra", "id":"${piedra.id}", "token":"${piedra.qr_token}"}`} size={100} />
                 </div>
               </div>
             ))}
           </div>
         </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl bg-card rounded-2xl border border-border p-8 shadow-2xl print:hidden">
       <h2 className="text-2xl font-bold text-primary mb-6 flex justify-between items-center">
          Registrar Nuevo Lote
          <button onClick={() => navigate('/')} className="text-sm bg-border px-3 py-1 rounded hover:bg-gray-700 cursor-pointer">Volver</button>
       </h2>
       <div className="space-y-6">
          <DynamicActorSelect 
             label="Cliente (Dueño)" 
             role="Cliente" 
             value={clienteId} 
             onSelect={setClienteId} 
             onIsCreatingChange={setIsCreatingCliente}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-300">Cantidad de Piedras</label>
              <input type="number" min="1" value={cantidadPiedras} onChange={(e) => setCantidadPiedras(e.target.value)} className="w-full mt-1 p-2.5 bg-input border border-border rounded-lg text-foreground outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-300">Peso Total Estimado (ct)</label>
              <input type="number" step="0.01" min="0" value={pesoTotal} onChange={(e) => setPesoTotal(e.target.value)} className="w-full mt-1 p-2.5 bg-input border border-border rounded-lg text-foreground outline-none focus:border-blue-500" />
            </div>
          </div>
          
          <DynamicActorSelect 
             label="Operador Responsable" 
             role="Operador" 
             value={responsableId} 
             onSelect={setResponsableId}
             onIsCreatingChange={setIsCreatingOperador}
          />
          
          <button 
            onClick={handleRegistrarLote}
            disabled={isSubmitting || isCreatingActors}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-700 text-white font-bold rounded-lg mt-4 transition shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            {isSubmitting ? 'Registrando...' : isCreatingActors ? 'Guarda los actores (botón verde) para continuar' : 'Registrar Lote y Generar QRs'}
          </button>
       </div>
    </div>
  );
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
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        <Route path="/recepcion" element={<Recepcion />} />
        <Route path="/trazabilidad/:id" element={<div className="w-full max-w-4xl"><StoneViewer /></div>} />
        <Route path="/lotes/:id" element={<div className="w-full max-w-6xl"><LoteViewer /></div>} />
        <Route path="/dashboard" element={<div className="w-full"><DashboardViewer /></div>} />
      </Routes>
    </div>
  );
}

export default App;
