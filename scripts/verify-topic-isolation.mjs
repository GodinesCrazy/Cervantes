import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  marketResearchTemplate,
  languageTemplate,
} = require('../apps/backend/dist/engines/templates.js');

const idea = 'Un ebook sobre el cuidado de tu perro';
const forbidden = ['runa', 'runas', 'runes', 'rúnico', 'runico'];

function assertNoForbidden(label, data) {
  const serialized = JSON.stringify(data).toLowerCase();
  for (const term of forbidden) {
    assert(!serialized.includes(term), `${label} leaked forbidden demo topic term: ${term}`);
  }
  assert(
    /perro|canin|dog|mascota/i.test(serialized),
    `${label} does not preserve the dog-care topic`,
  );
}

const market = await marketResearchTemplate(idea);
const language = await languageTemplate(idea);

assertNoForbidden('market-research', market.data);
assertNoForbidden('language-opportunity', language.data);

console.log(JSON.stringify({
  status: 'APPROVED',
  idea,
  checks: ['market-research', 'language-opportunity'],
}, null, 2));
