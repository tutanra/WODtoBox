# Producto y flujos

App de entrenamiento funcional para Android (Capacitor) y también usable en el navegador. Todo vive en el dispositivo. Google Drive es opcional (`#/sync`).

El menú de inicio (`#/`) deja el título arriba y cinco entradas apiladas abajo. Junto a **WOD PLANNING** hay un icono de nube: `#/sync` (Google Drive, opcional).

## 1. Timers (`#/timers`)

Timers sueltos, sin WOD. Eliges formato → configuras tiempos → `START`.

1. Rejilla de 6 formatos (AMRAP, For Time, EMOM, Tabata, Intervalos, Cronómetro).
2. `#/timers/:kind` — ajustes (presets + steppers + cuenta atrás 10 s opcional).
3. `#/timers/:kind/run` — pantalla a pantalla completa: reloj, pausa, reinicio.
   - AMRAP: `+ RONDA`
   - For Time: `FINISH`
   - Al terminar: `OTRA VEZ` o volver a ajustes

Detalle: [timers.md](timers.md).

## 2. WODs (`#/wods`)

Workouts grabados (Fran, Cindy, el del día…).

1. Lista vacía → `NUEVO WOD`. Con ítems: abrir, `Al timer`, borrar. Al final: menú **WOD Heroes**.
2. `#/wods/heroes` — plantillas clásicas en kg (Fran, Cindy, Murph…). Abrir, al timer o restaurar. No se borran.
3. `#/wods/new` o `#/wods/:id` — nombre, tipo, timer, bloques (ejercicio / descanso / rondas).
4. `Guardar` o `ADAPTAR AL TIMER` (guarda y lanza).
5. En el timer, un overlay muestra el contenido y destaca el bloque activo. Al terminar, el WOD entra en el historial.

Los WODs se guardan en `localStorage`. Detalle: [wods.md](wods.md).

## 3. Plan (`#/plan`)

Programas de fuerza por semanas y días.

1. Lista: plantillas PDF (no se borran) + planes `CUSTOM`.
2. `#/plan/:programId` — nombre, notas, objetivos, semanas. Copiar semana, añadir, borrar. En plantillas: restaurar PDF.
3. `#/plan/:id/day/:dayId` — editar ejercicios, series, kilos, reps. `ENTRENAR`.
4. `#/plan/.../train` — sesión: marcar series, ajustar reps hechas, pausa 2–3 min. **Guardar y salir** (o **Terminar día** si están todas) guarda esas series y el peso en el historial; si vuelves, se actualizan. En el programa: **Reiniciar plan** borra el progreso de las sesiones; el historial se queda.

Las plantillas:

- **Road to 100 kg** — Power Clean, 12 semanas (`power-clean-100`)
- **Kipping Muscle-Up** — 8 semanas (`kipping-muscle-up`)

Detalle semana a semana: [plan.md](plan.md).

## 4. RM (`#/rm`)

Pesos máximos: ejercicio, repeticiones, kilos y el día (sin hora). Por movimiento se ve el mejor y el registro; pulsar el ejercicio añade otra marca de ese mismo movimiento. Al guardar, también entra en el historial. Borrar un RM lo quita de RM y del historial.

Detalle: [rm.md](rm.md).

## 5. Historial (`#/historial`)

Lista de entrenos: WODs, días de plan (con el peso de ese día) y RM. Filtros Todos / WODs / Plan / RM. Se puede borrar un WOD del historial; el plan no. Un RM se borra desde `#/rm` y desaparece también aquí. **Reiniciar plan** no borra el historial.

Detalle: [historial.md](historial.md).

## 6. Drive (`#/sync`)

Copia opcional a un archivo en tu Google Drive (`wodplanning.pack.json`): WODs, plan, RM e historial. Muestra la última sync y si este dispositivo o Drive está más nuevo. **SYNC** sube; **Bajar de Drive** sustituye los datos locales (con confirmación). Sin cuenta la app no cambia.

Detalle: [sync.md](sync.md).

## Comportamiento común en sesión

- Pitidos (Web Audio) y vibración / haptics.
- Wake lock: la pantalla no se apaga mientras corre el timer o la sesión de plan.
- Botón atrás de Android: historial; en la raíz, sale de la app.
- Layout móvil: columna `max-w-lg`, fondos oscuros, acento naranja (`flame`).

## Qué no hace (hoy)

- iOS.
- Publicación en Play Store (el script actual genera APK de **debug**).
