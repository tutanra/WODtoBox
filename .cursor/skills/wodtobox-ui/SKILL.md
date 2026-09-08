---
name: wodtobox-ui
description: Cambia UI, rutas o comportamiento visible de WODtoBox y verifica en el navegador. Use when editing pages, layout, styling, routing, Home/Timers/WODs/Plan screens, or copy the user will see.
---

# UI y verificación

## Restricciones de shell

- Layout de páginas: `Screen` (`max-w-lg`, safe areas). El timer en run es pantalla completa (`TimerRun`), no `Screen`.
- Rutas nuevas solo en `src/App.tsx`, con `HashRouter`. Catch-all → `/`.
- Copy en español. No uses la marca «CrossFit». Tokens: `ink`, `panel`, `flame`, `work`, `rest`, `warn`, `gold` en `src/index.css`.
- No pases a `BrowserRouter`: rompe la APK.

## Verificar (obligatorio si cambia lo que se ve)

No basta un screenshot. Flujo real:

1. `npm run dev` → `http://localhost:5173`.
2. Recorre el camino tocado (timers, WOD, o plan) como usuario: tap, escribir, guardar, atrás.
3. Mira las otras dos entradas del Home si compartes estado (`localStorage`).
4. Vacío, error y un ítem guardado, no solo el camino feliz.
5. Si el layout cambió, desktop y un ancho tipo móvil.

Android: botón atrás y wake lock en timer/sesión si tocaste esas pantallas.

## Docs

Si el flujo de usuario cambió, actualiza el markdown en `docs/` de esa zona.
