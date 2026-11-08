# Tienda de apps Qadre (`qadre.net/tienda`)

Guía para publicar y mantener las apps descargables de Qadre.

## Cómo funciona

| Pieza | Dónde | Para qué |
|---|---|---|
| Lista de apps | `src/app/store.ts` → `STORE_APPS` | Todo lo que se ve en la tienda sale de aquí |
| Página | `src/app/store.html` / `store.css` | Diseño (reutiliza `app.css` de la landing) |
| Ruta | `src/main.ts` | Si la URL empieza por `/tienda` carga la tienda; si no, la landing |
| Versión en vivo | API `GET /api/v1/public/<app>-version` | Devuelve `{ version, url }`; la tienda y el actualizador de la app leen lo mismo |
| Archivo APK | Hosting externo (ver abajo) | Lo que realmente se descarga |

Las categorías (chips) y la tarjeta "Próximamente" se generan solas.

---

## Agregar una app nueva (paso a paso)

### 1. Imágenes
Crea la carpeta `public/img/apps/<id>/` con:
- `icon.png` — cuadrado, 512×512, sin bordes redondeados (la tienda los redondea).
- Capturas `.webp` (vertical u horizontal, ~340 px de alto se muestran bien). 2 a 5 capturas.

### 2. Entrada en `STORE_APPS` (`src/app/store.ts`)

```ts
{
  id: 'citas',                         // único, sin espacios
  name: 'Qadre Citas',
  tagline: 'Agenda y reservas para tu negocio',
  category: 'Agenda',                  // categoría nueva = chip nuevo automático
  icon: 'img/apps/citas/icon.png',
  downloadUrl: 'https://…/qadre-citas.apk', // sin esto se muestra "Próximamente"
  version: '1.0.0',                    // valor de respaldo si la API no responde
  versionApi: '/public/citas-version', // opcional, ver paso 3
  requirements: 'Android 8.0 o superior',
  about: ['Párrafo 1…', 'Párrafo 2…'],
  highlights: [                        // 2 a 4; icon = id del sprite en store.html
    { icon: 'i-zap', title: '…', text: '…' },
  ],
  screenshots: ['img/apps/citas/1.webp', 'img/apps/citas/2.webp'],
},
```

Íconos disponibles para `highlights`: `i-zap`, `i-card`, `i-wallet`, `i-trend`, `i-phone`, `i-shield`, `i-download`, `i-plus`.
Para uno nuevo, copia su `<symbol>` del sprite de `app.html` al de `store.html`.

**Truco:** para anunciar una app antes de lanzarla, agrégala sin `downloadUrl`; aparece como "Próximamente".

### 3. (Opcional, recomendado) Versión desde la API
Así publicas una versión nueva sin tocar ni volver a desplegar la landing.

En `qadre_api/src/modules/platform/platform.controller.ts`, copia el endpoint `pos-version` cambiando el prefijo:

```ts
@Get('citas-version')
citasVersion() {
  return {
    version: process.env.CITAS_VERSION ?? '1.0.0',
    build: Number(process.env.CITAS_LATEST_BUILD ?? 1),
    url: process.env.CITAS_APK_URL ?? '',
    minBuild: Number(process.env.CITAS_MIN_BUILD ?? 1),
  };
}
```

Agrega esas 4 variables a `qadre_api/.env.example` y al `.env` del servidor.

### 4. Probar y publicar
```bash
cd qadre_landing && npx ng serve
```
Abre `http://localhost:4200/tienda`, revisa modo claro/oscuro y móvil. Luego `npm run build` y despliega como siempre (Cloudflare Pages).

---

## Publicación automática de Qadre POS (recomendado)

Un workflow de GitHub Actions (`.github/workflows/pos-release.yml`) compila, firma, verifica la huella, sube el APK a R2 y escribe `apps/pos-version.json`. La API lee ese archivo (`/public/pos-version`), así que **no hay que tocar la VPS ni la landing** para publicar.

### Publicar una versión (cada vez)

```bash
git tag pos-v1.0.2
git push origin pos-v1.0.2
```

O en GitHub: **Actions › Publicar Qadre POS › Run workflow**, escribe la versión y, si hay que obligar a todos a actualizar, marca *force_update*.

En ~10-15 min el APK queda en `https://media.qadre.net/apps/qadre-pos-<build>.apk`, la tienda lo muestra y las apps instaladas ven el aviso (la API refresca la versión cada 5 min).

- La versión la eliges tú en el tag (`1.0.2`); el build lo pone el workflow (número de ejecución + 10, siempre sube).
- Si la firma no coincide con la huella de Qadre, el workflow se detiene y no publica nada.
- El APK también queda descargable 30 días en la ejecución (Actions › la ejecución › Artifacts).

### Configuración (una sola vez)

**1. Activar GitHub Actions**
GitHub › repo `Qadre` › pestaña **Actions**. Si pide habilitarlo, pulsa *I understand my workflows, go ahead and enable them*. En **Settings › Actions › General**, deja *Allow all actions*.

**2. Convertir la clave a texto (PowerShell, en tu PC)**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\VICTUS\qadre-pos.jks")) | Set-Clipboard
```
Queda copiado en el portapapeles (no lo pegues en ningún otro lado).

**3. Crear un token de R2 con permiso de escritura**
Cloudflare › R2 Object Storage › **Manage R2 API Tokens / Administrar tokens de API** › *Create API token*:
- Permiso: **Object Read & Write**.
- Alcance: solo el bucket `qadre`.
- Al crearlo, copia **Access Key ID** y **Secret Access Key** (el secreto solo se muestra una vez).
- El **Account ID** aparece en la misma página de R2 (también está en la URL del panel: `dash.cloudflare.com/<account_id>/r2/...`).

**4. Guardar los secrets en GitHub**
GitHub › repo › **Settings › Secrets and variables › Actions › New repository secret**. Crea estos 8:

| Secret | Valor |
|---|---|
| `POS_KEYSTORE_BASE64` | Lo copiado en el paso 2 |
| `POS_KEYSTORE_PASSWORD` | La contraseña de la clave |
| `POS_KEY_ALIAS` | `qadre` |
| `R2_ACCOUNT_ID` | Account ID de Cloudflare |
| `R2_ACCESS_KEY_ID` | Del token del paso 3 |
| `R2_SECRET_ACCESS_KEY` | Del token del paso 3 |
| `R2_BUCKET` | `qadre` |
| `R2_PUBLIC_URL` | `https://media.qadre.net` |

**5. Desplegar la API una vez** (para que lea el manifiesto)
En la VPS: `cd /opt/qadre_api && git pull && docker compose up -d --build`.
Usa `R2_PUBLIC_URL`, que ya está en el `.env`. Las variables `POS_*` del `.env` quedan solo como respaldo.

**6. Primera publicación de prueba**
`git tag pos-v1.0.1 && git push origin pos-v1.0.1` y revisa la pestaña Actions. Al terminar, abre `https://api.qadre.net/api/v1/public/pos-version`: debe mostrar `1.0.1` y la URL nueva.

### Si algo falla

| Error en Actions | Qué hacer |
|---|---|
| *Faltan los secrets POS_KEYSTORE…* | Revisa los nombres del paso 4 (mayúsculas exactas) |
| *El APK no está firmado con la clave de Qadre* | `POS_KEYSTORE_BASE64` no es el `.jks` correcto: repite el paso 2 |
| *AccessDenied* / *InvalidAccessKeyId* al subir | Token de R2 sin permiso de escritura o de otro bucket: repite el paso 3 |
| La versión debe tener el formato 1.2.3 | El tag debe ser `pos-v` + número, ej. `pos-v1.0.2` |

## Publicar una versión a mano (sin GitHub Actions)

1. Elige versión y build nuevos (el build **siempre sube**; los builds 1-10 quedan para publicaciones a mano, el workflow usa del 11 en adelante).
2. Compila el APK del flavor POS (desde `qadre_app/apps/qadre_web`). Build y versión van **dos veces**: una para Android y otra para el aviso de actualización:
   ```bash
   flutter build apk --release --flavor pos --target-platform android-arm,android-arm64 --build-name=1.1.0 --build-number=2 --dart-define=POS_ONLY=true --dart-define=VERSION=1.1.0 --dart-define=BUILD=2 --dart-define=API_URL=https://api.qadre.net/api/v1
   ```
   Requiere `android/key.properties` + keystore (ver "Firma"). El APK sale en `build/app/outputs/flutter-apk/app-pos-release.apk`.
3. Verifica la firma y súbelo a R2 en `apps/qadre-pos-<build>.apk`.
4. Edita `apps/pos-version.json` en R2 (o, si no existe, las variables `POS_*` del `.env` de la VPS):
   ```json
   {"version": "1.1.0", "build": 2, "url": "https://media.qadre.net/apps/qadre-pos-2.apk", "minBuild": 1}
   ```
   `minBuild` = build mínimo permitido; súbelo para obligar a actualizar.

## Firma del APK (una sola vez, no perderla nunca)

Sin `android/key.properties` el APK se firma con la clave de *debug* de quien compila. Android solo instala una actualización si está firmada con **la misma clave** que la versión instalada; si la clave cambia, cada cliente tiene que desinstalar (y pierde la configuración de impresora).

```bash
keytool -genkey -v -keystore qadre-pos.jks -keyalg RSA -keysize 2048 -validity 10000 -alias qadre
```

`qadre_app/apps/qadre_web/android/key.properties` (ya está en `.gitignore`):
```
storePassword=…
keyPassword=…
keyAlias=qadre
storeFile=C:/ruta/segura/qadre-pos.jks
```
Guarda el `.jks` y las contraseñas en un gestor de contraseñas + copia de respaldo.

## Dónde vive el APK

En el bucket R2 `qadre` (el mismo de la multimedia), carpeta `apps/`, fuera de `qadre/` que es la de la API.
La API nunca lista ni borra en el bucket, así que no toca estos archivos.

- URL: `https://media.qadre.net/apps/qadre-pos-<build>.apk`
- Subida: Cloudflare → R2 → `qadre` → `apps/` → Cargar.
- Antes de subir, verifica la firma (huella SHA-256 `c8cdcfbbf09f9ca07970f2daccbd4551162b11f18cf115761d043613a5c096a9`):
  ```powershell
  & "$env:LOCALAPPDATA\Android\Sdk\build-tools\36.0.0\apksigner.bat" verify --print-certs "<ruta>\app-pos-release.apk"
  ```

## Checklist por app

- [ ] Ícono 512×512 y 2–5 capturas en `public/img/apps/<id>/`
- [ ] Entrada en `STORE_APPS`
- [ ] APK firmado subido al hosting
- [ ] Endpoint `<app>-version` + variables en `.env` (si usa actualizador)
- [ ] Probado en `/tienda` (claro, oscuro, móvil) y botón Instalar descarga el archivo correcto
