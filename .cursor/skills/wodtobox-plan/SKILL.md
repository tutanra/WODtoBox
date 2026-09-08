---
name: wodtobox-plan
description: Edita planificaciones de fuerza y la sesión de series con pausa. Use when changing Program types, PlanList/PlanProgram/PlanDay/PlanSession, sessions, or rest timer.
---

# Plan

Lee `docs/plan.md`. Storage: `wodtobox.programs` y `wodtobox.sessions`.

La lista arranca vacía. No hay builders PDF. Ids retirados `power-clean-100` / `kipping-muscle-up`: el migrador y `listPrograms` / `replacePrograms` los descartan (también sus sesiones). No los reinsertes.

Si el historial de un día apunta a esos ids, `relinkOrphanPlanHistory` lo engancha al programa actual del mismo nombre y marca la sesión.

## Sesión

- `startSession` reanuda si hay sesión para ese día (también si ya se había completado).
- Pausa default 150 s (presets 120/150/180).
- Marcar serie hecha arranca pausa si no es la última.
- No hace falta un normalizer profundo de `SessionLog`; no rompas `{ id, programId, dayId, logs }`.

## Dónde va cada cambio

| Qué | Dónde |
| --- | --- |
| Modelo | `src/types/program.ts` |
| CRUD programas | `src/lib/programs.ts` |
| Logs de series | `src/lib/sessions.ts` |
| UI lista / semanas / día / train | `PlanList`, `PlanProgram`, `PlanDay`, `PlanSession` |
| Pausa | `useRestTimer.ts` |

Programa nuevo: `emptyProgram()`, se puede borrar. Objetivos del programa (movimiento / inicio / meta / ratio) se editan en `PlanProgram`. Cada semana tiene de 1 a 7 días (añadir en el programa; quitar en el editor del día). Copiar semana clona con ids nuevos (`cloneWeek` + `renumberWeeks`). El editor del día no lanza sesión (`ENTRENAR` está en la vista del programa y en el play de Siguiente de la lista). **Borrar plan** va al final de `PlanProgram`, no en la lista.

Compartir: `src/lib/sharePlan.ts` (`format: wodtobox.plan`). Exportar desde `PlanProgram`; importar desde `PlanList` (añade copia, ids nuevos, `seeded: false`).

Tras cambiar tipos o ids: `npm run check:compat`. Actualiza `docs/plan.md` si cambia el flujo.
