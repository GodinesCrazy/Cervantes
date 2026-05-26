# Cervantes — Fábrica Personal de eBooks Premium

> Transforma una idea simple en un producto editorial completo, premium, comercialmente competitivo y listo para publicar.

## 🎯 ¿Qué es Cervantes?

Cervantes es una aplicación **mono-usuario privada** diseñada para la producción editorial profesional de eBooks. Desde una idea inicial, guía al usuario por un pipeline completo de 16 fases hasta generar un paquete de publicación listo para plataformas como Amazon KDP, Gumroad, Shopify y Draft2Digital.

## ✨ Características principales

- **Pipeline editorial completo**: Idea → Investigación → Fórmula → Biblia → Manuscrito → Exportación
- **13 motores especializados**: Cada fase tiene su propio engine de generación
- **IA con fallback inteligente**: OpenAI → Gemini → Groq → Plantillas
- **Exportación premium**: Markdown, DOCX, PDF premium, EPUB, ZIP
- **Investigación de mercado**: Análisis de nicho, competencia, score GO/NO-GO
- **Análisis de idiomas**: Recomendación del idioma más rentable
- **Auditoría editorial**: Control de calidad por bloques
- **Compliance**: Declaración de IA, checklist por plataforma

## 🚀 Inicio rápido

### Requisitos
- Node.js 18+ (recomendado 22+)
- npm 9+

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/GodinesCrazy/Cervantes.git
cd Cervantes

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus API keys (opcional - funciona sin ellas)

# Crear base de datos
npm run db:push

# Iniciar en modo desarrollo
npm run dev
```

### Acceder a la aplicación
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## ⚙️ Configuración de IA

Cervantes soporta múltiples proveedores de IA en cadena de fallback:

| Prioridad | Provider | Variable | Notas |
|-----------|----------|----------|-------|
| 1 | OpenAI | `OPENAI_API_KEY` | GPT-4o, mejor calidad |
| 2 | Google Gemini | `GEMINI_API_KEY` | Gratuito con límites |
| 3 | Groq | `GROQ_API_KEY` | Gratuito, rápido |
| 4 | Plantillas | — | Sin API, modo manual |

Si no se configura ninguna API key, la aplicación funciona completamente en **modo plantilla**, generando estructuras y guías que el usuario puede completar manualmente.

## 📁 Estructura del proyecto

```
C:/Cervantes/
├── apps/
│   ├── frontend/          # React + Vite + TypeScript
│   └── backend/           # Express + TypeScript
├── prisma/
│   └── schema.prisma      # Modelo de datos (SQLite)
├── storage/               # Almacenamiento local
│   ├── projects/
│   ├── exports/
│   ├── covers/
│   └── assets/
├── docs/                  # Documentación de investigación
└── prompts/               # Prompts del proyecto
```

## 🏗️ Stack tecnológico

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Base de datos**: SQLite con Prisma ORM
- **Exportación**: docx, Puppeteer (PDF), epub-gen-redone, archiver (ZIP)
- **IA**: Abstracción multi-provider con fallback automático

## 📚 Documentación

- [Guía de usuario](docs/USER_GUIDE.md)
- [Reporte de desarrollo](docs/DEVELOPMENT_REPORT.md)
- [Reporte de pruebas](docs/TEST_REPORT.md)

## 📝 Licencia

Uso privado exclusivo — Iván Marty.
