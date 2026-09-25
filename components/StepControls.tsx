
import React, { useState, useEffect } from 'react';
import { ATSData } from '../types';
import { suggestControlsForTask } from '../geminiService';

interface Props {
  data: ATSData;
  update: (d: Partial<ATSData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const EPP_ITEMS = ["Casco Dieléctrico", "Gafas de Seguridad", "Protección Auditiva", "Botas de Seguridad", "Arnés de Seguridad", "Guantes de Nitrilo", "Respirador para Gases", "Traje Impermeable"];
const OTHER_CONTROLS = ["Previa desenergización de equipos", "Permiso de Alturas", "Permiso Eléctrico", "Bloqueo y Etiquetado", "Vigía HSE", "Monitor Multigas", "Extintor PQS"];

export default function StepControls({ data, update, onNext, onPrev }: Props) {
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{epp: string[], other: string[]}>({epp: [], other: []});
  const [manualControl, setManualControl] = useState('');
  const [manualEpp, setManualEpp] = useState('');

  useEffect(() => {
    if (data.activity.taskDescription) {
      loadAISuggestions();
    }
  }, []);

  const loadAISuggestions = async () => {
    setLoading(true);
    try {
      const suggestions = await suggestControlsForTask(data.activity.taskDescription);
      const filteredEpp = suggestions.epp.filter(item => !EPP_ITEMS.some(defaultItem => defaultItem.toLowerCase() === item.toLowerCase()));
      const filteredOther = suggestions.other.filter(item => !OTHER_CONTROLS.some(defaultItem => defaultItem.toLowerCase() === item.toLowerCase()));
      setAiSuggestions({ epp: filteredEpp, other: filteredOther });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (category: 'epp' | 'other', item: string) => {
    const section = { ...data.controls[category] };
    if (section[item]) delete section[item];
    else section[item] = "OK";
    update({ controls: { ...data.controls, [category]: section } });
  };

  const addManualControl = () => {
    if (manualControl.trim()) {
      toggleItem('other', manualControl.trim());
      setManualControl('');
    }
  };

  const addManualEpp = () => {
    if (manualEpp.trim()) {
      toggleItem('epp', manualEpp.trim());
      setManualEpp('');
    }
  };

  const manualOtherEntries = Object.keys(data.controls.other).filter(item => !OTHER_CONTROLS.includes(item) && !aiSuggestions.other.includes(item));
  const manualEppEntries = Object.keys(data.controls.epp).filter(item => !EPP_ITEMS.includes(item) && !aiSuggestions.epp.includes(item));

  return (
    <div className="space-y-8">
      <div className="border-b pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Controles y EPP</h2>
          <p className="text-slate-500 italic">Gestión de medidas preventivas para el sitio.</p>
        </div>
        <button onClick={loadAISuggestions} disabled={loading} className="text-[9pt] font-black uppercase text-syz-red border border-syz-red px-3 py-1 hover:bg-red-50 disabled:opacity-50">
          {loading ? 'Generando...' : 'Re-analizar con IA'}
        </button>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-black text-syz-onyx uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-syz-red rounded-full"></span>
            Equipo de Protección Personal
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {EPP_ITEMS.map(item => (
              <button key={item} onClick={() => toggleItem('epp', item)} className={`p-3 text-xs font-bold rounded-lg border transition-all ${data.controls.epp[item] ? 'bg-syz-jet text-white border-syz-jet' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                {item}
              </button>
            ))}
            {manualEppEntries.map(item => (
              <button key={item} onClick={() => toggleItem('epp', item)} className="p-3 text-xs font-bold rounded-lg border border-syz-onyx bg-syz-jet text-white shadow-md">
                {item} (Manual)
              </button>
            ))}
            {aiSuggestions.epp.map(item => (
              <button key={item} onClick={() => toggleItem('epp', item)} className={`p-3 text-xs font-bold rounded-lg border border-dashed transition-all ${data.controls.epp[item] ? 'bg-syz-red text-white border-syz-red' : 'bg-red-50 text-syz-red border-syz-red hover:bg-red-100'}`}>
                IA: {item}
              </button>
            ))}
          </div>
          <div className="bg-slate-50 p-4 border rounded-xl">
             <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Agregar EPP Manual</label>
             <div className="flex gap-2">
                <input type="text" className="flex-1 !bg-white" value={manualEpp} onChange={e => setManualEpp(e.target.value)} placeholder="Escriba otro EPP..." />
                <button onClick={addManualEpp} className="bg-syz-onyx text-white px-6 font-bold uppercase text-xs">Añadir</button>
             </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black text-syz-onyx uppercase tracking-widest mb-4 flex items-center gap-2">
             <span className="w-2 h-2 bg-syz-red rounded-full"></span>
             Controles Adicionales
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {OTHER_CONTROLS.map(item => (
              <button key={item} onClick={() => toggleItem('other', item)} className={`p-3 text-xs font-bold rounded-lg border transition-all ${data.controls.other[item] ? 'bg-syz-red text-white border-syz-red shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                {item}
              </button>
            ))}
            {manualOtherEntries.map(item => (
              <button key={item} onClick={() => toggleItem('other', item)} className="p-3 text-xs font-bold rounded-lg border border-syz-onyx bg-syz-jet text-white shadow-md">
                {item} (Manual)
              </button>
            ))}
            {aiSuggestions.other.map(item => (
              <button key={item} onClick={() => toggleItem('other', item)} className={`p-3 text-xs font-bold rounded-lg border border-dashed transition-all ${data.controls.other[item] ? 'bg-syz-jet text-white border-syz-jet' : 'bg-slate-50 text-syz-onyx border-syz-onyx hover:bg-slate-100'}`}>
                IA: {item}
              </button>
            ))}
          </div>
          <div className="bg-slate-50 p-4 border rounded-xl">
             <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Agregar Control Manual</label>
             <div className="flex gap-2">
                <input type="text" className="flex-1 !bg-white" value={manualControl} onChange={e => setManualControl(e.target.value)} placeholder="Escriba otro control..." />
                <button onClick={addManualControl} className="bg-syz-onyx text-white px-6 font-bold uppercase text-xs">Añadir</button>
             </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-8 border-t">
        <button onClick={onPrev} className="text-slate-500 font-bold px-6 py-3 hover:bg-slate-100 rounded-xl transition-all">Anterior</button>
        <button onClick={onNext} className="bg-syz-red text-white px-10 py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg uppercase">Siguiente</button>
      </div>
    </div>
  );
}
