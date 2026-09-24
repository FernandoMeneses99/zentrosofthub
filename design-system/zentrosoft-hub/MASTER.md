# MASTER — Zentrosoft Hub Design System
Fuente: ui-ux-pro-max `--design-system` ("b2b saas operations dashboard enterprise").
Decisiones de marca: se conserva azul `#4B82C3` + Inter (identidad Zentrosoft),
NO el indigo `#4F46E5`/Jakarta sugerido por defecto.

## Tokens
- primary `#4B82C3`, primary-dark `#3A6AA3`, accent `#4FD290`, ink `#0A1628`,
  ink-surface `#132238`, bg `#F8FAFC`, text `#1E293B`, muted `#64748B`,
  border `#E6EBF2`, radius 10/18/9999, ring `rgba(75,130,195,.35)`.
- Tipografía: Inter, sistema. Títulos extrabold tracking-tight.

## Patrones
- App shell: sidebar vertical oscura (logo arriba, nav apilada, usuario abajo)
  + contenido claro. Navegación superior eliminada.
- Páginas: PageHeader oscuro con degradado + cards blancas radio 18 + tablas
  TanStack ordenables + gráficos recharts con paleta de marca.
- Iconos: Lucide 16-20px, trazo consistente. Cero emojis como iconos.
- Estados: Badge (ok/warn/info/default), empty states con ilustración SVG,
  skeletons/error.tsx con reintento.

## Reglas
- Contraste texto ≥4.5:1. Foco visible siempre. `prefers-reduced-motion`.
- Tablas: `overflow-x-auto`, `scope="col"`, `aria-sort`. Formularios con
  `aria-label`, validación Zod inline, TanStack Form.
- Densidad dashboard: alta (grids 2/4, espaciado 16-24). Marketing: amplia.
- Sin parallax, sin autoplay, transiciones 150-300ms.
- Backend intacto: los cambios visuales no alteran RLS ni queries.
