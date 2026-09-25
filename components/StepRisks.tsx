
import React, { useState, useEffect } from 'react';
import { ATSData } from '../types';
import { suggestRisksForTask } from '../geminiService';

interface Props {
  data: ATSData;
  update: (d: Partial<ATSData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const RISK_CATEGORIES = [
  "Exposición a sustancias químicas", "Caídas desde alturas superiores a 1,5 mts", "Riesgo biológico", "Maquinaria pesada", "Espacios confinados", 
  "Superficies calientes", "Exposición a tensiones (Riesgo eléctrico)", "Ruido", "Manipulación de cargas", "Atmósferas peligrosas", 
  "Equipos en movimiento", "Caída de objetos", "Herramientas manuales", "Izaje de cargas", "Derrame / Fugas", "Incendio / Explosión"
];

export default function StepRisks({ data, update, onNext, onPrev }: Props) {
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [manualRisk, setManualRisk] = useState('');

  useEffect(() => {
    if (data.activity.taskDescription) {
      loadSuggestions();
    }
  }, []);

  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const suggestions = await suggestRisksForTask(data.activity.taskDescription);
      setAiSuggestions(suggestions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const toggleRisk = (risk: string) => {
    const newRisks = { ...data.risks };
    if (newRisks[risk]) {
      delete newRisks[risk];
    } else {
      newRisks[risk] = "Aplica";
    }
    update({ risks: newRisks });
  };

  const updateRiskDetail = (risk: string, detail: string) => {
    const newRisks = { ...data.risks, [risk]: detail };
    update({ risks: newRisks });
  };

  const addManualRisk = () => {
    if (manualRisk.trim()) {
      toggleRisk(manualRisk.trim());
      setManualRisk('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-syz-gray-x11 pb-2">
        <h2 className="text-title text-syz-red uppercase tracking-widest">Identificación de Riesgos</h2>
        <p className="text-[8pt] text-slate-500 font-bold uppercase italic">Seleccione los peligros presentes en el área de trabajo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {RISK_CATEGORIES.map(risk => (
              <div key={risk} className={`p-2 border-2 flex flex-col gap-1.5 transition-all rounded-lg ${data.risks[risk] ? 'bg-white border-syz-red shadow-lg scale-[1.01]' : 'bg-syz-light-gray border-slate-200'}`}>
                <div className="flex items-start justify-between">
                  <span className={`font-black uppercase text-[7.5pt] leading-tight flex-1 pr-2 ${data.risks[risk] ? 'text-syz-red' : 'text-slate-600'}`}>{risk}</span>
                  <button 
                    onClick={() => toggleRisk(risk)}
                    className={`w-5 h-5 border-2 rounded shrink-0 font-black flex items-center justify-center transition-colors ${data.risks[risk] ? 'bg-syz-red border-syz-red text-white' : 'bg-white border-slate-400'}`}>
                    {data.risks[risk] && '✓'}
                  </button>
                </div>
                {data.risks[risk] && (
                  <input 
                    type="text" 
                    className="w-full text-[7.5pt] !bg-white border-syz-red border-b border-t-0 border-x-0 !h-8 px-0 focus:ring-0 placeholder:italic" 
                    placeholder="Especifique detalles del peligro..."
                    autoFocus
                    value={data.risks[risk] === "Aplica" ? "" : data.risks[risk]} 
                    onChange={e => updateRiskDetail(risk, e.target.value)} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-slate-50 p-4 border-2 border-dashed border-slate-300 rounded-xl">
             <label className="text-[8pt] font-black uppercase block mb-2 text-slate-500">¿Otro riesgo específico no listado?</label>
             <div className="flex gap-2">
                <input type="text" className="flex-1 !bg-white border-slate-300" value={manualRisk} onChange={e => setManualRisk(e.target.value)} placeholder="Ej: Presencia de abejas, Terreno inclinado..." />
                <button onClick={addManualRisk} className="bg-syz-onyx text-white px-6 py-1 uppercase font-black text-[8pt] rounded-lg hover:bg-black transition-colors">Agregar</button>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-syz-jet p-6 border-l-4 border-syz-red text-syz-white lg:sticky lg:top-24 rounded-r-xl shadow-2xl">
            <h3 className="text-xs font-black text-syz-red uppercase mb-4 italic tracking-widest flex items-center gap-2">
              <span className="animate-pulse">●</span> Sugerencias de IA
            </h3>
            {loadingSuggestions ? (
              <div className="space-y-3">
                <div className="h-4 bg-syz-onyx animate-pulse rounded w-3/4"></div>
                <div className="h-4 bg-syz-onyx animate-pulse rounded w-1/2"></div>
                <div className="h-4 bg-syz-onyx animate-pulse rounded w-2/3"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {aiSuggestions.map(suggestion => (
                  <button 
                    key={suggestion}
                    onClick={() => toggleRisk(suggestion)}
                    className={`w-full p-2.5 border rounded-lg text-left text-[7.5pt] font-black transition-all flex items-center justify-between
                      ${data.risks[suggestion] ? 'bg-syz-red border-syz-red text-white' : 'bg-syz-onyx border-syz-onyx hover:bg-slate-800 text-syz-gray-x11'}`}>
                    <span className="flex-1">+ {suggestion}</span>
                    {data.risks[suggestion] && <span className="ml-2">✓</span>}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[7pt] mt-6 opacity-50 uppercase font-bold leading-tight border-t border-syz-onyx pt-4">
              La IA analiza su descripción del trabajo para recomendar peligros críticos del sector.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-syz-gray-x11">
        <button onClick={onPrev} className="text-syz-onyx font-black uppercase text-[9pt] hover:underline px-4 py-2">Anterior</button>
        <button onClick={onNext} className="bg-syz-red text-syz-white px-16 py-3 font-black uppercase border border-syz-onyx shadow-xl hover:bg-red-700 active:scale-95 transition-all rounded-lg">
          Continuar
        </button>
      </div>
    </div>
  );
}
