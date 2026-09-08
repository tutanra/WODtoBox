# Producto y flujos

App de entrenamiento funcional para Android (Capacitor) y también usable en el navegador. Todo vive en el dispositivo. Google Drive es opcional (`#/sync`).

El menú de inicio (`#/`) deja el título **WODtoBox** arriba y cinco entradas apiladas abajo. Junto al título hay un icono de nube: `#/sync` (Google Drive, opcional).

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

1. Lista vacía → `NUEVO WOD` o `Importar`. Con ítems: importar (icono en la barra), abrir, `Al timer`. Al final: menú **WOD Heroes**. Importar pide confirmación y **añade una copia**; no pisa lo que ya hay ni las plantillas. En Android, **Abrir con** un `.wodtobox` (p. ej. WhatsApp) llega a esta misma confirmación.
2. `#/wods/heroes` — plantillas clásicas en kg (Fran, Cindy, Murph…). Abrir, al timer o restaurar. No se borran.
3. `#/wods/new` o `#/wods/:id` — nombre, tipo, timer, bloques (ejercicio / descanso / rondas). Los cambios se guardan al momento. **Compartir** (icono de la barra, hace falta nombre). **Borrar WOD** al final cuando ya está insertado (no en `#/wods/new` vacío ni en Heroes). Un WOD nuevo entra en la lista en cuanto lo tocas.
4. En el timer, un overlay muestra el contenido y destaca el bloque activo. Al terminar, el WOD entra en el historial.

Los WODs se guardan en `localStorage`. Detalle: [wods.md](wods.md).

## 3. Plan (`#/plan`)

Programas de fuerza por semanas y días. La lista arranca vacía.

1. Lista: planes propios (crear o importar), con progreso y el siguiente día (play para entrenar). Importar pide confirmación y **añade una copia**; no pisa lo que ya hay. En Android, **Abrir con** un `.wodtobox` de plan llega a esta misma confirmación.
2. `#/plan/:programId` — nombre, notas, objetivos (movimiento / inicio / meta / ratio), semanas (fase, título, objetivo). En cada semana: 1 a 7 días (añadir), copiar semana, borrar semana. El play de un día lanza la sesión. **Compartir** envía un fichero `.wodtobox` (`format: wodtobox.plan`). Al final: **Reiniciar plan** y **Borrar plan** (con confirmación).
3. `#/plan/:id/day/:dayId` — editar nombre, foco, ejercicios, series, kilos y reps. **Borrar día** (si no es el único de la semana). No lanza el entreno (eso va desde el programa).
4. `#/plan/.../train` — sesión: marcar series, ajustar reps hechas. Misma columna y padding que el resto de pantallas. La pausa arranca al marcar una serie (si no es la última); el reloj se superpone arriba sin mover el listado. En los últimos 10 s pulsa como el timer. Si no está activa, no ocupa sitio. Chips de pausa 2:00 / 2:30 / 3:00 y **otro** (tiempo a medida). Cada serie marcada o desmarcada actualiza el historial; si no queda ninguna, el día desaparece de ahí. Atrás sale de la sesión. En el programa: **Reiniciar plan** borra el progreso de las sesiones; **Borrar plan** quita el programa. El historial de días con series hechas se queda.

Detalle: [plan.md](plan.md).

## 4. RM (`#/rm`)

Pesos máximos: ejercicio, repeticiones (1–50), kilos y el día (con año). Por movimiento se ve el mejor (si no es 1 rep, el 1RM Epley entre paréntesis: `5 @ 90 kg (1@105kg est.)`) y el registro; con varias marcas, una gráfica muestra la evolución del 1RM. Pulsar el nombre edita esa marca; el + añade otra del mismo movimiento. Al guardar, también entra en el historial. Borrar un RM lo quita de RM y del historial.

Detalle: [rm.md](rm.md).

## 5. Historial (`#/historial`)

Lista de entrenos: WODs, días de plan (título del programa y cada ejercicio en su línea, con el peso) y RM. Filtros Todos / WODs / Plan / RM. Se puede borrar un WOD del historial; el plan no. Un RM se borra desde `#/rm` y desaparece también aquí. **Reiniciar plan** no borra el historial.

Detalle: [historial.md](historial.md).

## 6. Drive (`#/sync`)

Copia opcional a un archivo en tu Google Drive (`wodtobox.pack.json` en la carpeta WODtoBox): WODs, plan, RM e historial. Muestra la última sync, la carpeta y si este dispositivo o Drive está más nuevo. Tras borrar este dispositivo, WOD Heroes vuelven solos; eso no marca lo local como más nuevo que Drive, y la última sync se olvida (no queda «al día» con esa copia). **GOOGLE** entra con tu cuenta (el Client ID ya va en la app). **SYNC** sube si este dispositivo está más nuevo y baja si lo está Drive (con confirmación). Debajo, el otro sentido: **Bajar copia de Drive** o **Subir copia a Drive**. Si no hay archivo en Drive o no se puede leer, no se bloquea **SYNC** con un “Drive más nuevo” de una sync antigua. También puedes **exportar** o **importar** el mismo pack a un fichero, sin cuenta. La papelera deja elegir borrar **este dispositivo** o **la copia en Drive** (con confirmación). Sin cuenta la app no cambia. Si mueves el archivo a otra carpeta en Drive, las siguientes syncs lo siguen.

Detalle: [sync.md](sync.md).

## Comportamiento común en sesión

- Pitidos (Web Audio) y vibración / haptics.
- Wake lock: la pantalla no se apaga mientras corre el timer o la sesión de plan.
- Botón atrás de Android: historial; en la raíz, sale de la app.
- Layout móvil: columna `max-w-lg`, fondos oscuros, acento naranja (`flame`).

## Qué no hace (hoy)

- iOS.
- Publicación en Play Store (el script actual genera APK de **debug**).
