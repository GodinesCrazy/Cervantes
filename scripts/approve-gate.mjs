const [projectId = '35', phase = 'blocks', ...noteParts] = process.argv.slice(2);
const notes = noteParts.join(' ') || 'Aprobado por verificacion local.';

const response = await fetch(`http://localhost:3001/api/projects/${projectId}/gates/${phase}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'APPROVED', notes }),
});

if (!response.ok) {
  console.error(await response.text());
  process.exit(1);
}

console.log(JSON.stringify({ status: 'APPROVED', projectId: Number(projectId), phase }, null, 2));
