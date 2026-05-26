import type { LayoutDocument, LayoutPage } from './layoutEngine';
import type { EditorialTheme } from './themeEngine';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function assetUrl(role: string, assetBase: string) {
  return `${assetBase}/${role}.svg`;
}

function renderPage(page: LayoutPage, assetBase: string) {
  if (page.type === 'cover') {
    return `<section class="book-cover" data-page-type="cover" aria-label="Portada editorial"><img src="${assetUrl('cover', assetBase)}" alt="Portada editorial premium"></section>`;
  }
  if (page.type === 'title') {
    return `<section class="book-page title-page" data-page-type="title"><p class="kicker">Edicion premium</p><h1>${inline(page.title)}</h1><h2>${inline(page.subtitle || '')}</h2><img class="separator-art" src="${assetUrl('separator', assetBase)}" alt=""></section>`;
  }
  if (page.type === 'toc') {
    return `<section class="book-page toc-page" data-page-type="toc"><p class="kicker">Mapa de lectura</p><h1>${inline(page.title)}</h1><img class="icon-strip" src="${assetUrl('icons', assetBase)}" alt="Iconografia editorial"><ol>${page.content.map((item) => `<li>${inline(item)}</li>`).join('')}</ol></section>`;
  }
  if (page.type === 'chapter-opener') {
    return `<section class="book-page chapter-opener" data-page-type="chapter-opener"><img class="chapter-art" src="${assetUrl('chapter-opener', assetBase)}" alt="Apertura de capitulo"><p class="chapter-label">Capitulo ${page.chapterNumber || ''}</p><h1>${inline(page.title)}</h1><p class="standfirst">${inline(page.subtitle || '')}</p></section>`;
  }
  if (page.type === 'figure-page') {
    return `<section class="book-page figure-page" data-page-type="figure-page"><p class="kicker">Figura editorial</p><h1>${inline(page.title)}</h1><figure><img src="${assetUrl('figure-map', assetBase)}" alt="Mapa conceptual"><figcaption>${inline(page.subtitle || 'Mapa visual')}</figcaption></figure>${page.content.map((item) => `<p>${inline(item)}</p>`).join('')}</section>`;
  }
  if (page.type === 'worksheet') {
    return `<section class="book-page worksheet-page" data-page-type="worksheet"><p class="kicker">Aplicacion</p><h1>${inline(page.title)}</h1><img class="worksheet-art" src="${assetUrl('worksheet', assetBase)}" alt="Worksheet imprimible">${page.content.map((item) => `<p class="bullet"><span></span>${inline(item)}</p>`).join('')}</section>`;
  }
  if (page.type === 'appendix') {
    return `<section class="book-page appendix-page" data-page-type="appendix"><p class="kicker">Apendice</p><h1>${inline(page.title)}</h1><div class="check-grid">${page.content.map((item) => `<div>${inline(item)}</div>`).join('')}</div></section>`;
  }
  if (page.type === 'credits') {
    return `<section class="book-page credits-page" data-page-type="credits"><p class="kicker">Cierre</p><h1>${inline(page.title)}</h1><img class="mockup-art" src="${assetUrl('mockup', assetBase)}" alt="Mockup editorial">${page.content.map((item) => `<p>${inline(item)}</p>`).join('')}</section>`;
  }
  return `<section class="book-page reading-page" data-page-type="reading-page"><p class="chapter-label">Capitulo ${page.chapterNumber || ''}</p><h1>${inline(page.title)}</h1><img class="separator-inline" src="${assetUrl('separator', assetBase)}" alt="">${page.content.map((item) => `<p>${inline(item)}</p>`).join('')}</section>`;
}

function css(theme: EditorialTheme) {
  return `
@page{size:A4;margin:0}
:root{--ink:${theme.colors.ink};--muted:${theme.colors.muted};--gold:${theme.colors.gold};--accent:${theme.colors.accent};--accent2:${theme.colors.accent2};--paper:${theme.colors.paper};--paper2:${theme.colors.paperAlt};--dark:${theme.colors.dark};--line:${theme.colors.line}}
*{box-sizing:border-box}
body{margin:0;background:#141414;color:var(--ink);font-family:${theme.typography.body};line-height:1.54}
.book-cover,.book-page{position:relative;width:210mm;min-height:297mm;margin:0 auto 18px;background:var(--paper2);box-shadow:0 20px 54px rgba(0,0,0,.35);overflow:hidden;break-after:page}
.book-cover{background:var(--dark)}
.book-cover img{display:block;width:100%;height:100%;object-fit:cover}
.book-page{padding:25mm 24mm 22mm;background:radial-gradient(circle at 20% 12%,rgba(255,255,255,.86),rgba(255,255,255,0) 34%),linear-gradient(90deg,rgba(0,0,0,.045),transparent 24mm),var(--paper)}
.book-page:before{content:"";position:absolute;inset:9mm;border:1px solid rgba(183,146,54,.48);pointer-events:none}
.book-page:after{content:"Cervantes";position:absolute;top:10mm;left:24mm;right:24mm;border-bottom:1px solid rgba(25,23,20,.2);padding-bottom:3mm;text-align:center;font:11px ${theme.typography.sans};letter-spacing:2px;text-transform:uppercase;color:var(--muted)}
h1{font-size:35px;line-height:1.08;margin:9mm 0 6mm;color:var(--ink);text-wrap:balance}
h2{font-size:22px;line-height:1.2;margin:6mm 0;color:#28231b}
h2:after{content:"";display:block;width:30mm;height:1px;background:var(--gold);margin-top:3mm}
p{font-size:14.2px;margin:0 0 4.2mm;max-width:144mm}
strong{font-weight:700;color:#111}em{color:var(--muted)}
.kicker,.chapter-label{font:700 12px ${theme.typography.sans};letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin:0 0 7mm}
.title-page{display:grid;align-content:center;text-align:center;background:linear-gradient(180deg,var(--dark),#1f2827)}
.title-page:before{border-color:rgba(183,146,54,.62)}.title-page:after{color:var(--gold);border-color:rgba(183,146,54,.32)}
.title-page h1{font-size:54px;color:var(--paper2);max-width:142mm;margin:0 auto 7mm}
.title-page h2{color:#e6d3a6;max-width:132mm;margin:0 auto}.title-page h2:after{margin-left:auto;margin-right:auto}
.separator-art{width:130mm;margin:10mm auto 0;display:block}.icon-strip{width:100%;margin:0 0 8mm;border:2px solid var(--gold)}
.toc-page ol{display:grid;gap:4mm;margin:0;padding:0;list-style:none}.toc-page li{border-bottom:1px solid var(--line);padding:3mm 0;font-size:18px}
.chapter-opener{display:grid;align-content:end;background:var(--dark);color:var(--paper2)}.chapter-opener:before{border-color:rgba(183,146,54,.7)}.chapter-opener:after{color:var(--gold);border-color:rgba(183,146,54,.32)}
.chapter-opener h1{color:var(--paper2);font-size:48px}.chapter-opener .standfirst{color:#e6d3a6;font-size:18px}.chapter-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.58}
.reading-page p:nth-of-type(2)::first-letter{float:left;font-size:56px;line-height:.85;padding:4px 8px 0 0;color:var(--gold)}
.separator-inline{width:100%;height:24mm;object-fit:cover;margin:-2mm 0 4mm}
figure{margin:8mm 0;text-align:center;break-inside:avoid}figure img{max-width:100%;border:2px solid var(--gold);box-shadow:0 14px 34px rgba(29,25,17,.18)}figcaption{font:12px ${theme.typography.sans};color:var(--muted);margin-top:3mm}
.worksheet-art,.mockup-art{width:100%;max-height:132mm;object-fit:contain;margin:4mm 0 7mm;border:1px solid var(--line);background:white}
.bullet{display:grid;grid-template-columns:6mm 1fr;gap:3mm;padding:3mm 0 3mm 4mm;border-left:2px solid var(--gold);background:rgba(255,255,255,.42)}.bullet span{width:13px;height:13px;border:2px solid var(--accent);margin-top:2px}
.check-grid{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.check-grid div{border:1px solid var(--line);background:rgba(255,255,255,.48);padding:6mm;font-size:16px}
.appendix-page,.credits-page{background:linear-gradient(180deg,#f7f0e3,#efe2c9)}
@media screen{body{padding:18px 0}.book-cover,.book-page{max-width:min(92vw,210mm)}}
@media print{body{background:white}.book-cover,.book-page{margin:0;box-shadow:none}}
`;
}

export class EditorialHtmlRenderer {
  render(layout: LayoutDocument, assetBase = 'assets') {
    const pages = layout.pages.map((page) => renderPage(page, assetBase)).join('\n');
    return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(layout.title)}</title><style>${css(layout.theme)}</style></head><body data-theme="${layout.theme.key}" data-variant="${layout.theme.variant}">${pages}</body></html>`;
  }
}
