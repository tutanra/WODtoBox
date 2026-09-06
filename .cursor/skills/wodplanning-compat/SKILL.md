---
name: wodplanning-compat
description: Protege el contrato de datos de WOD Planning (localStorage, sessionStorage, TIMER_KINDS, ids de plantilla, applicationId, HashRouter). Use when changing src/types, src/lib persistence, docs/contrato.json, Capacitor appId, Vite base, or when adding/removing timer kinds or template IDs.
---

# Compatibilidad de datos

Lee `docs/compatibilidad.md` y `docs/contrato.json`. El backend es JSON en el dispositivo.

## Antes de editar

```bash
npm run check:compat
```

## Reglas

1. **No renombrar** claves de storage. Si hace falta otra: lector dual (clave vieja + nueva) y migrador que reescribe.
2. **No quitar** un `TimerKind`. Añadir al **final** de `TIMER_KINDS` sí.
3. **No cambiar** `power-clean-100`, `kipping-muscle-up`, ni `com.wodplanning.app`.
4. Campo nuevo → **opcional** con default en `normalizeWod` / `normalizeTimerConfig` / lectura de Program. Un JSON viejo tiene que seguir cargando.
5. Extender normalizers; no borrar ramas legacy (`isRest`, `wodplanning.timerConfig`, reseed de plantillas).
6. `rounds` no se anidan.

## Si un invariante cambia de verdad

1. Sube `schemaVersion` en `docs/contrato.json`.
2. Actualiza `anchors` / kinds / keys para que el script siga siendo verdad.
3. Documenta la migración en `docs/compatibilidad.md`.
4. Implementa el migrador **antes** de cualquier build de Android.
5. Corre otra vez:

```bash
npm run check:compat
npm run build
```

Si `check:compat` falla, no des por cerrado el cambio.
