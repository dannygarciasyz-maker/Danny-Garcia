
import React, { useState, useEffect, useRef } from 'react';
import { ATSData, TaskStep } from '../types';
import { generateTaskAnalysis } from '../geminiService';

interface Props {
  data: ATSData;
  update: (d: Partial<ATSData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

// Componente interno para manejar el auto-resize del textarea
const AutoResizeTextArea = ({ value, onChange, disabled, className, placeholder }: any) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const node = textareaRef.current;
    if (node) {
      node.style.height = 'auto';
      node.style.height = `${node.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className={`${className} resize-none overflow-hidden transition-[height] duration-200`}
      rows={1}
    />
  );
};

export default function StepAnalysis({ data, update, onNext, onPrev }: Props) {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (data.analysis.length === 0 && data.activity.taskDescription) {
      handleSuggest();
    }
  }, []);

  const handleSuggest = async () => {
    setLoading(true);
    try {
      const result = await generateTaskAnalysis(data.activity.taskDescription);
      update({ analysis: result });
      setIsEditing(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addManualRow = () => {
    const newRows = [...data.analysis, { step: '', risk: '', control: '', acknowledged: false }];
    update({ analysis: newRows });
    setIsEditing(true);
  };

  const updateRow = (idx: number, field: keyof TaskStep, val: any) => {
    const newRows = [...data.analysis];
    (newRows[idx] as any)[field] = val;
    update({ analysis: newRows });
  };

  const deleteRow = (idx: number) => {
    const newRows = data.analysis.filter((_, i) => i !== idx);
    update({ analysis: newRows });
  };

  // Funciones para Drag & Drop
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Crear una imagen transparente para que no se vea feo el arrastre nativo completo
    const ghost = document.createElement("div");
    ghost.style.visibility = "hidden";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newAnalysis = [...data.analysis];
    const draggedItem = newAnalysis[draggedIndex];
    
    // Mover el item en el array
    newAnalysis.splice(draggedIndex, 1);
    newAnalysis.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    update({ analysis: newAnalysis });
  };

  const onDragEnd = () => {
    setDraggedIndex(null);
  };

  const allAcknowledged = data.analysis.length > 0 && data.analysis.every(r => r.acknowledged);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-slate-100 pb-4 gap-4">
        <div>
          <h2 className="text-3xl font-black text-syz-red uppercase tracking-tight">Análisis de trabajo</h2>
          <p className="text-slate-600 font-medium italic">Ordene los pasos arrastrándolos desde el icono lateral.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={addManualRow}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-syz-jet text-white px-6 py-3 rounded-xl font-black border-2 border-syz-jet hover:bg-black transition-all shadow-md text-xs uppercase">
            + Añadir Fila
          </button>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black border-2 transition-all shadow-md text-xs uppercase ${isEditing ? 'bg-syz-red text-white border-syz-red' : 'bg-white text-syz-onyx border-slate-200 hover:bg-slate-50'}`}>
            {isEditing ? 'Bloquear Edición' : 'Habilitar Edición'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border-2 border-slate-100 shadow-sm bg-slate-50">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr className="bg-syz-jet text-white">
              <th className="p-4 w-[40px]"></th>
              <th className="p-5 text-[8pt] font-black uppercase tracking-widest w-[28%]">Actividad / Paso</th>
              <th className="p-5 text-[8pt] font-black uppercase tracking-widest w-[28%]">Peligro Asociado</th>
              <th className="p-5 text-[8pt] font-black uppercase tracking-widest w-[28%]">Medida de Control</th>
              <th className="p-5 text-[8pt] font-black uppercase tracking-widest text-center w-[8%]">Validar</th>
              <th className="p-5 text-[8pt] font-black uppercase tracking-widest text-center w-[6%]">Quitar</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="p-20 text-center font-black text-syz-red animate-pulse">GENERANDO ANÁLISIS...</td></tr>
            ) : data.analysis.length === 0 ? (
              <tr><td colSpan={6} className="p-20 text-center text-slate-400 font-bold uppercase text-xs">Sin pasos registrados.</td></tr>
            ) : (
              data.analysis.map((row, i) => (
                <tr 
                  key={i} 
                  draggable={isEditing}
                  onDragStart={(e) => onDragStart(e, i)}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDragEnd={onDragEnd}
                  className={`transition-all duration-200 ${row.acknowledged ? 'bg-green-50/50' : 'bg-white'} ${draggedIndex === i ? 'opacity-40 scale-[0.98] border-2 border-syz-red' : ''}`}
                >
                  <td className="p-2 text-center align-middle cursor-grab active:cursor-grabbing text-slate-300 hover:text-syz-red transition-colors">
                    {isEditing && (
                      <div className="flex flex-col items-center gap-0.5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 9h8M8 15h8" /></svg>
                      </div>
                    )}
                  </td>
                  <td className="p-4 align-top">
                    <AutoResizeTextArea
                      disabled={!isEditing}
                      className={`w-full p-2 border rounded-xl text-[8pt] font-bold focus:ring-1 focus:ring-syz-red outline-none ${isEditing ? 'bg-white border-slate-300' : 'bg-transparent border-transparent'}`} 
                      value={row.step} 
                      onChange={(e: any) => updateRow(i, 'step', e.target.value)} 
                    />
                  </td>
                  <td className="p-4 align-top">
                    <AutoResizeTextArea
                      disabled={!isEditing}
                      className={`w-full p-2 border rounded-xl text-[8pt] font-bold focus:ring-1 focus:ring-syz-red outline-none ${isEditing ? 'bg-white border-slate-300' : 'bg-transparent border-transparent'}`} 
                      value={row.risk} 
                      onChange={(e: any) => updateRow(i, 'risk', e.target.value)} 
                    />
                  </td>
                  <td className="p-4 align-top">
                    <AutoResizeTextArea
                      disabled={!isEditing}
                      className={`w-full p-2 border rounded-xl text-[8pt] font-bold focus:ring-1 focus:ring-syz-red outline-none ${isEditing ? 'bg-white border-slate-300' : 'bg-transparent border-transparent'}`} 
                      value={row.control} 
                      onChange={(e: any) => updateRow(i, 'control', e.target.value)} 
                    />
                  </td>
                  <td className="p-4 text-center align-top pt-6">
                    <input 
                      type="checkbox" 
                      className="w-7 h-7 rounded border-slate-300 text-syz-red focus:ring-syz-red cursor-pointer"
                      checked={row.acknowledged}
                      onChange={e => updateRow(i, 'acknowledged', e.target.checked)}
                    />
                  </td>
                  <td className="p-4 text-center align-top pt-6">
                    <button onClick={() => deleteRow(i)} className="text-slate-300 hover:text-syz-red transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pt-10">
        <button onClick={onPrev} className="text-slate-500 font-black px-8 py-4 hover:bg-slate-100 rounded-2xl transition-all uppercase text-xs">Anterior</button>
        <button onClick={onNext} disabled={!allAcknowledged} className={`px-12 py-4 rounded-2xl font-black text-lg transition-all shadow-2xl uppercase ${allAcknowledged ? 'bg-syz-red text-white hover:bg-red-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Siguiente</button>
      </div>
    </div>
  );
}
