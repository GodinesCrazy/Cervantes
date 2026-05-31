import { validateFinalExportReadiness } from './src/services/validators/finalExportQualityGate';
import { ExportService } from './src/exporters/exportService';

async function main() {
  const projectId = 51; // Assuming project 51 based on the URL in screenshot
  const exporter = new ExportService();
  const markdown = await exporter.assembleMarkdown(projectId);
  const result = await validateFinalExportReadiness(projectId, markdown);
  console.log("FINAL EXPORT GATE RESULT:", JSON.stringify(result, null, 2));
}

main().catch(console.error);
