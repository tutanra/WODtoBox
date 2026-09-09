---
name: wodtobox-android
description: Construye o ajusta la envoltura Android (Capacitor, APK debug, applicationId, sync). Use when the user mentions APK, Gradle, Capacitor, Play Store, signing, appId, or android/ files.
---

# Android (Capacitor)

Lee `docs/arquitectura.md` (sección Android). WebView de `dist/` con las mismas rutas hash.

## Identidad

- `appId` / `applicationId`: `com.wodtobox.app` — no cambiar si ya hay instalaciones. La ficha `com.wodotobox.app` está descartada.
- Nombre: `WODtoBox`.
- `minSdk` 24, `targetSdk` 36.

## Comandos

```bash
npm run apk             # sync + assembleDebug (elige JDK 21 y el SDK)
npm run aab             # sync + bundleRelease firmado (Play Console)
npm run android:sync    # solo build web + cap sync
```

APK debug: `android/app/build/outputs/apk/debug/app-debug.apk`.
AAB release: `android/app/build/outputs/bundle/release/app-release.aab`.

**JDK:** Capacitor 8 necesita Java **21**. Ni el 17 (`invalid source release: 21`) ni el 26 de Arch (`jlink` / JdkImageTransform). En esta máquina: `~/.local/jdk-21`. Si falta, ver `docs/android-build.md`. No pongas `org.gradle.java.home` absoluto en git.

**SDK:** `android/local.properties` (`sdk.dir`) o `ANDROID_HOME`. Ese archivo no se commitea.

Play Console usa el AAB, no el APK de debug. La keystore de subida (`android/wodtobox-upload.jks` + `android/keystore.properties`) no va a git. No reutilizar `upload-keystore.jks` de `com.wodotobox.app`. `versionCode` / `versionName` viven en `android/app/build.gradle`. Release lleva R8; el mapping de desofuscación va dentro del AAB.

## Al tocar nativo

- Permisos actuales: `INTERNET`, `VIBRATE`, `WAKE_LOCK`. No pidas más sin usarlos.
- Tras cambiar web: siempre `android:sync` antes de reinstalar.
- `versionCode` / `versionName` viven en `android/app/build.gradle`, no en `package.json`.
- Botón atrás: `App.tsx` (historial o `exitApp`).
- Google Drive: `MainActivity` debe implementar `ModifiedMainActivityForSocialLoginPlugin` (scopes). No lo pises al regenerar el proyecto nativo.

No implementes la ficha de Play (textos de tienda, capturas, política) salvo que lo pidan. El AAB sí: `npm run aab`.
