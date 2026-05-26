export type EditorialTheme = {
  key: string;
  variant: 'light-editorial' | 'dark-elegant' | 'technical-clean' | 'practical-visual';
  colors: {
    ink: string;
    muted: string;
    paper: string;
    paperAlt: string;
    dark: string;
    gold: string;
    accent: string;
    accent2: string;
    line: string;
  };
  typography: {
    display: string;
    body: string;
    sans: string;
  };
  density: 'balanced' | 'visual' | 'textual';
  ornament: 'classic' | 'minimal' | 'technical';
};

function readJsonObject(value?: string | null) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function text(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export class EditorialThemeEngine {
  static defaultTheme(): EditorialTheme {
    return {
      key: 'premium-editorial',
      variant: 'light-editorial',
      colors: {
        ink: '#191714',
        muted: '#675f51',
        paper: '#f3ead8',
        paperAlt: '#fbf7ed',
        dark: '#101214',
        gold: '#b79236',
        accent: '#2f6e6d',
        accent2: '#d95d39',
        line: '#c8b98d',
      },
      typography: {
        display: 'Georgia, "Times New Roman", serif',
        body: 'Georgia, "Times New Roman", serif',
        sans: 'Inter, Arial, sans-serif',
      },
      density: 'balanced',
      ornament: 'classic',
    };
  }

  static fromVisualBible(visualBible?: {
    visualConcept?: string | null;
    artDirection?: string | null;
    colorPalette?: string | null;
    typography?: string | null;
  } | null): EditorialTheme {
    const theme = EditorialThemeEngine.defaultTheme();
    const source = `${visualBible?.visualConcept || ''} ${visualBible?.artDirection || ''}`.toLowerCase();
    const palette = readJsonObject(visualBible?.colorPalette);
    const typography = readJsonObject(visualBible?.typography);

    if (source.includes('minimal') || source.includes('limpio') || source.includes('moderno')) {
      theme.variant = 'technical-clean';
      theme.ornament = 'minimal';
    }
    if (source.includes('oscuro') || source.includes('místico') || source.includes('mistico') || source.includes('lujo')) {
      theme.variant = 'dark-elegant';
      theme.ornament = 'classic';
      theme.colors.paper = '#e8ddc4';
      theme.colors.paperAlt = '#f5ecd8';
      theme.colors.dark = '#0d0e10';
    }
    if (source.includes('práctico') || source.includes('practico') || source.includes('visual')) {
      theme.variant = 'practical-visual';
      theme.density = 'visual';
    }

    theme.colors.accent = text(palette.primary) || theme.colors.accent;
    theme.colors.gold = text(palette.secondary) || theme.colors.gold;
    theme.colors.paperAlt = text(palette.background) || theme.colors.paperAlt;
    theme.colors.ink = text(palette.text) || theme.colors.ink;
    theme.typography.sans = text(typography.fontFamily) || theme.typography.sans;

    return theme;
  }
}
