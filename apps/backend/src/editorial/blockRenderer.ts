import { ChapterData } from './schema';

function escapeHtml(value: string) {
  if (!value) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderChapterToHtml(chapter: ChapterData): string {
  const html: string[] = [];

  // Title page of chapter
  html.push(`<section class="chapter-page">`);
  html.push(`<p class="chapter-label">Capítulo</p>`);
  html.push(`<h1>${escapeHtml(chapter.chapterTitle)}</h1>`);
  if (chapter.objective) {
    html.push(`<p class="kicker">Objetivo: ${escapeHtml(chapter.objective)}</p>`);
  }
  if (chapter.opening) {
    html.push(`<p class="opening-text">${escapeHtml(chapter.opening)}</p>`);
  }
  html.push(`</section>`);

  // We start a new section for blocks
  let pageOpen = false;
  const openPage = (className = '') => {
    if (pageOpen) html.push(`</section>`);
    html.push(`<section class="book-page ${className}">`);
    pageOpen = true;
  };

  openPage();

  for (const block of chapter.blocks) {
    if (block.type === 'paragraph') {
      html.push(`<p>${escapeHtml(block.text)}</p>`);
    } else if (block.type === 'checklist') {
      if (block.heading) html.push(`<h2>${escapeHtml(block.heading)}</h2>`);
      html.push(`<div class="checklist-block">`);
      for (const item of block.items) {
        html.push(`<p class="bullet"><span>•</span>${escapeHtml(item)}</p>`);
      }
      html.push(`</div>`);
    } else if (block.type === 'table') {
      if (block.heading) html.push(`<h2>${escapeHtml(block.heading)}</h2>`);
      html.push(`<table><tr>`);
      for (const col of block.columns) {
        html.push(`<td><strong>${escapeHtml(col)}</strong></td>`);
      }
      html.push(`</tr>`);
      for (const row of block.rows) {
        html.push(`<tr>`);
        for (const cell of row) {
          html.push(`<td>${escapeHtml(cell)}</td>`);
        }
        html.push(`</tr>`);
      }
      html.push(`</table>`);
    } else if (block.type === 'expert_tip') {
      html.push(`<aside class="expert-tip">`);
      if (block.heading) html.push(`<h3>${escapeHtml(block.heading)}</h3>`);
      html.push(`<p>${escapeHtml(block.body)}</p>`);
      if (block.source) {
        html.push(`<p class="source">Fuente: ${escapeHtml(block.source)}${block.requiresVerification ? ' (Requiere verificación)' : ''}</p>`);
      }
      html.push(`</aside>`);
    } else if (block.type === 'case_study') {
      html.push(`<aside class="case-study">`);
      if (block.heading) html.push(`<h2>${escapeHtml(block.heading)}</h2>`);
      html.push(`<p><strong>Situación:</strong> ${escapeHtml(block.situation)}</p>`);
      html.push(`<p><strong>Decisión:</strong> ${escapeHtml(block.decision)}</p>`);
      html.push(`<p><strong>Resultado:</strong> ${escapeHtml(block.result)}</p>`);
      html.push(`</aside>`);
    } else if (block.type === 'exercise') {
      html.push(`<div class="exercise-block">`);
      if (block.heading) html.push(`<h2>${escapeHtml(block.heading)}</h2>`);
      html.push(`<p>${escapeHtml(block.instructions)}</p>`);
      html.push(`<ul>`);
      for (const field of block.fields) {
        html.push(`<li><strong>${escapeHtml(field)}:</strong> _______________</li>`);
      }
      html.push(`</ul>`);
      html.push(`</div>`);
    } else if (block.type === 'inline_image') {
      html.push(`<figure class="inline-figure">`);
      const imgSrc = block.localUrl || 'https://via.placeholder.com/800x400?text=Generando+Imagen...';
      html.push(`<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(block.caption || 'Ilustración')}">`);
      if (block.caption) {
        html.push(`<figcaption>${escapeHtml(block.caption)}</figcaption>`);
      }
      html.push(`</figure>`);
    }
  }

  // Summary & Action closing page
  openPage('summary-page');
  html.push(`<h2>Resumen del Capítulo</h2>`);
  html.push(`<p>${escapeHtml(chapter.summary)}</p>`);
  
  if (chapter.action_closing) {
    html.push(`<div class="action-closing">`);
    html.push(`<h3>Cierre Accionable</h3>`);
    html.push(`<p><strong>Idea Clave:</strong> ${escapeHtml(chapter.action_closing.key_idea)}</p>`);
    html.push(`<p><strong>Acción para hoy:</strong> ${escapeHtml(chapter.action_closing.today_action)}</p>`);
    html.push(`<p><strong>Error común:</strong> ${escapeHtml(chapter.action_closing.common_error)}</p>`);
    html.push(`<p><strong>Pregunta:</strong> ${escapeHtml(chapter.action_closing.follow_up_question)}</p>`);
    html.push(`</div>`);
  }

  if (chapter.references && chapter.references.length > 0) {
    html.push(`<h3>Referencias</h3><ul>`);
    for (const ref of chapter.references) {
      html.push(`<li>${escapeHtml(ref.title)} - ${escapeHtml(ref.source)} ${ref.verified ? '✓' : '(No verificada)'}</li>`);
    }
    html.push(`</ul>`);
  }

  if (pageOpen) html.push(`</section>`);

  return html.join('\n');
}
