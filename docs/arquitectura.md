# Arquitectura

## Stack

- React 19 + React Router 7 (`HashRouter`, para que la APK sirva `index.html` en cualquier ruta).
- Vite 8, `base: './'`.
- Tailwind 4 (`src/index.css`, tokens `ink` / `flame` / `work` / `rest`).
- Capacitor 8 → proyecto `android/` (`applicationId` `com.wodplanning.app`).
- TypeScript. Lint: oxlint.

No hay backend ni tests automatizados de UI. El chequeo de contrato es `npm run check:compat`.

## Rutas

Definidas en `src/App.tsx`. Cualquier otra → `/`.

| Hash | Página |
| --- | --- |
| `#/` | Home |
| `#/timers` | Menú timers |
| `#/timers/:kind` | Setup |
| `#/timers/:kind/run` | Carrera |
| `#/wods` | Lista |
| `#/wods/:id` | Editor (`new` o uuid) |
| `#/plan` | Lista de programas |
| `#/plan/:programId` | Programa |
| `#/plan/:programId/day/:dayId` | Editor de día |
| `#/plan/:programId/day/:dayId/train` | Sesión |

`:kind` debe estar en `TIMER_KINDS`. Si no, redirect.

## Árbol `src/`

```
pages/          pantallas
components/     Screen, TopBar, TimerFields, WodBlockList, WodOverlay, chips/stepper
hooks/          useTimerEngine, useRestTimer
lib/            engine, wods, programs, sessions, runSession, audio, haptics, wakeLock
types/          timer, wod, program  ← contratos de datos
data/           kinds, templates, powerClean100, kippingMuscleUp
```

## Persistencia

| Dónde | Clave | Contenido |
| --- | --- | --- |
| localStorage | `wodplanning.wods` | `Wod[]` |
| localStorage | `wodplanning.programs` | `Program[]` (+ reseed de plantillas) |
| localStorage | `wodplanning.sessions` | `SessionLog[]` |
| sessionStorage | `wodplanning.runSession` | timer en curso + WOD opcional |
| sessionStorage | `wodplanning.timerConfig` | legado |

Lectura siempre con try/JSON.parse y normalizers. Escritura = JSON.stringify del array completo.

## Android

- `capacitor.config.ts`: `appId`, `appName` WOD Planning, `webDir: dist`.
- Scripts: `dev`, `build`, `android:sync` (build + cap sync), `apk` (**debug**).
- Permisos: INTERNET, VIBRATE, WAKE_LOCK.
- `versionCode` / `versionName` en `android/app/build.gradle` (hoy 1 / 1.0). `package.json` tiene `0.1.0` — no están acoplados.
- Play Store exigiría AAB firmado, no el APK de debug.

## UI

`Screen`: columna `max-w-lg`, safe areas. En escritorio la app se ve como un móvil centrado. Fuentes: Bebas Neue (display), Outfit (UI), Roboto Condensed (reloj).
