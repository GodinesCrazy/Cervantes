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

function sampleSvgDataUrl(label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720"><rect width="1200" height="720" fill="#101214"/><rect x="80" y="80" width="1040" height="560" fill="none" stroke="#d9bf67" stroke-width="8"/><circle cx="600" cy="310" r="145" fill="#3a7d7c"/><path d="M410 510 H790" stroke="#d95d39" stroke-width="24" stroke-linecap="round"/><text x="600" y="610" text-anchor="middle" fill="#f8f3ea" font-family="Arial" font-size="42">${label}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg.repeat(5)).toString('base64')}`;
}

const id = Number(process.argv[2] || 14);

let project = await request(`${api}/projects/${id}`);
if (!project.visualAssets?.length) {
  await request(`${api}/projects/${id}/layout/render`, { method: 'POST', body: JSON.stringify({}) });
  project = await request(`${api}/projects/${id}`);
}

const asset = project.visualAssets.find((item) => item.assetType === 'figure') || project.visualAssets[0];
assert(asset, 'No visual asset available for provider verification.');

const promptInfo = await request(`${api}/projects/${id}/visual-assets/${asset.id}/prompt`);
assert(promptInfo.prompt.includes('professional ebook visual asset'), 'Prompt does not include professional image direction.');
assert(promptInfo.prompt.includes(asset.name), 'Prompt does not mention the asset role/name.');

project = await request(`${api}/projects/${id}/visual-assets/${asset.id}/external-result`, {
  method: 'POST',
  body: JSON.stringify({
    dataUrl: sampleSvgDataUrl(asset.name),
    provider: 'puter',
    model: 'verifier-fixture',
    prompt: promptInfo.prompt,
    rights: 'Verifier fixture stored locally.',
  }),
});

const updated = project.visualAssets.find((item) => item.id === asset.id);
assert(updated.externalProvider === 'puter', 'External provider was not persisted.');
assert(updated.externalStatus === 'GENERATED', 'External generated status was not persisted.');
assert(updated.replacementPath?.includes('external-ai'), 'External replacement path was not persisted.');

const preview = await fetch(`${api}/projects/${id}/visual-assets/${asset.id}/preview.svg`);
assert(preview.ok, `External asset preview failed: ${preview.status}`);
const previewBody = await preview.text();
assert(previewBody.includes('<svg'), 'Preview did not serve the stored external fixture.');

project = await request(`${api}/projects/${id}/visual-assets/${asset.id}/external-fallback`, {
  method: 'POST',
  body: JSON.stringify({
    provider: 'puter',
    model: 'verifier-fixture',
    prompt: promptInfo.prompt,
    error: 'Verifier fallback path.',
  }),
});

const fallback = project.visualAssets.find((item) => item.id === asset.id);
assert(fallback.externalStatus === 'FALLBACK_USED', 'Fallback status was not persisted.');
assert(fallback.replacementPath?.includes('local-svg-fallback'), 'Fallback replacement metadata was not persisted.');

console.log(
  JSON.stringify(
    {
      projectId: id,
      status: 'AI_IMAGE_PROVIDER_READY',
      assetId: asset.id,
      provider: updated.externalProvider,
      fallback: fallback.externalStatus,
    },
    null,
    2,
  ),
);
