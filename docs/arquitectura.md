# Arquitectura

## Stack

- React 19 + React Router 7 (`HashRouter`, para que la APK sirva `index.html` en cualquier ruta).
- Vite 8, `base: './'`.
- Tailwind 4 (`src/index.css`, tokens `ink` / `flame` / `work` / `rest`).
- Capacitor 8 → proyecto `android/` (`applicationId` `com.wodtobox.app`).
- TypeScript. Lint: oxlint.

No hay backend ni tests automatizados de UI. El chequeo de contrato es `npm run check:compat`.

## Rutas

Definidas en `src/App.tsx`. Cualquier otra → `/`.

| Hash | Página |
| --- | --- |
| `#/` | Home |
| `#/sync` | Google Drive (opcional) y pack JSON (exportar / importar) |
| `#/timers` | Menú timers |
| `#/timers/:kind` | Setup |
| `#/timers/:kind/run` | Carrera |
| `#/wods` | Lista (propios, importar `.wodtobox` de WOD, menú WOD Heroes abajo) |
| `#/wods/heroes` | Plantillas clásicas |
| `#/wods/:id` | Editor (`new`, uuid o `hero-*`) |
| `#/plan` | Lista de programas (importar `.wodtobox` de plan) |
| `#/plan/:programId` | Programa |
| `#/plan/:programId/day/:dayId` | Editor de día |
| `#/plan/:programId/day/:dayId/train` | Sesión |
| `#/rm` | Pesos máximos |
| `#/rm/:id` | Editor de RM (`new` o uuid) |
| `#/historial` | Lista de entrenos terminados |
| `#/historial/:id` | Detalle de un entreno |

`:kind` debe estar en `TIMER_KINDS`. Si no, redirect.

## Árbol `src/`

```
pages/          pantallas
components/     Screen, TopBar, TimerFields, WodBlockList, WodOverlay, chips/stepper
hooks/          useTimerEngine, useRestTimer
lib/            engine, wods, programs, sessions, history, rms, pack, shareWod, sharePlan, sync, googleAuth, drive, runSession, migrate, audio, haptics, wakeLock
types/          timer, wod, program, history, rm, pack  ← contratos de datos
data/           kinds, heroWods
```

## Persistencia

| Dónde | Clave | Contenido |
| --- | --- | --- |
| localStorage | `wodtobox.wods` | `Wod[]` |
| localStorage | `wodtobox.programs` | `Program[]` |
| localStorage | `wodtobox.sessions` | `SessionLog[]` |
| localStorage | `wodtobox.history` | entrenos terminados (WOD + plan + RM) |
| localStorage | `wodtobox.rms` | máximos (ejercicio, reps, peso) |
| localStorage | `wodtobox.sync` | última sync Drive (no el pack) |
| localStorage | `wodtobox.googleSession` | token de Google (opcional) |
| sessionStorage | `wodtobox.runSession` | timer en curso + WOD opcional |
| sessionStorage | `wodtobox.timerConfig` | legado |

Al arrancar, `migrateLegacyStorage` copia `wodplanning.*` a `wodtobox.*` y borra las claves viejas.

Lectura siempre con try/JSON.parse y normalizers. Escritura = JSON.stringify del array completo.

## Android

- `capacitor.config.ts`: `appId` `com.wodtobox.app`, `appName` WODtoBox, `webDir: dist`.
- Scripts: `dev`, `build`, `android:sync` (build + cap sync), `apk` (**debug**), `aab` (**release** firmado para Play).
- Permisos: INTERNET, VIBRATE, WAKE_LOCK.
- Un `.wodtobox` se puede **Abrir con** / **Compartir** hacia WODtoBox (`MainActivity` + `OpenWodPlugin`). El contenido decide la ruta: `wodtobox.wod` → `#/wods`, `wodtobox.plan` → `#/plan`. No pide permisos extra: lee el `content://` que manda la otra app. **Compartir** desde la app usa `@capacitor/share` y un fichero en caché (`file_paths.xml` ya cubre `cache-path`).
- Google Drive en el APK pide scopes; `MainActivity` implementa `ModifiedMainActivityForSocialLoginPlugin` (Capgo Social Login). Sin eso, Google falla al entrar.
- `versionCode` / `versionName` en `android/app/build.gradle` (hoy 1 / 1.0). `package.json` tiene `0.1.0` — no están acoplados.
- Release: R8 (`minifyEnabled true`) con reglas Capacitor/Google en `android/app/proguard-rules.pro`. El mapping va en el AAB.
- Play Console usa el AAB de `npm run aab`, no el APK de debug. La keystore de subida de **esta** app es `android/wodtobox-upload.jks` + `keystore.properties` (no git). No reutilizar `upload-keystore.jks` de `com.wodotobox.app`.
- Cómo construir (JDK 21, SDK, errores conocidos): [android-build.md](android-build.md).

## UI

`Screen`: columna `max-w-lg`, safe areas. En escritorio la app se ve como un móvil centrado. Fuentes: Bebas Neue (display), Outfit (UI), Roboto Condensed (reloj).
