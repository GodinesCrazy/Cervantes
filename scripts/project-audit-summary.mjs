const response = await fetch(`http://localhost:3001/api/projects/${process.argv[2] || 35}`);
const project = await response.json();
const audit = project.auditReports?.[0];
console.log(JSON.stringify({
  audit: audit ? {
    overallScore: audit.overallScore,
    approvalStatus: audit.approvalStatus,
    issues: audit.issues,
    recommendations: audit.recommendations,
  } : null,
  gates: (project.phaseGates || [])
    .filter((gate) => ['blocks', 'audit'].includes(gate.phase))
    .map((gate) => ({ phase: gate.phase, status: gate.status, notes: gate.notes })),
}, null, 2));
