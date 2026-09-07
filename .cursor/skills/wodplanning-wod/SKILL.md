---
name: wodplanning-wod
description: Edita WODs grabados (bloques ejercicio/descanso/rondas, overlay en el timer, persistencia). Use when changing Wod types, WodEditor, WodsList, WodBlockList, WodOverlay, wods.ts, or launching a WOD to the timer.
---

# WODs grabados

Lee `docs/wods.md`. Storage: `wodplanning.wods`. API: `listWods` (usuario) / `listHeroWods` / `getWod` / `saveWod` / `deleteWod` / `restoreHeroWod`.

## Forma

- `kind` + `timer` con `timer.kind === wod.kind` al guardar.
- Bloques: `exercise` (`text`, `weight`), `rest` (`restSeconds`), `rounds` (hijos solo exercise|rest).
- `normalizeWod` / `normalizeItem` aceptan JSON viejo (`isRest`, exercise sin `type`). Conserva esas ramas.

## Dónde va cada cambio

| Qué | Dónde |
| --- | --- |
| Campos del modelo | `src/types/wod.ts` + default en `normalizeWod` |
| Lista / borrar / lanzar | `WodsList.tsx` |
| WOD Heroes | `data/heroWods.ts`, `WodHeroes.tsx`, reseed en `wods.ts`. Ids `hero-*` fijos. |
| Editor | `WodEditor.tsx` + `TimerFields` + `WodBlockList` |
| Overlay en run | `WodOverlay.tsx` + `activeBlockId` en `wodProgress.ts` |
| Persistencia | `src/lib/wods.ts` |

Lanzar al timer: `persistRunSession({ config, wod })` y navegar a `#/timers/:kind/run`.

## No hacer

- Rondas anidadas.
- Lista de bloques vacía (si se borra el último, queda un exercise vacío).
- Un storage key nuevo para WODs.

Tras cambiar tipos: `npm run check:compat`. Actualiza `docs/wods.md` si cambia el flujo.
