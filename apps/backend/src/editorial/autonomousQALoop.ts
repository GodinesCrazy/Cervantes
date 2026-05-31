import { prisma } from '../prisma';
import { AIOrchestrator } from '../ai/aiOrchestrator';
import { EditorialLayoutService } from './editorialLayoutService';
import { inspectManuscript, upsertGate } from '../services/qualityService';
import { validateChapterSchema } from '../services/validators/schemaValidator';
import { auditFoodSafety } from '../services/validators/foodSafetyGuard';
import { processInlineImages } from '../ai/inlineImageProcessor';

const MAX_RETRIES = 3;

export class AutonomousQALoopService {
  private ai = new AIOrchestrator();
  private layoutService = new EditorialLayoutService();

  /**
   * Ejecuta el control de calidad en etapas previas (per-stage).
   * Intenta corregir automáticamente el bloque si la IA comete un error grave.
   */
  async runStageQA(projectId: number, blockId: number, blockTitle: string, originalContent: string): Promise<string> {
    let currentContent = originalContent;
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      // 1. Evaluar calidad del bloque (Regex/Estructural)
      const report = inspectManuscript(currentContent);
      let combinedIssues = [...report.issues];

      // 1.5. Validación estricta del JSON Schema
      const schemaValidation = validateChapterSchema(currentContent);
      if (!schemaValidation.isValid) {
        combinedIssues.push(`Error crítico de estructura JSON: ${schemaValidation.error}`);
      }

      // 1.6. Guardia de Seguridad Alimentaria
      const safetyAudit = auditFoodSafety(currentContent);
      if (!safetyAudit.isSafe) {
        combinedIssues.push(...safetyAudit.errors);
      }

      // 2. Evaluar Calidad Editorial Semántica (Humana)
      if (report.status === 'APPROVED') {
        const auditPrompt = `Evalúa el siguiente capítulo para detectar si suena robótico, generado por IA (clichés como 'En resumen', 'En el tapiz de la vida', 'Es crucial notar', listas monótonas), o si tiene falta de consistencia narrativa y calidad editorial. 
        Si el texto suena completamente natural, humano y premium, responde EXACTAMENTE con la palabra: APPROVED. 
        Si detectas defectos de escritura o tono robótico, responde SOLO con una lista de viñetas (bullet points) detallando los problemas estilísticos detectados. No agregues introducciones.`;
        
        const auditResult = await this.ai.run('audit', { content: currentContent }, auditPrompt);
        
        if (!auditResult.error) {
           const auditText = typeof auditResult.data === 'string' ? auditResult.data : JSON.stringify(auditResult.data);
           if (!auditText.includes('APPROVED') && auditText.length > 10) {
             combinedIssues.push('Falla Semántica (Tono/IA): ' + auditText.slice(0, 200) + '...');
           }
        }
      }

      if (combinedIssues.length === 0) {
        return currentContent;
      }

      // 3. Si falla, usar AIOrchestrator para arreglarlo basándose en todos los issues (Estructurales + Semánticos)
      attempts++;
      const correctionPrompt = `El siguiente capítulo ("${blockTitle}") tiene errores editoriales graves que debes corregir de inmediato:\nErrores detectados:\n- ${combinedIssues.join('\n- ')}\n\nReescribe el contenido para resolver TODOS estos errores. Asegúrate de que la escritura sea humana, dinámica, libre de clichés de IA y estructurada correctamente. \n\nDEBES DEVOLVER EXCLUSIVAMENTE UN JSON VÁLIDO CON LA SIGUIENTE ESTRUCTURA ESTRICTA:\n{ "blocks": [ { "type": "paragraph" | "inline_image", "content": "..." } ], "summary": "...", "action_closing": { "key_idea": "...", "today_action": "...", "common_error": "...", "follow_up_question": "..." } }\n\nEntrega solo el JSON válido sin markdown ni introducciones. Manten la estructura requerida.`;
      
      const result = await this.ai.run('editorial-rewrite', { content: currentContent }, correctionPrompt);
      if (!result.error && typeof result.data === 'object') {
        currentContent = JSON.stringify(result.data);
      } else if (!result.error && typeof result.data === 'string') {
        currentContent = result.data;
      } else {
        // Fallback o error severo
        break;
      }
    }

    return currentContent;
  }

  /**
   * Ejecuta el QA final del Layout ensamblado.
   * Modifica los bloques o los assets si el Inspector Final los rechaza.
   */
  async runFinalQA(projectId: number, themeKey?: string) {
    let attempts = 0;

    // Actualizamos el status en PhaseGate a IN_AUTONOMOUS_LOOP
    await upsertGate(projectId, 'export', { generationStatus: 'GENERATED', approvalStatus: 'PENDING' }, 'Iniciando Auto-QA Final');

    while (attempts < MAX_RETRIES) {
      // 1. Construir y renderizar
      const rendered = await this.layoutService.renderProject(projectId, { 
        persist: true, 
        themeKey, 
        assetBase: `/api/projects/${projectId}/assets` 
      });
      
      if (rendered.report.status === 'APPROVED') {
        await upsertGate(projectId, 'export', { approvalStatus: 'APPROVED' }, 'Auto-QA superado sin errores.');
        return rendered;
      }

      // 2. Si falla, intentar arreglar
      attempts++;
      const issues = rendered.professionalReport.issues || [];
      const project = await prisma.project.findUnique({ where: { id: projectId }, include: { manuscriptBlocks: true } });
      
      if (!project) break;

      // Acciones correctivas:
      // Exceso de texto -> Comprimir bloques muy largos
      if (issues.some(i => i.includes('demasiado texto corrido') || i.includes('muros de texto'))) {
        for (const block of project.manuscriptBlocks) {
          if ((block.wordCount || 0) > 600) {
            const prompt = 'Este bloque de texto es muy extenso y denso. Reescribe el contenido dividiéndolo, usando listas (bullet points) y haciéndolo más conciso y directo para el lector, sin perder valor informativo.\n\nDEBES DEVOLVER EXCLUSIVAMENTE UN JSON VÁLIDO CON LA SIGUIENTE ESTRUCTURA ESTRICTA:\n{ "blocks": [ { "type": "paragraph" | "inline_image", "content": "..." } ], "summary": "...", "action_closing": { "key_idea": "...", "today_action": "...", "common_error": "...", "follow_up_question": "..." } }\n\nEntrega solo el JSON válido sin markdown ni introducciones.';
            const result = await this.ai.run('editorial-rewrite', { content: block.content }, prompt);
            if (!result.error) {
              await prisma.manuscriptBlock.update({
                where: { id: block.id },
                data: { content: typeof result.data === 'string' ? result.data : JSON.stringify(result.data) }
              });
            }
          }
        }
      }

      // Markdown Leak -> Limpiar markdown expuesto
      if (issues.some(i => i.includes('Markdown') || i.includes('placeholder'))) {
        for (const block of project.manuscriptBlocks) {
          if (block.content && (block.content.includes('**') || block.content.includes('lorem ipsum'))) {
             const prompt = 'Elimina cualquier marca de formato Markdown (asteriscos, numerales, etc.) y cualquier frase como "lorem ipsum" o "Claro, aquí tienes el capítulo". Deja el contenido completamente limpio y profesional.\n\nDEBES DEVOLVER EXCLUSIVAMENTE UN JSON VÁLIDO CON LA SIGUIENTE ESTRUCTURA ESTRICTA:\n{ "blocks": [ { "type": "paragraph" | "inline_image", "content": "..." } ], "summary": "...", "action_closing": { "key_idea": "...", "today_action": "...", "common_error": "...", "follow_up_question": "..." } }\n\nEntrega solo el JSON válido sin markdown ni introducciones.';
             const result = await this.ai.run('editorial-rewrite', { content: block.content }, prompt);
             if (!result.error) {
                await prisma.manuscriptBlock.update({
                  where: { id: block.id },
                  data: { content: typeof result.data === 'string' ? result.data : JSON.stringify(result.data) }
                });
             }
          }
        }
      }

      // Reparar legacy blocks rotos (JSON inválido en DB)
      for (const block of project.manuscriptBlocks) {
        let isBroken = false;
        if (!block.content || !String(block.content).trim().startsWith('{')) {
          isBroken = true;
        } else {
          try {
            JSON.parse(String(block.content));
          } catch (e) {
            isBroken = true;
          }
        }
        if (isBroken) {
          console.log(`[AutoQA] Detectado bloque legacy roto ID: ${block.id}. Forzando runStageQA...`);
          const fixedContent = await this.runStageQA(projectId, block.id, block.blockTitle, String(block.content));
          await prisma.manuscriptBlock.update({
            where: { id: block.id },
            data: { content: fixedContent }
          });
        }
      }


      // Regeneración de imágenes caídas (Inline Images sin localUrl)
      let regeneratedAnyImage = false;
      for (const block of project.manuscriptBlocks) {
        if (block.content && block.content.includes('"inline_image"')) {
          try {
            const parsed = JSON.parse(block.content);
            const hasMissingImages = parsed.blocks?.some((b: any) => b.type === 'inline_image' && !b.localUrl);
            if (hasMissingImages) {
              const updatedBlocks = await processInlineImages(projectId, block.id, parsed.blocks);
              parsed.blocks = updatedBlocks;
              await prisma.manuscriptBlock.update({
                where: { id: block.id },
                data: { content: JSON.stringify(parsed) }
              });
              regeneratedAnyImage = true;
            }
          } catch (e) {}
        }
      }
      
      if (regeneratedAnyImage) {
        // Continue the loop so the layout is re-rendered with the new images
        continue;
      }
      
      // Si llegamos aquí, intentará renderizar en la siguiente iteración del loop
    }

    // Si salimos del loop sin aprobar
    await upsertGate(projectId, 'export', { approvalStatus: 'NEEDS_REVISION' }, 'Auto-QA finalizó pero requiere revisión manual.');
    return this.layoutService.renderProject(projectId, { 
      persist: true, 
      themeKey,
      assetBase: `/api/projects/${projectId}/assets` 
    });
  }
}
