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
    const subtitle = project.metadataPackage?.subtitle || 'Guia premium practica y visual';
    const toc = project.chapterPlans.map((chapter) => `${chapter.chapterNumber}. ${chapter.title}`).join('\n');
    const body = project.manuscriptBlocks
      .map((block) => this.rewriteEngine.rewriteBlock(block.blockTitle, block.content, project.name))
      .join('\n\n---\n\n');
    return this.rewriteEngine.rewriteMarkdown(`![Portada editorial](assets/cover.svg)

# ${title}

## ${subtitle}

**Edicion:** Premium Cervantes
**Idioma principal:** Espanol
**Declaracion IA:** Contenido asistido por herramientas de IA, estructurado y revisado editorialmente.

---

# Front matter

## Promesa editorial

Este libro convierte una idea especializada en una experiencia de lectura clara, visual, aplicable y comercialmente publicable.

## Para quien es

${project.marketResearch?.audience || 'Lectores que buscan una guia practica, confiable y visualmente cuidada.'}

---

# Indice

${toc}

---

# Tabla de decisión

![Figura editorial](assets/figure-map.svg)

---

${body}

---

# Apendice A: Checklist editorial

| Area | Criterio premium | Estado esperado |
|---|---|---|
| Estructura | Front matter, capitulos, ejercicios y apendices | Completo |
| Visual | Portada, figuras, tablas, worksheets y jerarquia | Completo |
| Comercial | Titulo sugerido, promesa, metadata y precio | Revisado |
| Compliance | Declaracion IA y claims acotados | Revisado |

# Apendice B: Resumen en ingles

This ebook is designed as a premium practical guide with a clear method, visual support, exercises, and publishing-ready metadata.

# Creditos visuales

Assets SVG generados localmente por Cervantes como elementos editables y reemplazables.
`);
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
    const previousStates = this.parsePageStates(latest?.pageTemplates);
    if (previousStates.length) {
      enhancedLayout.pages = this.pageComposer.merge(enhancedLayout.pages, previousStates);
    }
    return enhancedLayout;
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
    const professionalReport = await this.professionalInspector.inspect(layout, html);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { idea: true, marketResearch: true, visualBible: true },
    });
    if (!project) throw new Error('Project not found');
    const artDirection = this.artDirection.choose(project, layout.theme.key);
    const pageStates = this.pageComposer.summarize(layout.pages);
    const pageApprovals = Object.fromEntries(pageStates.map((page) => [page.id, page.status]));
    const status = report.status === 'APPROVED' && depthReport.status === 'APPROVED' && professionalReport.status === 'APPROVED' ? 'APPROVED' : 'NEEDS_REVISION';
    const combinedReport = { ...report, status, professional: professionalReport, depth: depthReport } as VisualQualityReport;
    
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
          editorialReport: JSON.stringify({ artDirection, professional: professionalReport, depth: depthReport }),
          status,
          lastRenderedAt: new Date(),
        },
      });
    }
    return { layout, html, htmlPath, report: combinedReport, artDirection, professionalReport };
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
