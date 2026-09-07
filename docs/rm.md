# RM (pesos máximos)

Código: `src/types/rm.ts`, `src/lib/rms.ts`, páginas `RmList` y `RmEditor`.

Un RM es ejercicio + número de reps + peso, con fecha. Sirve para anotar máximos (1 @ 100 kg, 5 @ 110 kg…).

## Modelo

- `id`, `exercise`, `reps` (≥ 1), `weightText` (lo que ve el usuario), `weightKg` (número parseado, o null), `liftedAt`

`normalizeRmLift` acepta JSON sin `weightKg`.

## Flujo

1. `#/rm` — ejercicios agrupados: mejor marca con el día (sin hora), y debajo cada RM de ese movimiento con su fecha. Pulsar el ejercicio (o el +) abre un RM nuevo de ese mismo movimiento. Pulsar una marca concreta la edita.
2. `#/rm/new` o `#/rm/new?ejercicio=…` o `#/rm/:id` — ejercicio, día, reps (stepper) y peso. `Guardar` escribe en `wodplanning.rms` y añade/actualiza la entrada en el historial con esa fecha.
3. Borrar desde RM quita el máximo de esa lista y también su fila del historial.

## Storage

Clave `wodplanning.rms`. API: `listRms`, `getRm`, `saveRm`, `deleteRm`.
