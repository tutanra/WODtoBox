# RM (pesos máximos)

Código: `src/types/rm.ts`, `src/lib/rms.ts`, páginas `RmList` y `RmEditor`.

Un RM es ejercicio + número de reps + peso, con fecha. Sirve para anotar máximos (1 @ 100 kg, 5 @ 110 kg…).

Si las reps no son 1, se estima el 1RM con Epley: `peso × (1 + reps/30)`. Se muestra como `(1@105kg est.)`. Esa estimación ordena el «mejor» de cada movimiento.

## Modelo

- `id`, `exercise`, `reps` (1–50), `weightText` (lo que ve el usuario), `weightKg` (número parseado, o null), `liftedAt`

`normalizeRmLift` acepta JSON sin `weightKg` y recorta reps a 50.

## Flujo

1. `#/rm` — ejercicios agrupados: mejor marca (Epley) con el día (con año, sin hora), y debajo cada RM de ese movimiento. Con dos o más marcas con kilos, una gráfica pequeña muestra la evolución del 1RM (Epley si no es 1 rep) en el tiempo. Pulsar el nombre abre esa marca para editarla (incluido el nombre del ejercicio; si lo cambias, se renombra el grupo). El + añade otra del mismo movimiento.
2. `#/rm/new` o `#/rm/new?ejercicio=…` o `#/rm/:id` — ejercicio, día, reps (1–50) y peso. `Guardar` escribe en `wodtobox.rms` y añade/actualiza la entrada en el historial con esa fecha.
3. Borrar desde RM quita el máximo de esa lista y también su fila del historial.

## Storage

Clave `wodtobox.rms`. API: `listRms`, `getRm`, `saveRm`, `renameExercise`, `deleteRm`.
