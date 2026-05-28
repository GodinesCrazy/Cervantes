export type EditorialTheme = {
  key: string;
  variant:
    | 'light-editorial'
    | 'dark-elegant'
    | 'technical-clean'
    | 'practical-visual'
    | 'mystic-antique'
    | 'modern-clean'
    | 'dark-luxury'
    | 'educational-clear'
    | 'technical-professional'
    | 'pet-care-premium';
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
  ornament: 'classic' | 'minimal' | 'technical' | 'mystic' | 'academic';
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

  static styles(): EditorialTheme[] {
    const base = EditorialThemeEngine.defaultTheme();
    return [
      base,
      {
        ...base,
        key: 'pet-care-premium',
        variant: 'pet-care-premium',
        colors: {
          ...base.colors,
          ink: '#172322',
          muted: '#5a6862',
          paper: '#eef4ee',
          paperAlt: '#fffdf5',
          dark: '#163332',
          gold: '#d6a93a',
          accent: '#2f7b78',
          accent2: '#d9784a',
          line: '#bed5ca',
        },
        typography: { ...base.typography, body: 'Inter, Arial, sans-serif' },
        density: 'visual',
        ornament: 'minimal',
      },
      {
        ...base,
        key: 'mystic-antique',
        variant: 'mystic-antique',
        colors: {
          ...base.colors,
          ink: '#22180f',
          muted: '#6f5a3e',
          paper: '#d9c49b',
          paperAlt: '#f0dec0',
          dark: '#090806',
          gold: '#c79c42',
          accent: '#192d34',
          accent2: '#8f3f2d',
          line: '#9d7d45',
        },
        density: 'visual',
        ornament: 'mystic',
      },
      {
        ...base,
        key: 'modern-clean',
        variant: 'modern-clean',
        colors: {
          ...base.colors,
          ink: '#151719',
          muted: '#5d6668',
          paper: '#f5f4ef',
          paperAlt: '#ffffff',
          dark: '#11181b',
          gold: '#c4a348',
          accent: '#2c7a7b',
          accent2: '#d65f45',
          line: '#d8dedb',
        },
        typography: { ...base.typography, body: 'Inter, Arial, sans-serif' },
        ornament: 'minimal',
      },
      {
        ...base,
        key: 'practical-visual',
        variant: 'practical-visual',
        colors: {
          ...base.colors,
          ink: '#132020',
          muted: '#536361',
          paper: '#eef3ef',
          paperAlt: '#fbfdfb',
          dark: '#102224',
          gold: '#d6b64e',
          accent: '#267572',
          accent2: '#d86a45',
          line: '#bfd3cc',
        },
        density: 'visual',
        ornament: 'minimal',
      },
      {
        ...base,
        key: 'dark-luxury',
        variant: 'dark-luxury',
        colors: {
          ...base.colors,
          ink: '#f3ead8',
          muted: '#c3b18b',
          paper: '#171514',
          paperAlt: '#211d19',
          dark: '#070707',
          gold: '#d0a849',
          accent: '#385f60',
          accent2: '#a34e35',
          line: '#5e4b24',
        },
        density: 'visual',
        ornament: 'classic',
      },
      {
        ...base,
        key: 'educational-clear',
        variant: 'educational-clear',
        colors: {
          ...base.colors,
          ink: '#1a2329',
          muted: '#53616b',
          paper: '#f2f5f4',
          paperAlt: '#ffffff',
          dark: '#14323a',
          gold: '#c7a33a',
          accent: '#2d7a95',
          accent2: '#d66a4a',
          line: '#cad8dc',
        },
        ornament: 'academic',
      },
      {
        ...base,
        key: 'technical-professional',
        variant: 'technical-professional',
        colors: {
          ...base.colors,
          ink: '#182125',
          muted: '#5c676c',
          paper: '#eef0ee',
          paperAlt: '#fafafa',
          dark: '#10171a',
          gold: '#b99d4a',
          accent: '#1f6d79',
          accent2: '#b9573c',
          line: '#c7d0d2',
        },
        typography: { ...base.typography, body: 'Inter, Arial, sans-serif' },
        density: 'textual',
        ornament: 'technical',
      },
    ];
  }

  static styleByKey(key?: string | null) {
    return EditorialThemeEngine.styles().find((style) => style.key === key) || EditorialThemeEngine.defaultTheme();
  }

  static recommend(topic?: string | null, visualConcept?: string | null) {
    const source = `${topic || ''} ${visualConcept || ''}`.toLowerCase();
    if (/(perr|canin|mascota|veterin|pet care|dog care|dog\b|cachorro)/i.test(source)) return 'pet-care-premium';
    if (/(runa|luna|tarot|astrolog|mist|ritual|espiritual)/i.test(source)) return 'mystic-antique';
    if (/(tecnico|software|programacion|datos|finanzas|sistema)/i.test(source)) return 'technical-professional';
    if (/(educacion|curso|estudiante|aprender|guia)/i.test(source)) return 'educational-clear';
    if (/(lujo|premium oscuro|exclusivo)/i.test(source)) return 'dark-luxury';
    if (/(visual|practico|paso a paso|checklist)/i.test(source)) return 'practical-visual';
    return 'premium-editorial';
  }

  static fromVisualBible(visualBible?: {
    visualConcept?: string | null;
    artDirection?: string | null;
    colorPalette?: string | null;
    typography?: string | null;
  } | null): EditorialTheme {
    const theme = EditorialThemeEngine.styleByKey(
      EditorialThemeEngine.recommend(visualBible?.visualConcept, visualBible?.artDirection),
    );
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
