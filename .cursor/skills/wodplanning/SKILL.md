---
name: wodplanning
description: Orienta el trabajo en la app WOD Planning (timers de WOD, workouts grabados, plan de fuerza, Capacitor Android). Use when starting a change in this repo, when the user mentions WOD Planning, timers, WODs, plan, Power Clean, Muscle-Up, or when unsure which project skill to follow.
---

# WOD Planning

## Arranque

1. Lee `docs/README.md` (índice). Luego solo el doc de la zona que tocas.
2. Elige la skill concreta:
   - Datos, tipos, storage, ids → `wodplanning-compat`
   - Formatos de timer / motor / reloj → `wodplanning-timer`
   - WODs grabados / bloques / overlay → `wodplanning-wod`
   - Programas, plantillas PDF, sesión de series → `wodplanning-plan`
   - APK, Capacitor, Play → `wodplanning-android`
3. No implementes export escritorio↔móvil ni un segundo schema. Ideas: `docs/escritorio.md`.

## Invariantes (no negociar)

- Claves `wodplanning.wods` / `.programs` / `.sessions` / `.runSession`
- `TIMER_KINDS` existentes; ids `power-clean-100`, `kipping-muscle-up`
- `appId` `com.wodplanning.app`
- `HashRouter` y Vite `base: './'`
- Tras tocar tipos o `src/lib`: `npm run check:compat`

## Tras un cambio de producto

Actualiza el markdown de `docs/` de esa zona en el mismo cambio. Copy de UI en español. No uses la marca «CrossFit» (ni «Crossfit») en UI, ficha de tienda ni docs.
