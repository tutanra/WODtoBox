# WOD Planning

App de CrossFit para Android: timers de WOD, workouts grabados y planificación de fuerza. El menú principal tiene tres entradas.

Todo se guarda en el dispositivo (sin cuenta ni servidor). En sesión hay pitidos, vibración y la pantalla no se apaga.

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
- se puede guardar a medias y seguir luego

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. La navegación usa hash (`#/timers`) para que el mismo build funcione dentro de la APK.

## Generar la APK

Hace falta Android SDK / Android Studio y `ANDROID_HOME`.

```bash
npm run android:add   # solo la primera vez
npm run apk
```

El APK de debug queda en:

`android/app/build/outputs/apk/debug/app-debug.apk`

También puedes abrir el proyecto nativo con:

```bash
npx cap open android
```
