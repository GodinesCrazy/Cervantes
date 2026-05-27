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
    const texture = `<pattern id="grain" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M0 22 C40 8 80 42 120 20 M0 74 C34 62 77 92 120 70" fill="none" stroke="${theme.colors.line}" stroke-opacity=".18" stroke-width="1"/><circle cx="18" cy="18" r="1.2" fill="${theme.colors.ink}" opacity=".12"/><circle cx="78" cy="54" r="1" fill="${theme.colors.ink}" opacity=".1"/><circle cx="42" cy="102" r="1.1" fill="${theme.colors.ink}" opacity=".09"/></pattern>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><defs><filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity=".32"/></filter><filter id="ink"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .16"/></feComponentTransfer></filter>${texture}${extra}</defs><rect width="${width}" height="${height}" fill="${theme.colors.paperAlt}"/><rect width="${width}" height="${height}" fill="url(#grain)" opacity=".7"/>${body}</svg>`;
  }

  private cover(title: string, subtitle: string, theme: EditorialTheme) {
    const extra = `<radialGradient id="glow" cx="50%" cy="28%" r="58%"><stop stop-color="${theme.colors.gold}" stop-opacity=".34"/><stop offset=".62" stop-color="${theme.colors.accent}" stop-opacity=".12"/><stop offset="1" stop-color="${theme.colors.dark}" stop-opacity="0"/></radialGradient><linearGradient id="coverBg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${theme.colors.dark}"/><stop offset=".55" stop-color="#162121"/><stop offset="1" stop-color="${theme.colors.accent}"/></linearGradient>`;
    const starField = Array.from({ length: 42 }, (_, index) => {
      const x = 170 + ((index * 97) % 1260);
      const y = 220 + ((index * 151) % 1720);
      const r = 1 + (index % 4) * 0.7;
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="${theme.colors.gold}" opacity="${0.2 + (index % 5) * 0.1}"/>`;
    }).join('');
    const corner = `<path d="M170 170 H360 M170 170 V360 M1430 170 H1240 M1430 170 V360 M170 2230 H360 M170 2230 V2040 M1430 2230 H1240 M1430 2230 V2040" fill="none" stroke="${theme.colors.gold}" stroke-width="5"/><path d="M215 215 C260 250 260 300 215 335 M1385 215 C1340 250 1340 300 1385 335 M215 2185 C260 2150 260 2100 215 2065 M1385 2185 C1340 2150 1340 2100 1385 2065" fill="none" stroke="${theme.colors.gold}" stroke-width="3" opacity=".75"/>`;
    const symbol = `<g filter="url(#shadow)"><circle cx="800" cy="640" r="220" fill="#050607" opacity=".68"/><circle cx="800" cy="640" r="205" fill="none" stroke="${theme.colors.gold}" stroke-width="7"/><circle cx="800" cy="640" r="142" fill="none" stroke="${theme.colors.paper}" stroke-opacity=".24" stroke-width="2"/><path d="M758 475 C642 626 692 805 860 872 C772 752 808 600 940 520 C880 486 820 468 758 475Z" fill="${theme.colors.paper}" opacity=".86"/><path d="M585 640 H1015 M800 425 V855 M657 497 L943 783 M943 497 L657 783" stroke="${theme.colors.gold}" stroke-width="3" opacity=".58"/><text x="800" y="916" text-anchor="middle" fill="${theme.colors.gold}" font-family="Georgia" font-size="28" letter-spacing="7">CICLO · METODO · REVELACION</text></g>`;
    const body = `<rect width="1600" height="2400" fill="url(#coverBg)"/><rect width="1600" height="2400" filter="url(#ink)"/><rect width="1600" height="2400" fill="url(#glow)"/>${starField}<rect x="96" y="96" width="1408" height="2208" fill="none" stroke="${theme.colors.gold}" stroke-width="8"/><rect x="148" y="148" width="1304" height="2104" fill="none" stroke="${theme.colors.paper}" stroke-opacity=".22"/>${corner}${symbol}<g fill="${theme.colors.paper}" font-family="Georgia" font-size="82" font-weight="700">${titleLines(title, 800, 1125, 21, 92)}</g><path d="M480 1515 H1120" stroke="${theme.colors.gold}" stroke-width="5"/><text x="800" y="1585" text-anchor="middle" fill="${theme.colors.gold}" font-family="Arial" font-size="31" letter-spacing="5">EDICION PREMIUM ILUSTRADA</text><text x="800" y="1668" text-anchor="middle" fill="${theme.colors.paper}" font-family="Georgia" font-size="36">${escapeSvg(subtitle).slice(0, 78)}</text><g transform="translate(385 1840)" filter="url(#shadow)"><rect width="830" height="210" fill="${theme.colors.paper}" opacity=".94"/><rect x="24" y="24" width="782" height="162" fill="none" stroke="${theme.colors.gold}" stroke-width="3"/><circle cx="122" cy="105" r="54" fill="none" stroke="${theme.colors.accent2}" stroke-width="12"/><path d="M230 68 H690 M230 106 H626 M230 144 H548" stroke="${theme.colors.dark}" stroke-width="12"/></g><text x="800" y="2186" text-anchor="middle" fill="${theme.colors.paper}" font-family="Arial" font-size="28" opacity=".72" letter-spacing="3">CERVANTES EDITORIAL SYSTEM</text>`;
    return this.svgShell(theme, 1600, 2400, body, extra);
  }

  private chapterOpener(title: string, theme: EditorialTheme) {
    const body = `<rect width="1200" height="760" fill="${theme.colors.dark}"/><rect width="1200" height="760" filter="url(#ink)"/><rect x="42" y="42" width="1116" height="676" fill="none" stroke="${theme.colors.gold}" stroke-width="5"/><rect x="72" y="72" width="1056" height="616" fill="none" stroke="${theme.colors.paper}" stroke-opacity=".16"/><g stroke="${theme.colors.gold}" fill="none" opacity=".9"><circle cx="930" cy="260" r="122"/><circle cx="930" cy="260" r="70" opacity=".35"/><path d="M900 160 C820 288 870 428 1006 474"/><path d="M150 570 H1040"/><path d="M190 600 H1000"/><path d="M580 142 C660 96 750 96 830 142"/></g><g fill="${theme.colors.gold}" opacity=".55">${Array.from({ length: 18 }, (_, i) => `<circle cx="${170 + i * 52}" cy="${455 + (i % 3) * 18}" r="${2 + (i % 2)}"/>`).join('')}</g><text x="120" y="170" fill="${theme.colors.gold}" font-family="Arial" font-size="28" letter-spacing="5">CAPITULO</text><text x="120" y="280" fill="${theme.colors.paper}" font-family="Georgia" font-size="58">${escapeSvg(title).slice(0, 34)}</text><text x="120" y="348" fill="${theme.colors.paper}" font-family="Georgia" font-size="32" opacity=".75">Apertura editorial visual</text><text x="120" y="650" fill="${theme.colors.gold}" font-family="Arial" font-size="18" letter-spacing="4">LECTURA · METODO · PRACTICA</text>`;
    return this.svgShell(theme, 1200, 760, body);
  }

  private figureMap(theme: EditorialTheme) {
    const nodes = [
      [210, 170, theme.colors.accent, 'Observa', 'senales'],
      [990, 170, theme.colors.accent2, 'Prioriza', 'riesgo'],
      [210, 550, theme.colors.gold, 'Aplica', 'rutina'],
      [990, 550, '#526064', 'Registra', 'avance'],
    ];
    const body = `<rect width="1200" height="720" fill="${theme.colors.paperAlt}"/><rect x="42" y="38" width="1116" height="644" fill="none" stroke="${theme.colors.gold}" stroke-width="4"/><rect x="66" y="62" width="1068" height="596" fill="none" stroke="${theme.colors.ink}" stroke-opacity=".12"/><text x="80" y="92" font-family="Georgia" font-size="46" fill="${theme.colors.ink}">Mapa editorial del metodo</text><text x="82" y="132" font-family="Arial" font-size="18" fill="${theme.colors.muted}">Una secuencia visual para convertir lectura en accion</text><g opacity=".22" stroke="${theme.colors.gold}" fill="none">${Array.from({ length: 7 }, (_, i) => `<path d="M${118 + i * 154} 170 V602"/>`).join('')}${Array.from({ length: 4 }, (_, i) => `<path d="M100 ${220 + i * 92} H1100"/>`).join('')}</g><circle cx="600" cy="365" r="156" fill="${theme.colors.dark}" filter="url(#shadow)"/><circle cx="600" cy="365" r="126" fill="none" stroke="${theme.colors.gold}" stroke-width="5"/><circle cx="600" cy="365" r="86" fill="none" stroke="${theme.colors.paper}" stroke-opacity=".25" stroke-width="2"/><text x="600" y="350" text-anchor="middle" fill="${theme.colors.paper}" font-family="Georgia" font-size="34">Decision</text><text x="600" y="394" text-anchor="middle" fill="${theme.colors.gold}" font-family="Arial" font-size="18">con criterio</text><g fill="none" stroke-width="6" opacity=".9"><path d="M488 330 C360 290 292 238 210 170" stroke="${theme.colors.accent}"/><path d="M712 330 C840 290 908 238 990 170" stroke="${theme.colors.accent2}"/><path d="M488 400 C360 440 292 492 210 560" stroke="${theme.colors.gold}"/><path d="M712 400 C840 440 908 492 990 560" stroke="#526064"/></g>${nodes.map(([x, y, color, label, sub], index) => `<g filter="url(#shadow)"><rect x="${Number(x) - 132}" y="${Number(y) - 62}" width="264" height="124" rx="0" fill="${color}"/><rect x="${Number(x) - 108}" y="${Number(y) - 38}" width="216" height="76" fill="none" stroke="#fff" stroke-opacity=".28"/><circle cx="${Number(x) - 88}" cy="${Number(y) - 4}" r="18" fill="none" stroke="${color === theme.colors.gold ? theme.colors.ink : '#fff'}" stroke-opacity=".65" stroke-width="4"/><text x="${x}" y="${Number(y) - 10}" text-anchor="middle" fill="${color === theme.colors.gold ? theme.colors.ink : '#fff'}" font-family="Arial" font-size="23" font-weight="700">${label}</text><text x="${x}" y="${Number(y) + 24}" text-anchor="middle" fill="${color === theme.colors.gold ? theme.colors.ink : '#fff'}" font-family="Arial" font-size="15" opacity=".85">${sub}</text><text x="${Number(x) + 96}" y="${Number(y) + 46}" text-anchor="end" fill="${color === theme.colors.gold ? theme.colors.ink : '#fff'}" font-family="Georgia" font-size="18" opacity=".55">0${index + 1}</text></g>`).join('')}<g opacity=".55" stroke="${theme.colors.gold}" fill="none"><path d="M120 620 C350 590 850 590 1080 620"/><path d="M160 638 H1040"/><circle cx="600" cy="628" r="16"/><path d="M578 628 H510 M622 628 H690"/></g><text x="600" y="676" text-anchor="middle" fill="${theme.colors.muted}" font-family="Arial" font-size="15">Promesa clara · metodo visible · accion concreta · revision prudente</text>`;
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
    const body = `<rect width="1000" height="720" fill="${theme.colors.paperAlt}"/><rect x="64" y="52" width="872" height="616" fill="#fff" stroke="${theme.colors.gold}" stroke-width="5"/><rect x="92" y="82" width="816" height="556" fill="none" stroke="${theme.colors.ink}" stroke-opacity=".16"/><text x="130" y="135" font-family="Georgia" font-size="38" fill="${theme.colors.ink}">Worksheet editorial</text><text x="132" y="166" font-family="Arial" font-size="16" fill="${theme.colors.muted}">Hoja aplicable para convertir lectura en decision revisable</text>${rows.map((row, index) => `<g transform="translate(130 ${215 + index * 82})"><rect width="24" height="24" fill="none" stroke="${theme.colors.accent}" stroke-width="4"/><text x="42" y="21" font-family="Arial" font-size="21" fill="${theme.colors.ink}">${row}</text><line x1="180" y1="15" x2="690" y2="15" stroke="${index === 3 ? theme.colors.accent2 : theme.colors.muted}" stroke-width="3"/><line x1="180" y1="39" x2="690" y2="39" stroke="${theme.colors.muted}" stroke-opacity=".35" stroke-width="2"/></g>`).join('')}<g transform="translate(130 570)"><rect width="700" height="44" fill="${theme.colors.dark}" opacity=".92"/><text x="24" y="29" fill="${theme.colors.paper}" font-family="Arial" font-size="17">Criterio final: si no puedes medirlo, conviertelo en una accion mas pequena.</text></g><rect x="130" y="628" width="220" height="10" fill="${theme.colors.gold}"/><rect x="370" y="628" width="110" height="10" fill="${theme.colors.accent}"/><rect x="500" y="628" width="160" height="10" fill="${theme.colors.accent2}"/>`;
    return this.svgShell(theme, 1000, 720, body);
  }

  private mockup(theme: EditorialTheme) {
    const body = `<rect width="1000" height="620" fill="${theme.colors.paperAlt}"/><ellipse cx="500" cy="520" rx="260" ry="42" fill="#000" opacity=".14"/><path d="M350 140 L548 100 L548 470 L350 510 Z" fill="${theme.colors.accent}"/><path d="M548 100 L650 170 L650 520 L548 470 Z" fill="${theme.colors.gold}"/><rect x="390" y="200" width="110" height="12" fill="${theme.colors.paper}"/><rect x="390" y="232" width="85" height="8" fill="${theme.colors.paper}"/><circle cx="450" cy="335" r="54" fill="none" stroke="${theme.colors.accent2}" stroke-width="12"/><text x="500" y="575" text-anchor="middle" font-family="Georgia" font-size="30" fill="${theme.colors.ink}">Mockup comercial premium</text>`;
    return this.svgShell(theme, 1000, 620, body);
  }
}
