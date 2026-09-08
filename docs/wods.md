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

1. Un WOD nuevo sin cambios no se escribe; en cuanto tocas algo, queda en la lista (aunque el nombre esté vacío).
2. Tipo: chips de los 6 formatos; al cambiar, se copia `kind` al `timer`.
3. Mismos campos de timer que en Timers sueltos.
4. Contenido: añadir Ejercicio / Descanso / Rondas. No se puede dejar la lista vacía (si borras el último, aparece un exercise vacío).
5. Los cambios se guardan al momento (no hay botón Guardar ni lanzar al timer). Para lanzar, atrás a `#/wods` y **Al timer**. **Compartir** está en la barra del editor (hace falta nombre). **Borrar WOD** al final, con confirmación, solo cuando el WOD ya está en la lista (en `#/wods/new` sin cambios no sale; las plantillas Heroes no se borran). Al terminar el timer, el resultado se guarda en el historial (`wodtobox.history`). Los timers sueltos no.

## WOD Heroes

Menú al final de `#/wods` → `#/wods/heroes`. Plantillas clásicas (Fran, Cindy, Murph…) con pesos en kg, ids `hero-*`. Los esquemas 21-15-9 / 50-40-30-20-10 se desglosan en un ejercicio por ronda y movimiento (Fran, Annie, Diane). Murph va sin chaleco. Viven en la misma clave `wodtobox.wods` con `seeded: true` y `seedRevision`; `listWods` no las mezcla con las del usuario. Si faltan o la revisión de plantilla sube, se reinsertan. No se borran; **Restaurar** pisa con la plantilla. El editor de un hero vuelve a `#/wods/heroes`.

No renombrar los ids `hero-fran`, `hero-cindy`, etc.: el reseed depende de ellos.

## Overlay en el timer

- AMRAP / For Time / Cronómetro: se listan todos los bloques de trabajo a la vez (el WOD es “el mismo” todo el rato).
- EMOM / Tabata / Intervalos: `activeBlockId` recorre ejercicios (o rests en fase `rest`) según `snapshot.round`.

## Storage

Clave `wodtobox.wods`: array JSON. API: `listWods` (solo los del usuario), `listHeroWods`, `getWod`, `saveWod`, `deleteWod` (no borra heroes), `restoreHeroWod`.

Un WOD se puede **compartir** desde el editor (`#/wods/:id`, icono Compartir; hace falta nombre) como `{ "format": "wodtobox.wod", "schemaVersion": 1, "wod": … }` en un fichero `nombre.wodtobox`. En el PC descarga el archivo. En la APK, **Compartir** abre la hoja de Android (`@capacitor/share` + fichero en caché). En `#/wods`, el icono de importar (y **Importar** si la lista está vacía) lee ese fichero: si el `format` no vale, *Ese archivo no es un WOD de WODtoBox.*; si vale, pide confirmación y **añade una copia** (id nuevo, no seeded). No sustituye la lista ni las plantillas Heroes. Un pack `wodtobox.pack` no entra por este camino.

En Android, **Abrir con** / **Compartir** un `.wodtobox` (WhatsApp, gestor de archivos, etc.) abre WODtoBox y usa el mismo flujo de confirmación. Si el MIME no trae la extensión, la app mira el contenido (`wodtobox.wod` o `wodtobox.plan`) y enruta a `#/wods` o `#/plan`. Un pack no entra por este camino.
