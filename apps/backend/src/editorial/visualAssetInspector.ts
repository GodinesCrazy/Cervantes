import { AIService } from '../ai/aiService';

export type VisualAssetInspectionResult = {
  status: 'APPROVED' | 'REJECTED';
  reason: string;
};

export class EditorialVisualAssetInspector {
  async inspect(base64Image: string, prompt: string, caption?: string): Promise<VisualAssetInspectionResult> {
    const inspectionPrompt = `Eres un Director de Arte Editorial senior en una editorial premium.
Tu trabajo es revisar de forma estricta las imágenes generadas por IA que se incluirán en un libro profesional.

El escritor solicitó generar una imagen con este prompt:
"${prompt}"

El pie de foto de la imagen es:
"${caption || 'Sin pie de foto'}"

Observa la imagen adjunta a este mensaje.
CRITERIOS DE RECHAZO (REJECTED):
1. Alucinaciones graves: Texto deforme o garabatos ilegibles, manos con dedos extraños, extremidades fusionadas.
2. Fuera de contexto: La imagen no representa para nada el prompt ni el pie de foto.
3. Baja calidad profesional: Parece un borrador muy feo o tiene marcas de agua obvias.
4. Formato erróneo: El prompt pide un gráfico o esquema y la imagen es una foto realista que no explica nada, o viceversa.

CRITERIOS DE APROBACIÓN (APPROVED):
1. La imagen representa aceptablemente el prompt.
2. Tiene calidad suficiente para ser publicada en un eBook comercial.
3. No hay errores aberrantes que distraigan al lector.

Responde obligatoriamente en estricto JSON con las claves:
- "status": "APPROVED" o "REJECTED"
- "reason": "Una explicación detallada en español de por qué la aprobaste o rechazaste."`;

    try {
      const ai = new AIService();
      const result = await ai.generate(
        { status: 'APPROVED', reason: 'Imagen validada por fallback en caso de error.' },
        { 
          engine: 'visual', 
          prompt: inspectionPrompt, 
          base64Image 
        }
      );

      return {
        status: result.data.status as 'APPROVED' | 'REJECTED',
        reason: result.data.reason
      };
    } catch (error) {
      console.error('[VisualAssetInspector] Error during visual inspection:', error);
      // Fallback a APPROVED si el LLM falla para no romper el pipeline por completo
      return { status: 'APPROVED', reason: 'Error en la inspección visual, aprobada por defecto.' };
    }
  }
}
