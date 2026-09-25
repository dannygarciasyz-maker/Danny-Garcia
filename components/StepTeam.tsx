
import React, { useState, useRef, useEffect } from 'react';
import { ATSData, Worker } from '../types';

interface Props {
  data: ATSData;
  update: (d: Partial<ATSData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function StepTeam({ data, update, onNext, onPrev }: Props) {
  const [newWorker, setNewWorker] = useState({ name: '', id: '', role: '', email: '' });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
  }, []);

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) };
  };

  const startDrawing = (e: any) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
    if (e.cancelable) e.preventDefault();
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke();
    if (e.cancelable) e.preventDefault();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const addWorker = () => {
    if (!newWorker.name || !newWorker.id) return;
    const signature = canvasRef.current?.toDataURL();
    const isEmpty = (signature?.length || 0) < 2000;
    const updatedTeam = [...data.team, { ...newWorker, signature: isEmpty ? '' : signature }];
    
    // Sincronizar conteo de trabajadores
    update({ 
      team: updatedTeam,
      activity: { ...data.activity, workerCount: updatedTeam.length }
    });
    
    setNewWorker({ name: '', id: '', role: '', email: '' });
    clearCanvas();
  };

  const removeWorker = (idx: number) => {
    const updatedTeam = data.team.filter((_, i) => i !== idx);
    // Sincronizar conteo de trabajadores
    update({ 
      team: updatedTeam,
      activity: { ...data.activity, workerCount: updatedTeam.length }
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-black text-syz-red uppercase">Equipo de Trabajo</h2>
        <p className="text-slate-500 font-bold italic">Integrantes registrados: {data.team.length}</p>
      </div>

      <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-1">
            <label className="text-[8pt] font-black text-syz-onyx uppercase">Nombre Completo <span className="text-syz-red">*</span></label>
            <input type="text" className="w-full font-bold" value={newWorker.name} onChange={e => setNewWorker({...newWorker, name: e.target.value})} placeholder="Nombre" />
          </div>
          <div className="space-y-1">
            <label className="text-[8pt] font-black text-syz-onyx uppercase">Cédula <span className="text-syz-red">*</span></label>
            <input type="text" className="w-full font-bold" value={newWorker.id} onChange={e => setNewWorker({...newWorker, id: e.target.value})} placeholder="ID" />
          </div>
          <div className="space-y-1">
            <label className="text-[8pt] font-black text-syz-onyx uppercase">Cargo / Rol</label>
            <input type="text" className="w-full font-bold" value={newWorker.role} onChange={e => setNewWorker({...newWorker, role: e.target.value})} placeholder="Ej: Técnico" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[8pt] font-black text-syz-onyx uppercase italic">Firma Digital (Opcional)</label>
            <button onClick={clearCanvas} className="text-[8pt] font-black text-syz-red uppercase px-2 py-1 bg-white border rounded">Limpiar</button>
          </div>
          <div className="bg-white border-2 border-slate-300 rounded-xl h-32 relative overflow-hidden">
            <canvas ref={canvasRef} width={600} height={200} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)} className="w-full h-full cursor-crosshair touch-none" />
          </div>
        </div>

        <button onClick={addWorker} className="w-full mt-4 bg-syz-jet text-white py-3 rounded-xl font-black uppercase shadow-lg hover:bg-black transition-all">+ Agregar Integrante</button>
      </div>

      <div className="mt-8 space-y-4">
        {data.team.map((w, i) => (
          <div key={i} className="flex justify-between items-center p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm relative">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 rounded-full bg-syz-jet text-white flex items-center justify-center font-black text-sm">{w.name[0]}</div>
              <div>
                <p className="font-black text-syz-jet uppercase text-xs">{w.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">CC: {w.id} | {w.role}</p>
              </div>
            </div>
            {w.signature ? <img src={w.signature} className="h-10 w-24 object-contain border bg-slate-50 p-1 mr-4" /> : <div className="h-8 w-24 border-dashed border-2 flex items-center justify-center mr-4 text-[8px] font-black text-slate-300">MANUAL</div>}
            <button onClick={() => removeWorker(i)} className="text-slate-300 hover:text-syz-red"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-8 border-t">
        <button onClick={onPrev} className="text-slate-500 font-black px-6 py-3 hover:bg-slate-100 rounded-xl transition-all uppercase text-xs">Anterior</button>
        <button onClick={onNext} className="bg-syz-red text-white px-10 py-3 rounded-xl font-black shadow-lg uppercase">Siguiente</button>
      </div>
    </div>
  );
}
