# Escritorio → app (ideas, no implementado)

Nada de esto existe aún. El código actual ya se puede **abrir en el navegador** (`npm run dev` → `http://localhost:5173`) con la misma UI de columna estrecha. No hay export, ni sync, ni layout de escritorio.

## Situación actual

- Un solo front: Vite + HashRouter. Capacitor solo envuelve `dist/` en WebView.
- Datos en `localStorage` del origen. En Chrome desktop eso **no** es el `localStorage` de la APK. Son dos silos.
- No hay fichero, QR, cuenta ni API.

Cualquier puente escritorio ↔ móvil tiene que copiar **JSON** con las mismas formas que [contrato.json](contrato.json) (`Wod[]`, `Program[]`, `SessionLog[]`), no un formato paralelo.

## Idea A — La app web es el editor; el móvil es el player

Usar el navegador en el PC (layout más ancho, teclado, PDF al lado) para montar WODs y semanas. En el móvil, timers y sesión.

Puente mínimo: un botón **Exportar pack** / **Importar pack** que descarga o lee un `.json`:

```json
{
  "format": "wodplanning.pack",
  "schemaVersion": 1,
  "exportedAt": 0,
  "wods": [],
  "programs": [],
  "sessions": []
}
```

En el teléfono: compartir el archivo (Drive, WhatsApp, USB, correo) → Importar. Un merge explícito: “añadir / sustituir por id”, nunca un sync silencioso que pise series hechas.

Encaja con Capacitor (`Filesystem` + `Share`) más adelante; no hace falta backend.

## Idea B — Mismo pack, arrastre o código

- Arrastrar el JSON a la ventana web.
- QR con el pack **pequeño** (un WOD, no 12 semanas de Power Clean).
- URL `https://…/#/import?…` frágil (tamaño, privacidad). Mejor fichero.

## Idea C — Escritorio como “mesa de programación”

Pantalla split: izquierda el PDF / notas, derecha el día del plan. Atajos de teclado para series. Exporta solo el `Program` tocado, no toda la app. El móvil importa y el atleta solo pulsa Entrenar.

Útil para las plantillas: editar kilos del Power Clean en el PC una vez y mandar el programa al móvil.

## Idea D — Carpeta compartida

Un directorio (Syncthing, Nextcloud, carpeta Android) con `wods.json` y `programs.json`. La app, al arrancar, si existe el fichero y `schemaVersion` coincide, ofrece “cargar desde carpeta”. Sigue siendo pull explícito, no sync bidireccional automático (los conflictos de `SessionLog` son feos).

## Idea E — PWA instalable en el PC

`vite` + manifest. Misma app, icono en el escritorio. Sigue sin resolver el salto al Android: hace falta A o D.

## Qué no conviene

- Dos modelos de datos (uno “de escritorio” y otro móvil).
- Cuenta obligatoria solo para pasar un JSON.
- Overwrite de `wodplanning.sessions` sin preguntar (se pierde el día a medias).
- Cambiar las claves de `localStorage` para “preparar el sync”. El pack debe **mapear** a esas claves, no sustituirlas.

## Orden de implementación sugerido (cuando se haga)

1. Definir `wodplanning.pack` en el contrato (`schemaVersion` compartido) y validarlo con el mismo `check:compat`.
2. Export/import en la web (ya sirve en el móvil dentro de Capacitor).
3. Layout desktop opcional (`min-width`) sin romper `max-w-lg` del timer a pantalla completa.
4. Share nativo Android.
5. Recién entonces, si hace falta, nube.

Hasta que exista el pack, el workaround es: crear el WOD/plan en el navegador del PC solo como referencia visual, y volver a teclearlo en el teléfono — o usar Chrome remote debugging; no copia datos.
