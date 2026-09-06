# WOD Planning

App de timers de CrossFit para Android. El menú principal separa **Timers** (AMRAP, For Time, EMOM, Tabata, intervalos y cronómetro) de **WODs grabados**, que queda preparado para una fase posterior.

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
