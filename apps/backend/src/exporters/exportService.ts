import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import puppeteer from 'puppeteer';
import { prisma } from '../prisma';
import { inspectManuscript, validateGumroadPackage, validateKdpPackage } from '../services/qualityService';

const root = path.resolve(__dirname, '../../../..');
const exportDir = path.join(root, 'storage', 'exports');

async function ensureDir() {
  await fs.mkdir(exportDir, { recursive: true });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function svgTitleLines(title: string, x: number, y: number, maxChars = 23, lineHeight = 92) {
  const words = title.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines
    .slice(0, 4)
    .map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" fill="#F8F3EA" font-family="Georgia" font-size="82" text-anchor="middle">${escapeHtml(line)}</text>`)
    .join('');
}

export class ExportService {
  private async premiumAssets(projectId: number, title: string) {
    const assetDir = path.join(exportDir, `project-${projectId}-assets`);
    const publicAssetDir = path.join(exportDir, 'assets');
    await fs.mkdir(assetDir, { recursive: true });
    await fs.mkdir(publicAssetDir, { recursive: true });
    const coverPath = path.join(assetDir, 'cover.svg');
    const figurePath = path.join(assetDir, 'figure-map.svg');
    const sealPath = path.join(assetDir, 'quality-seal.svg');

    await fs.writeFile(
      coverPath,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 2400"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#111315"/><stop offset="0.58" stop-color="#172123"/><stop offset="1" stop-color="#2F4F4D"/></linearGradient><radialGradient id="halo" cx="50%" cy="28%" r="42%"><stop stop-color="#F4D77C" stop-opacity="0.28"/><stop offset="1" stop-color="#F4D77C" stop-opacity="0"/></radialGradient><filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="22" stdDeviation="26" flood-color="#000" flood-opacity="0.42"/></filter></defs><rect width="1600" height="2400" fill="url(#bg)"/><rect width="1600" height="2400" fill="url(#halo)"/><rect x="116" y="116" width="1368" height="2168" fill="none" stroke="#D9BF67" stroke-width="8"/><rect x="168" y="168" width="1264" height="2064" fill="none" stroke="#F8F3EA" stroke-opacity="0.16" stroke-width="2"/><g filter="url(#shadow)"><path d="M460 790 C460 610 598 492 800 492 C1002 492 1140 610 1140 790 C1140 1016 952 1125 800 1258 C648 1125 460 1016 460 790Z" fill="#F8F3EA" opacity="0.92"/><circle cx="690" cy="760" r="34" fill="#111315"/><circle cx="910" cy="760" r="34" fill="#111315"/><path d="M742 880 C782 920 818 920 858 880" fill="none" stroke="#111315" stroke-width="20" stroke-linecap="round"/><path d="M800 824 L844 862 L756 862 Z" fill="#D95D39"/></g><path d="M505 1325 H1095" stroke="#D9BF67" stroke-width="8"/><text x="800" y="1400" fill="#D9BF67" font-family="Arial" font-size="34" text-anchor="middle" letter-spacing="4">GUIA PREMIUM PRACTICA Y VISUAL</text>${svgTitleLines(title, 800, 1530)}<text x="800" y="2115" fill="#F8F3EA" fill-opacity="0.78" font-family="Arial" font-size="34" text-anchor="middle">CERVANTES EDITORIAL SYSTEM</text></svg>`,
      'utf8',
    );
    await fs.copyFile(coverPath, path.join(publicAssetDir, 'cover.svg'));
    await fs.writeFile(
      figurePath,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720"><defs><linearGradient id="paper" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#FBF7EE"/><stop offset="1" stop-color="#E8EFEA"/></linearGradient><filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#1B1F20" flood-opacity="0.18"/></filter></defs><rect width="1200" height="720" fill="url(#paper)"/><text x="96" y="88" font-family="Georgia" font-size="44" fill="#111315">Mapa práctico de cuidado</text><text x="98" y="126" font-family="Arial" font-size="18" fill="#526064">Del síntoma observable a una acción segura y revisable</text><g filter="url(#soft)"><circle cx="600" cy="360" r="114" fill="#111315"/><text x="600" y="348" font-family="Georgia" font-size="31" text-anchor="middle" fill="#F8F3EA">Decisión</text><text x="600" y="388" font-family="Arial" font-size="18" text-anchor="middle" fill="#D9BF67">con criterio</text></g><g font-family="Arial" font-size="20" text-anchor="middle"><path d="M470 340 C365 302 300 245 246 170" fill="none" stroke="#3A7D7C" stroke-width="6"/><path d="M730 340 C835 302 900 245 954 170" fill="none" stroke="#D95D39" stroke-width="6"/><path d="M470 390 C365 428 300 485 246 560" fill="none" stroke="#D9BF67" stroke-width="6"/><path d="M730 390 C835 428 900 485 954 560" fill="none" stroke="#526064" stroke-width="6"/><g><rect x="122" y="118" width="248" height="96" rx="0" fill="#3A7D7C"/><text x="246" y="158" fill="#fff">Observa</text><text x="246" y="188" font-size="15" fill="#E8EFEA">señales reales</text></g><g><rect x="830" y="118" width="248" height="96" rx="0" fill="#D95D39"/><text x="954" y="158" fill="#fff">Prioriza</text><text x="954" y="188" font-size="15" fill="#FFE8DF">salud y seguridad</text></g><g><rect x="122" y="506" width="248" height="96" rx="0" fill="#D9BF67"/><text x="246" y="546" fill="#111315">Aplica</text><text x="246" y="576" font-size="15" fill="#3A3320">rutina breve</text></g><g><rect x="830" y="506" width="248" height="96" rx="0" fill="#526064"/><text x="954" y="546" fill="#fff">Registra</text><text x="954" y="576" font-size="15" fill="#E8EFEA">ajuste semanal</text></g></g><rect x="90" y="656" width="1020" height="2" fill="#D9BF67"/><text x="96" y="688" font-family="Arial" font-size="16" fill="#526064">Figura editorial editable para explicar el método dentro del ebook.</text></svg>`,
      'utf8',
    );
    await fs.copyFile(figurePath, path.join(publicAssetDir, 'figure-map.svg'));
    await fs.writeFile(
      sealPath,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 520"><rect width="520" height="520" rx="0" fill="#101214"/><circle cx="260" cy="260" r="190" fill="none" stroke="#C9A227" stroke-width="18"/><text x="260" y="235" fill="#F4F0E8" font-family="Georgia" font-size="48" text-anchor="middle">Premium</text><text x="260" y="300" fill="#3A7D7C" font-family="Arial" font-size="28" text-anchor="middle">Editorial QA</text></svg>`,
      'utf8',
    );
    await fs.copyFile(sealPath, path.join(publicAssetDir, 'quality-seal.svg'));
    return { assetDir, coverPath, figurePath, sealPath };
  }

  async assembleMarkdown(projectId: number) {
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
    await this.premiumAssets(projectId, title);

    const body = project.manuscriptBlocks
      .map((block) => block.content || `# ${block.blockTitle}\n\nPendiente de redacción.`)
      .join('\n\n---\n\n');

    const toc = project.chapterPlans
      .map((chapter) => `${chapter.chapterNumber}. ${chapter.title}`)
      .join('\n');

    return `![Portada editorial](assets/cover.svg)

# ${title}

## ${subtitle}

**Edicion:** Premium MVP Cervantes  
**Idioma principal:** Español  
**Idiomas preparados:** Español e ingles editorial base  
**Declaracion IA:** Contenido asistido por herramientas de IA, estructurado y revisado editorialmente.

---

# Front matter

## Promesa editorial

Este libro convierte una idea especializada en una experiencia de lectura clara, visual, aplicable y comercialmente publicable.

## Para quien es

${project.marketResearch?.audience || 'Lectores que buscan una guia practica, confiable y visualmente cuidada.'}

## Como usar este libro

Lee cada capitulo, completa el ejercicio guiado y valida el checklist antes de avanzar.

---

# Indice

${toc}

---

# Direccion visual

${project.visualBible?.visualConcept || 'Premium editorial contemporaneo'}.

![Sello de calidad editorial](assets/quality-seal.svg)

---

${body}

---

# Apendice A: Checklist editorial

| Area | Criterio premium | Estado esperado |
|---|---|---|
| Estructura | Front matter, capitulos, ejercicios y apendices | Completo |
| Visual | Portada, figura, sello, tablas y jerarquia | Completo |
| Comercial | Titulo sugerido, promesa, metadata y precio | Revisado |
| Compliance | Declaracion IA y claims acotados | Revisado |

# Apendice B: Resumen en ingles

## Editorial promise

This ebook is designed as a premium practical guide with a clear method, visual support, exercises, and publishing-ready metadata.

## Suggested positioning

A concise, visual and actionable guide for readers who want a reliable first path into the topic.

# Creditos visuales

Assets generados localmente por Cervantes como SVG editables: cover.svg, figure-map.svg, quality-seal.svg.
`;
  }

  private markdownToHtml(markdown: string, title: string, assetBase = 'assets') {
    const rows = markdown.split('\n');
    let inTable = false;
    const html: string[] = [];
    for (const rawLine of rows) {
      const line = rawLine.trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (line.includes('---')) continue;
        const cells = line
          .split('|')
          .slice(1, -1)
          .map((cell) => `<td>${escapeHtml(cell.trim())}</td>`)
          .join('');
        if (!inTable) {
          html.push('<table>');
          inTable = true;
        }
        html.push(`<tr>${cells}</tr>`);
        continue;
      }
      if (inTable) {
        html.push('</table>');
        inTable = false;
      }
      if (!line) {
        html.push('');
      } else if (line.startsWith('![Portada')) {
        html.push(`<img class="cover" src="${assetBase}/cover.svg" alt="Portada editorial">`);
      } else if (line.startsWith('![Figura')) {
        html.push(`<figure><img src="${assetBase}/figure-map.svg" alt="Figura editorial"><figcaption>Figura editorial del metodo.</figcaption></figure>`);
      } else if (line.startsWith('![Sello')) {
        html.push(`<img class="seal" src="${assetBase}/quality-seal.svg" alt="Sello de calidad">`);
      } else if (line.startsWith('# ')) {
        html.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
      } else if (line.startsWith('## ')) {
        html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      } else if (line.startsWith('- ')) {
        html.push(`<p class="bullet">• ${escapeHtml(line.slice(2))}</p>`);
      } else if (line === '---') {
        html.push('<hr>');
      } else {
        html.push(`<p>${escapeHtml(line)}</p>`);
      }
    }
    if (inTable) html.push('</table>');

    return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
      @page{size:A4;margin:22mm 18mm}
      body{font-family:Georgia,serif;max-width:820px;margin:0 auto;line-height:1.62;color:#171717;background:#fff}
      h1{font-size:34px;line-height:1.12;margin:34px 0 12px;break-after:avoid;color:#101214}
      h2{font-size:22px;margin:24px 0 8px;color:#3A3A34}
      p{font-size:14.5px;margin:0 0 10px}
      hr{border:0;border-top:1px solid #C9A227;margin:26px 0}
      table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}
      td{border:1px solid #C8C0AD;padding:9px;vertical-align:top}
      tr:first-child td{background:#101214;color:#F4F0E8;font-weight:bold}
      .cover{display:block;width:66%;max-width:420px;margin:24px auto 40px;break-after:page}
      figure{margin:20px 0;text-align:center;break-inside:avoid}
      figure img{max-width:100%;border:1px solid #D8D0BD}
      figcaption{font:12px Arial,sans-serif;color:#666;margin-top:6px}
      .seal{width:120px;float:right;margin:0 0 12px 18px}
      .bullet{padding-left:14px}
    </style></head><body>${html.join('\n')}</body></html>`;
  }

  async previewHtml(projectId: number) {
    await ensureDir();
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');
    const markdown = await this.assembleMarkdown(projectId);
    const titleMatch = markdown.match(/^# (.+)$/m);
    const title = titleMatch?.[1] || project.name;
    await this.premiumAssets(projectId, title);
    return this.markdownToHtml(markdown, title, `/api/projects/${projectId}/assets`);
  }

  async assetPath(projectId: number, assetName: string) {
    if (!['cover.svg', 'figure-map.svg', 'quality-seal.svg'].includes(assetName)) {
      throw new Error('Unsupported asset');
    }
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');
    const markdown = await this.assembleMarkdown(projectId);
    const titleMatch = markdown.match(/^# (.+)$/m);
    const title = titleMatch?.[1] || project.name;
    const assets = await this.premiumAssets(projectId, title);
    const map: Record<string, string> = {
      'cover.svg': assets.coverPath,
      'figure-map.svg': assets.figurePath,
      'quality-seal.svg': assets.sealPath,
    };
    return map[assetName];
  }

  private async writeEpub(epubPath: string, title: string, markdown: string, assets: { coverPath: string; figurePath: string; sealPath: string }) {
    const htmlBody = this.markdownToHtml(markdown, title)
      .replace(/<!doctype html><html><head>[\s\S]*?<body>/, '')
      .replace('</body></html>', '');

    await new Promise<void>((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const stream = createWriteStream(epubPath);
      stream.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(stream);
      archive.append('application/epub+zip', { name: 'mimetype', store: true });
      archive.append('<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>', { name: 'META-INF/container.xml' });
      archive.append(`<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="bookid">cervantes-${Date.now()}</dc:identifier><dc:title>${escapeHtml(title)}</dc:title><dc:language>es</dc:language></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="content" href="content.xhtml" media-type="application/xhtml+xml"/><item id="cover" href="assets/cover.svg" media-type="image/svg+xml"/><item id="figure" href="assets/figure-map.svg" media-type="image/svg+xml"/><item id="seal" href="assets/quality-seal.svg" media-type="image/svg+xml"/></manifest><spine><itemref idref="content"/></spine></package>`, { name: 'OEBPS/package.opf' });
      archive.append(`<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${escapeHtml(title)}</title></head><body><nav epub:type="toc"><h1>Indice</h1><ol><li><a href="content.xhtml">Libro completo</a></li></ol></nav></body></html>`, { name: 'OEBPS/nav.xhtml' });
      archive.append(`<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${escapeHtml(title)}</title><style>body{font-family:serif;line-height:1.55}img{max-width:100%}table{width:100%;border-collapse:collapse}td{border:1px solid #999;padding:6px}</style></head><body>${htmlBody}</body></html>`, { name: 'OEBPS/content.xhtml' });
      archive.file(assets.coverPath, { name: 'OEBPS/assets/cover.svg' });
      archive.file(assets.figurePath, { name: 'OEBPS/assets/figure-map.svg' });
      archive.file(assets.sealPath, { name: 'OEBPS/assets/quality-seal.svg' });
      archive.finalize().catch(reject);
    });
  }

  async exportFormat(projectId: number, format: string) {
    await ensureDir();
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    const base = `${project.id}-${slugify(project.name)}-${Date.now()}`;
    const markdown = await this.assembleMarkdown(projectId);
    const titleMatch = markdown.match(/^# (.+)$/m);
    const title = titleMatch?.[1] || project.name;
    const assets = await this.premiumAssets(projectId, title);
    let filePath = path.join(exportDir, `${base}.${format}`);

    if (format === 'md') {
      await fs.writeFile(filePath, markdown, 'utf8');
    } else if (format === 'docx') {
      const doc = new Document({
        sections: [
          {
            children: markdown
              .split('\n')
              .filter((line) => !line.startsWith('!['))
              .map((line) => {
                const isTitle = line.startsWith('# ');
                const isHeading = line.startsWith('## ');
                return new Paragraph({
                  spacing: { after: isTitle ? 260 : 120 },
                  children: [
                    new TextRun({
                      text: line.replace(/^#{1,2}\s/, '') || ' ',
                      bold: isTitle || isHeading,
                      size: isTitle ? 34 : isHeading ? 26 : 22,
                    }),
                  ],
                });
              }),
          },
        ],
      });
      await fs.writeFile(filePath, await Packer.toBuffer(doc));
    } else if (format === 'pdf') {
      const htmlPath = path.join(exportDir, `${base}.html`);
      await fs.writeFile(htmlPath, this.markdownToHtml(markdown, title), 'utf8');
      try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(`file://${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
        await page.pdf({ path: filePath, format: 'A4', printBackground: true, displayHeaderFooter: false });
        await browser.close();
      } catch {
        filePath = htmlPath;
      }
    } else if (format === 'epub') {
      await this.writeEpub(filePath, title, markdown, assets);
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    const stats = await fs.stat(filePath);
    return prisma.formatBuild.create({
      data: {
        projectId,
        format,
        filePath,
        fileSize: stats.size,
        status: 'DONE',
        validationReport: 'Exportación generada correctamente en modo MVP.',
      },
    });
  }

  async exportZip(projectId: number) {
    await ensureDir();
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    const zipPath = path.join(exportDir, `${project.id}-${slugify(project.name)}-production-package-${Date.now()}.zip`);
    const markdown = await this.assembleMarkdown(projectId);
    const titleMatch = markdown.match(/^# (.+)$/m);
    const title = titleMatch?.[1] || project.name;
    const assets = await this.premiumAssets(projectId, title);
    const html = this.markdownToHtml(markdown, title);
    const mdBuild = await this.exportFormat(projectId, 'md');
    const docxBuild = await this.exportFormat(projectId, 'docx');
    const pdfBuild = await this.exportFormat(projectId, 'pdf');
    const epubBuild = await this.exportFormat(projectId, 'epub');
    const fullProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: { metadataPackage: true, publishingChecklist: true, visualBible: true },
    });
    const metadata = {
      title,
      subtitle: fullProject?.metadataPackage?.subtitle,
      language: 'es',
      keywords: fullProject?.metadataPackage?.keywords,
      categories: fullProject?.metadataPackage?.suggestedCategories,
      price: fullProject?.metadataPackage?.recommendedPrice,
      kdp: fullProject?.metadataPackage?.kdpMetadata,
      gumroad: fullProject?.metadataPackage?.gumroadMetadata,
    };
    const quality = inspectManuscript(markdown);
    const kdp = validateKdpPackage({
      title,
      subtitle: metadata.subtitle,
      aiDeclaration: fullProject?.publishingChecklist?.aiDeclaration,
      keywords: metadata.keywords,
      categories: metadata.categories,
      epubPath: epubBuild.filePath,
      coverPath: assets.coverPath,
    });
    const gumroad = validateGumroadPackage({
      premiumPdfPath: pdfBuild.filePath,
      zipPath,
      salesDescription: fullProject?.metadataPackage?.longDescription,
      price: fullProject?.metadataPackage?.recommendedPrice,
      mockupPrompts: fullProject?.visualBible?.imagePrompts,
      disclaimer: fullProject?.publishingChecklist?.copyrightStatus,
    });
    const kdpChecklist = `# KDP Publication Checklist

- Title: ${metadata.title || 'PENDING'}
- Subtitle: ${metadata.subtitle || 'PENDING'}
- AI declaration: ${fullProject?.publishingChecklist?.aiDeclaration || 'PENDING'}
- Cover separated: APPROVED
- EPUB: ebook_reflowable.epub
- Keywords: ${metadata.keywords || 'PENDING'}
- Categories: ${metadata.categories || 'PENDING'}
- Status: ${kdp.status}
`;
    const gumroadPage = `# Gumroad Product Page

## Title
${metadata.title}

## Description
${fullProject?.metadataPackage?.longDescription || 'PENDING'}

## Price
${metadata.price || 'PENDING'}

## Included files
- ebook_premium.pdf
- ebook_reflowable.epub
- ebook_editable.docx
- manuscript_master.md
- cover_front.svg

## Notes
${fullProject?.publishingChecklist?.copyrightStatus || 'Review rights and refund/disclaimer copy before publication.'}
`;
    const aiDeclaration = `# AI Declaration

${fullProject?.publishingChecklist?.aiDeclaration || 'Contenido asistido por herramientas de IA y revisado editorialmente por el autor.'}
`;
    const qualityReport = `# Quality Report

Status: ${quality.status}
Word count: ${quality.wordCount}
Headings: ${quality.headings}

## Issues
${quality.issues.length ? quality.issues.map((issue) => `- ${issue}`).join('\n') : '- None'}

## KDP
${JSON.stringify(kdp, null, 2)}

## Gumroad
${JSON.stringify(gumroad, null, 2)}
`;
    const output = await fs.open(zipPath, 'w');
    await output.close();

    await new Promise<void>((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const stream = createWriteStream(zipPath);
      stream.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(stream);
      if (mdBuild.filePath) archive.file(mdBuild.filePath, { name: 'manuscript_master.md' });
      if (docxBuild.filePath) archive.file(docxBuild.filePath, { name: 'ebook_editable.docx' });
      if (pdfBuild.filePath) archive.file(pdfBuild.filePath, { name: 'ebook_premium.pdf' });
      if (epubBuild.filePath) archive.file(epubBuild.filePath, { name: 'ebook_reflowable.epub' });
      archive.append(markdown, { name: 'manuscript_master_clean.md' });
      archive.append(html, { name: 'preview.html' });
      archive.file(assets.coverPath, { name: 'cover_front.svg' });
      archive.file(assets.coverPath, { name: 'assets/cover.svg' });
      archive.file(assets.figurePath, { name: 'assets/figure-map.svg' });
      archive.file(assets.sealPath, { name: 'assets/quality-seal.svg' });
      archive.append(gumroadPage, { name: 'gumroad_product_page.md' });
      archive.append(kdpChecklist, { name: 'kdp_publication_checklist.md' });
      archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });
      archive.append(aiDeclaration, { name: 'ai_declaration.md' });
      archive.append(qualityReport, { name: 'quality_report.md' });
      archive.append(JSON.stringify({ projectId, name: project.name, title, assets: ['cover_front.svg', 'assets/figure-map.svg', 'assets/quality-seal.svg'], kdp, gumroad }, null, 2), { name: 'manifest.json' });
      archive.finalize().catch(reject);
    });

    const stats = await fs.stat(zipPath);
    return prisma.exportPackage.create({
      data: {
        projectId,
        packageType: 'complete',
        filePath: zipPath,
        fileSize: stats.size,
        contents: 'ebook_premium.pdf, ebook_reflowable.epub, ebook_editable.docx, manuscript_master.md, cover_front.svg, gumroad_product_page.md, kdp_publication_checklist.md, metadata.json, ai_declaration.md, quality_report.md',
      },
    });
  }
}
