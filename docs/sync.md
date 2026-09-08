# Sync (Drive y fichero)

Código: `src/lib/pack.ts`, `src/lib/sync.ts`, `src/lib/googleAuth.ts`, `src/lib/drive.ts`, página `DriveSync`.

La cuenta de Google es **opcional**. Sin Google la app sigue igual (todo en `localStorage`). En `#/sync` también puedes **exportar** e **importar** un fichero JSON sin cuenta.

## Qué se copia

Mismo pack (`format: wodplanning.pack`, fichero `wodplanning.pack.json`):

- WODs (incluidos Heroes editados)
- programas y sesiones de plan
- RM
- historial

No se copia el timer en curso (`wodplanning.runSession`).

### Fichero local

- **Exportar** descarga `wodplanning.pack.json` con los datos de este dispositivo (`downloadPackFile`).
- **Importar** pide un `.json`, lo valida con `parsePack` y, tras confirmación, sustituye WODs, plan, sesiones, RM e historial (`applyPack`). Drive no se toca. Un fichero inválido muestra error y no cambia nada.

### Google Drive

Un archivo en tu Drive llamado `wodplanning.pack.json`, dentro de una carpeta **WODtoBox** que crea la app si no existe.

La app usa el ámbito `drive.file`: solo ve archivos que ella misma creó. No puede listar el resto de tus carpetas, así que no hay un selector de «cualquier carpeta de Drive». Si mueves `wodplanning.pack.json` a otra carpeta en la web de Drive, las siguientes **SYNC** actualizan ese mismo archivo (sigue donde lo dejaste). Un archivo que ya estaba en Mi unidad no se mueve solo.

`SYNC` hace la dirección que encaja con el estado: si este dispositivo está más nuevo (o no hay copia), **sube**; si Drive está más nuevo, **baja** (con confirmación). El botón secundario es la otra dirección: **Bajar de Drive** o **Subir a Drive**. Subir cuando Drive está más nuevo también pide confirmación, porque machaca la copia remota.

La comparación local/Drive usa `dataAt`: el `updatedAt` más reciente de WODs, planes, sesiones, historial y RM **del usuario**. Las plantillas PDF y WOD Heroes recién reinsertadas (tras un borrado local) no cuentan: si no, el dispositivo parecería más nuevo que Drive solo porque se han vuelto a sembrar.

El icono de papelera en `#/sync` deja elegir qué borrar, con confirmación:

- **Este dispositivo** — WODs, plan, RM, historial y sesiones locales. Las plantillas PDF y WOD Heroes vuelven al original. Drive no se toca.
- **Copia en Drive** — borra `wodplanning.pack.json` de tu Drive. Este dispositivo no se toca. Hace falta sesión de Google.

El Client ID web va integrado (`VITE_GOOGLE_CLIENT_ID` / `GOOGLE_WEB_CLIENT_ID`). En `#/sync` se pulsa **GOOGLE**; no hay que pegar credenciales. El Client ID de Android (`573815267654-oogn68pklgmoh9fkhpah4psou419r6ah.apps.googleusercontent.com`) no se usa en código: Google lo empareja por paquete `com.wodotobox.app` y SHA-1.

En Android, `MainActivity` implementa el hook de Capgo Social Login; sin eso, pedir `drive.file` falla con *You CANNOT use scopes without modifying the main activity*.

SHA-1 debug: `C3:2E:8C:DF:67:6B:E2:94:09:99:83:6F:F6:66:74:92:4C:7F:F2:25`. Para Play, el cliente Android pide el **SHA-1** del certificado de firma (Play Console → integridad de la app), no el SHA-256.

Si Google dice que la app no está verificada: en Prueba solo funcionan los **usuarios de prueba**. `drive.file` es un ámbito sensible; para el público hace falta verificación. Para uso propio, Prueba + tu correo basta.

Prueba el login en Chrome o Firefox en `http://localhost:5173` (no en `127.0.0.1`). El cliente OAuth web debe tener ese origen. GIS cierra el popup al aprobar; eso no es una cancelación.

## UI

`#/sync` — última sync, carpeta de la copia, si este dispositivo o Drive está más nuevo, bloque **Fichero** (Exportar / Importar), Google / SYNC (sube o baja según quién esté más nuevo) / el otro sentido / papelera (borrar local o Drive) / cerrar sesión.
