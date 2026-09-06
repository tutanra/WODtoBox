# Plan

Código: `src/types/program.ts`, `src/lib/programs.ts`, `src/lib/sessions.ts`, `src/data/templates.ts`, `src/data/powerClean100.ts`, `src/data/kippingMuscleUp.ts`, páginas `PlanList`, `PlanProgram`, `PlanDay`, `PlanSession`.

## Modelo

```
Program
  targets[]          movimiento / start / goal / ratio (resumen de la plantilla)
  weeks[]
    days[]
      exercises[]
        sets[]       reps, weightKg (número o null), weightText (lo que ve el usuario)
```

`seeded: true` = plantilla PDF. No se muestra el botón borrar en la lista. Sí se puede editar kilos/reps. `restoreTemplate(id)` pisa el programa con el builder original (pierde ediciones de esa plantilla).

IDs fijos de plantilla (no cambiar):

- `power-clean-100`
- `kipping-muscle-up`

Si al leer `localStorage` falta alguna, `listPrograms()` la reinserta.

## Sesión de un día

`SessionLog` en `wodplanning.sessions`. Una sesión abierta por `(programId, dayId)`: `startSession` reanuda si no tiene `completedAt`.

- Pausa por defecto **150 s** (presets 120 / 150 / 180).
- Al marcar una serie hecha (si no es la última) arranca la pausa.
- `actualReps` se puede subir/bajar; el objetivo de la plantilla sigue visible (`/set.reps`).
- `sessionProgress` = series `done` / total de series del día (barra en la vista del programa).
- `Terminar día` pone `completedAt` solo si todas las series están hechas; si no, `Guardar y salir` deja la sesión abierta.

## Plantilla: Road to 100 kg (Power Clean)

12 semanas, 2 días/semana (Día 1 tirón/hang + front squat + pulls; Día 2 power clean desde suelo + back squat + press). Notas en la app: descansos 2–3 min, no subir si la barra frena o la recepción es fea.

| Semana | Título | Fase | Objetivo PC |
| --- | --- | --- | --- |
| 1 | Aceleración | 1 · Re-aceleración | 88–90 kg |
| 2 | Contacto | 1 | 88–90 kg |
| 3 | Confianza | 1 | 88–90 kg |
| 4 | Test Fase 1 | 1 | 88–90 kg (test; día 2 front squat single) |
| 5 | Sobrecarga | 2 · Sobrecarga estructural | 92–95 kg |
| 6 | Intensidad | 2 | 92–95 kg |
| 7 | Pico de carga | 2 | 92–95 kg (ondas de PC) |
| 8 | Test Fase 2 | 2 | 92–95 kg + test front squat 1RM |
| 9 | Consolidar | 3 · Pico de potencia | 100 kg |
| 10 | Sobrecarga 100+ | 3 | 100 kg |
| 11 | Afinamiento | 3 | 100 kg |
| 12 | Día 100 kg | 3 | Taper + test oficial 92 / 96 / 100 |

Metas laterales: Front Squat 115–120, Back Squat 135–145, Clean Pulls 115–120.

El detalle de cada serie (kilos concretos) está en `src/data/powerClean100.ts`. La app trata esos números como **orientativos**: el usuario los edita en el día.

## Plantilla: Kipping Muscle-Up

8 semanas, 2 sesiones cortas (A fuerza estricta, B kip/transición). ~15–20 min. Sin fallo absoluto en estrictas.

| Semana | Título | Fase | Objetivo |
| --- | --- | --- | --- |
| 1 | Base de tracción | 1 · Fuerza y cadera | Altura de tirón |
| 2 | Contacto al pecho | 1 | Altura de tirón |
| 3 | Volumen y banda | 1 | Altura de tirón |
| 4 | Test de control | 1 | 7–8 dominadas · 2 C2B |
| 5 | Transferencia | 2 · Movimiento completo | Singles sólidas |
| 6 | Singles | 2 | Singles sólidas |
| 7 | Enlazar reps | 2 | Linking 2 reps |
| 8 | Test final | 2 | Single + linking 2–3 |

Metas: dominadas 10–12, C2B estrictas 4–5, kipping MU singles / 2–3.

Fuente: `src/data/kippingMuscleUp.ts`.

## Plan CUSTOM

`emptyProgram()`: una semana, dos días, un ejercicio con 3 series. Se puede añadir semana, copiar una semana debajo (ids nuevos), borrar semana (mínimo 1), editar igual que las plantillas. Sí se puede borrar el programa entero.
