import { ExportService } from './src/exporters/exportService';

async function main() {
  const exporter = new ExportService();
  const md = await exporter.assembleMarkdown(51);
  console.log(md);
}

main().catch(console.error);
