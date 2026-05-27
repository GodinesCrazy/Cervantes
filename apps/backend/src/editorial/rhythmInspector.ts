import type { LayoutDocument } from './layoutEngine';
import { EditorialRhythmEngine, type EditorialRhythmReport } from './rhythmEngine';

export class EditorialRhythmInspector {
  inspect(layout: LayoutDocument): EditorialRhythmReport {
    return new EditorialRhythmEngine().apply(layout).report;
  }
}
