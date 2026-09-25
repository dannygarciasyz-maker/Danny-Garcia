import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MODELS_PRIORITY = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('La clave GEMINI_API_KEY no está configurada en las variables de entorno.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function callGeminiWithFallback(params: {
  contents: any;
  config?: any;
}) {
  const ai = getGenAI();
  let lastError: any = null;

  for (const model of MODELS_PRIORITY) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`Aviso: Modelo ${model} falló o no disponible (${err?.message || err}). Probando siguiente...`);
    }
  }

  throw lastError || new Error('No se pudo obtener respuesta de los modelos de Gemini.');
}

function parseBase64Part(raw: string): { data: string; mimeType: string } | null {
  if (!raw || typeof raw !== 'string') return null;

  const match = raw.match(/^data:([a-zA-Z0-9\/+-.]+);base64,(.+)$/);
  if (match) {
    let mime = match[1].toLowerCase();
    if (mime === 'image/jpg') mime = 'image/jpeg';
    const data = match[2].trim();
    return { data, mimeType: mime };
  }

  // Si ya es base64 puro sin encabezado de Data URL
  return {
    data: raw.trim(),
    mimeType: 'image/jpeg',
  };
}

async function startServer() {
  const app = express();

  // Aumentar límites para soportar imágenes en Base64
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Ruta de comprobación de salud
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 1. Análisis de Visión de Imágenes y Documentos (PDF)
  app.post('/api/gemini/vision-analysis', async (req, res) => {
    try {
      const { photos, task } = req.body;

      if (!Array.isArray(photos) || photos.length === 0) {
        return res.status(400).json({
          error: 'Debe proporcionar al menos una foto o documento para el análisis de visión.',
        });
      }

      const validParts: Array<{ inlineData: { data: string; mimeType: string } }> = [];
      for (const item of photos) {
        const parsed = parseBase64Part(item);
        if (parsed && parsed.data) {
          // Asegurar que sea imagen o PDF admitido por Gemini
          if (parsed.mimeType.startsWith('image/') || parsed.mimeType === 'application/pdf') {
            validParts.push({
              inlineData: {
                data: parsed.data,
                mimeType: parsed.mimeType,
              },
            });
          }
        }
      }

      if (validParts.length === 0) {
        return res.status(400).json({
          error: 'No se encontraron imágenes o documentos PDF válidos en el formato requerido.',
        });
      }

      const taskContext = task && task.trim() 
        ? `Se va a ejecutar la tarea: "${task.trim()}".` 
        : 'Inspección general de seguridad industrial y análisis de riesgos en el entorno de trabajo.';

      const prompt = `
        ACTÚA COMO: Director Senior de Gestión de Riesgos y Seguridad y Salud en el Trabajo (HSE/SST) en Colombia.
        CONTEXTO DE LA OPERACIÓN: ${taskContext}
        
        INSTRUCCIÓN DE INSPECCIÓN:
        1. Analiza minuciosamente cada una de las fotos del entorno real y los documentos adjuntos (Plan de Trabajo / Procedimiento de Trabajo Seguro).
        2. Identifica todos los peligros visibles, actos subestándar y condiciones inseguras (e.g., trabajos en alturas sin arnés o línea de vida, riesgo eléctrico o cables expuestos, falta de cascos/gafas/guantes/botas, desorden locativo, superficies resbalosas o desniveles, espacios confinados, izaje de cargas, herramientas inadecuadas o defectuosas).
        3. Para cada peligro encontrado, define la medida de control correctiva/preventiva obligatoria y cita la normativa colombiana específica aplicable (Res. 4272/2021 de trabajo en alturas, Res. 5018/2019 de riesgo eléctrico, Dec. 1072/2015, Guía GTC 45, etc.).
        4. Clasifica la severidad con criterio técnico (Baja, Media, Alta, Crítica).
      `;

      const response = await callGeminiWithFallback({
        contents: [
          ...validParts,
          { text: prompt },
        ],
        config: {
          systemInstruction: 'Eres un experto auditor HSE en Colombia. Devuelve un análisis riguroso y estructurado en JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                risk: {
                  type: Type.STRING,
                  description: 'Descripción precisa del peligro identificado en las imágenes o documentos.',
                },
                category: {
                  type: Type.STRING,
                  description: 'Categoría del riesgo (Alturas, Eléctrico, Locativo, Químico, Mecánico, Biológico, etc.).',
                },
                controlMeasure: {
                  type: Type.STRING,
                  description: 'Medida de control y prevención obligatoria a implementar antes de iniciar.',
                },
                colombianRegulation: {
                  type: Type.STRING,
                  description: 'Artículo y Norma Colombiana aplicable (e.g. Resolución 4272 de 2021 Art. 21).',
                },
                severity: {
                  type: Type.STRING,
                  enum: ['Baja', 'Media', 'Alta', 'Crítica'],
                  description: 'Nivel de severidad técnica del riesgo.',
                },
              },
              required: ['risk', 'category', 'controlMeasure', 'colombianRegulation', 'severity'],
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '[]');
      const recommendations = parsed.map((item: any, idx: number) => ({
        ...item,
        id: `ai-rec-${Date.now()}-${idx}`,
        acknowledged: false,
      }));

      return res.json({ recommendations });
    } catch (error: any) {
      console.error('Error en /api/gemini/vision-analysis:', error);
      return res.status(500).json({
        error: error.message || 'Error al procesar el análisis de visión con IA.',
      });
    }
  });

  // 2. Desglose de Análisis de Trabajo Seguro (Paso a Paso)
  app.post('/api/gemini/task-analysis', async (req, res) => {
    try {
      const { task } = req.body;
      const taskText = task && task.trim() ? task.trim() : 'Mantenimiento y operaciones técnicas';

      const prompt = `Desglosa la tarea "${taskText}" en pasos lógicos y secuenciales de seguridad para un Análisis de Trabajo Seguro (ATS) en Colombia según la Guía GTC 45 y el Decreto 1072 de 2015. Devuelve JSON con lista de pasos, peligro asociado a cada paso y su medida de control específica.`;

      const response = await callGeminiWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                step: { type: Type.STRING, description: 'Paso o secuencia de la actividad' },
                risk: { type: Type.STRING, description: 'Peligro o riesgo potencial asociado al paso' },
                control: { type: Type.STRING, description: 'Medida de control y prevención aplicable' },
              },
              required: ['step', 'risk', 'control'],
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '[]');
      const steps = parsed.map((item: any) => ({ ...item, acknowledged: false }));
      return res.json({ steps });
    } catch (error: any) {
      console.error('Error en /api/gemini/task-analysis:', error);
      return res.status(500).json({
        error: error.message || 'Error al generar desglose de la tarea.',
      });
    }
  });

  // 3. Sugerencia de Riesgos para la Actividad
  app.post('/api/gemini/suggest-risks', async (req, res) => {
    try {
      const { task } = req.body;
      const taskText = task && task.trim() ? task.trim() : 'Actividad operativa industrial';

      const prompt = `Sugiere entre 5 y 8 riesgos y peligros laborales críticos específicos para: "${taskText}" en Colombia. Devuelve un array JSON de strings con nombres claros y directos.`;

      const response = await callGeminiWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      });

      const risks = JSON.parse(response.text || '[]');
      return res.json({ risks });
    } catch (error: any) {
      console.error('Error en /api/gemini/suggest-risks:', error);
      return res.status(500).json({
        error: error.message || 'Error al sugerir riesgos.',
      });
    }
  });

  // 4. Sugerencia de Controles y EPP para la Actividad
  app.post('/api/gemini/suggest-controls', async (req, res) => {
    try {
      const { task } = req.body;
      const taskText = task && task.trim() ? task.trim() : 'Actividad operativa industrial';

      const prompt = `Sugiere las medidas de control y Elementos de Protección Personal (EPP) requeridos para la tarea: "${taskText}" en Colombia. Devuelve JSON con objeto epp (array de strings) y other (array de controles adicionales, permisos, bloqueos LOTO, monitoreo).`;

      const response = await callGeminiWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              epp: { type: Type.ARRAY, items: { type: Type.STRING } },
              other: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['epp', 'other'],
          },
        },
      });

      const result = JSON.parse(response.text || '{"epp":[],"other":[]}');
      return res.json(result);
    } catch (error: any) {
      console.error('Error en /api/gemini/suggest-controls:', error);
      return res.status(500).json({
        error: error.message || 'Error al sugerir controles.',
      });
    }
  });

  // Integración de Vite Middleware para Frontend en desarrollo o producción
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ATSYZ Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
