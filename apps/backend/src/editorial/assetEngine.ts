import fs from 'node:fs/promises';
import path from 'node:path';
import type { LayoutDocument } from './layoutEngine';
import type { EditorialTheme } from './themeEngine';

function escapeSvg(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function titleLines(title: string, x: number, y: number, maxChars = 22, lineHeight = 82) {
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
    .map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" text-anchor="middle">${escapeSvg(line)}</text>`)
    .join('');
}

export class EditorialAssetEngine {
  constructor(private readonly exportDir: string) {}

  async generate(layout: LayoutDocument) {
    const assetDir = path.join(this.exportDir, `project-${layout.projectId}-editorial-assets`);
    const publicAssetDir = path.join(this.exportDir, 'assets');
    await fs.mkdir(assetDir, { recursive: true });
    await fs.mkdir(publicAssetDir, { recursive: true });

    const assets: Record<string, string> = {
      cover: path.join(assetDir, 'cover.svg'),
      'chapter-opener': path.join(assetDir, 'chapter-opener.svg'),
      'figure-map': path.join(assetDir, 'figure-map.svg'),
      separator: path.join(assetDir, 'separator.svg'),
      icons: path.join(assetDir, 'icons.svg'),
      worksheet: path.join(assetDir, 'worksheet.svg'),
      mockup: path.join(assetDir, 'mockup.svg'),
    };

    await fs.writeFile(assets.cover, this.cover(layout.title, layout.subtitle, layout.theme), 'utf8');
    await fs.writeFile(assets['chapter-opener'], this.chapterOpener(layout.title, layout.theme), 'utf8');
    await fs.writeFile(assets['figure-map'], this.figureMap(layout.theme), 'utf8');
    await fs.writeFile(assets.separator, this.separator(layout.theme), 'utf8');
    await fs.writeFile(assets.icons, this.icons(layout.theme), 'utf8');
    await fs.writeFile(assets.worksheet, this.worksheet(layout.theme), 'utf8');
    await fs.writeFile(assets.mockup, this.mockup(layout.theme), 'utf8');

    for (const [role, filePath] of Object.entries(assets)) {
      await fs.copyFile(filePath, path.join(publicAssetDir, `${role}.svg`));
    }
    layout.assets = assets;
    return assets;
  }

  private svgShell(theme: EditorialTheme, width: number, height: number, body: string, extra = '') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><defs><filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity=".32"/></filter>${extra}</defs><rect width="${width}" height="${height}" fill="${theme.colors.paperAlt}"/>${body}</svg>`;
  }

  private cover(title: string, subtitle: string, theme: EditorialTheme) {
    const extra = `<radialGradient id="glow" cx="50%" cy="24%" r="50%"><stop stop-color="${theme.colors.gold}" stop-opacity=".32"/><stop offset="1" stop-color="${theme.colors.gold}" stop-opacity="0"/></radialGradient>`;
    const body = `<rect width="1600" height="2400" fill="${theme.colors.dark}"/><rect width="1600" height="2400" fill="url(#glow)"/><rect x="96" y="96" width="1408" height="2208" fill="none" stroke="${theme.colors.gold}" stroke-width="8"/><rect x="148" y="148" width="1304" height="2104" fill="none" stroke="${theme.colors.paper}" stroke-opacity=".22"/><g fill="none" stroke="${theme.colors.gold}" stroke-width="4" opacity=".9"><path d="M300 360 C520 245 1080 245 1300 360"/><path d="M300 2040 C520 2155 1080 2155 1300 2040"/><circle cx="800" cy="550" r="112"/><path d="M760 466 C690 560 715 670 812 708 C762 640 782 548 860 494"/></g><g fill="${theme.colors.paper}" font-family="Georgia" font-size="78" font-weight="700">${titleLines(title, 800, 930, 21, 88)}</g><text x="800" y="1300" text-anchor="middle" fill="${theme.colors.gold}" font-family="Arial" font-size="34" letter-spacing="4">EDICION PREMIUM</text><text x="800" y="1390" text-anchor="middle" fill="${theme.colors.paper}" font-family="Georgia" font-size="38">${escapeSvg(subtitle).slice(0, 78)}</text><g filter="url(#shadow)"><rect x="420" y="1580" width="760" height="340" fill="${theme.colors.paper}" opacity=".95"/><circle cx="570" cy="1750" r="70" fill="${theme.colors.accent}"/><rect x="690" y="1680" width="360" height="18" fill="${theme.colors.dark}"/><rect x="690" y="1740" width="300" height="14" fill="${theme.colors.gold}"/><rect x="690" y="1795" width="250" height="14" fill="${theme.colors.accent2}"/></g><text x="800" y="2160" text-anchor="middle" fill="${theme.colors.paper}" font-family="Arial" font-size="28" opacity=".72">CERVANTES EDITORIAL SYSTEM</text>`;
    return this.svgShell(theme, 1600, 2400, body, extra);
  }

  private chapterOpener(title: string, theme: EditorialTheme) {
    const body = `<rect width="1200" height="760" fill="${theme.colors.dark}"/><rect x="42" y="42" width="1116" height="676" fill="none" stroke="${theme.colors.gold}" stroke-width="5"/><g stroke="${theme.colors.gold}" fill="none" opacity=".9"><circle cx="930" cy="260" r="94"/><path d="M906 184 C842 278 872 386 970 426"/><path d="M150 570 H1040"/><path d="M190 600 H1000"/></g><text x="120" y="170" fill="${theme.colors.gold}" font-family="Arial" font-size="28" letter-spacing="5">CAPITULO</text><text x="120" y="280" fill="${theme.colors.paper}" font-family="Georgia" font-size="58">${escapeSvg(title).slice(0, 34)}</text><text x="120" y="348" fill="${theme.colors.paper}" font-family="Georgia" font-size="32" opacity=".75">Apertura editorial visual</text>`;
    return this.svgShell(theme, 1200, 760, body);
  }

  private figureMap(theme: EditorialTheme) {
    const nodes = [
      [210, 170, theme.colors.accent, 'Observa', 'senales'],
      [990, 170, theme.colors.accent2, 'Prioriza', 'riesgo'],
      [210, 550, theme.colors.gold, 'Aplica', 'rutina'],
      [990, 550, '#526064', 'Registra', 'avance'],
    ];
    const body = `<rect width="1200" height="720" fill="${theme.colors.paperAlt}"/><text x="80" y="82" font-family="Georgia" font-size="44" fill="${theme.colors.ink}">Mapa editorial del metodo</text><text x="82" y="120" font-family="Arial" font-size="18" fill="${theme.colors.muted}">Una secuencia visual para convertir lectura en accion</text><circle cx="600" cy="360" r="124" fill="${theme.colors.dark}" filter="url(#shadow)"/><text x="600" y="350" text-anchor="middle" fill="${theme.colors.paper}" font-family="Georgia" font-size="32">Decision</text><text x="600" y="390" text-anchor="middle" fill="${theme.colors.gold}" font-family="Arial" font-size="18">con criterio</text><g fill="none" stroke-width="6" opacity=".9"><path d="M488 330 C360 290 292 238 210 170" stroke="${theme.colors.accent}"/><path d="M712 330 C840 290 908 238 990 170" stroke="${theme.colors.accent2}"/><path d="M488 390 C360 430 292 482 210 550" stroke="${theme.colors.gold}"/><path d="M712 390 C840 430 908 482 990 550" stroke="#526064"/></g>${nodes.map(([x, y, color, label, sub]) => `<g><rect x="${Number(x) - 120}" y="${Number(y) - 48}" width="240" height="96" fill="${color}"/><text x="${x}" y="${Number(y) - 6}" text-anchor="middle" fill="${color === theme.colors.gold ? theme.colors.ink : '#fff'}" font-family="Arial" font-size="23" font-weight="700">${label}</text><text x="${x}" y="${Number(y) + 25}" text-anchor="middle" fill="${color === theme.colors.gold ? theme.colors.ink : '#fff'}" font-family="Arial" font-size="15" opacity=".85">${sub}</text></g>`).join('')}<rect x="80" y="660" width="1040" height="2" fill="${theme.colors.gold}"/>`;
    return this.svgShell(theme, 1200, 720, body);
  }

  private separator(theme: EditorialTheme) {
    const body = `<rect width="1200" height="160" fill="none"/><path d="M120 80 H1080" stroke="${theme.colors.gold}" stroke-width="4"/><circle cx="600" cy="80" r="22" fill="${theme.colors.dark}" stroke="${theme.colors.gold}" stroke-width="4"/><path d="M570 80 C585 50 615 50 630 80 C615 110 585 110 570 80Z" fill="${theme.colors.gold}" opacity=".75"/>`;
    return this.svgShell(theme, 1200, 160, body);
  }

  private icons(theme: EditorialTheme) {
    const labels = ['Idea', 'Metodo', 'Accion', 'Revision'];
    const body = `<rect width="1200" height="240" fill="${theme.colors.dark}"/>${labels.map((label, index) => `<g transform="translate(${150 + index * 290} 55)"><circle cx="55" cy="55" r="45" fill="none" stroke="${theme.colors.gold}" stroke-width="5"/><path d="M30 58 H80 M55 30 V82" stroke="${index % 2 ? theme.colors.accent2 : theme.colors.accent}" stroke-width="6"/><text x="55" y="145" text-anchor="middle" fill="${theme.colors.paper}" font-family="Arial" font-size="24">${label}</text></g>`).join('')}`;
    return this.svgShell(theme, 1200, 240, body);
  }

  private worksheet(theme: EditorialTheme) {
    const rows = ['Accion', 'Criterio', 'Fecha', 'Resultado'];
    const body = `<rect width="1000" height="720" fill="${theme.colors.paperAlt}"/><rect x="80" y="70" width="840" height="580" fill="#fff" stroke="${theme.colors.gold}" stroke-width="5"/><text x="130" y="135" font-family="Georgia" font-size="38" fill="${theme.colors.ink}">Worksheet editorial</text>${rows.map((row, index) => `<g transform="translate(130 ${200 + index * 92})"><rect width="24" height="24" fill="none" stroke="${theme.colors.accent}" stroke-width="4"/><text x="42" y="21" font-family="Arial" font-size="21" fill="${theme.colors.ink}">${row}</text><line x1="180" y1="15" x2="690" y2="15" stroke="${index === 3 ? theme.colors.accent2 : theme.colors.muted}" stroke-width="3"/></g>`).join('')}<rect x="130" y="600" width="220" height="10" fill="${theme.colors.gold}"/>`;
    return this.svgShell(theme, 1000, 720, body);
  }

  private mockup(theme: EditorialTheme) {
    const body = `<rect width="1000" height="620" fill="${theme.colors.paperAlt}"/><ellipse cx="500" cy="520" rx="260" ry="42" fill="#000" opacity=".14"/><path d="M350 140 L548 100 L548 470 L350 510 Z" fill="${theme.colors.accent}"/><path d="M548 100 L650 170 L650 520 L548 470 Z" fill="${theme.colors.gold}"/><rect x="390" y="200" width="110" height="12" fill="${theme.colors.paper}"/><rect x="390" y="232" width="85" height="8" fill="${theme.colors.paper}"/><circle cx="450" cy="335" r="54" fill="none" stroke="${theme.colors.accent2}" stroke-width="12"/><text x="500" y="575" text-anchor="middle" font-family="Georgia" font-size="30" fill="${theme.colors.ink}">Mockup comercial premium</text>`;
    return this.svgShell(theme, 1000, 620, body);
  }
}
