# Planify - Planificador Colaborativo de Comidas

## 📋 ¿De qué va el proyecto?

**Planify** es una plataforma web colaborativa diseñada para que grupos de amigos o colegas puedan planificar comidas juntos de manera fácil y democrática. La aplicación permite crear planes de restaurantes, invitar a otros usuarios, y dejar que la comunidad vote por sus opciones favoritas.

### Características principales:
- **Autenticación segura** - Registro e inicio de sesión de usuarios
- **Crear planes** - Planificar comidas especificadas en zona y código postal
- **Unirse a planes** - Otros usuarios pueden unirse a planes existentes mediante un código
- **Sistema de votación** - Los miembros del plan pueden votar por sus restaurantes favoritos
- **Recomendaciones inteligentes** - Integración con OpenAI para generar sugerencias personalizadas
- **Gestión de perfiles** - Cada usuario puede personalizar su perfil
- **Búsqueda de restaurantes** - API integrada para buscar restaurantes disponibles

---

## 🛠️ Cómo montado

### Requisitos previos
- **Node.js** v18+ 
- **npm** o **yarn** como gestor de paquetes
- Una cuenta de **Supabase** (base de datos PostgreSQL + autenticación)
- Clave API de **OpenAI** (opcional, para recomendaciones)

### Instalación paso a paso

#### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/Software-.git
cd Software-
```

#### 2. Instalar dependencias
```bash
npm install
```

#### 3. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# OpenAI (opcional)
OPENAI_API_KEY=tu_api_key_openai

# Base URL para API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### 4. Ejecutar en desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

#### 5. Compilar para producción
```bash
npm run build
npm start
```

---

## 🎯 Objetivos

El proyecto busca:

1. **Facilitar la toma de decisiones en grupo** - Eliminar discusiones infinitas sobre dónde comer mediante un sistema de votación justo

2. **Crear experiencia social** - Permitir que usuarios organicen eventos y planes de comidas con amigos o colegas

3. **Recomendaciones personalizadas** - Utilizar IA para sugerir restaurantes basados en preferencias y historiales

4. **Escalabilidad** - Construir una plataforma que pueda crecer a múltiples usuarios y planes simultáneos

5. **Usabilidad** - Interfaz intuitiva y responsiva que funcione en dispositivos móviles y desktop

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── auth/              # Páginas de autenticación (login, registro)
│   ├── crear/             # Crear nuevos planes
│   ├── plan/[id]/         # Detalles de un plan específico
│   │   ├── votar/         # Sistema de votación
│   │   ├── recomanacio/   # Recomendaciones
│   │   └── resultados/    # Resultados de votación
│   ├── perfil/            # Gestión de perfil del usuario
│   ├── unirse/            # Unirse a planes existentes
│   └── api/               # Rutas API
│       ├── restaurants/   # Búsqueda de restaurantes
│       └── foto/          # Gestión de imágenes
├── components/
│   └── ui/                # Componentes reutilizables (botones, etc.)
├── lib/
│   ├── supabase.ts        # Configuración de Supabase
│   ├── recomanacio.ts     # Lógica de recomendaciones
│   └── utils.ts           # Funciones utilitarias
├── middleware.ts          # Middleware de Next.js
└── public/                # Archivos estáticos (imágenes, etc.)
```

---

## 🧰 Tecnologías utilizadas

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **Next.js** | 14.2.15 | Framework React full-stack |
| **React** | 18.3.1 | Librería de UI |
| **TypeScript** | 5.x | Tipado estático |
| **Tailwind CSS** | 4.0.0 | Estilos CSS |
| **Supabase** | 0.5.1+ | Base de datos y autenticación |
| **OpenAI** | 4.67.3 | IA para recomendaciones |
| **Radix UI** | 1.2.4+ | Componentes accesibles |

---

## 📖 Scripts disponibles

```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Compilar para producción
npm start        # Ejecutar servidor de producción
npm run lint     # Ejecutar linter (ESLint)
```

---

## 🔐 Variables de entorno necesarias

| Variable | Descripción | Requerida |
|----------|------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase | ✅ Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase | ✅ Sí |
| `OPENAI_API_KEY` | API Key de OpenAI | ❌ No |

---

## 📞 Contacto y Contribuciones

Para reportar problemas o contribuir al proyecto, abre un issue o pull request en el repositorio.

---

**Versión actual**: 0.1.1 | **Estado**: En desarrollo
