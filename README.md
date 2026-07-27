# 🚀 AriaPrompt - Asistente de IA Inmobiliario & CRM

**AriaPrompt** es una plataforma SaaS diseñada para agentes y agencias inmobiliarias. Permite automatizar la calificación de leads mediante chatbots con IA, sincronizar inventarios de propiedades con CRMs y ofrecer asistencia multicanal en tiempo real.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** React 18, Vite, TypeScript, Tailwind CSS.
* **Backend & API:** Vercel Serverless Functions (`/api`), Node.js / Bun.
* **Base de Datos & Autenticación:** Supabase (PostgreSQL con Row Level Security - RLS).
* **Internacionalización (i18n):** Soporte multi-idioma (Español, Inglés, Portugués).
* **Integraciones:** Conectores de CRM, motor de búsqueda de propiedades, generador de dossiers en PDF.

---

## 📁 Estructura del Proyecto

```text
Ariaprompt-main/
├── api/                  # Endpoints serverless (Chat, CRM Sync, Leads, Properties, Usage)
├── public/               # Recursos estáticos (Sitemap, Robots.txt, Favicon)
├── scripts/              # Scripts de mantenimiento, base de datos (schema.sql) y tests (RLS, Usage)
├── src/
│   ├── components/       # Componentes React (Auth, Dashboard, Marketing, Chat, Profile, Playground)
│   ├── context/          # Contextos globales (AuthContext, LanguageContext)
│   ├── hooks/            # Custom Hooks (useChat, useUsage, useDeviceType)
│   ├── lib/              # Clientes Supabase, motor inmobiliario y límites de planes
│   ├── locales/          # Diccionarios de traducción (es, en, pt)
│   └── services/         # Servicios de integración con CRMs
├── server.ts             # Servidor principal
└── vite.config.ts        # Configuración del empaquetador Vite
