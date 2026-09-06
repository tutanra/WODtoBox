---
name: wodplanning-plan
description: Edita planificaciones de fuerza, plantillas PDF (Power Clean 100 kg, Kipping Muscle-Up) y la sesión de series con pausa. Use when changing Program types, PlanList/PlanProgram/PlanDay/PlanSession, powerClean100, kippingMuscleUp, sessions, or rest timer.
---

# Plan

Lee `docs/plan.md`. Storage: `wodplanning.programs` y `wodplanning.sessions`.

## IDs fijos

- `power-clean-100` — Road to 100 kg, 12 semanas, `seeded: true`
- `kipping-muscle-up` — 8 semanas, `seeded: true`

No se borran desde la lista. `listPrograms` **reinserta** si faltan, sin pisar ediciones ya guardadas. `restoreTemplate(id)` sí pisa con el builder.

Cambiar kilos/series del PDF: edita `src/data/powerClean100.ts` o `kippingMuscleUp.ts`. Quien ya tiene la plantilla en localStorage no ve el cambio hasta “Restaurar plantilla del PDF”.

## Sesión

- `startSession` reanuda si hay sesión sin `completedAt` para ese día.
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

Plan CUSTOM: `emptyProgram()`, se puede borrar. Copiar semana clona con ids nuevos (`cloneWeek` + `renumberWeeks`).

Tras cambiar tipos o ids: `npm run check:compat`. Actualiza `docs/plan.md` si cambia el flujo o las fases.
