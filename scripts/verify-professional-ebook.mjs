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

async function zipHas(zipPath, name) {
  const buffer = await fs.readFile(zipPath);
  return buffer.includes(Buffer.from(name));
}

const id = Number(process.argv[2] || 14);

const artDirection = await request(`${api}/projects/${id}/art-direction/apply`, {
  method: 'POST',
  body: JSON.stringify({}),
});
assert(artDirection?.styleKey, 'No active art direction style was returned.');
assert(Array.isArray(artDirection?.designPrinciples) && artDirection.designPrinciples.length >= 3, 'Art direction is too shallow.');

const render = await request(`${api}/projects/${id}/layout/render`, {
  method: 'POST',
  body: JSON.stringify({ themeKey: artDirection.styleKey }),
});
assert(render.professionalReport, 'Missing professional ebook report.');
assert(render.professionalReport.status === 'APPROVED', `Professional ebook report failed: ${JSON.stringify(render.professionalReport, null, 2)}`);
assert(render.professionalReport.score >= 80, `Professional score too low: ${render.professionalReport.score}`);

const pagesResponse = await request(`${api}/projects/${id}/layout/pages`);
const pages = pagesResponse.pages || [];
assert(pages.length >= 8, 'Not enough persisted editorial pages.');
for (const type of ['cover', 'title', 'toc', 'chapter-opener', 'reading-page', 'figure-page', 'worksheet', 'credits']) {
  assert(pages.some((page) => page.type === type), `Missing page type ${type}.`);
}
assert(pages.filter((page) => page.status === 'APPROVED').length >= 6, 'Too few approved pages.');

const html = await request(`${api}/projects/${id}/preview`);
for (const marker of ['professional-layout', 'book-cover', 'chapter-opener', 'figure-page', 'worksheet-page']) {
  assert(html.includes(marker), `Preview missing ${marker}.`);
}
assert(!html.includes('**'), 'Preview contains visible Markdown bold markers.');
assert(!html.includes('!['), 'Preview contains Markdown image syntax.');
assert(!/como modelo|inteligencia artificial|chatgpt|prompt/i.test(html), 'Preview leaks AI metatext.');

const pdfResponse = await fetch(`${api}/projects/${id}/preview.pdf`);
assert(pdfResponse.ok, `Preview PDF failed: ${pdfResponse.status}`);
const pdf = Buffer.from(await pdfResponse.arrayBuffer());
assert(pdf.subarray(0, 5).toString('ascii') === '%PDF-', 'Preview PDF is invalid.');
assert(pdf.length > 120_000, `Preview PDF is too small: ${pdf.length} bytes.`);

const project = await request(`${api}/projects/${id}/production-package`, {
  method: 'POST',
  body: JSON.stringify({ overrideReason: 'Professional ebook verifier refreshes the package after layout approval.' }),
});
const packagePath = project.exportPackages?.[0]?.filePath;
assert(packagePath, 'Production package was not generated.');
for (const required of ['visual_style.json', 'layout_report.json', 'page_approvals.json', 'professional_ebook_report.md']) {
  assert(await zipHas(packagePath, required), `Production ZIP missing ${required}.`);
}

console.log(
  JSON.stringify(
    {
      projectId: id,
      status: 'PROFESSIONAL_EBOOK_APPROVED',
      styleKey: artDirection.styleKey,
      score: render.professionalReport.score,
      pageCount: pages.length,
      approvedPages: pages.filter((page) => page.status === 'APPROVED').length,
      previewPdfBytes: pdf.length,
    },
    null,
    2,
  ),
);
