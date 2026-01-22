# DJ Ponte - Diagnóstico de Fiesta (FiestaScore)

Landing + test (sin backend) pensado para anuncios de Instagram.
Devuelve un **FiestaScore (0–100)**, **pack recomendado** y **protocolo de seguridad**.

## ✅ Cómo usar
1. Sube esta carpeta a un repo de GitHub.
2. Activa GitHub Pages:
   - Settings → Pages → Deploy from a branch → `main` → `/ (root)`
3. Abre la URL pública y úsala en tu bio/anuncios.

## ⚙️ Configuración rápida

Contacto: djponteabailar@gmail.com
Edita `app.js`:

- `CONFIG.whatsappNumber`: tu WhatsApp en formato internacional (ej: `34600111222`)
- `CONFIG.brandUrl`: tu web
- `CONFIG.leadEndpoint` (opcional): URL para enviar leads a un endpoint (Formspree/Make/Zapier/tu API)
  - Si está vacío, el formulario no envía (pero guarda el lead en `localStorage`).

## 📩 Captación de leads (opcional)
Si quieres recibir leads por email sin programar:
- Crea un formulario en Formspree y pega la URL en `CONFIG.leadEndpoint`.

Payload enviado:
- Datos del lead
- Respuestas del test
- Informe (score, pack, protocolo)
- Referrer y userAgent

## 📁 Estructura
- `index.html`
- `styles.css`
- `app.js`
- `assets/logo.png`



## ✅ Envío automático a Google Sheets (recomendado)
Este proyecto es estático (GitHub Pages), así que para guardar leads en un Google Sheet usamos **Google Apps Script** como endpoint.

### 1) Crea tu Google Sheet
- Crea un Sheet (por ejemplo: `Leads DJ Ponte`)
- Abre **Extensiones → Apps Script**

### 2) Pega el script
Copia el contenido de `google-apps-script/Code.gs` en tu proyecto de Apps Script (sustituyendo lo que haya).

### 3) Despliega como Web App
En Apps Script:
- **Deploy → New deployment**
- Type: **Web app**
- Execute as: **Me**
- Who has access: **Anyone**
- Deploy y copia la **Web App URL**

### 4) Conecta el test con el Sheet
En `app.js`, pega la Web App URL aquí:
```js
leadEndpoint: "PASTE_GOOGLE_APPS_SCRIPT_WEBAPP_URL_HERE"
```

### 5) Test rápido
- Publica en GitHub Pages
- Completa el test
- Rellena el formulario y marca consentimiento
- Verás una nueva fila en la pestaña **Leads** del Sheet

> Nota: si quieres bloquear spam, luego podemos añadir reCAPTCHA o un token simple.


## 🧭 Navegación
- Botones **Atrás** y **Continuar** en todas las preguntas.
- Diseño responsive optimizado para móvil y escritorio.


✅ Fix v3: el campo “Un detalle que no pueda fallar” ya permite escribir (CSS ajustado para no ocultar inputs de texto).


## 🧾 Informe en PDF
- En resultados, el botón **Descargar informe (PDF)** genera un PDF con tu marca y CTA a WhatsApp.
- Requiere conexión (carga jsPDF desde CDN).
