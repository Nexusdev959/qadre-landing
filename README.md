# Qadre Landing Page

Landing page moderna desarrollada en **Angular 21** (Standalone Components, Signals y CSS Glassmorphism puro) para la plataforma **QADRE** (POS, Inventario, Créditos y Catálogo Digital).

---

## 🚀 Características
- **Tecnología**: Angular 21 (Zero dependencias pesadas, compilación < 3 segundos, bundle transfer < 60 kB).
- **Diseño**: Dark mode con gradientes Aurora, glassmorphism, microinteracciones y animaciones CSS fluidas.
- **Secciones incluidas**:
  1. **Hero**: Propuesta de valor, mockup interactivo del POS con preview de ticket en vivo y botones de acción rápida.
  2. **¿Para qué sirve?**: Problemas resueltos vs métodos tradicionales, diferenciando modo *Tienda de Productos* vs *Servicios con Citas*.
  3. **Funciones (Bento Grid)**: POS & Caja, Inventario Inteligente, Fiados y Comprobantes de Abono, Catálogo Web & QR, Estudio de Marketing y Agenda de Citas.
  4. **Puesta en marcha (Timeline)**: Pasos de 0 a 5 minutos para empezar sin conocimientos técnicos.
  5. **Promociones**: 15 días gratis de Plan Pro sin tarjeta y 20% de descuento en planes anuales.
  6. **Planes y Precios**: Switch interactivo Mensual / Anual (Emprendedor, Plan Pro y Negocio Total).
  7. **Preguntas Frecuentes (FAQ)**: Acordeón interactivo con dudas comunes (impresoras térmicas, WhatsApp, créditos, medios de pago).
  8. **Contacto & Lead Capture**: Formulario directo conectado con 1 clic a WhatsApp para el equipo comercial y soporte.

---

## 🛠️ Comandos de Desarrollo

### 1. Iniciar servidor de desarrollo local
```bash
npm install
npm start
```
Abre tu navegador en `http://localhost:4200/`.

### 2. Generar compilación para Producción
```bash
npm run build
```
Los archivos optimizados y listos para producción se generan en:
`qadre_landing/dist/qadre-landing/browser/`

---

## ☁️ Despliegue en Cloudflare Pages
- **Build command**: `npm run build`
- **Build output directory**: `dist/qadre-landing/browser`
- **Root directory**: `qadre_landing`
