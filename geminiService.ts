import { AIRiskAnalysis, TaskStep } from "./types";

export const analyzeWorkspaceVision = async (photosBase64: string[], task: string): Promise<AIRiskAnalysis[]> => {
  if (!photosBase64 || photosBase64.length === 0) {
    throw new Error("Debe proporcionar al menos una foto o documento.");
  }

  const response = await fetch("/api/gemini/vision-analysis", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      photos: photosBase64,
      task: task || "",
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `Error ${response.status}: No se pudo completar el análisis de visión.`);
  }

  return result.recommendations || [];
};

export const generateTaskAnalysis = async (task: string): Promise<TaskStep[]> => {
  try {
    const response = await fetch("/api/gemini/task-analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task: task || "" }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.warn("Fallo al generar desglose de tarea:", result.error);
      return [];
    }
    return result.steps || [];
  } catch (e) {
    console.error("Error en generateTaskAnalysis:", e);
    return [];
  }
};

export const suggestRisksForTask = async (task: string): Promise<string[]> => {
  try {
    const response = await fetch("/api/gemini/suggest-risks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task: task || "" }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.warn("Fallo al sugerir riesgos:", result.error);
      return [];
    }
    return result.risks || [];
  } catch (e) {
    console.error("Error en suggestRisksForTask:", e);
    return [];
  }
};

export const suggestControlsForTask = async (task: string): Promise<{ epp: string[]; other: string[] }> => {
  try {
    const response = await fetch("/api/gemini/suggest-controls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task: task || "" }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.warn("Fallo al sugerir controles:", result.error);
      return { epp: [], other: [] };
    }
    return {
      epp: result.epp || [],
      other: result.other || [],
    };
  } catch (e) {
    console.error("Error en suggestControlsForTask:", e);
    return { epp: [], other: [] };
  }
};
