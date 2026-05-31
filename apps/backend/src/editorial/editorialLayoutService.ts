import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../prisma';
import { EditorialAssetEngine } from './assetEngine';
import { EditorialHtmlRenderer } from './htmlRenderer';
import { EditorialLayoutEngine, type LayoutDocument } from './layoutEngine';
import { EditorialThemeEngine } from './themeEngine';
import { VisualQualityInspector, type VisualQualityReport } from './visualQualityInspector';
import { EditorialDepthInspector } from './depthInspector';
import { ProfessionalArtDirectionEngine, type ArtDirectionReport } from './professionalArtDirectionEngine';
import { EditorialRewriteEngine } from './editorialRewriteEngine';
import { PremiumPageTemplateEngine } from './premiumPageTemplateEngine';
import { ProfessionalEbookInspector, type ProfessionalEbookReport } from './professionalEbookInspector';
import { EditorialPageComposer, type PersistedPageState } from './pageComposer';
import { EditorialRhythmEngine, type EditorialRhythmReport } from './rhythmEngine';
import { EditorialRhythmInspector } from './rhythmInspector';
import { renderChapterToHtml } from './blockRenderer';
import { ChapterData } from './schema';

const root = path.resolve(__dirname, '../../../..');
const exportDir = path.join(root, 'storage', 'exports');

async function ensureDir() {
  await fs.mkdir(exportDir, { recursive: true });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export type RenderedEditorialLayout = {
  layout: LayoutDocument;
  html: string;
  htmlPath: string;
  report: VisualQualityReport;
  artDirection: ArtDirectionReport;
  professionalReport: ProfessionalEbookReport;
  rhythmReport: EditorialRhythmReport;
};

export class EditorialLayoutService {
  private readonly layoutEngine = new EditorialLayoutEngine();
  private readonly assetEngine = new EditorialAssetEngine(exportDir);
  private readonly renderer = new EditorialHtmlRenderer();
  private readonly inspector = new VisualQualityInspector();
  private readonly depthInspector = new EditorialDepthInspector();
  private readonly artDirection = new ProfessionalArtDirectionEngine();
  private readonly rewriteEngine = new EditorialRewriteEngine();
  private readonly templateEngine = new PremiumPageTemplateEngine();
  private readonly professionalInspector = new ProfessionalEbookInspector();
  private readonly pageComposer = new EditorialPageComposer();
  private readonly rhythmEngine = new EditorialRhythmEngine();
  private readonly rhythmInspector = new EditorialRhythmInspector();

  async assembleManuscript(projectId: number) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        manuscriptBlocks: { orderBy: { order: 'asc' } },
        chapterPlans: { orderBy: { order: 'asc' } },
        marketResearch: true,
        metadataPackage: true,
        visualBible: true,
      },
    });
    if (!project) throw new Error('Project not found');
    const title = project.metadataPackage?.commercialTitle || project.marketResearch?.recommendedTitle || project.name;
    const subtitle = project.metadataPackage?.subtitle || 'Guía premium práctica y visual';
    
    const parts: string[] = [];
    parts.push(`![Portada editorial](assets/cover.svg)\n\n# ${title}\n\n## ${subtitle}\n\n**Edición:** Premium Cervantes\n**Idioma principal:** Español\n**Declaración IA:** Contenido asistido por herramientas de IA, estructurado y revisado editorialmente.\n\n---`);

    parts.push(`# Front matter\n\n## Promesa editorial\n\nEste libro convierte una idea especializada en una experiencia de lectura clara, visual, aplicable y comercialmente publicable.\n\n## Para quién es\n\n${project.marketResearch?.audience || 'Lectores que buscan una guía práctica, confiable y visualmente cuidada.'}\n\n---`);

    const toc = project.chapterPlans.map((chapter) => `${chapter.chapterNumber}. ${chapter.title}`).join('\n');
    parts.push(`# Índice\n\n${toc}\n\n---`);
    parts.push(`# Tabla de decisión\n\n![Figura editorial](assets/figure-map.svg)\n\n---`);

    for (const block of project.manuscriptBlocks) {
      if (!block.content) continue;
      try {
        const parsed = JSON.parse(block.content) as ChapterData;
        parts.push(`# ${parsed.chapterTitle}`);
        if (parsed.objective) parts.push(`**Objetivo:** ${parsed.objective}`);
        if (parsed.opening) parts.push(parsed.opening);
        
        for (const b of parsed.blocks) {
          if (b.type === 'paragraph') parts.push(b.text);
          else if (b.type === 'checklist') {
            if (b.heading) parts.push(`## ${b.heading}`);
            b.items.forEach(item => parts.push(`- ${item}`));
          }
          else if (b.type === 'table') {
            if (b.heading) parts.push(`## ${b.heading}`);
            parts.push(`| ${b.columns.join(' | ')} |`);
            parts.push(`| ${b.columns.map(() => '---').join(' | ')} |`);
            b.rows.forEach(r => parts.push(`| ${r.join(' | ')} |`));
          }
          else if (b.type === 'expert_tip') {
            if (b.heading) parts.push(`### 💡 ${b.heading}`);
            parts.push(`> ${b.body}\n> *Fuente: ${b.source || 'N/A'}*`);
          }
          else if (b.type === 'case_study') {
            if (b.heading) parts.push(`## ${b.heading}`);
            parts.push(`**Situación:** ${b.situation}\n**Decisión:** ${b.decision}\n**Resultado:** ${b.result}`);
          }
          else if (b.type === 'exercise') {
            if (b.heading) parts.push(`## 🛠️ ${b.heading}`);
            parts.push(b.instructions);
            b.fields.forEach(f => parts.push(`- [ ] ${f}`));
          }
          else if (b.type === 'inline_image') {
            if (b.localUrl) {
              parts.push(`![Figura interior](${b.localUrl})\n*${b.caption || 'Ilustración'}*`);
            }
            // Si no hay imagen generada, omitimos el bloque visual para no imprimir prompts en inglés.
          }
        }
        
        parts.push(`## Resumen del Capítulo\n${parsed.summary}`);
        if (parsed.action_closing) {
          parts.push(`### Cierre Accionable`);
          parts.push(`- **Idea Clave:** ${parsed.action_closing.key_idea}`);
          parts.push(`- **Acción:** ${parsed.action_closing.today_action}`);
          parts.push(`- **Error común:** ${parsed.action_closing.common_error}`);
          parts.push(`- **Pregunta:** ${parsed.action_closing.follow_up_question}`);
        }
        
        parts.push(`---`);
      } catch {
        // Fallback: si el contenido no es JSON válido, forzamos un marcador de error claro
        // Esto será detectado inmediatamente por el schemaValidator o contentSanitizer
        // y provocará una reescritura automática por parte de la IA.
        parts.push(`# ${block.blockTitle} (Requiere Recuperación IA)`);
        parts.push(`> ⚠️ **Error de Estructura**: Este bloque falló la validación JSON. La IA lo regenerará automáticamente durante el control de calidad.`);
        parts.push(`\`\`\`json\n${String(block.content || '').trim()}\n\`\`\``);
        parts.push(`---`);
      }
    }



    return parts.join('\n\n');
  }

  async buildLayoutDocument(projectId: number, markdown?: string, preferredStyle?: string | null) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        idea: true,
        manuscriptBlocks: { orderBy: { order: 'asc' } },
        chapterPlans: { orderBy: { order: 'asc' } },
        marketResearch: true,
        metadataPackage: true,
        visualBible: true,
      },
    });
    if (!project) throw new Error('Project not found');
    const manuscript = markdown || (await this.assembleManuscript(projectId));
    const latest = await prisma.editorialLayout.findFirst({ where: { projectId }, orderBy: { createdAt: 'desc' } });
    const activeStyle = preferredStyle || latest?.activeStyle || latest?.themeKey;
    const direction = this.artDirection.choose(project, activeStyle);
    const rewrittenProject = {
      ...project,
      manuscriptBlocks: project.manuscriptBlocks.map((block) => ({
        ...block,
        content: this.rewriteEngine.rewriteBlock(block.blockTitle, block.content, project.name),
      })),
    };
    const baseLayout = this.layoutEngine.build(rewrittenProject, direction.theme || EditorialThemeEngine.fromVisualBible(project.visualBible), manuscript);
    const enhancedLayout = this.templateEngine.enhance(baseLayout);
    const rhythmApplied = this.rhythmEngine.apply(enhancedLayout).layout;
    const previousStates = this.parsePageStates(latest?.pageTemplates);
    if (previousStates.length) {
      rhythmApplied.pages = this.pageComposer.merge(rhythmApplied.pages, previousStates);
    }
    return rhythmApplied;
  }

  async renderProject(projectId: number, options: { assetBase?: string; persist?: boolean; themeKey?: string } = {}): Promise<RenderedEditorialLayout> {
    await ensureDir();
    const layout = await this.buildLayoutDocument(projectId, undefined, options.themeKey);
    await this.assetEngine.generate(layout);
    await this.applyVisualAssetReplacements(projectId, layout);
    await this.syncVisualAssets(projectId, layout);
    const html = this.renderer.render(layout, options.assetBase || 'assets');
    const htmlPath = path.join(exportDir, `${projectId}-${slugify(layout.title)}-editorial-preview.html`);
    await fs.writeFile(htmlPath, html, 'utf8');
    const report = await this.inspector.inspect(layout, html, htmlPath);
    const depthReport = this.depthInspector.inspect(layout);
    const rhythmReport = this.rhythmInspector.inspect(layout);
    const professionalReport = await this.professionalInspector.inspect(layout, html);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { idea: true, marketResearch: true, visualBible: true },
    });
    if (!project) throw new Error('Project not found');
    const artDirection = this.artDirection.choose(project, layout.theme.key);
    const pageStates = this.pageComposer.summarize(layout.pages);
    const pageApprovals = Object.fromEntries(pageStates.map((page) => [page.id, page.status]));
    const status = report.status === 'APPROVED' && professionalReport.status === 'APPROVED' && rhythmReport.status === 'APPROVED' ? 'APPROVED' : 'NEEDS_REVISION';
    const combinedReport = { ...report, status, professional: professionalReport, depth: depthReport, rhythm: rhythmReport } as VisualQualityReport;
    
    if (options.persist !== false) {
      await prisma.editorialLayout.create({
        data: {
          projectId,
          themeKey: layout.theme.key,
          activeStyle: layout.theme.key,
          pageTemplates: JSON.stringify(pageStates),
          renderedPages: JSON.stringify(pageStates),
          pageApprovals: JSON.stringify(pageApprovals),
          renderedHtmlPath: htmlPath,
          visualReport: JSON.stringify(combinedReport),
          editorialReport: JSON.stringify({ artDirection, professional: professionalReport, depth: depthReport, rhythm: rhythmReport }),
          status,
          lastRenderedAt: new Date(),
        },
      });
    }
    return { layout, html, htmlPath, report: combinedReport, artDirection, professionalReport, rhythmReport };
  }

  async latestReport(projectId: number) {
    const latest = await prisma.editorialLayout.findFirst({ where: { projectId }, orderBy: { createdAt: 'desc' } });
    if (!latest?.visualReport) return null;
    try {
      return JSON.parse(latest.visualReport) as VisualQualityReport;
    } catch {
      return null;
    }
  }

  async assetPath(projectId: number, assetName: string) {
    const role = assetName.replace(/\.[a-z0-9]+$/i, '');
    const rendered = await this.renderProject(projectId, { persist: false });
    const filePath = rendered.layout.assets[role];
    if (!filePath) throw new Error('Unsupported editorial asset');
    return filePath;
  }

  async artDirectionReport(projectId: number, preferredStyle?: string | null) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { idea: true, marketResearch: true, visualBible: true },
    });
    if (!project) throw new Error('Project not found');
    return this.artDirection.choose(project, preferredStyle);
  }

  async applyArtDirection(projectId: number, preferredStyle?: string | null) {
    const report = await this.artDirectionReport(projectId, preferredStyle);
    const rendered = await this.renderProject(projectId, { themeKey: report.styleKey, persist: true });
    return { ...report, layoutStatus: rendered.professionalReport.status, pages: rendered.layout.pages.length };
  }

  async rhythmReport(projectId: number) {
    const rendered = await this.renderProject(projectId, { persist: false });
    return rendered.rhythmReport;
  }

  async applyRhythm(projectId: number) {
    const rendered = await this.renderProject(projectId, { persist: true });
    return {
      status: rendered.rhythmReport.status,
      pages: rendered.layout.pages.length,
      report: rendered.rhythmReport,
      visualStatus: rendered.report.status,
    };
  }

  private parsePageStates(value?: string | null): PersistedPageState[] {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as PersistedPageState[]) : [];
    } catch {
      return [];
    }
  }

  private async applyVisualAssetReplacements(projectId: number, layout: LayoutDocument) {
    const assets = await prisma.visualAsset.findMany({ where: { projectId } });
    for (const asset of assets) {
      const role = asset.layoutRole || (asset.assetType === 'figure' ? 'figure-map' : asset.assetType);
      if (!role || !layout.assets[role]) continue;
      const replacement = this.parseReplacement(asset.replacementPath);
      if (!replacement?.filePath) continue;
      try {
        const stat = await fs.stat(replacement.filePath);
        if (stat.isFile() && stat.size > 256) {
          layout.assets[role] = replacement.filePath;
          const publicAssetDir = path.join(exportDir, 'assets');
          await fs.mkdir(publicAssetDir, { recursive: true });
          const ext = path.extname(replacement.filePath).toLowerCase() || '.png';
          await fs.copyFile(replacement.filePath, path.join(publicAssetDir, `${role}${ext}`));
        }
      } catch {
        // Keep the local SVG fallback generated by EditorialAssetEngine.
      }
    }
  }

  private parseReplacement(value?: string | null) {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as { filePath?: unknown };
      return typeof parsed.filePath === 'string' ? { filePath: parsed.filePath } : null;
    } catch {
      return { filePath: value };
    }
  }

  private async syncVisualAssets(projectId: number, layout: LayoutDocument) {
    const descriptors: Record<string, { assetType: string; name: string; description: string; pagePlacement: string }> = {
      cover: { assetType: 'cover', name: 'Portada frontal', description: 'Portada premium separada para KDP/Gumroad', pagePlacement: 'front-cover' },
      'chapter-opener': { assetType: 'chapter-opener', name: 'Apertura de capítulo', description: 'Lámina visual para inicio de capítulo', pagePlacement: 'chapter-start' },
      'figure-map': { assetType: 'figure', name: 'Mapa conceptual', description: 'Figura interna principal del método', pagePlacement: 'method-page' },
      separator: { assetType: 'separator', name: 'Separadores editoriales', description: 'Ornamentos y divisores visuales consistentes', pagePlacement: 'reading-pages' },
      icons: { assetType: 'icons', name: 'Iconografía editorial', description: 'Sistema de iconos para índice y resúmenes', pagePlacement: 'toc-and-summary' },
      worksheet: { assetType: 'worksheet', name: 'Worksheet imprimible', description: 'Hoja imprimible de ejercicios o checklist', pagePlacement: 'appendix' },
      mockup: { assetType: 'mockup', name: 'Mockup comercial', description: 'Imagen comercial para página de venta', pagePlacement: 'credits-package' },
    };
    for (const [role, filePath] of Object.entries(layout.assets)) {
      const descriptor = descriptors[role];
      if (!descriptor) continue;
      const existing = await prisma.visualAsset.findFirst({
        where: {
          projectId,
          OR: [{ layoutRole: role }, { assetType: descriptor.assetType }],
        },
      });
      const data = {
        ...descriptor,
        prompt: `SVG editorial local ${role} para tema ${layout.theme.key}`,
        filePath,
        layoutRole: role,
        themeKey: layout.theme.key,
        qualityStatus: 'APPROVED',
        status: 'APPROVED',
        approvalStatus: 'APPROVED',
        rights: 'SVG editorial local generado por Cervantes; editable y reemplazable antes de publicar.',
        approvedAt: new Date(),
      };
      if (existing) {
        await prisma.visualAsset.update({ where: { id: existing.id }, data });
      } else {
        await prisma.visualAsset.create({ data: { ...data, projectId, aiGenerated: true } });
      }
    }
  }
}
