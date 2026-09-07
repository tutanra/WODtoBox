# Compatibilidad

Objetivo: poder seguir desarrollando sin romper WODs, planes ni el id de Android de quien ya tenga la app instalada (sideload o Play).

El archivo [contrato.json](contrato.json) es la lista corta de invariantes. `npm run check:compat` falla si el código ya no contiene esas cadenas.

## Nunca, sin migración

1. **Renombrar o borrar claves de storage** (`wodplanning.wods`, `.programs`, `.sessions`, `.runSession`, `.history`, `.rms`, `.sync`). Si hace falta un nombre nuevo: leer la clave antigua, escribir la nueva, dejar el lector dual un tiempo.
2. **Quitar un `TimerKind`**. Puede estar guardado en WODs. Añadir kinds sí; eliminar no, o hay que mapear el kind viejo en `normalizeWod`.
3. **Cambiar IDs de plantilla** `power-clean-100`, `kipping-muscle-up`, ni los `hero-*` de WOD Heroes. El reseed y `restoreTemplate` / `restoreHeroWod` dependen de ellos. Usuarios con ediciones las perderían al reinsertar “otro” id.
4. **Cambiar `applicationId` / `appId`** `com.wodotobox.app` una vez publicada. Play lo trata como otra app.
5. **Anidar `rounds` dentro de `rounds`**. `normalizeItem` lo prohíbe a propósito.
6. **Asumir que `timer.kind` y `wod.kind` pueden divergir**. Al guardar, el editor los iguala.

## Cómo añadir campos

- Campo nuevo **opcional** en WOD / Program / Session: dar default en `normalizeWod` / `isProgram` / `startSession`. Los JSON viejos sin el campo deben seguir cargando.
- Campo nuevo **obligatorio**: no. O es opcional con default, o hay migrador explícito que recorre el array y reescribe.
- Cambiar el significado de un campo (p. ej. `weight` de número a string): normalizer que acepte ambos.

Los normalizers actuales que hay que conservar o extender, no sustituir a ciegas:

- `normalizeTimerConfig`, `normalizeWod`, `normalizeItem` (`src/types/`)
- `readRunSession` (dual `runSession` + `timerConfig`)
- `listPrograms` (reseed de plantillas ausentes)

## Semver interno del contrato

`contrato.json` → `schemaVersion`. Sube **solo** si cambia un invariante (clave, kind, id, forma incompatible). Entonces:

1. Actualiza `contrato.json`.
2. Añade un párrafo aquí: versión, qué cambió, cómo se migran datos viejos.
3. Implementa el migrador **antes** de desplegar.
4. Pasa `npm run check:compat` y `npm run build`.

### Historial

**2** (actual) — Rebrand a WODtoBox. `applicationId` / `appId` pasa de `com.wodplanning.app` a `com.wodotobox.app`. Nombre visible: WODtoBox (ficha: «WODtoBox: WOD Timer & Plans»). Las claves `wodplanning.*` y el pack de Drive **no** cambian: un JSON viejo sigue leyéndose. La APK nueva es otra app en Android (Play la trata como distinta); los datos del sideload antiguo no se copian solos. Quien ya tenía copia en Drive puede bajarla.

**1** — Contrato inicial (WOD Planning, `com.wodplanning.app`).

## Qué sí se puede cambiar con libertad

- Copy, colores, layout, pitidos.
- Defaults de un timer **nuevo** (no reescribir JSON ya guardado).
- Contenido de las plantillas PDF: al restaurar se pisan; las ediciones del usuario en localStorage **no** se pisan hasta que pulsa “Restaurar plantilla del PDF” o borra la clave `programs`. Si cambias el builder, los usuarios que ya tienen la plantilla **conservan la copia vieja** hasta restaurar. Eso es correcto.
- Añadir rutas nuevas. No reutilizar `:kind` para otra cosa.

## Checklist antes de tocar tipos o `src/lib/*`

- [ ] ¿Sigue leyéndose un JSON de la versión anterior?
- [ ] ¿Los 6 kinds siguen en `TIMER_KINDS`?
- [ ] ¿Las dos plantillas de plan y los WOD Heroes siguen con el mismo id y `seeded: true`?
- [ ] ¿Hash router y `base: './'` siguen (si no, la APK rompe)?
- [ ] `npm run check:compat` y `npm run build`
