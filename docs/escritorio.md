# Escritorio → app (ideas)

Copia entre dispositivos vía Google Drive o fichero: [sync.md](sync.md) (`#/sync`). Lo de abajo sigue siendo ideas no hechas (layout de escritorio, QR, carpeta compartida).

## Situación actual

- Un solo front: Vite + HashRouter. Capacitor solo envuelve `dist/` en WebView.
- Datos en `localStorage` del origen. En Chrome desktop eso **no** es el `localStorage` de la APK. Son dos silos, salvo que uses Drive o un pack JSON.

En `#/sync` ya hay **Exportar** / **Importar** del pack `wodtobox.pack` (el mismo JSON que Drive). Importar sustituye, con confirmación.

Cualquier puente escritorio ↔ móvil tiene que copiar **JSON** con las mismas formas que [contrato.json](contrato.json) (`Wod[]`, `Program[]`, `SessionLog[]`), no un formato paralelo.

## Idea A — La app web es el editor; el móvil es el player

Usar el navegador en el PC (layout más ancho, teclado, PDF al lado) para montar WODs y semanas. En el móvil, timers y sesión.

Puente mínimo **ya en la app**: **Exportar** / **Importar** en `#/sync` descarga o lee un `.json`:

```json
{
  "format": "wodtobox.pack",
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
- Overwrite de `wodtobox.sessions` sin preguntar (se pierde el día a medias).
- Cambiar las claves de `localStorage` para “preparar el sync”. El pack debe **mapear** a esas claves, no sustituirlas.

## Orden de implementación sugerido (cuando se haga)

1. ~~Definir `wodtobox.pack`~~ y ~~export/import en `#/sync`~~ — hecho.
2. Layout desktop opcional (`min-width`) sin romper `max-w-lg` del timer a pantalla completa.
3. Share nativo Android (Filesystem + Share) si el `<a download>` / Web Share no basta.
4. QR o carpeta compartida, si hace falta.
