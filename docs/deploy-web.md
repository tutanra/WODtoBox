# Publicar WODtoBox en el VPS (web)

Sitio público: **[http://jc-applabs.com/wodtobox/](http://jc-applabs.com/wodtobox/)** (HTTP, no HTTPS).

La app web es el mismo `dist/` de Vite (`base: './'`, `HashRouter`). No hay backend: nginx solo sirve ficheros estáticos bajo `/var/www/html/wodtobox`.

## Comando

Desde este repo (con `.env` configurado y SSH a `javi@jc-applabs.com`):

```bash
npm run web
```

Ejecuta `scripts/deploy-web.mjs`:

1. `npm run build` → `dist/`
2. Sube `dist/` al VPS:
   - con **rsync** (`-avz --delete`) si está en el PATH (preferido);
   - si no, **tar + ssh** (borra el contenido remoto y extrae).

Defaults sin `.env` de usuario/host: `javi` @ `jc-applabs.com`. Obligatoria: `WEB_DEPLOY_PATH`.

## Para el agente

Tras un **commit** que afecte a la app web (UI, lógica en `src/`, build, assets públicos), **pregunta al humano** si quiere publicar con `npm run web`. No despliegues solo: espera el sí. Si el commit es solo docs/Android/scripts de APK sin cambio de `dist`, no hace falta preguntar.

Detalle operativo de commit + deploy: también en [para-agentes.md](para-agentes.md) y `AGENTS.md`.

## Estado actual del VPS (resumen)

| Ítem | Valor |
| --- | --- |
| Host | `jc-applabs.com` |
| Usuario SSH | `javi` |
| Ruta remota | `/var/www/html/wodtobox` |
| URL | `http://jc-applabs.com/wodtobox/` |
| Permisos | carpeta de `javi:javi` (sin `sudo` en el deploy) |
| Runtime en el servidor | solo nginx; no Node ni Capacitor |

## Configuración local (`.env`)

Copia `.env.example` → `.env` (fuera de git):

```env
WEB_DEPLOY_PATH=/var/www/html/wodtobox
WEB_DEPLOY_URL=http://jc-applabs.com/wodtobox/
```

| Variable | Ejemplo | Obligatorio |
| --- | --- | --- |
| `WEB_DEPLOY_PATH` | `/var/www/html/wodtobox` | sí |
| `WEB_DEPLOY_USER` | `javi` | no (default `javi`) |
| `WEB_DEPLOY_HOST` | `jc-applabs.com` | no (default `jc-applabs.com`) |
| `WEB_DEPLOY_PORT` | `22` | no |
| `WEB_DEPLOY_SSH_KEY` | ruta a clave privada | no |
| `WEB_DEPLOY_URL` | `http://jc-applabs.com/wodtobox/` | no (mensaje final) |
| `WEB_DEPLOY_RSYNC_PATH` | `sudo rsync` | no (evitar; ver abajo) |

Comprobar SSH y escritura:

```bash
ssh -o BatchMode=yes javi@jc-applabs.com 'touch /var/www/html/wodtobox/.write-test && rm /var/www/html/wodtobox/.write-test && echo ok'
```

El script usa `ssh -o BatchMode=yes`: hace falta clave en el VPS (`authorized_keys`), no prompt de contraseña.

En este PC: `rsync` y `ssh` (y `tar` como respaldo).

## Cómo automatizar sin sudo en cada deploy

No guardes la contraseña de sudo en `.env` ni uses `sudo -S` en el script.

**Una vez en el VPS** (con sudo):

```bash
sudo mkdir -p /var/www/html/wodtobox
sudo chown -R javi:javi /var/www/html/wodtobox
```

Así `javi` escribe con rsync y `npm run web` no pide nada.

### Alternativa (peor): sudoers + `WEB_DEPLOY_RSYNC_PATH`

Solo si la carpeta debe seguir siendo de root:

```
javi ALL=(root) NOPASSWD: /usr/bin/rsync
```

y `WEB_DEPLOY_RSYNC_PATH=sudo rsync`. Preferible el `chown`.

## Nginx (una vez)

Ejemplo si el `root` del sitio es `/var/www/html`:

```nginx
location /wodtobox/ {
    alias /var/www/html/wodtobox/;
    try_files $uri $uri/ /wodtobox/index.html;
}

location = /wodtobox {
    return 301 /wodtobox/;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Hoy el sitio se sirve por **HTTP**. HTTPS (certbot) es opcional y no está en uso para esta URL.

No hace falta reiniciar nginx en cada `npm run web`: solo cambian ficheros.

## Google Sign-In (`#/sync`)

El origen OAuth web debe coincidir con la URL real. Con HTTP público, GIS de Google suele exigir HTTPS salvo `localhost`. Mientras el sitio sea `http://jc-applabs.com`, el login Google en esa web puede fallar; local (`http://localhost:5173`) y la APK siguen aparte. Detalle: [sync.md](sync.md).

## Relación con el resto del proyecto

| Pieza | Rol |
| --- | --- |
| `npm run build` | Genera `dist/` (también Capacitor). |
| `npm run web` | Build + subida al VPS. |
| `npm run apk` / `aab` | Android; no toca el VPS. |
| Datos | `localStorage` del navegador; el VPS no los guarda. |

No cambies `HashRouter` ni `base: './'` solo por el deploy web: el contrato y la APK dependen de ellos. Con rutas relativas, `/wodtobox/` funciona sin retocar Vite.
