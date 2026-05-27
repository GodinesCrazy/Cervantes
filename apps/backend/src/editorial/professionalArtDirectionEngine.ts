import { EditorialThemeEngine, type EditorialTheme } from './themeEngine';

type ProjectArtContext = {
  name: string;
  idea?: { rawIdea?: string | null; baseLanguage?: string | null } | null;
  marketResearch?: { niche?: string | null; audience?: string | null; language?: string | null; recommendedTitle?: string | null } | null;
  visualBible?: { visualConcept?: string | null; artDirection?: string | null } | null;
};

export type ArtDirectionReport = {
  status: 'APPROVED';
  styleKey: string;
  theme: EditorialTheme;
  rationale: string;
  audience: string;
  marketLanguage: string;
  designPrinciples: string[];
  pageStrategy: Record<string, string>;
};

export class ProfessionalArtDirectionEngine {
  choose(project: ProjectArtContext, preferredStyle?: string | null): ArtDirectionReport {
    const source = [
      project.name,
      project.idea?.rawIdea,
      project.marketResearch?.niche,
      project.visualBible?.visualConcept,
      project.visualBible?.artDirection,
    ]
      .filter(Boolean)
      .join(' ');
    const styleKey = preferredStyle || EditorialThemeEngine.recommend(source, project.visualBible?.artDirection);
    const theme = EditorialThemeEngine.styleByKey(styleKey);
    const audience = project.marketResearch?.audience || 'Lectores que buscan una guía clara, visual y editorialmente cuidada.';
    return {
      status: 'APPROVED',
      styleKey: theme.key,
      theme,
      rationale: `Estilo ${theme.key} seleccionado por encaje entre nicho, promesa visual, audiencia y mercado.`,
      audience,
      marketLanguage: project.marketResearch?.language || project.idea?.baseLanguage || 'es',
      designPrinciples: [
        'Portada con señal comercial fuerte y composición de libro, no de presentación.',
        'Aperturas de capítulo con atmósfera, ornamento y jerarquía de lectura.',
        'Páginas interiores con ritmo editorial: texto, láminas, figuras y worksheets.',
        'Assets coherentes por paleta, textura, iconografía y densidad visual.',
      ],
      pageStrategy: {
        cover: 'Impacto comercial y símbolo central memorable.',
        title: 'Respiración editorial y legitimidad visual.',
        toc: 'Mapa visual escaneable.',
        chapter: 'Entrada inmersiva por capítulo.',
        reading: 'Lectura cómoda con jerarquía, capitulares y llamadas visuales.',
        figure: 'Láminas explicativas con valor gráfico real.',
        worksheet: 'Aplicación práctica lista para imprimir.',
      },
    };
  }
}
