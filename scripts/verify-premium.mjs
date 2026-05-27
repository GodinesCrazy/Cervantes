import fs from 'node:fs/promises';
import path from 'node:path';

const api = 'http://localhost:3001/api';

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${response.status} ${url}: ${body.error || JSON.stringify(body)}`);
  }
  return body;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function exists(filePath, minSize = 500) {
  const stats = await fs.stat(filePath);
  assert(stats.size > minSize, `Archivo demasiado pequeno: ${filePath}`);
  return stats.size;
}

const idea =
  'Un ebook premium sobre runas para principiantes con enfoque practico, visual, ejercicios guiados, glosario y preparacion multidioma.';

let project = await request(`${api}/projects`, {
  method: 'POST',
  body: JSON.stringify({
    name: 'Proyecto en análisis',
    rawIdea: idea,
    topic: idea,
    audience: 'Por definir',
    tone: 'Premium practico',
  }),
});

assert(project.name === 'Proyecto en análisis', 'El proyecto no debe iniciar con nombre comercial definitivo.');

project = await request(`${api}/projects/${project.id}/idea`, {
  method: 'POST',
  body: JSON.stringify({ rawIdea: idea, topic: idea }),
});
assert(project.clarifications.length >= 5, 'Faltan preguntas de clarificacion.');

project = await request(`${api}/projects/${project.id}/market-research`, { method: 'POST', body: JSON.stringify({ userVerified: true }) });

for (const endpoint of [
  'language-opportunity',
  'go-nogo',
  'editorial-formula',
  'editorial-bible',
  'visual-bible',
  'chapter-plans',
  'blocks',
  'audit',
  'recovery',
  'metadata',
  'publishing-checklist',
]) {
  project = await request(`${api}/projects/${project.id}/${endpoint}`, { method: 'POST', body: JSON.stringify({}) });
}

assert(project.name !== 'Proyecto en análisis', 'El analisis de mercado no sugirio/aplico nombre comercial.');
assert(project.marketResearch?.recommendedTitle, 'Falta titulo comercial recomendado.');
assert(project.marketResearch?.suggestedTitles, 'Faltan alternativas de titulo comercial.');
const titleOptions = JSON.parse(project.marketResearch.suggestedTitles);
const titles = titleOptions
  .map((item) => (typeof item === 'string' ? item : item?.title))
  .filter((title) => typeof title === 'string' && title.trim())
  .map((title) => title.trim());
assert(titles.length >= 3, 'Faltan alternativas comerciales validas.');
assert(titles.every((title) => title.length <= 70), 'Hay titulos sugeridos demasiado largos para uso comercial.');
assert(titleOptions.every((item) => item.language && item.market && item.adaptation), 'Los titulos deben incluir idioma, mercado y adaptacion.');
assert(project.chapterPlans.length >= 6, 'El plan editorial debe tener estructura amplia.');
assert(project.manuscriptBlocks.length >= 6, 'Faltan bloques de manuscrito.');
assert(project.manuscriptBlocks.some((block) => block.content.includes('![Figura editorial')), 'Faltan figuras en el manuscrito.');
assert(project.manuscriptBlocks.some((block) => block.content.includes('| Criterio |')), 'Faltan tablas editoriales.');
assert(project.recoveryReports[0]?.masterManuscript.includes('Apendice B: Resumen en ingles'), 'Falta preparacion multidioma.');

for (const asset of project.visualAssets || []) {
  project = await request(`${api}/projects/${project.id}/visual-assets/${asset.id}`, {
    method: 'POST',
    body: JSON.stringify({ approvalStatus: 'APPROVED', status: 'APPROVED', rights: 'Verified for local private production.' }),
  });
}

for (const phase of [
  'idea',
  'research',
  'languages',
  'go-nogo',
  'formula',
  'editorial-bible',
  'visual-bible',
  'chapter-plan',
  'blocks',
  'audit',
  'recovery',
  'metadata',
  'publishing',
  'visual-assets',
  'preview',
  'export',
]) {
  project = await request(`${api}/projects/${project.id}/gates/${phase}`, {
    method: 'POST',
    body: JSON.stringify({ status: 'APPROVED', notes: 'Verified by premium script.' }),
  });
}

for (const format of ['md', 'docx', 'pdf', 'epub']) {
  project = await request(`${api}/projects/${project.id}/export/${format}`, { method: 'POST', body: JSON.stringify({}) });
}
project = await request(`${api}/projects/${project.id}/export/zip`, { method: 'POST', body: JSON.stringify({}) });

const previewResponse = await fetch(`${api}/projects/${project.id}/preview`);
const previewHtml = await previewResponse.text();
assert(previewResponse.ok, 'La vista previa HTML no responde correctamente.');
assert(previewHtml.includes('/api/projects/'), 'La vista previa no referencia assets servidos por API.');
assert(previewHtml.includes('Portada editorial'), 'La vista previa no contiene portada.');

const latestByFormat = new Map();
for (const build of project.formatBuilds) {
  if (!latestByFormat.has(build.format)) latestByFormat.set(build.format, build);
}

const md = latestByFormat.get('md');
const docx = latestByFormat.get('docx');
const pdf = latestByFormat.get('pdf');
const epub = latestByFormat.get('epub');
assert(md && docx && pdf && epub, 'No se generaron todos los formatos.');

const mdText = await fs.readFile(md.filePath, 'utf8');
assert(mdText.includes('Front matter'), 'Markdown sin front matter.');
assert(mdText.includes('assets/cover.svg'), 'Markdown sin portada.');
assert(mdText.includes('Apendice A: Checklist editorial'), 'Markdown sin checklist editorial.');
assert(mdText.includes('Apendice B: Resumen en ingles'), 'Markdown sin resumen en ingles.');

const sizes = {
  md: await exists(md.filePath),
  docx: await exists(docx.filePath),
  pdf: await exists(pdf.filePath),
  epub: await exists(epub.filePath),
  zip: await exists(project.exportPackages[0].filePath),
};

const assetDir = path.join(path.dirname(md.filePath), 'assets');
await exists(path.join(assetDir, 'cover.svg'));
await exists(path.join(assetDir, 'figure-map.svg'));
await exists(path.join(assetDir, 'quality-seal.svg'), 250);

console.log(
  JSON.stringify(
    {
      projectId: project.id,
      suggestedCommercialName: project.marketResearch.recommendedTitle,
      alternativeNames: titles,
      files: {
        md: md.filePath,
        docx: docx.filePath,
        pdf: pdf.filePath,
        epub: epub.filePath,
        zip: project.exportPackages[0].filePath,
      },
      sizes,
      premiumMvpChecks: {
        marketNamedAfterAnalysis: true,
        marketLocalizedNaming: true,
        integratedPreview: true,
        frontMatter: true,
        coverAndFigures: true,
        tablesAndExercises: true,
        multilingualAppendix: true,
        multiFormatExports: true,
      },
    },
    null,
    2,
  ),
);
