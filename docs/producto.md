# Producto y flujos

App de entrenamiento funcional para Android (Capacitor) y también usable en el navegador. Sin cuenta y sin servidor: todo vive en el dispositivo.

El menú de inicio (`#/`) tiene tres entradas.

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

1. Lista vacía → `NUEVO WOD`. Con ítems: abrir, `Al timer`, borrar.
2. `#/wods/new` o `#/wods/:id` — nombre, tipo, timer, bloques (ejercicio / descanso / rondas).
3. `Guardar` o `ADAPTAR AL TIMER` (guarda y lanza).
4. En el timer, un overlay muestra el contenido y destaca el bloque activo.

Los WODs se guardan en `localStorage`. Detalle: [wods.md](wods.md).

## 3. Plan (`#/plan`)

Programas de fuerza por semanas y días.

1. Lista: plantillas PDF (no se borran) + planes `CUSTOM`.
2. `#/plan/:programId` — nombre, notas, objetivos, semanas. Copiar semana, añadir, borrar. En plantillas: restaurar PDF.
3. `#/plan/:id/day/:dayId` — editar ejercicios, series, kilos, reps. `ENTRENAR`.
4. `#/plan/.../train` — sesión: marcar series, ajustar reps hechas, pausa 2–3 min.

Las plantillas:

- **Road to 100 kg** — Power Clean, 12 semanas (`power-clean-100`)
- **Kipping Muscle-Up** — 8 semanas (`kipping-muscle-up`)

Detalle semana a semana: [plan.md](plan.md).

## Comportamiento común en sesión

- Pitidos (Web Audio) y vibración / haptics.
- Wake lock: la pantalla no se apaga mientras corre el timer o la sesión de plan.
- Botón atrás de Android: historial; en la raíz, sale de la app.
- Layout móvil: columna `max-w-lg`, fondos oscuros, acento naranja (`flame`).

## Qué no hace (hoy)

- Nube, cuentas, sync entre dispositivos.
- Importar/exportar ficheros.
- iOS.
- Publicación en Play Store (el script actual genera APK de **debug**).
