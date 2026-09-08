# Arquitectura

## Stack

- React 19 + React Router 7 (`HashRouter`, para que la APK sirva `index.html` en cualquier ruta).
- Vite 8, `base: './'`.
- Tailwind 4 (`src/index.css`, tokens `ink` / `flame` / `work` / `rest`).
- Capacitor 8 → proyecto `android/` (`applicationId` `com.wodotobox.app`).
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
| `#/wods` | Lista (propios + menú WOD Heroes abajo) |
| `#/wods/heroes` | Plantillas clásicas |
| `#/wods/:id` | Editor (`new`, uuid o `hero-*`) |
| `#/plan` | Lista de programas |
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
lib/            engine, wods, programs, sessions, history, rms, pack, sync, googleAuth, drive, runSession, migrate, audio, haptics, wakeLock
types/          timer, wod, program, history, rm, pack  ← contratos de datos
data/           kinds, templates, powerClean100, kippingMuscleUp
```

## Persistencia

| Dónde | Clave | Contenido |
| --- | --- | --- |
| localStorage | `wodtobox.wods` | `Wod[]` |
| localStorage | `wodtobox.programs` | `Program[]` (+ reseed de plantillas) |
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

- `capacitor.config.ts`: `appId` `com.wodotobox.app`, `appName` WODtoBox, `webDir: dist`.
- Scripts: `dev`, `build`, `android:sync` (build + cap sync), `apk` (**debug**, vía `scripts/build-apk.mjs`).
- Permisos: INTERNET, VIBRATE, WAKE_LOCK.
- Google Drive en el APK pide scopes; `MainActivity` implementa `ModifiedMainActivityForSocialLoginPlugin` (Capgo Social Login). Sin eso, Google falla al entrar.
- `versionCode` / `versionName` en `android/app/build.gradle` (hoy 1 / 1.0). `package.json` tiene `0.1.0` — no están acoplados.
- Play Store exigiría AAB firmado, no el APK de debug.
- Cómo construir (JDK 21, SDK, errores conocidos): [android-build.md](android-build.md).

## UI

`Screen`: columna `max-w-lg`, safe areas. En escritorio la app se ve como un móvil centrado. Fuentes: Bebas Neue (display), Outfit (UI), Roboto Condensed (reloj).
