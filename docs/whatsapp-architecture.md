# ARIA PROP — Arquitectura de WhatsApp Cloud API, Idempotencia y Resiliencia

## 1. Flujo General del Sistema

```
                    ┌────────────────────────┐
                    │  Meta WhatsApp Cloud   │
                    └───────────┬────────────┘
                                │  Webhook POST (<100ms)
                                ▼
                    ┌────────────────────────┐
                    │  Next.js Fast Ingest   │
                    │  api/webhook/whatsapp  │
                    └───────────┬────────────┘
                                │
               ┌────────────────┴────────────────┐
               │                                 │
               ▼                                 ▼
      [At-Most-Once Dedupe]             [Debounce Stream Lock]
   processed_messages (wamid)         Map<orgId_phone, Timer>
               │                                 │
               │ (claimed=true)                  │ (1200ms window)
               └────────────────┬────────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │  Conversation Worker   │
                    │  (Agrupa mensajes)     │
                    └───────────┬────────────┘
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
                 ▼                             ▼
        [Supabase CRM / Leads]        [Catálogo RAG Inmobiliario]
      leads + chat_messages (N:1)    properties (Argentina Geo)
                 │                             │
                 └──────────────┬──────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │  OpenRouter / Gemini   │
                    │  Structured Output     │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │  Meta Resilience Out   │
                    │  Rate Limiting/Errors  │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │  WhatsApp User Phone   │
                    └────────────────────────┘
```

---

## 2. Componentes Clave

### A. Fast Ingest Webhook (<100ms)
- El endpoint `api/webhook/whatsapp` responde de inmediato `200 OK` tras validar el webhook y registrar la deduplicación del `wamid`.
- No bloquea la conexión esperando a OpenRouter ni ejecutando llamadas sincrónicas pesadas.

### B. Deduplicación Atómica de Mensajes (`wamid`)
- Capa 1: `inMemoryProcessedWamids` (Set en memoria para 0ms de descarte entre peticiones casi simultáneas).
- Capa 2: Inserción atómica en `processed_messages` en Supabase con restricción UNIQUE por `wamid`.

### C. Debounce y Exclusión Mutua por Conversación
- Agrupa ráfagas de mensajes del mismo cliente (ej: *"Hola"*, *"Quiero una casa"*, *"en Villa Atuel"*) en una ventana configurable (`WHATSAPP_DEBOUNCE_MS=1200`).
- Procesa el bloque combinado como una sola interacción conversacional, evitando 3 respuestas separadas de la IA.

### D. Clasificador Centralizado de Errores de Meta Graph API (`metaResilience.ts`)
- **429 / 130429 (Throughput Limit):** Throttle y backoff exponencial con jitter.
- **131048 (Spam/Quality Restriction):** Detención inmediata sin reintentos agresivos ni regeneración de IA.
- **131047 (Window Expired):** Marca como expirada la ventana de 24 horas y requiere plantilla aprobada.

### E. Integridad de Fichas Web (`/p/[id]`)
- Sin fallbacks a propiedades demo (`INITIAL_PROPERTIES` purgado).
- Búsqueda directa por UUID en Supabase y renderizado de `404 Not Found` ante IDs inexistentes.
