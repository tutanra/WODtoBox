# Plan

Código: `src/types/program.ts`, `src/lib/programs.ts`, `src/lib/sessions.ts`, páginas `PlanList`, `PlanProgram`, `PlanDay`, `PlanSession`.

La lista arranca **vacía**. Cada plan muestra semanas, días y una barra de progreso (y el siguiente día pendiente, con play para entrenar). **Borrar plan** está al final del editor (`#/plan/:programId`), no en la lista. No hay plantillas PDF de programa. `migrateLegacyStorage` quita de `wodtobox.programs` / `.sessions` los ids retirados `power-clean-100` y `kipping-muscle-up` (y un pack de Drive no los reinserta). Si el historial de un día apunta a esos ids, se reenlaza al programa actual del mismo nombre y se marca la sesión.

## Modelo

```
Program
  targets[]          movimiento / start / goal / ratio (opcional)
  weeks[]
    days[]
      exercises[]
        sets[]       reps, weightKg (número o null), weightText (lo que ve el usuario)
```

`seeded` se conserva en el JSON por si llega un pack viejo; la UI no trata ningún plan como plantilla. Todos se pueden borrar.

## Sesión de un día

`SessionLog` en `wodtobox.sessions`. Una sesión por `(programId, dayId)`: `startSession` reanuda la misma aunque ya tuviera `completedAt`. **Reiniciar plan** las borra todas.

- Pausa por defecto **150 s** (presets 120 / 150 / 180). Chip **otro** (borde discontinuo): abre minutos y segundos (5–600 s) y deja esa duración en la sesión. Los chips están solo en el listado. Si la pausa ya corre, cambiar el chip (preset u otro) reinicia el reloj con el tiempo nuevo. La sesión usa el mismo layout que el resto (`Screen`). El recuadro de pausa se superpone arriba (PAUSA, reloj y **Saltar**) sin chips ni botón atrás; al hacer scroll se queda ahí. En los últimos 10 s usa el mismo pulso que el timer (`last-ten`), no pasa a rojo. **Saltar** la cierra.
- Al marcar una serie hecha suena el mismo pitido de inicio que el timer (`go`). Si no es la última, arranca la pausa.
- `actualReps` se puede subir/bajar; el objetivo del set sigue visible (`/set.reps`).
- `sessionProgress` = series `done` / total de series del día (barra en la vista del programa).
- Al marcar o desmarcar una serie se actualiza el historial al momento. Si no queda ninguna serie hecha, la entrada se borra. `completedAt` se pone cuando el día está completo y se limpia si dejas series sin hacer. El atrás (o el botón de Android) sale de la sesión; no hay **Guardar y salir**.
- Al final del programa: **Reiniciar plan** borra las sesiones (progreso). El historial de esos días se queda. Semanas y kilos no se tocan.

## Programa nuevo

`emptyProgram()`: una semana, un día, un ejercicio con 3 series. Se pueden añadir **objetivos** (movimiento, inicio, meta, ratio). Se puede añadir semana, copiar una semana debajo (ids nuevos), borrar semana (mínimo 1). En cada semana se editan fase, título y objetivo, y de **1 a 7 días** (añadir en la semana; **Borrar día** en el editor, el último no se quita). Editar un día es solo el contenido (ejercicios, series, kilos); **entrenar** se lanza con el play de la vista del programa o con el play de **Siguiente** en la lista. **Borrar plan** (abajo del todo, con confirmación) quita el programa y las sesiones; el historial se queda.

## Compartir e importar

Un plan se **comparte** desde `#/plan/:programId` (icono Compartir, hace falta nombre) como `{ "format": "wodtobox.plan", "schemaVersion": 1, "program": … }` en un fichero `nombre.wodtobox`. En el PC descarga; en la APK abre la hoja de Android. En `#/plan`, **importar** lee ese fichero: si el `format` no vale, *Ese archivo no es un plan de WODtoBox.*; si vale, pide confirmación y **añade una copia** (ids nuevos, `seeded: false`). No sustituye la lista. Un pack o un WOD suelto no entra por este camino. No se importan sesiones ni historial.

Las plantillas que antes venían de fábrica están en `docs/planes/` (`road-to-100-kg.wodtobox`, `kipping-muscle-up.wodtobox`) para importarlas a mano.

En Android, **Abrir con** / **Compartir** un `.wodtobox` de plan abre `#/plan` y usa el mismo flujo.
