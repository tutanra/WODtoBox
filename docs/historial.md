# Historial

Código: `src/types/history.ts`, `src/lib/history.ts`, páginas `HistoryList` y `HistoryDetail`.

## Qué entra

- Un WOD lanzado al timer, cuando la cuenta llega a `finished` (o `FINISH` en For Time). Los timers sueltos, sin WOD, no se guardan.
- Un día de plan al marcar (o desmarcar) una serie, con el peso de cada una. Si vuelves a entrar y cambias series, se actualiza la misma entrada. Si desmarcas todas, esa fila desaparece del historial.
- Un RM (ejercicio, reps, peso) al guardarlo en `#/rm`.

**Reiniciar plan** borra solo las sesiones (progreso). El historial de esos días se queda.

Cada ítem de WOD es una foto. Plan y RM no se borran desde Historial (los WOD sí). Borrar un RM desde `#/rm` sí quita también su fila del historial.

## Storage

Clave `wodtobox.history` (array JSON, más reciente primero). No sustituye `wodtobox.sessions` ni `wodtobox.rms`.

API: `listHistory`, `getHistoryEntry`, `recordWodFinish`, `recordPlanSession`, `recordRmLift`, `deleteHistoryEntry` (solo WODs), `deleteRmHistory` (al borrar un RM), `resetPlanProgress` (solo sesiones).

## UI

- `#/historial` — lista agrupada por día (con año), filtros Todos / WODs / Plan / RM. En un plan se ve el título del programa y cada ejercicio en su línea, con el peso de ese día.
- `#/historial/:id` — detalle.
