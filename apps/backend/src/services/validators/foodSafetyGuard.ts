export function auditFoodSafety(text: string): { isSafe: boolean; errors: string[] } {
  const errors: string[] = [];
  const lower = text.toLowerCase();

  // Reglas de moho y contaminación
  if (lower.includes('moho') || lower.includes('contamina') || lower.includes('blanca')) {
    if (lower.includes('retirar') && (lower.includes('continuar') || lower.includes('consumir') || lower.includes('seguir'))) {
      errors.push('Recomendación peligrosa: sugiere retirar moho y continuar el lote sin protocolo de descarte estricto.');
    }
  }

  // Claims médicos
  const medicalClaims = [
    'cura el cáncer', 'previene el cáncer', 'cura enfermedades', 
    'reduce inflamación sistémica', 'fortalece respuesta inmune',
    'cura la diabetes', 'elimina toxinas'
  ];
  for (const claim of medicalClaims) {
    if (lower.includes(claim)) {
      errors.push(`Claim médico sin respaldo detectado: ${claim}`);
    }
  }

  // Datos técnicos sin fuentes (básico)
  if (lower.includes('estudios demuestran') && !lower.includes('según')) {
    errors.push('Uso de "estudios demuestran" sin citar una fuente.');
  }

  return {
    isSafe: errors.length === 0,
    errors
  };
}
