---
name: wodtobox-timer
description: Cambia o añade formatos de timer (AMRAP, For Time, EMOM, Tabata, intervalos, cronómetro) y el motor de cuenta. Use when editing timer kinds, engine.ts, useTimerEngine, TimerFields, TimerSetup, TimerRun, audio cues, or prepare countdown.
---

# Timers

Lee `docs/timers.md`. Fuente de verdad del reloj: `computeSnapshot` en `src/lib/engine.ts`.

## Añadir un formato

1. Añade el `kind` al **final** de `TIMER_KINDS` en `src/types/timer.ts` (nunca quites uno existente).
2. `defaultConfig(kind)` y `normalizeTimerConfig` deben cubrir el nuevo kind.
3. `src/data/kinds.ts` — meta de menú (título, hint, icono).
4. `TimerFields` — UI de setup (presets + steppers). Toggle de prepare 10s ya es común.
5. `engine.ts` — fases `idle` → `prepare` → `work`/`rest` → `finished`.
6. `TimerRun` — botones extra solo si hace falta (como `+ RONDA` o `FINISH`).
7. `summarizeTimer` y, si el overlay debe destacar bloques, `wodProgress.ts`.
8. `docs/timers.md` + `timerKinds` en `docs/contrato.json`.
9. `npm run check:compat` y `npm run build`.

## No hacer

- Poner la carrera en `localStorage` (va en `sessionStorage` `wodtobox.runSession`).
- Cambiar `HashRouter` o `base: './'`.
- Duplicar lógica de tiempo en el componente; el hook solo orquesta `elapsedMs` y cues.

## Verificar UI

Flujo: menú → setup → START → pausa → reinicio → fin. En AMRAP, `+ RONDA`. En For Time, `FINISH` y cap. Pitidos en prepare 3-2-1 y al terminar.
