# WODtoBox

App de entrenamiento funcional para Android: timers de WOD, workouts grabados, planificación de fuerza, máximos e historial. El menú principal tiene cinco entradas. Ficha: **WODtoBox: WOD Timer & Plans**.

Todo se guarda en el dispositivo. Puedes copiar WODs, plan, RM e historial a Google Drive o a un fichero JSON (icono de nube junto al título: **Exportar** / **Importar**, o **GOOGLE**).

Documentación completa (flujos, plantillas, arquitectura y contrato para no romper datos): [`docs/`](docs/README.md).

## Timers

Formatos sueltos, sin WOD asociado:

- **AMRAP** — cuenta atrás; se marcan rondas con `+ RONDA`
- **For Time** — con o sin cap; cuenta de 0 al cap o al revés; `FINISH` al completar
- **EMOM** — intervalo (30 s a 3 min) y número de rondas
- **Tabata** — 20/10 × 8 por defecto; work, rest y rondas editables
- **Intervalos** — bloques work/rest personalizados
- **Cronómetro** — tiempo hacia arriba, sin estructura

Antes de arrancar hay cuenta atrás opcional de 10 s (3-2-1). En marcha: pausa, reinicio y barra de progreso. Los últimos segundos de trabajo se avisan en rojo.

## WODs

Lista de workouts propios (Fran, Cindy, el del día…). Cada uno tiene nombre, formato de timer y contenido:

- ejercicios con peso aparte
- descansos con tiempo (15 s–3 min)
- grupos de rondas (varios movimientos que se repiten juntos)

Se guarda, se edita, se borra y se lanza al timer. Durante la cuenta, el overlay enseña los bloques y destaca el movimiento o el descanso activo.

Al final de la lista hay **WOD Heroes**: plantillas clásicas (Fran, Cindy, Murph…) con pesos en kg.

## Plan

Programas por semanas y días, con ejercicios, series, kilos y cues.

Vienen dos plantillas (se pueden editar kilos y reps; no se borran):

- **Road to 100 kg** — Power Clean, 12 semanas
- **Kipping Muscle-Up** — especialización, 8 semanas

También se pueden crear planificaciones propias (semanas, copiar semana, días).

En un día de entreno:

- se marca cada serie hecha y se ajustan las reps reales
- al completar una serie arranca la pausa (2–3 min, o a mano)
- el progreso del día se ve en el programa
- se puede guardar a medias y seguir luego; esas series ya entran en Historial (con el peso)
- **Reiniciar plan** (al final del programa) borra el progreso de las sesiones; el historial se queda

## RM

Pesos máximos: ejercicio, reps y kilos. Los mejores y el registro. Al guardar también van al historial.

## Historial

WODs que acabaron en el timer, días de plan (series y peso de ese día) y RM. Se agrupan por día. Los WODs se pueden borrar de la lista; el plan y el RM, no.

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. La navegación usa hash (`#/timers`) para que el mismo build funcione dentro de la APK.

`npm run check:compat` comprueba que las claves de datos, formatos de timer e ids de plantilla no se hayan roto respecto a `docs/contrato.json`.

## Generar la APK

```bash
npm run apk
```

El script elige solo el **JDK 21** y el SDK (`local.properties` o `ANDROID_HOME`). Detalle y fallos conocidos: [`docs/android-build.md`](docs/android-build.md).

El APK de debug queda en:

`android/app/build/outputs/apk/debug/app-debug.apk`

También puedes abrir el proyecto nativo con:

```bash
npx cap open android
```
