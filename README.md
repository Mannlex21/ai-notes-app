# 📝 Notes App + AI Assist

> **Notes App + AI Assist** es una aplicación web moderna y minimalista para la gestión de notas y listas de tareas, potenciada con funciones inteligentes de **IA Assist mediante Google Gemini**.
>
> La aplicación permite crear y organizar notas, utilizar checklists interactivas y mejorar el contenido mediante inteligencia artificial, ofreciendo herramientas para continuar borradores, generar variantes de estilo y estructurar ideas de manera rápida e intuitiva.

---

## 🌐 Demo en Línea

Puedes probar la aplicación directamente desde:

👉 **[Notes App + AI Assist — Demo](https://ai-notes-app-wine-six.vercel.app/)**

🚀 Aplicación desplegada en **Vercel** y disponible en línea.

---

## 🚀 Características Principales

### 📝 Creación de Notas y Checklists

Permite crear diferentes tipos de contenido desde una interfaz sencilla:

* Notas de texto plano.
* Listas de tareas interactivas.
* Elementos marcables como completados.
* Edición rápida del contenido.
* Interfaz adaptativa para diferentes tamaños de pantalla.

---

### 🤖 IA Assist — Gemini AI

La aplicación incorpora herramientas de inteligencia artificial para mejorar y transformar el contenido de las notas.

#### ✨ Continuar Borrador

Permite expandir una idea existente manteniendo el contexto del contenido escrito.

Por ejemplo:

```text
La reunión con el equipo fue muy productiva...
```

La IA puede continuar el texto manteniendo la intención y contexto original.

---

#### 🎨 Sugerir Variantes de Estilo

Permite generar diferentes versiones del contenido utilizando distintos estilos:

* **Formal**
* **Conciso**
* **Casual**

Esto facilita adaptar rápidamente una nota dependiendo del propósito del contenido.

---

#### 🔄 Selector de Variantes

Las variantes generadas por IA se muestran en un modal antes de aplicarlas.

El usuario puede:

1. Generar diferentes alternativas.
2. Revisar las propuestas.
3. Comparar las variantes.
4. Seleccionar la versión deseada.
5. Aplicarla directamente a la nota.

---

## 🎨 Interfaz de Usuario

La aplicación está diseñada con una experiencia minimalista y enfocada en la productividad.

Incluye:

* Textareas con crecimiento automático (*autogrow*).
* Menús flotantes.
* Modales ligeros.
* Interacciones mediante teclado.
* Soporte para tecla `Esc`.
* Diseño responsive.
* Componentes desacoplados y reutilizables.
* Flujo de edición rápido y sin distracciones.

---

## 🧩 Arquitectura Modular

El proyecto utiliza una arquitectura basada en componentes pequeños y especializados.

Entre los componentes principales se encuentran:

* `AiMenuDropdown`
* `AiVariantsModal`
* `NoteInput`

Esta separación permite mantener una estructura organizada y facilita la evolución de las funcionalidades de IA.

---

## 🛠️ Tecnologías Utilizadas

### Frontend

* **[Vue 3](https://vuejs.org/)** — Framework principal.
* **Composition API** — Gestión de lógica y estado dentro de los componentes.
* **`<script setup lang="ts">`** — Sintaxis moderna para componentes Vue con TypeScript.
* **[TypeScript](https://www.typescriptlang.org/)** — Tipado estático.
* **[Tailwind CSS](https://tailwindcss.com/)** — Sistema de estilos utilitario.
* **[Lucide Vue Next](https://lucide.dev/)** — Iconografía.

### Estado

* **[Pinia](https://pinia.vuejs.org/)** — Administración del estado global de la aplicación.

### IA & Backend

* **Google Gemini AI** — Procesamiento inteligente de notas y generación de contenido.
* **Gemini 1.5 Flash** — Modelo utilizado para las funciones de IA.
* **Node.js** — Entorno de ejecución del backend.
* **API Routes** — Comunicación entre el frontend y los servicios de IA.

### Deployment

* **[Vercel](https://vercel.com/)** — Deployment de la aplicación.

---

## 📁 Estructura del Proyecto

```text
src/
├── components/
│   └── notes/
│       ├── AiMenuDropdown.vue
│       │   # Menú flotante con las acciones de IA
│       │
│       ├── AiVariantsModal.vue
│       │   # Modal para previsualizar y seleccionar variantes
│       │
│       └── NoteInput.vue
│           # Componente orquestador del formulario de notas
│
├── stores/
│   └── useNotesStore.ts
│       # Estado global de notas y comunicación con la API de IA
│
├── App.vue
│   # Componente raíz de la aplicación
│
└── ...
```

---

## 🔄 Flujo de IA Assist

El flujo general para utilizar las herramientas de inteligencia artificial es:

```text
┌──────────────────────┐
│       Usuario        │
└──────────┬───────────┘
           │
           │ Escribe una nota
           ▼
┌──────────────────────┐
│      NoteInput       │
└──────────┬───────────┘
           │
           │ Acción de IA
           ▼
┌──────────────────────┐
│  AiMenuDropdown      │
└──────────┬───────────┘
           │
           ├───────────────┐
           │               │
           ▼               ▼
   Continuar borrador   Variantes
           │               │
           └───────┬───────┘
                   │
                   ▼
          ┌─────────────────┐
          │    API / IA     │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │  Google Gemini  │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ Resultado IA    │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ AiVariantsModal │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ Nota actualizada│
          └─────────────────┘
```

---

## ⚙️ Configuración e Instalación

### Prerrequisitos

Antes de comenzar necesitas tener instalado:

* **Node.js 18.x o superior**
* **npm**
* Una API Key de Google Gemini.

---

### 1. Clonar el repositorio

```bash
git clone <url-de-tu-repositorio>
cd nombre-de-tu-proyecto
```

---

### 2. Instalar dependencias

```bash
npm install
```

También puedes utilizar:

```bash
yarn install
```

o:

```bash
pnpm install
```

---

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
GEMINI_API_KEY=tu_api_key_aqui
```

> ⚠️ **Importante:** No publiques tu API Key en el repositorio. El archivo `.env.local` debe estar incluido en `.gitignore`.

---

### 4. Ejecutar el servidor de desarrollo

Con npm:

```bash
npm run dev
```

Con Yarn:

```bash
yarn dev
```

Con pnpm:

```bash
pnpm dev
```

---

### 5. Acceder a la aplicación

Una vez iniciado el servidor, abre:

```text
http://localhost:3000
```

---

## 🧠 Ejemplos de Uso

### Continuar una nota

El usuario puede escribir una idea inicial:

```text
Preparar la presentación del proyecto para la reunión...
```

Después puede utilizar **Continuar Borrador** para que Gemini ayude a desarrollar la idea.

---

### Cambiar el estilo

Una nota puede transformarse seleccionando uno de los estilos disponibles:

```text
Formal
Conciso
Casual
```

El usuario puede revisar las alternativas antes de aplicar una de ellas.

---

## 🔐 Seguridad

Para mantener las credenciales protegidas:

* No almacenar API Keys directamente en el código.
* Utilizar variables de entorno.
* No publicar `.env.local`.
* Agregar `.env.local` a `.gitignore`.
* Procesar las solicitudes a Gemini desde el backend cuando corresponda.
* Validar las entradas recibidas desde el cliente.

Ejemplo de `.gitignore`:

```text
.env
.env.local
.env.*.local
```

---

## 🎯 Roadmap

### Completado

* [x] Arquitectura modular con Vue 3.
* [x] Composition API.
* [x] TypeScript.
* [x] Tailwind CSS.
* [x] Pinia.
* [x] Creación de notas.
* [x] Checklists interactivas.
* [x] Textareas con autogrow.
* [x] Menú de acciones de IA.
* [x] Integración con Google Gemini.
* [x] Continuar borradores.
* [x] Generación de variantes de estilo.
* [x] Estilos Formal, Conciso y Casual.
* [x] Modal para previsualizar variantes.
* [x] Selección y aplicación de variantes.
* [x] Soporte para tecla `Esc`.
* [x] Interfaz responsive.
* [x] Deployment en Vercel.

### Pendiente

* [ ] Persistencia de notas.
* [ ] Autenticación de usuarios.
* [ ] Sincronización entre dispositivos.
* [ ] Historial de cambios.
* [ ] Más herramientas de IA.
* [ ] Generación de resúmenes.
* [ ] Corrección ortográfica mediante IA.
* [ ] Etiquetas y categorías.
* [ ] Búsqueda avanzada de notas.
* [ ] Exportación de notas.
* [ ] Modo offline.

---

## 📊 Módulos Principales

| Módulo      | Descripción                               |
| ----------- | ----------------------------------------- |
| Notes       | Creación y edición de notas               |
| Checklists  | Gestión de listas de tareas               |
| AI Assist   | Herramientas inteligentes mediante Gemini |
| AI Variants | Generación y selección de estilos         |
| Pinia Store | Estado global de la aplicación            |
| API         | Comunicación con el servicio de IA        |

---

## 🌐 Demo

**Aplicación:** [ai-notes-app-wine-six.vercel.app](https://ai-notes-app-wine-six.vercel.app/)

---

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**.

Consulta el archivo `LICENSE` para más información.
