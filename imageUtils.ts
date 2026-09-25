/**
 * Utilidades para procesamiento optimizado de imágenes y documentos en el cliente
 * Evita bloqueos de memoria, cuota de localStorage excedida y asegura compatibilidad con Gemini Vision.
 */

export interface ProcessedFileResult {
  dataUrl?: string;
  name: string;
  type?: 'image' | 'pdf';
  error?: string;
}

export async function processUploadedFile(file: File): Promise<ProcessedFileResult> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  // Caso 1: Archivos Word (.doc, .docx)
  if (
    fileName.endsWith('.doc') || 
    fileName.endsWith('.docx') || 
    fileType.includes('word') || 
    fileType.includes('officedocument')
  ) {
    return {
      name: file.name,
      error: `"${file.name}" es un documento Word. Para que la IA lo analice, por favor expórtelo a PDF o tome una foto/captura de la sección relevante.`
    };
  }

  // Caso 2: Documentos PDF
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    if (file.size > 15 * 1024 * 1024) {
      return {
        name: file.name,
        error: `El archivo PDF "${file.name}" supera los 15MB. Por favor use un archivo más liviano o las páginas clave.`
      };
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      return {
        name: file.name,
        type: 'pdf',
        dataUrl
      };
    } catch {
      return {
        name: file.name,
        error: `No se pudo leer el archivo PDF "${file.name}".`
      };
    }
  }

  // Caso 3: Imágenes (JPG, PNG, WEBP, HEIC, etc.)
  if (fileType.startsWith('image/') || /\.(jpe?g|png|webp|bmp|heic|heif)$/i.test(fileName)) {
    try {
      const compressedDataUrl = await compressAndNormalizeImage(file, 1600, 0.85);
      return {
        name: file.name,
        type: 'image',
        dataUrl: compressedDataUrl
      };
    } catch {
      // Fallback a lectura directa si canvas falla
      try {
        const fallbackUrl = await readFileAsDataUrl(file);
        return {
          name: file.name,
          type: 'image',
          dataUrl: fallbackUrl
        };
      } catch {
        return {
          name: file.name,
          error: `Error al procesar la imagen "${file.name}".`
        };
      }
    }
  }

  return {
    name: file.name,
    error: `Formato de archivo no admitido ("${file.name}"). Utilice imágenes (JPG, PNG, WEBP) o documentos PDF.`
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function compressAndNormalizeImage(file: File, maxDimension = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Si no hay contexto 2d, fallback
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      // Fondo blanco para imágenes transparentes que se convertirán a jpeg
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const outputDataUrl = canvas.toDataURL(mimeType, quality);
      resolve(outputDataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo decodificar la imagen'));
    };

    img.src = objectUrl;
  });
}
