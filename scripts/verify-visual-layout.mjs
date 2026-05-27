import fs from 'node:fs/promises';

const api = 'http://localhost:3001/api';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json().catch(() => ({})) : await response.text();
  if (!response.ok) throw new Error(`${response.status} ${url}: ${typeof body === 'string' ? body : body.error || JSON.stringify(body)}`);
  return body;
}

const id = process.argv[2] || '35';

const render = await request(`${api}/projects/${id}/layout/render`, { method: 'POST', body: JSON.stringify({}) });
assert(render.report?.checks && Object.values(render.report.checks).every(Boolean), `Visual layout checks failed: ${JSON.stringify(render.report)}`);
assert(render.professionalReport?.status === 'APPROVED', `Professional report not approved: ${JSON.stringify(render.professionalReport)}`);
assert((render.report?.rhythm?.score || 0) >= 80, `Editorial rhythm score too low: ${JSON.stringify(render.report?.rhythm)}`);
assert(render.report?.pageCount >= 8, 'Visual layout has too few pages.');
assert(render.report?.assetCount >= 7, 'Visual layout has too few assets.');

const html = await request(`${api}/projects/${id}/preview`);
assert(html.includes('professional-layout'), 'Preview missing professional layout shell.');
assert(html.includes('book-cover'), 'Preview missing book cover shell.');
assert(html.includes('chapter-opener'), 'Preview missing chapter opener.');
assert(html.includes('figure-page'), 'Preview missing figure page.');
assert(!html.includes('**'), 'Preview exposes raw Markdown bold markers.');
assert(!html.includes('!['), 'Preview exposes Markdown image markers.');

const pdfResponse = await fetch(`${api}/projects/${id}/preview.pdf`);
assert(pdfResponse.ok, `Preview PDF download failed: ${pdfResponse.status}`);
const pdf = Buffer.from(await pdfResponse.arrayBuffer());
assert(pdf.subarray(0, 5).toString('ascii') === '%PDF-', 'Preview download is not a PDF.');
assert(pdf.length > 100_000, 'Preview PDF is unexpectedly small.');

if (render.htmlPath) {
  const stat = await fs.stat(render.htmlPath);
  assert(stat.size > 10_000, 'Rendered HTML is unexpectedly small.');
}

console.log(
  JSON.stringify(
    {
      projectId: Number(id),
      status: 'VISUAL_LAYOUT_APPROVED',
      pageCount: render.report.pageCount,
      assetCount: render.report.assetCount,
      score: render.report.score,
      previewPdfBytes: pdf.length,
    },
    null,
    2,
  ),
);
