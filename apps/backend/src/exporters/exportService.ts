import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import puppeteer from 'puppeteer';
import { prisma } from '../prisma';
import { EditorialLayoutService } from '../editorial/editorialLayoutService';
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

function inlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
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
  private readonly layoutService = new EditorialLayoutService();

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
    return this.layoutService.assembleManuscript(projectId);
  }

  private markdownToHtml(markdown: string, title: string, assetBase = 'assets') {
    const rows = markdown.split('\n');
    let inTable = false;
    let pageOpen = false;
    let introDone = false;
    const html: string[] = [];
    const closePage = () => {
      if (pageOpen) {
        html.push('</section>');
        pageOpen = false;
      }
    };
    const openPage = (className = '') => {
      closePage();
      html.push(`<section class="book-page ${className}">`);
      pageOpen = true;
    };
    for (const rawLine of rows) {
      const line = rawLine.trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!pageOpen) openPage();
        if (line.includes('---')) continue;
        const cells = line
          .split('|')
          .slice(1, -1)
          .map((cell) => `<td>${inlineMarkdown(cell.trim())}</td>`)
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
        closePage();
        html.push(`<section class="book-cover"><img class="cover" src="${assetBase}/cover.svg" alt="Portada editorial"></section>`);
      } else if (line.startsWith('![Figura')) {
        if (!pageOpen) openPage('visual-page');
        html.push(`<figure class="feature-figure"><img src="${assetBase}/figure-map.svg" alt="Figura editorial"><figcaption>Mapa editorial del metodo: observa, prioriza, aplica y registra.</figcaption></figure>`);
      } else if (line.startsWith('![Sello')) {
        if (!pageOpen) openPage();
        html.push(`<aside class="quality-seal"><img class="seal" src="${assetBase}/quality-seal.svg" alt="Sello de calidad"><span>Revision editorial local</span></aside>`);
      } else if (line.startsWith('# ')) {
        const heading = line.slice(2);
        const lower = heading.toLowerCase();
        if (lower === title.toLowerCase()) {
          openPage('title-page');
          html.push(`<p class="kicker">Edicion premium</p><h1>${inlineMarkdown(heading)}</h1>`);
          introDone = true;
        } else if (lower.includes('apendice') || lower.includes('creditos')) {
          openPage('appendix-page');
          html.push(`<h1>${inlineMarkdown(heading)}</h1>`);
        } else if (introDone) {
          openPage('chapter-page');
          html.push(`<p class="chapter-label">Capitulo</p><h1>${inlineMarkdown(heading)}</h1>`);
        } else {
          openPage();
          html.push(`<h1>${inlineMarkdown(heading)}</h1>`);
        }
      } else if (line.startsWith('## ')) {
        if (!pageOpen) openPage();
        html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
      } else if (line.startsWith('- ')) {
        if (!pageOpen) openPage();
        html.push(`<p class="bullet"><span>•</span>${inlineMarkdown(line.slice(2))}</p>`);
      } else if (line === '---') {
        closePage();
      } else {
        if (!pageOpen) openPage();
        html.push(`<p>${inlineMarkdown(line)}</p>`);
      }
    }
    if (inTable) html.push('</table>');
    closePage();

    return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
      @page{size:A4;margin:0}
      :root{--ink:#191714;--muted:#675f51;--gold:#b79236;--teal:#2f6e6d;--paper:#f3ead8;--paper2:#fbf7ed;--line:#c8b98d}
      *{box-sizing:border-box}
      body{margin:0;background:#171717;color:var(--ink);font-family:Georgia,"Times New Roman",serif;line-height:1.55}
      .book-cover,.book-page{position:relative;width:210mm;min-height:297mm;margin:0 auto 16px;background:var(--paper2);box-shadow:0 18px 50px rgba(0,0,0,.35);overflow:hidden;break-after:page}
      .book-page{padding:25mm 24mm 22mm;background:radial-gradient(circle at 20% 12%,rgba(255,255,255,.9),rgba(255,255,255,0) 32%),linear-gradient(90deg,rgba(0,0,0,.045),transparent 24mm),var(--paper)}
      .book-page:before{content:"";position:absolute;inset:9mm;border:1px solid rgba(183,146,54,.45);pointer-events:none}
      .book-page:after{content:"Cervantes";position:absolute;top:10mm;left:24mm;right:24mm;border-bottom:1px solid rgba(25,23,20,.22);padding-bottom:3mm;text-align:center;font:11px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:var(--muted)}
      .book-cover{display:grid;place-items:center;background:#101214}
      .book-cover .cover{display:block;width:100%;height:100%;object-fit:cover}
      .title-page{display:grid;align-content:center;text-align:center;background:linear-gradient(180deg,#101214,#1b2524)}
      .title-page:before{border-color:rgba(217,191,103,.58)}
      .title-page:after{color:#d9bf67;border-color:rgba(217,191,103,.32)}
      .title-page h1{color:#f7edd5;font-size:54px;max-width:140mm;margin:0 auto 12mm;text-wrap:balance}
      .title-page p{color:#e6d3a6;max-width:120mm;margin-left:auto;margin-right:auto}
      .kicker,.chapter-label{font:700 12px Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin:0 0 8mm}
      h1{font-size:35px;line-height:1.1;margin:10mm 0 7mm;color:var(--ink);text-wrap:balance}
      h2{font-size:22px;line-height:1.2;margin:9mm 0 4mm;color:#24211b}
      h2:after{content:"";display:block;width:28mm;height:1px;background:var(--gold);margin-top:3mm}
      p{font-size:14.2px;margin:0 0 4.2mm;max-width:142mm}
      .chapter-page p:nth-of-type(2)::first-letter{float:left;font-size:54px;line-height:.85;padding:4px 8px 0 0;color:var(--gold)}
      strong{font-weight:700;color:#111}
      em{color:var(--muted)}
      table{width:100%;border-collapse:collapse;margin:8mm 0;font-size:12.5px;break-inside:avoid}
      td{border:1px solid var(--line);padding:3.5mm;vertical-align:top;background:rgba(255,255,255,.42)}
      tr:first-child td{background:#171717;color:#f7edd5;font-weight:bold;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:.5px}
      figure{margin:9mm 0;text-align:center;break-inside:avoid}
      figure img{max-width:100%;border:2px solid var(--gold);box-shadow:0 14px 34px rgba(29,25,17,.18)}
      .feature-figure{margin-top:4mm}
      figcaption{font:12px Arial,sans-serif;color:var(--muted);margin-top:3mm}
      .quality-seal{float:right;width:38mm;margin:0 0 7mm 8mm;text-align:center;color:var(--muted);font:11px Arial,sans-serif;text-transform:uppercase;letter-spacing:.8px}
      .seal{display:block;width:100%;margin-bottom:2mm}
      .bullet{display:grid;grid-template-columns:6mm 1fr;gap:2mm;padding:2.5mm 0 2.5mm 4mm;border-left:2px solid var(--gold);background:rgba(255,255,255,.38)}
      .bullet span{color:var(--gold)}
      .appendix-page{background:linear-gradient(180deg,#f7f0e3,#efe2c9)}
      @media screen{body{padding:18px 0}.book-cover,.book-page{max-width:min(92vw,210mm)}}
      @media print{body{background:white}.book-cover,.book-page{margin:0;box-shadow:none}}
    </style></head><body>${html.join('\n')}</body></html>`;
  }

  async previewHtml(projectId: number) {
    const rendered = await this.layoutService.renderProject(projectId, { assetBase: `/api/projects/${projectId}/assets` });
    return rendered.html;
  }

  async assetPath(projectId: number, assetName: string) {
    return this.layoutService.assetPath(projectId, assetName);
  }

  private async writeEpub(epubPath: string, title: string, html: string, assets: Record<string, string>) {
    const htmlBody = html
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
      const manifestAssets = Object.keys(assets)
        .map((role) => `<item id="${role}" href="assets/${role}.svg" media-type="image/svg+xml"/>`)
        .join('');
      archive.append(`<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="bookid">cervantes-${Date.now()}</dc:identifier><dc:title>${escapeHtml(title)}</dc:title><dc:language>es</dc:language></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>${manifestAssets}</manifest><spine><itemref idref="content"/></spine></package>`, { name: 'OEBPS/package.opf' });
      archive.append(`<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${escapeHtml(title)}</title></head><body><nav epub:type="toc"><h1>Indice</h1><ol><li><a href="content.xhtml">Libro completo</a></li></ol></nav></body></html>`, { name: 'OEBPS/nav.xhtml' });
      archive.append(`<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${escapeHtml(title)}</title><style>body{font-family:serif;line-height:1.55}img{max-width:100%}table{width:100%;border-collapse:collapse}td{border:1px solid #999;padding:6px}</style></head><body>${htmlBody}</body></html>`, { name: 'OEBPS/content.xhtml' });
      for (const [role, filePath] of Object.entries(assets)) {
        archive.file(filePath, { name: `OEBPS/assets/${role}.svg` });
      }
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
      const rendered = await this.layoutService.renderProject(projectId, { assetBase: 'assets' });
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(`file://${rendered.htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
      await page.pdf({ path: filePath, format: 'A4', printBackground: true, displayHeaderFooter: false });
      await browser.close();
    } else if (format === 'epub') {
      const rendered = await this.layoutService.renderProject(projectId, { assetBase: 'assets' });
      await this.writeEpub(filePath, title, rendered.html, rendered.layout.assets);
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
    const rendered = await this.layoutService.renderProject(projectId, { assetBase: 'assets' });
    const assets = rendered.layout.assets;
    const html = rendered.html;
    const pageApprovals = Object.fromEntries(rendered.layout.pages.map((page) => [page.id, page.status || 'APPROVED']));
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
      coverPath: assets.cover,
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

## Professional Ebook
${JSON.stringify(rendered.professionalReport, null, 2)}
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
      if (assets.cover) archive.file(assets.cover, { name: 'cover_front.svg' });
      for (const [role, filePath] of Object.entries(assets)) {
        archive.file(filePath, { name: `assets/${role}.svg` });
      }
      archive.append(gumroadPage, { name: 'gumroad_product_page.md' });
      archive.append(kdpChecklist, { name: 'kdp_publication_checklist.md' });
      archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });
      archive.append(aiDeclaration, { name: 'ai_declaration.md' });
      archive.append(qualityReport, { name: 'quality_report.md' });
      archive.append(JSON.stringify(rendered.report, null, 2), { name: 'visual_quality_report.json' });
      archive.append(JSON.stringify(rendered.artDirection, null, 2), { name: 'visual_style.json' });
      archive.append(JSON.stringify({ pages: rendered.layout.pages, report: rendered.report }, null, 2), { name: 'layout_report.json' });
      archive.append(JSON.stringify(pageApprovals, null, 2), { name: 'page_approvals.json' });
      archive.append(`# Professional Ebook Report

Status: ${rendered.professionalReport.status}
Score: ${rendered.professionalReport.score}

## Actions
${rendered.professionalReport.actions.map((action) => `- ${action}`).join('\n')}

## Checks
${JSON.stringify(rendered.professionalReport.checks, null, 2)}
`, { name: 'professional_ebook_report.md' });
      archive.append(JSON.stringify({ projectId, name: project.name, title, assets: Object.keys(assets), kdp, gumroad, visual: rendered.report, professional: rendered.professionalReport, style: rendered.artDirection.styleKey }, null, 2), { name: 'manifest.json' });
      archive.finalize().catch(reject);
    });

    const stats = await fs.stat(zipPath);
    return prisma.exportPackage.create({
      data: {
        projectId,
        packageType: 'complete',
        filePath: zipPath,
        fileSize: stats.size,
        contents: 'ebook_premium.pdf, ebook_reflowable.epub, ebook_editable.docx, manuscript_master.md, cover_front.svg, gumroad_product_page.md, kdp_publication_checklist.md, metadata.json, ai_declaration.md, quality_report.md, visual_style.json, layout_report.json, page_approvals.json, professional_ebook_report.md',
      },
    });
  }
}
