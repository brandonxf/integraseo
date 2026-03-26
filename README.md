<div align="center">

# INTEGRASEO

**Sistema de Gestión de Contratos y Operaciones (Multi-usuario)**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)](https://firebase.google.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-instalable-5a0fc8?logo=pwa)](https://web.dev/progressive-web-apps)

Una plataforma digital corporativa para empresas de servicios que necesitan organizar contratos, equipos de trabajo, visitas y operaciones desde cualquier dispositivo, ahora con soporte multi-usuario y datos privados por cuenta.

[Reportar Bug](https://github.com/brandonxf/integraseo/issues) · [Solicitar Feature](https://github.com/brandonxf/integraseo/issues)

</div>

---

## Tabla de Contenidos

- [Sobre el Proyecto](#sobre-el-proyecto)
- [Funcionalidades Principales](#funcionalidades-principales)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación y Desarrollo Local](#instalación-y-desarrollo-local)
- [Estructura de Base de Datos](#estructura-de-base-de-datos)
- [Deploy](#deploy)
- [PWA (Instalación en Móviles)](#pwa-instalación-en-móviles)

---

## Sobre el Proyecto

Integraseo es una aplicación web progresiva (PWA) construida con Next.js y Firebase que centraliza la gestión de contratos de servicios (aseo, jardinería, mantenimiento de piscinas, etc.). Permite llevar control del personal asignado, registrar visitas, generar reportes PDF y capturar firmas digitales, todo desde el celular.

Recientemente se ha incorporado un sistema de **autenticación y cuentas de usuario**, permitiendo que cada usuario o empresa tenga su propio espacio de trabajo (Workspaces) con datos completamente aislados y seguros.

---

## Funcionalidades Principales

### 🔐 Autenticación y Cuentas (Nuevo)
- Login seguro con Google mediante Firebase Auth.
- Datos totalmente privados y aislados por usuario.
- Sesiones persistentes.

### 📄 Contratos
- Crear, editar y eliminar contratos con cliente, ubicación, estado y valor agregado.
- Color personalizable por contrato para fácil identificación visual.
- Vista compacta o expandida en la lista.
- Contratos agrupados por estado (Activo / Pendiente / Completado).

### 👷 Operarios
- Asignar operarios a contratos con cargo predefinido (Aseador, Jardinero, Piscinero, Todero, Conserje, Salvavidas).
- Agregar teléfono de contacto.

### 📝 Notas y Observaciones
- Notas con fecha y hora por contrato.
- Editar y eliminar con logs de confirmación.

### 🗓️ Visitas
- Calendario por contrato para programar y confirmar visitas.
- Historial de visitas confirmadas con timestamp.

### 🧹 Brigadas Diarias
- Marcar diariamente los servicios prestados por contrato (Jardinería / Aseo).
- Barra de progreso interactiva del día.

### 👥 Supernumerarios
- Registro de personal ocasional con fecha, trabajo realizado y contrato.
- Exportar listado general a Excel (.xlsx).

### 🔔 Recordatorios
- Sistema de recordatorios con fecha, hora y contrato asociado.
- Filtros interactivos por contrato.
- Marcar como completados/pendientes.

### 📅 Calendario Global
- Vista mensual de eventos generales de la empresa.
- Indicadores visuales en días con notas o eventos.

### ✍️ Firma Digital
- Canvas interactivo de firma táctil o con mouse.
- Guarda el nombre del firmante y timestamp de la aprobación.
- Firma adjuntada automáticamente en el reporte PDF del contrato.

### 📊 Reportes PDF y Estadísticas
- **Generación de PDFs:** Reporte profesional por contrato con datos generales, operarios, visitas, notas y firma. Generado 100% offline en el cliente (jsPDF).
- **Dashboard:** Gráficas de contratos por estado, total de operarios en campo, visitas del mes y top de contratos más activos.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Framework** | Next.js 16.2 (App Router, Turbopack) |
| **UI** | React 19 + Tailwind CSS 4 |
| **Componentes UI** | shadcn/ui + Radix UI Primitives |
| **Animaciones** | Framer Motion + Tailwind Animate |
| **Estado Global** | Zustand 5 |
| **Backend & DB** | Firebase (Auth + Firestore) |
| **Tipado** | TypeScript 5 |
| **Gestor de Paquetes**| pnpm 10.x |
| **Exportación** | jsPDF (PDF) + SheetJS (Excel) |
| **Mapas** | Google Maps API |

---

## Instalación y Desarrollo Local

Requisitos previos: `Node.js 20+` y `pnpm`.

```bash
# Clonar el repositorio
git clone https://github.com/brandonxf/integraseo.git
cd integraseo/integraseo

# Instalar dependencias con pnpm
pnpm install

# Ejecutar el servidor de desarrollo
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Estructura de Base de Datos

Con la nueva actualización de Autenticación, los datos dejaron de ser públicos y globales. Ahora Firestore está estructurado bajo el namespace de cada usuario:

```text
users/
 └── {User_UID} /
      ├── contracts/         # Contratos (con notas, operarios, visitas, firma)
      ├── events/            # Eventos del calendario
      ├── recordatorios/     # Recordatorios de tareas
      ├── brigadas/          # Estado diario de servicios
      ├── supernumerarios/   # Personal ocasional
      └── history/           # Log de auditoría de acciones
```

---

## Deploy

El proyecto está configurado y optimizado para ser desplegado en **Vercel**.

```bash
# Build de producción para test local
pnpm run build
```

**Configuración requerida en Vercel:**
- **Framework Preset:** Next.js
- **Root Directory:** `integraseo`
- **Build Command:** `pnpm run build`
- **Install Command:** `pnpm install`

---

## PWA (Instalación en Móviles)

Integraseo es una Aplicación Web Progresiva instalable:

**En iPhone (Safari):**
1. Abrir la aplicación en Safari.
2. Tocar el botón de compartir → **"Añadir a pantalla de inicio"**.

**En Android (Chrome):**
1. Abrir la aplicación en Chrome.
2. Tocar los tres puntos → **"Instalar aplicación"** / "Añadir a pantalla de inicio".

*Una vez instalada, la aplicación se comportará como una app nativa, operando en pantalla completa.*

---

<div align="center">

Desarrollado con ❤️ usando Next.js + Firebase

</div>
