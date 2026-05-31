import { FinalExportQualityReport } from './finalExportQualityGate';

export function sanitizeHtmlContent(html: string): { isClean: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const forbiddenPatterns = [
    { regex: /"(paragraph|table|checklist|summary|inline_image|expert_tip|case_study|exercise|requiresVerification)"\s*:/i, msg: 'Etiqueta de bloque interno JSON expuesta' },
    { regex: /"requiresVerification"\s*:\s*(true|false)/i, msg: 'Valor booleano de JSON detectado (true/false)' },
    { regex: /A detailed|A high-resolution|close-up photograph|Include labels/i, msg: 'Prompt de imagen en inglés detectado' },
    { regex: /Se reservan espacios|fotografías sugeridas|espacios reservados/i, msg: 'Placeholder editorial detectado' },
    { regex: /```json/i, msg: 'Bloque de código markdown JSON visible' }
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.regex.test(html)) {
      errors.push(`${pattern.msg}: ${html.match(pattern.regex)?.[0] || 'patrón'}`);
    }
  }

  // Comprobar si hay demasiados corchetes sueltos en el texto normal (indicador de tabla rota o JSON)
  const bracketCount = (html.match(/\[/g) || []).length;
  // Permitimos algunos corchetes para checkboxes [ ], pero no docenas.
  if (bracketCount > 50) {
    errors.push('Exceso de corchetes detectado, posible fuga de JSON o tabla rota');
  }

  return {
    isClean: errors.length === 0,
    errors
  };
}
