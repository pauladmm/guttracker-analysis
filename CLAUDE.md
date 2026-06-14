# GutTracker — Briefing de proyecto

## Qué es esto

App web de seguimiento digestivo personal para detectar qué alimentos causan síntomas intestinales en una persona que lleva tiempo sin diagnóstico médico claro. El objetivo final es generar evidencia estadística rigurosa que pueda presentarse a médicos, cruzada con literatura científica disponible.

## Estado actual

- Fase 1 completada como prototipo funcional en claude.ai (React en un solo archivo HTML con localStorage)
- Pendiente: migrar a proyecto React real con Vite, conectar Supabase como BD, y continuar con fases 2-4

---

## Stack técnico

- **Frontend:** React + Vite
- **Estilos:** CSS con variables (sin framework externo por ahora)
- **Base de datos:** Supabase (PostgreSQL + auth + storage para fotos)
- **LLM:** Claude API (claude-sonnet-4-6) con vision para extraer ingredientes de fotos
- **Despliegue:** Vercel (luego PWA instalable en móvil)
- **Iconos:** Tabler Icons (outline, via CDN o npm)

---

## Fases del proyecto

### Fase 1 — Tracker base ✅ (prototipo hecho, pendiente migrar)
- Calendario mensual navegable
- CRUD de comidas por día: desayuno, almuerzo, cena, extra/merienda
- Por cada comida: nombre, ¿sentó bien/mal?, dolor de estómago (0-5), mal sabor de boca (0-5), cuándo aparecieron síntomas, síntomas extra en texto libre, ingredientes manuales
- Estrés diario del día (1-5 con emojis)
- Notas generales del día
- Indicadores visuales en el calendario (puntos de color: verde=bien, coral=mal, gris=sin valorar)

### Fase 2 — Fotos e ingredientes con IA
- Upload de foto (etiqueta de producto, plato, ticket de restaurante)
- Envío a Claude API con vision
- Extracción automática de ingredientes y almacenamiento en BD
- Normalización de nombres INCI/químicos (E-números, aditivos, nombres comerciales)

### Fase 3 — Análisis estadístico
- Correlación ingrediente ↔ síntoma
- Frecuencia de aparición de ingredientes en comidas con síntomas vs sin síntomas
- Score de "sospecha" por ingrediente
- Visualizaciones: heatmaps, gráficos de barras, timeline

### Fase 4 — Evidencia científica
- Claude API con web_search tool: buscar estudios sobre ingredientes problemáticos
- Cruzar con síntomas específicos del paciente
- Identificar si ingredientes son FODMAP, alto en histamina, etc.
- Informe exportable en PDF para llevar al médico

---

## Estructura de carpetas

```
guttracker/
├── .env.local
├── .gitignore
├── package.json
├── vite.config.js
├── index.html
├── CLAUDE.md                      ← este archivo
│
├── public/
│   └── favicon.svg
│
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    │
    ├── lib/
    │   ├── supabase.js            ← cliente Supabase
    │   └── claude.js             ← llamadas a Claude API
    │
    ├── hooks/
    │   ├── useMeals.js           ← CRUD comidas contra Supabase
    │   └── useAuth.js            ← sesión de usuario
    │
    ├── components/
    │   ├── Calendar/
    │   │   ├── Calendar.jsx
    │   │   └── DayCell.jsx
    │   ├── MealSheet/
    │   │   ├── MealSheet.jsx     ← bottom sheet formulario
    │   │   ├── IntensityPicker.jsx
    │   │   └── FeelButtons.jsx
    │   ├── DayPanel/
    │   │   ├── DayPanel.jsx
    │   │   └── MealCard.jsx
    │   └── UI/
    │       ├── Badge.jsx
    │       ├── IconButton.jsx
    │       └── BottomSheet.jsx
    │
    ├── pages/
    │   ├── TrackerPage.jsx       ← vista principal
    │   ├── StatsPage.jsx         ← análisis (fase 3)
    │   └── LoginPage.jsx
    │
    └── utils/
        ├── dateHelpers.js
        └── symptomHelpers.js
```

---

## Base de datos — Supabase (esquema SQL)

```sql
CREATE TABLE days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  date date NOT NULL,
  stress int CHECK (stress BETWEEN 1 AND 5),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid REFERENCES days(id) ON DELETE CASCADE,
  meal_type text CHECK (meal_type IN ('breakfast','lunch','dinner','extra')),
  name text,
  feel text CHECK (feel IN ('bien','mal')),
  stomach_intensity int CHECK (stomach_intensity BETWEEN 0 AND 5),
  taste_intensity int CHECK (taste_intensity BETWEEN 0 AND 5),
  symptom_time text,         -- 'Inmediato' | '1–2 h' | '3–6 h' | 'Día siguiente'
  extra_symptoms text,
  photo_url text,            -- fase 2: URL en Supabase Storage
  created_at timestamptz DEFAULT now()
);

CREATE TABLE ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid REFERENCES meals(id) ON DELETE CASCADE,
  name text NOT NULL,
  source text CHECK (source IN ('manual', 'ai_extracted')),
  created_at timestamptz DEFAULT now()
);
```

---

## Variables de entorno necesarias (.env.local)

```
VITE_SUPABASE_URL=           # Panel Supabase → Settings → API → Project URL
VITE_SUPABASE_ANON_KEY=      # Panel Supabase → Settings → API → anon public key
VITE_ANTHROPIC_API_KEY=      # console.anthropic.com → API Keys
```

---

## Diseño visual — criterios clave

- Estética mobile-first, limpia, flat (sin sombras ni gradientes)
- Paleta: púrpura como color principal (#7F77DD), verde para "bien" (#1D9E75), coral para "mal" (#D85A30), ámbar para intensidad de síntomas (#EF9F27)
- Iconos: Tabler Icons outline únicamente
- Bottom sheet para formularios (no modales centrados — se adapta mejor a móvil)
- Las comidas en el panel del día tienen borde izquierdo de color según cómo sentaron
- Los días en el calendario muestran puntos de colores como resumen visual rápido
- Tipos de comida con iconos y fondos de color propios:
  - Desayuno: ámbar claro + icono ti-coffee
  - Almuerzo: verde claro + icono ti-salad
  - Cena: púrpura claro + icono ti-moon
  - Extra: coral claro + icono ti-apple

---

## Contexto médico importante (para las fases de análisis)

El tracker es para una persona con síntomas digestivos crónicos sin diagnóstico. Los médicos no han encontrado la causa tras múltiples pruebas. El objetivo es construir evidencia estadística propia.

**Factores críticos a trackear más allá de los ingredientes:**

1. **Tiempo de aparición de síntomas** — pueden aparecer 6-24h después, no solo inmediatamente. Siempre registrar cuándo, no solo qué.
2. **Efecto acumulativo** — un ingrediente solo puede no causar síntomas, pero combinado con otros del mismo día supera el umbral de tolerancia.
3. **Estrés** — el eje intestino-cerebro es real. El estrés empeora síntomas independientemente de la comida.
4. **FODMAPs** — carbohidratos fermentables (ajo, cebolla, trigo, manzana, lactosa...) causa #1 de síntomas difusos sin diagnóstico. Marcar automáticamente en fase 3.
5. **Histamina** — intolerancia muy infradiagnosticada. Alimentos fermentados, embutidos, tomate, vino, queso curado. Síntomas variados y confusos.
6. **SIBO** (sobrecrecimiento bacteriano intestinal) — no se detecta con pruebas convencionales. Los síntomas empeoran con fibra.
7. **Ciclo menstrual** — fuerte correlación con síntomas intestinales. Campo a añadir en fases futuras.
8. **Medicación y suplementos** — registrar en notas del día.
9. **Hidratación y actividad física** — variables confusoras importantes.

**En fase 4, el análisis de evidencia científica debe buscar:**
- Relación ingrediente → síntoma específico en estudios peer-reviewed
- Clasificación FODMAP de ingredientes encontrados
- Contenido en histamina / liberadores de histamina
- Relación con SII (síndrome de intestino irritable), SIBO, enfermedad de Crohn, colitis, celiaquía no clásica

---

## Instrucciones para Claude Code

Cuando se te pida construir este proyecto:

1. Empieza siempre por `npm create vite@latest . -- --template react` si la carpeta está vacía
2. Instala dependencias base: `npm install @supabase/supabase-js react-router-dom`
3. Crea `.env.local` con las variables vacías documentadas arriba
4. Construye componente a componente, empezando por `TrackerPage` + `Calendar` + `DayPanel` + `MealSheet`
5. Usa localStorage como fallback mientras Supabase no esté configurado (detecta si las env vars están vacías)
6. El diseño debe ser mobile-first, máximo 420px de ancho para la vista principal
7. No uses ningún framework CSS externo — CSS puro con variables
8. Todos los iconos son Tabler Icons outline: `npm install @tabler/icons-react`
9. Para Supabase: crea primero el cliente en `src/lib/supabase.js`, luego el hook `useMeals.js` con las 4 operaciones CRUD básicas
10. Los formularios de comida son bottom sheets (posición fixed bottom, deslizables)

