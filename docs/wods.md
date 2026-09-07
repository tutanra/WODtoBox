# WODs grabados

Código: `src/types/wod.ts`, `src/lib/wods.ts`, `src/pages/WodsList.tsx`, `src/pages/WodEditor.tsx`, `src/components/WodBlockList.tsx`, `src/components/WodOverlay.tsx`, `src/lib/wodProgress.ts`.

## Modelo

Un WOD:

- `id`, `name`, `kind` (mismo enum que el timer)
- `timer`: `TimerConfig` (siempre con `timer.kind === wod.kind`)
- `blocks`: lista de ítems
- `seeded` (opcional; `true` en WOD Heroes). JSON viejo sin el campo carga como `false`.
- `createdAt`, `updatedAt`

Ítems (`WodItem`):

| `type` | Campos | Uso |
| --- | --- | --- |
| `exercise` | `text`, `weight` | Movimiento y carga en campos separados |
| `rest` | `restSeconds` | Descanso con tiempo (presets 15–180 s) |
| `rounds` | `rounds` (≥ 2), `items` | Grupo que se repite. Dentro solo exercise o rest, no rondas anidadas |

`normalizeWod` / `normalizeItem` aceptan datos viejos (`isRest`, exercise sin `type`) para no romper WODs ya guardados. **No quitar esa rama.**

## Flujo de edición

1. Nombre obligatorio para guardar o lanzar.
2. Tipo: chips de los 6 formatos; al cambiar, se copia `kind` al `timer`.
3. Mismos campos de timer que en Timers sueltos.
4. Contenido: añadir Ejercicio / Descanso / Rondas. No se puede dejar la lista vacía (si borras el último, aparece un exercise vacío).
5. `Guardar` o `ADAPTAR AL TIMER` (guarda + `persistRunSession` + navega a run). Al terminar el timer, el resultado se guarda en el historial (`wodplanning.history`). Los timers sueltos no.

## WOD Heroes

Menú al final de `#/wods` → `#/wods/heroes`. Plantillas clásicas (Fran, Cindy, Murph…) con pesos en kg, ids `hero-*`. Los esquemas 21-15-9 / 50-40-30-20-10 se desglosan en un ejercicio por ronda y movimiento (Fran, Annie, Diane). Murph va sin chaleco. Viven en la misma clave `wodplanning.wods` con `seeded: true` y `seedRevision`; `listWods` no las mezcla con las del usuario. Si faltan o la revisión de plantilla sube, se reinsertan. No se borran; **Restaurar** pisa con la plantilla. El editor de un hero vuelve a `#/wods/heroes`.

No renombrar los ids `hero-fran`, `hero-cindy`, etc.: el reseed depende de ellos.

## Overlay en el timer

- AMRAP / For Time / Cronómetro: se listan todos los bloques de trabajo a la vez (el WOD es “el mismo” todo el rato).
- EMOM / Tabata / Intervalos: `activeBlockId` recorre ejercicios (o rests en fase `rest`) según `snapshot.round`.

## Storage

Clave `wodplanning.wods`: array JSON. API: `listWods` (solo los del usuario), `listHeroWods`, `getWod`, `saveWod`, `deleteWod` (no borra heroes), `restoreHeroWod`.
