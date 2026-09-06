---
name: wodplanning-android
description: Construye o ajusta la envoltura Android (Capacitor, APK debug, applicationId, sync). Use when the user mentions APK, Gradle, Capacitor, Play Store, signing, appId, or android/ files.
---

# Android (Capacitor)

Lee `docs/arquitectura.md` (sección Android). WebView de `dist/` con las mismas rutas hash.

## Identidad

- `appId` / `applicationId`: `com.wodplanning.app` — no cambiar si ya hay instalaciones.
- Nombre: `WOD Planning`.
- `minSdk` 24, `targetSdk` 36.

## Comandos

```bash
npm run android:sync    # build web + cap sync android
npm run apk             # lo anterior + assembleDebug
```

APK debug: `android/app/build/outputs/apk/debug/app-debug.apk`.

Play Store **no** usa este APK. Haría falta AAB firmado (`bundleRelease`) y keystore (no commitear; ya está en `.gitignore`).

## Al tocar nativo

- Permisos actuales: `INTERNET`, `VIBRATE`, `WAKE_LOCK`. No pidas más sin usarlos.
- Tras cambiar web: siempre `android:sync` antes de reinstalar.
- `versionCode` / `versionName` viven en `android/app/build.gradle`, no en `package.json`.
- Botón atrás: `App.tsx` (historial o `exitApp`).

No implementes publicación en Play salvo que lo pidan. Guía humana: no está en skills; el consejo ya se dio en chat.
