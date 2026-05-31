import fs from 'node:fs';
import path from 'node:path';
import { ImageGenerationService } from './imageService';
import { PrismaClient } from '@prisma/client';
import { EditorialVisualAssetInspector } from '../editorial/visualAssetInspector';

const prisma = new PrismaClient();
const imageService = new ImageGenerationService();
const visualInspector = new EditorialVisualAssetInspector();

export async function processInlineImages(projectId: number, chapterPlanId: number, blocks: any[], updateProgress?: (msg: string) => void) {
  const assetsDir = path.join(process.cwd(), 'public', 'projects', projectId.toString(), 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const updatedBlocks = [];
  let inlineImageCounter = 0;

  for (const block of blocks) {
    if (block.type === 'inline_image' && block.image_prompt) {
      inlineImageCounter++;
      const imageName = `inline_${chapterPlanId}_${inlineImageCounter}.jpg`;
      const localPath = path.join(assetsDir, imageName);
      const urlPath = `/projects/${projectId}/assets/${imageName}`;

      if (updateProgress) {
        updateProgress(`Generando imagen contextual: ${block.caption || 'Ilustración'}`);
      }

      try {
        let attempts = 0;
        let isApproved = false;
        let lastReason = '';
        let currentPrompt = block.image_prompt;

        while (attempts < 3 && !isApproved) {
          attempts++;
          const safePrompt = `Text-less flat illustration. Do NOT include any letters, words, or typography. ${currentPrompt}`;
          const result = await imageService.generateImage(safePrompt, { orientation: 'landscape' });
          
          let base64ToCheck = '';
          if (result.base64) {
            base64ToCheck = result.base64;
            fs.writeFileSync(localPath, Buffer.from(result.base64, 'base64'));
          } else if (result.buffer) {
            base64ToCheck = result.buffer.toString('base64');
            fs.writeFileSync(localPath, result.buffer);
          }

          if (base64ToCheck) {
            if (updateProgress) updateProgress(`Auditando imagen ${inlineImageCounter} (Intento ${attempts}/3)...`);
            const inspection = await visualInspector.inspect(base64ToCheck, block.image_prompt, block.caption);
            
            if (inspection.status === 'APPROVED') {
              isApproved = true;
              block.localUrl = urlPath;
            } else {
              lastReason = inspection.reason;
              console.warn(`[VisualQA] Imagen rechazada: ${lastReason}. Reintentando...`);
              currentPrompt = `${block.image_prompt}. CORRECT THE FOLLOWING ERRORS: ${lastReason}`;
            }
          } else {
            break; // Fallo de generador de imagen, no intentar de nuevo
          }
        }

        if (!isApproved) {
          console.error(`[VisualQA] Fallo al generar imagen válida después de 3 intentos. Razón: ${lastReason}`);
          block.localUrl = urlPath; // Guarda la última generada aunque sea fea
          block.qualityNote = `Imagen marcada por auditoría visual: ${lastReason}`;
        }

      } catch (err: any) {
        console.error('[inlineImageProcessor] Error generating inline image:', err);
      }
    }
    updatedBlocks.push(block);
  }

  return updatedBlocks;
}
