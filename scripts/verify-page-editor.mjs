const BASE_URL = 'http://localhost:3001/api';

async function request(endpoint, method = 'GET', body = null) {
  const options = { method, headers: {} };
  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function run() {
  console.log('Verificando Premium Editorial Page Builder...');

  const projectId = Number(process.argv[2] || 14);

  // 1. Render layout to ensure we have pages
  console.log('1. Renderizando layout base...');
  await request(`/projects/${projectId}/layout/render`, 'POST');

  // 2. Fetch pages
  console.log('2. Listando páginas del layout...');
  const { pages } = await request(`/projects/${projectId}/layout/pages`);
  
  if (!pages || pages.length === 0) {
    throw new Error('No se encontraron páginas en el layout');
  }
  console.log(`${pages.length} paginas encontradas.`);

  // 3. Change template
  const targetPage = pages.find(p => p.type === 'reading-page') || pages[0];
  console.log(`3. Cambiando plantilla de página ${targetPage.id}...`);
  await request(`/projects/${projectId}/layout/pages/${targetPage.id}/template`, 'POST', { template: 'worksheet' });
  
  const { pages: updatedPages1 } = await request(`/projects/${projectId}/layout/pages`);
  const changedPage = updatedPages1.find(p => p.id === targetPage.id);
  if (changedPage.type !== 'worksheet') throw new Error('El cambio de plantilla falló.');
  console.log('Plantilla cambiada a worksheet.');

  // 4. Regenerate page
  console.log(`4. Regenerando página ${targetPage.id}...`);
  await request(`/projects/${projectId}/layout/pages/${targetPage.id}/regenerate`, 'POST');
  const { pages: updatedPages2 } = await request(`/projects/${projectId}/layout/pages`);
  const regenPage = updatedPages2.find(p => p.id === targetPage.id);
  if (regenPage.variant <= targetPage.variant) throw new Error('La regeneración falló (la variante no incrementó).');
  console.log('Pagina regenerada exitosamente.');

  // 5. Approve page
  console.log(`5. Aprobando página ${targetPage.id}...`);
  await request(`/projects/${projectId}/layout/pages/${targetPage.id}/approve`, 'POST');
  const { pages: updatedPages3 } = await request(`/projects/${projectId}/layout/pages`);
  const approvedPage = updatedPages3.find(p => p.id === targetPage.id);
  if (approvedPage.status !== 'APPROVED') throw new Error('La aprobación falló.');
  console.log('Pagina aprobada.');

  // 6. List styles
  console.log('6. Listando estilos premium...');
  const { styles } = await request(`/projects/${projectId}/layout/styles`);
  if (!styles || styles.length < 7) throw new Error('Faltan estilos premium.');
  console.log(`${styles.length} estilos encontrados.`);

  console.log('Todas las verificaciones del Page Builder pasaron exitosamente.');
}

run().catch(err => {
  console.error('Error de verificacion:', err.message);
  process.exit(1);
});
