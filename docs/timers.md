# Timers

Código: `src/types/timer.ts`, `src/lib/engine.ts`, `src/hooks/useTimerEngine.ts`, `src/pages/TimerSetup.tsx`, `src/pages/TimerRun.tsx`, `src/components/TimerFields.tsx`.

## Formatos

| `kind` | UI | Qué hace el motor |
| --- | --- | --- |
| `amrap` | AMRAP | Cuenta atrás `durationSeconds`. El atleta pulsa `+ RONDA`. Aviso en los últimos 10 s. Termina al llegar a 0 (`complete`). |
| `forTime` | FOR TIME | Reloj de trabajo. Cap opcional (`durationSeconds === 0` → sin cap). Dirección: `countUp` true = 0→cap, false = cap→0. `FINISH` marca tiempo (`manual`). Si hay cap y se agota: `cap`. |
| `emom` | EMOM | `rounds` intervalos de `intervalSeconds`. Cada intervalo cuenta atrás. Termina al completar. |
| `tabata` | TABATA | Por defecto 20/10 × 8. Work/rest/rondas editables. Última ronda **sin** rest. |
| `intervals` | INTERVALOS | Igual que Tabata pero defaults 40/20 × 8. |
| `stopwatch` | CRONÓMETRO | Tiempo hacia arriba, sin fin programado. |

Defaults: `defaultConfig(kind)` en `src/types/timer.ts`. AMRAP 12 min, For Time 15 min, EMOM 60 s × 10, Tabata 20/10 × 8, Intervalos 40/20 × 8, prepare 10 s (cronómetro: prepare 0).

## Fases (`TimerPhase`)

`idle` → `prepare` (si `prepareSeconds > 0`) → `work` ↔ `rest` → `finished`.

Prepare: cuenta atrás; los últimos 3 s muestran `3 · 2 · 1` y `warning`.

## Snapshot

`computeSnapshot(config, elapsedMs, extra)` es la fuente de verdad. El hook avanza `now` cada 50 ms, resta pausas, y dispara `beep` / `pulse` al cambiar de fase, al 3-2-1, a los 10 s de work y al terminar.

`extra`: `amrapRounds`, `manualFinishMs`, `started`.

## Audio (`src/lib/audio.ts`)

| Cue | Cuándo | Parámetros |
| --- | --- | --- |
| `go` | Tras prepare (inicio) y al cambiar de ronda EMOM | 1100 Hz, **2,4 s**, square |
| `done` | Fin del timer (también al acabar la pausa del plan) | horn **3,2 s**, 220 + 330 Hz |
| `tick` | Últimos 3 s de prepare (3-2-1) | 800 Hz, 0,15 s |
| `warn` | 10 s de work restantes | doble 1200 Hz |
| `rest` | Entra fase rest | 392 Hz, 0,22 s, sine |
| `shift` | Work ↔ rest en Tabata / intervalos | horn 1 s, 370 + 554 Hz |

## Persistencia de la carrera

No va a `localStorage`. Va a `sessionStorage`:

- `wodplanning.runSession` — `{ config, wod }`
- `wodplanning.timerConfig` — legado, solo config

Si recargas la pantalla de run, se recupera. Si cierras la pestaña, se pierde (correcto: es la sesión en curso, no un WOD guardado).
