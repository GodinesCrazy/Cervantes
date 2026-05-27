const api = 'http://localhost:3001/api';
const id = Number(process.argv[2] || 35);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, options = {}) {
  const response = await fetch(`${api}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${response.status} ${path}: ${body.error || JSON.stringify(body)}`);
  return body;
}

const applied = await request(`/projects/${id}/layout/rhythm/apply`, { method: 'POST', body: JSON.stringify({}) });
assert(applied.report, 'Missing rhythm report.');
assert(applied.report.score >= 70, `Rhythm score too low: ${applied.report.score}`);
assert(applied.pages >= 8, 'Rhythm layout did not generate enough pages.');

const { pages } = await request(`/projects/${id}/layout/pages`);
assert(Array.isArray(pages) && pages.length === applied.pages, 'Persisted page count does not match rhythm output.');
assert(pages.some((page) => page.type === 'case-study'), 'Missing case-study page.');
assert(pages.some((page) => page.type === 'comparison-table'), 'Missing comparison-table page.');
assert(pages.some((page) => page.type === 'chapter-summary'), 'Missing chapter-summary page.');
assert(!pages.some((page) => /\/\s*continuaci[oó]n|continuacion/i.test(page.title)), 'Mechanical continuation title found.');
assert(!pages.some((page) => page.type.includes('reading') && Number(page.words || page.wordCount || 0) > 620), 'A reading page exceeds 620 words.');

const report = await request(`/projects/${id}/layout/rhythm/report`);
assert(report.checks?.noMechanicalTitles, 'Rhythm report flags mechanical titles.');

console.log(JSON.stringify({
  projectId: id,
  status: 'EDITORIAL_RHYTHM_VERIFIED',
  score: applied.report.score,
  pageCount: applied.pages,
  targetRange: applied.report.targetRange,
}, null, 2));
