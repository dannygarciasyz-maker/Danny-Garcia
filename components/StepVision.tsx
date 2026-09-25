import React, { useState, useRef } from 'react';
import { ATSData } from '../types';
import { analyzeWorkspaceVision } from '../geminiService';
import { processUploadedFile } from '../imageUtils';

interface Props {
  data: ATSData;
  update: (d: Partial<ATSData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function StepVision({ data, update, onNext, onPrev }: Props) {
  const [loading, setLoading] = useState(false);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (filesList: FileList | File[]) => {
    const files = Array.from(filesList);
    if (files.length === 0) return;

    setProcessingFiles(true);
    setError(null);
    setInfoMessage(null);

    const validDataUrls: string[] = [];
    const errorsEncountered: string[] = [];

    for (const file of files) {
      try {
        const res = await processUploadedFile(file);
        if (res.error) {
          errorsEncountered.push(res.error);
        } else if (res.dataUrl) {
          validDataUrls.push(res.dataUrl);
        }
      } catch (err: any) {
        errorsEncountered.push(`Error al procesar "${file.name}": ${err?.message || 'Error desconocido'}`);
      }
    }

    if (validDataUrls.length > 0) {
      update({ photos: [...data.photos, ...validDataUrls] });
      setInfoMessage(`Se cargaron ${validDataUrls.length} archivo(s) correctamente y optimizados para IA.`);
    }

    if (errorsEncountered.length > 0) {
      setError(errorsEncountered.join(' | '));
    }

    setProcessingFiles(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      // Reset input value so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const startAnalysis = async () => {
    if (data.photos.length === 0) {
      setError("Por favor suba al menos una foto del área de trabajo o documento PDF para iniciar el análisis.");
      return;
    }
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const recommendations = await analyzeWorkspaceVision(
        data.photos, 
        data.activity.taskDescription || "Inspección de seguridad y evaluación de riesgos en sitio"
      );

      if (recommendations.length === 0) {
        setInfoMessage("La IA completó el análisis pero no detectó riesgos críticos en las imágenes proporcionadas. Puede añadir observaciones manuales.");
      } else {
        update({ aiRecommendations: recommendations });
        setInfoMessage(`¡Análisis completado con éxito! Se detectaron ${recommendations.length} hallazgo(s) de seguridad.`);
      }
    } catch (err: any) {
      console.error("Fallo de visión Gemini:", err);
      setError(err?.message || "Ocurrió un error al analizar las imágenes con la IA de Gemini. Asegúrese de que las imágenes muestren claramente el área de trabajo.");
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (idx: number) => {
    const newFiles = data.photos.filter((_, i) => i !== idx);
    update({ photos: newFiles });
  };

  const clearAllFiles = () => {
    if (window.confirm("¿Está seguro de eliminar todas las fotos y documentos adjuntos?")) {
      update({ photos: [] });
    }
  };

  const removeRecommendation = (id: string) => {
    const newRecs = data.aiRecommendations.filter(r => r.id !== id);
    update({ aiRecommendations: newRecs });
  };

  const isPDF = (base64: string) => base64.startsWith('data:application/pdf');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b-4 border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-black text-syz-jet uppercase tracking-tighter flex items-center gap-3">
            <span className="bg-syz-red p-2 rounded-xl text-white">IA</span> Visión & Documentos
          </h2>
          <p className="text-slate-500 font-bold italic">
            Cargue fotos del área de trabajo y el Plan de Trabajo (PDF) para inspección visual automatizada de riesgos.
          </p>
        </div>
        {data.photos.length > 0 && (
          <button
            onClick={clearAllFiles}
            className="text-[10px] font-black uppercase text-red-600 hover:text-red-800 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors self-start md:self-auto"
          >
            Limpiar Archivos ({data.photos.length})
          </button>
        )}
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-syz-red p-4 rounded-r-xl shadow-sm text-red-700 text-xs font-bold flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 text-syz-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 leading-relaxed">
            <p className="font-black uppercase mb-0.5">Atención:</p>
            {error}
          </div>
        </div>
      )}

      {infoMessage && (
        <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-r-xl shadow-sm text-green-800 text-xs font-bold flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <div className="flex-1">{infoMessage}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Column: Upload & Files */}
        <div className="space-y-6">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-6 transition-all text-center ${
              isDragging 
                ? 'border-syz-red bg-red-50/50 scale-[1.01]' 
                : 'border-slate-300 bg-white hover:border-syz-red shadow-sm'
            }`}
          >
            <div className="grid grid-cols-3 gap-3 mb-4">
              {/* Button: Galería / Fotos */}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="border border-slate-200 hover:border-syz-red p-4 rounded-2xl flex flex-col items-center justify-center bg-slate-50 hover:bg-white transition-all cursor-pointer group"
              >
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  ref={photoInputRef}
                  onChange={handleInputChange}
                  className="hidden"
                />
                <svg className="w-7 h-7 text-syz-red mb-1.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[10px] font-black uppercase text-slate-700">Subir Fotos</span>
                <span className="text-[8px] text-slate-400 font-bold">JPG, PNG, WEBP</span>
              </button>

              {/* Button: Tomar Foto con Cámara */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="border border-slate-200 hover:border-syz-jet p-4 rounded-2xl flex flex-col items-center justify-center bg-slate-50 hover:bg-white transition-all cursor-pointer group"
              >
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  onChange={handleInputChange}
                  className="hidden"
                />
                <svg className="w-7 h-7 text-syz-jet mb-1.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[10px] font-black uppercase text-slate-700">Tomar Foto</span>
                <span className="text-[8px] text-slate-400 font-bold">Cámara en Vivo</span>
              </button>

              {/* Button: PDF Plan de Trabajo */}
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="border border-slate-200 hover:border-syz-onyx p-4 rounded-2xl flex flex-col items-center justify-center bg-slate-50 hover:bg-white transition-all cursor-pointer group"
              >
                <input
                  type="file"
                  multiple
                  accept="application/pdf"
                  ref={docInputRef}
                  onChange={handleInputChange}
                  className="hidden"
                />
                <svg className="w-7 h-7 text-syz-onyx mb-1.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-[10px] font-black uppercase text-slate-700">Plan Trabajo</span>
                <span className="text-[8px] text-slate-400 font-bold">Documento PDF</span>
              </button>
            </div>

            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Arrastre y suelte sus imágenes o archivos PDF aquí
            </p>
          </div>

          {/* Processing Indicator */}
          {processingFiles && (
            <div className="flex items-center justify-center gap-2 p-3 bg-slate-100 rounded-xl text-slate-600 font-bold text-xs animate-pulse">
              <svg className="w-4 h-4 animate-spin text-syz-red" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Optimizando y preparando imágenes para IA...</span>
            </div>
          )}

          {/* Gallery Thumbnails */}
          {data.photos.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase text-slate-500">
                  Archivos Cargados ({data.photos.length})
                </span>
                <span className="text-[9px] font-bold text-slate-400 italic">
                  Haga clic para ampliar
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
                {data.photos.map((p, i) => (
                  <div 
                    key={i} 
                    className="relative aspect-square group bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-syz-red shadow-sm transition-all cursor-pointer"
                  >
                    {isPDF(p) ? (
                      <div 
                        onClick={() => window.open(p, '_blank')}
                        className="flex flex-col items-center justify-center h-full p-2 gap-1 text-center bg-red-50/50"
                      >
                        <svg className="w-8 h-8 text-syz-red" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.586 5L14 2.414A2 2 0 0013 2H9z" />
                        </svg>
                        <span className="text-[8px] font-black uppercase text-slate-700 leading-tight">PDF Adjunto</span>
                      </div>
                    ) : (
                      <img 
                        src={p} 
                        alt={`Área ${i + 1}`}
                        onClick={() => setPreviewModalImg(p)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                    )}
                    
                    {/* Delete file button */}
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }} 
                      className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-80 group-hover:opacity-100 transition-all shadow-md z-10"
                      title="Eliminar archivo"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button: Execute AI Analysis */}
          <button 
            type="button"
            onClick={startAnalysis} 
            disabled={loading || processingFiles || data.photos.length === 0} 
            className={`w-full py-5 rounded-2xl font-black uppercase text-base sm:text-lg transition-all shadow-xl flex items-center justify-center gap-3 ${
              loading || processingFiles || data.photos.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-syz-jet text-white hover:bg-black active:scale-[0.99]'
            }`}
          >
            {loading ? (
              <>
                <svg className="w-6 h-6 animate-spin text-syz-red" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Analizando con Visión IA Gemini...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-syz-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Ejecutar Análisis Visual IA</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: AI Results */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-sm font-black text-syz-onyx uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-syz-red rounded-full"></span>
              Hallazgos de la Inspección Visual ({data.aiRecommendations.length})
            </h3>
            {data.aiRecommendations.length > 0 && (
              <span className="text-[9px] font-bold text-slate-400 uppercase">
                Marque para validar
              </span>
            )}
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {data.aiRecommendations.map(rec => (
              <div 
                key={rec.id} 
                className={`p-4 rounded-2xl border-2 transition-all relative group ${
                  rec.acknowledged 
                    ? 'bg-emerald-50/50 border-emerald-200' 
                    : 'bg-white border-syz-red shadow-sm'
                }`}
              >
                {/* Delete recommendation button */}
                <button 
                  type="button"
                  onClick={() => removeRecommendation(rec.id)}
                  className="absolute -top-2 -right-2 bg-syz-onyx text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-syz-red z-20"
                  title="Descartar este hallazgo"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                        rec.severity === 'Crítica' || rec.severity === 'Alta'
                          ? 'bg-syz-red text-white'
                          : 'bg-syz-jet text-white'
                      }`}>
                        {rec.severity}
                      </span>
                      <span className="text-[8px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                        {rec.category}
                      </span>
                    </div>

                    <h4 className="text-[10pt] font-black text-syz-jet uppercase leading-snug mb-1">
                      {rec.risk}
                    </h4>
                    
                    <p className="text-[8.5pt] text-slate-700 font-semibold italic bg-slate-50 p-2 rounded-lg border border-slate-100 mb-1.5">
                      Medida de Control: {rec.controlMeasure}
                    </p>
                    
                    <p className="text-[7.5pt] text-slate-500 font-bold uppercase flex items-center gap-1">
                      <span className="text-syz-red font-black">Ref. Normativa:</span> {rec.colombianRegulation}
                    </p>
                  </div>

                  <label className="flex flex-col items-center gap-1 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={rec.acknowledged} 
                      onChange={() => update({
                        aiRecommendations: data.aiRecommendations.map(r => 
                          r.id === rec.id ? { ...r, acknowledged: !r.acknowledged } : r
                        )
                      })} 
                      className="w-7 h-7 rounded border-slate-300 text-syz-red focus:ring-syz-red cursor-pointer" 
                    />
                    <span className="text-[7px] font-bold uppercase text-slate-400">
                      {rec.acknowledged ? 'Validado' : 'Validar'}
                    </span>
                  </label>
                </div>
              </div>
            ))}

            {data.aiRecommendations.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-400 font-black uppercase text-xs">
                  Sin hallazgos pendientes
                </p>
                <p className="text-slate-400 text-[9px] mt-1 font-bold">
                  Cargue las fotos del sitio de trabajo y presione "Ejecutar Análisis Visual IA"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enlarged Image Preview Modal */}
      {previewModalImg && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewModalImg(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white p-2 rounded-2xl shadow-2xl overflow-hidden">
            <button 
              onClick={() => setPreviewModalImg(null)}
              className="absolute top-4 right-4 bg-syz-jet text-white rounded-full p-2 hover:bg-syz-red transition-colors z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={previewModalImg} 
              alt="Vista previa ampliada" 
              className="max-h-[85vh] w-auto mx-auto object-contain rounded-xl" 
            />
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-10 border-t-4 border-slate-50">
        <button 
          type="button"
          onClick={onPrev} 
          className="text-slate-500 hover:text-syz-jet font-black uppercase text-xs px-6 py-3 hover:bg-slate-100 rounded-xl transition-all"
        >
          Atrás
        </button>
        <button 
          type="button"
          onClick={onNext} 
          className="bg-syz-red hover:bg-red-700 active:scale-95 text-white px-12 py-4 rounded-2xl font-black text-lg uppercase shadow-xl transition-all"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
