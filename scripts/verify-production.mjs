import fs from 'node:fs/promises';

const api = 'http://localhost:3001/api';

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${response.status} ${url}: ${body.error || JSON.stringify(body)}`);
  return body;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fileContainsZipName(zipPath, name) {
  const buffer = await fs.readFile(zipPath);
  return buffer.includes(Buffer.from(name));
}

const idea = 'Un ebook premium sobre runas para principiantes con enfoque practico, visual, ejercicios guiados, glosario y preparacion multidioma.';
let project = await request(`${api}/projects`, {
  method: 'POST',
  body: JSON.stringify({ name: 'Proyecto en análisis', rawIdea: idea, topic: idea, audience: 'Por definir', tone: 'Premium practico' }),
});

project = await request(`${api}/projects/${project.id}/idea`, { method: 'POST', body: JSON.stringify({ rawIdea: idea, topic: idea }) });
project = await request(`${api}/projects/${project.id}/market-research`, { method: 'POST', body: JSON.stringify({ userVerified: true, sourceNotes: 'Competitor and pricing notes verified manually for local production.' }) });

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

for (const asset of project.visualAssets || []) {
  project = await request(`${api}/projects/${project.id}/visual-assets/${asset.id}`, {
    method: 'POST',
    body: JSON.stringify({ approvalStatus: 'APPROVED', status: 'APPROVED', rights: 'Approved or replaceable local production asset.' }),
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
]) {
  project = await request(`${api}/projects/${project.id}/gates/${phase}`, {
    method: 'POST',
    body: JSON.stringify({ status: 'APPROVED', notes: 'Production verification approved.' }),
  });
}

for (const format of ['md', 'docx', 'pdf', 'epub']) {
  project = await request(`${api}/projects/${project.id}/export/${format}`, { method: 'POST', body: JSON.stringify({}) });
}

let quality = await request(`${api}/projects/${project.id}/quality`);
assert(quality.manuscript?.status === 'APPROVED', `Manuscript not approved: ${JSON.stringify(quality)}`);
assert(quality.gates?.status === 'APPROVED', `Gates not approved: ${JSON.stringify(quality)}`);
assert(quality.kdp?.status === 'APPROVED', `KDP not approved: ${JSON.stringify(quality)}`);

project = await request(`${api}/projects/${project.id}/production-package`, { method: 'POST', body: JSON.stringify({}) });
quality = await request(`${api}/projects/${project.id}/quality`);
assert(quality.status === 'APPROVED', `Final quality not approved: ${JSON.stringify(quality)}`);

assert(project.publicationReadiness?.status === 'APPROVED', 'Publication readiness is not approved.');
assert(project.exportPackages?.[0]?.filePath, 'Final production package missing.');

const zipPath = project.exportPackages[0].filePath;
for (const required of [
  'ebook_premium.pdf',
  'ebook_reflowable.epub',
  'ebook_editable.docx',
  'manuscript_master.md',
  'cover_front.svg',
  'gumroad_product_page.md',
  'kdp_publication_checklist.md',
  'metadata.json',
  'ai_declaration.md',
  'quality_report.md',
  'visual_style.json',
  'layout_report.json',
  'page_approvals.json',
  'professional_ebook_report.md',
]) {
  assert(await fileContainsZipName(zipPath, required), `Final ZIP missing ${required}`);
}

const previewResponse = await fetch(`${api}/projects/${project.id}/preview`);
const previewHtml = await previewResponse.text();
assert(previewResponse.ok && previewHtml.includes('Portada editorial'), 'Preview is not production ready.');

console.log(
  JSON.stringify(
    {
      projectId: project.id,
      status: 'GO_OPERATIVO_LOCAL_PRIVADO',
      finalPackage: zipPath,
      qualityStatus: quality.status,
      kdpStatus: quality.kdp.status,
      gumroadStatus: quality.gumroad.status,
      requiredZipFilesVerified: true,
    },
    null,
    2,
  ),
);
