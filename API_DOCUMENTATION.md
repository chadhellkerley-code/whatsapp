# WhatsApp Manager Pro - API Documentation

## Descripción General

WhatsApp Manager Pro es una plataforma web completa para gestionar WhatsApp mediante OpenWA API. Incluye gestión de números, campañas de mensajería, automatización con IA (Gemini) y análisis de datos.

## Stack Tecnológico

- **Frontend**: React 19 + Tailwind CSS 4 + Framer Motion
- **Backend**: Express 4 + tRPC 11
- **Base de Datos**: MySQL/TiDB con Drizzle ORM
- **Autenticación**: Manus OAuth
- **Animaciones**: Framer Motion

## Endpoints Disponibles

### Autenticación

```typescript
// Obtener usuario actual
trpc.auth.me.useQuery()

// Cerrar sesión
trpc.auth.logout.useMutation()
```

### Configuración de OpenWA

#### Guardar configuración de OpenWA
```typescript
trpc.whatsapp.saveOpenwaConfig.useMutation({
  apiKey: "tu_api_key",
  apiUrl: "https://api.openwa.com"
})
```

#### Obtener configuración de OpenWA
```typescript
trpc.whatsapp.getOpenwaConfig.useQuery()
```

### Gestión de Números de WhatsApp

#### Agregar nuevo número
```typescript
trpc.whatsapp.addNumber.useMutation({
  phoneNumber: "+34123456789",
  sessionName: "sesion_1"
})
```

#### Listar números conectados
```typescript
trpc.whatsapp.listNumbers.useQuery()
```

Respuesta:
```json
[
  {
    "id": 1,
    "phoneNumber": "+34123456789",
    "sessionName": "sesion_1",
    "isConnected": true,
    "connectionStatus": "connected",
    "lastActivity": "2026-06-09T15:58:00Z"
  }
]
```

#### Actualizar estado de número
```typescript
trpc.whatsapp.updateNumberStatus.useMutation({
  numberId: 1,
  isConnected: true,
  status: "connected"
})
```

#### Eliminar número
```typescript
trpc.whatsapp.deleteNumber.useMutation({
  numberId: 1
})
```

### Campañas de Mensajería

#### Crear campaña
```typescript
trpc.whatsapp.createCampaign.useMutation({
  name: "Campaña de Bienvenida",
  message: "¡Hola! Bienvenido a nuestro servicio",
  targetNumbers: ["+34123456789", "+34987654321"],
  description: "Primera campaña de prueba"
})
```

#### Listar campañas
```typescript
trpc.whatsapp.listCampaigns.useQuery()
```

Respuesta:
```json
[
  {
    "id": 1,
    "name": "Campaña de Bienvenida",
    "message": "¡Hola! Bienvenido a nuestro servicio",
    "status": "draft",
    "sentCount": 0,
    "failedCount": 0,
    "targetNumbers": ["+34123456789", "+34987654321"],
    "createdAt": "2026-06-09T15:58:00Z"
  }
]
```

#### Actualizar estado de campaña
```typescript
trpc.whatsapp.updateCampaignStatus.useMutation({
  campaignId: 1,
  status: "running" // draft | scheduled | running | completed | failed
})
```

### Automatización con IA (Gemini)

#### Crear flujo de automatización
```typescript
// Opción 1: Respuesta estática
trpc.whatsapp.createAutomationFlow.useMutation({
  name: "Respuesta Automática",
  triggerKeywords: ["hola", "hi", "buenos días"],
  responseType: "static",
  staticResponse: "¡Hola! ¿En qué puedo ayudarte?"
})

// Opción 2: Con Gemini AI
trpc.whatsapp.createAutomationFlow.useMutation({
  name: "Asistente con IA",
  triggerKeywords: ["*"], // Responde a todos los mensajes
  responseType: "gemini",
  geminiApiKey: "tu_gemini_api_key",
  geminiPrompt: "Eres un asistente de servicio al cliente. Responde de manera amable y profesional."
})
```

#### Listar flujos de automatización
```typescript
trpc.whatsapp.listAutomationFlows.useQuery()
```

Respuesta:
```json
[
  {
    "id": 1,
    "name": "Respuesta Automática",
    "responseType": "static",
    "triggerKeywords": ["hola", "hi", "buenos días"],
    "isActive": true,
    "createdAt": "2026-06-09T15:58:00Z"
  }
]
```

### Estadísticas y Análisis

#### Obtener estadísticas de mensajes
```typescript
// Todas las estadísticas
trpc.whatsapp.getMessageStats.useQuery({})

// Estadísticas de un número específico
trpc.whatsapp.getMessageStats.useQuery({
  phoneNumber: "+34123456789"
})
```

Respuesta:
```json
[
  {
    "phoneNumber": "+34123456789",
    "totalMessages": 150,
    "totalReceived": 75,
    "totalSent": 75,
    "automatedResponses": 45,
    "date": "2026-06-09T00:00:00Z"
  }
]
```

#### Obtener registro de mensajes
```typescript
trpc.whatsapp.getMessageLog.useQuery({
  phoneNumber: "+34123456789",
  limit: 50
})
```

Respuesta:
```json
[
  {
    "id": 1,
    "phoneNumber": "+34123456789",
    "contactNumber": "+34111111111",
    "message": "Hola, ¿cómo estás?",
    "direction": "incoming",
    "isAutomated": false,
    "createdAt": "2026-06-09T15:58:00Z"
  }
]
```

#### Obtener estadísticas del dashboard
```typescript
trpc.whatsapp.getDashboardStats.useQuery()
```

Respuesta:
```json
{
  "connectedNumbers": 3,
  "totalNumbers": 5,
  "activeCampaigns": 2,
  "totalCampaigns": 10,
  "activeFlows": 4,
  "totalMessages": 1250,
  "totalSent": 650,
  "totalReceived": 600,
  "automatedResponses": 350
}
```

## Estructura de Base de Datos

### Tabla: users
- `id` (int, PK)
- `openId` (varchar, UNIQUE)
- `name` (text)
- `email` (varchar)
- `loginMethod` (varchar)
- `role` (enum: user, admin)
- `createdAt`, `updatedAt`, `lastSignedIn` (timestamp)

### Tabla: openwa_configs
- `id` (int, PK)
- `userId` (int, FK)
- `apiKey` (varchar)
- `apiUrl` (varchar)
- `isActive` (boolean)
- `createdAt`, `updatedAt` (timestamp)

### Tabla: whatsapp_numbers
- `id` (int, PK)
- `userId` (int, FK)
- `phoneNumber` (varchar)
- `sessionName` (varchar)
- `isConnected` (boolean)
- `connectionStatus` (varchar)
- `lastActivity` (timestamp)
- `createdAt`, `updatedAt` (timestamp)

### Tabla: campaigns
- `id` (int, PK)
- `userId` (int, FK)
- `name` (varchar)
- `description` (text)
- `message` (text)
- `targetNumbers` (json)
- `status` (enum: draft, scheduled, running, completed, failed)
- `sentCount`, `failedCount` (int)
- `scheduledAt`, `startedAt`, `completedAt` (timestamp)
- `createdAt`, `updatedAt` (timestamp)

### Tabla: automation_flows
- `id` (int, PK)
- `userId` (int, FK)
- `name` (varchar)
- `description` (text)
- `triggerKeywords` (json)
- `responseType` (enum: static, gemini, flow)
- `staticResponse` (text)
- `geminiApiKey` (varchar)
- `geminiPrompt` (text)
- `flowSteps` (json)
- `isActive` (boolean)
- `createdAt`, `updatedAt` (timestamp)

### Tabla: message_stats
- `id` (int, PK)
- `userId` (int, FK)
- `phoneNumber` (varchar)
- `totalMessages`, `totalReceived`, `totalSent`, `automatedResponses` (int)
- `date` (timestamp)
- `createdAt`, `updatedAt` (timestamp)

### Tabla: message_log
- `id` (int, PK)
- `userId` (int, FK)
- `phoneNumber` (varchar)
- `contactNumber` (varchar)
- `message` (text)
- `direction` (enum: incoming, outgoing)
- `isAutomated` (boolean)
- `campaignId`, `automationFlowId` (int, FK)
- `createdAt` (timestamp)

## Instalación y Uso

### Desarrollo
```bash
cd whatsapp-manager-openwa
pnpm install
pnpm dev
```

### Build para producción
```bash
pnpm build
pnpm start
```

## Variables de Entorno Requeridas

```
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=tu_jwt_secret
VITE_APP_ID=tu_app_id
OAUTH_SERVER_URL=https://oauth.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
```

## Notas Importantes

1. **Seguridad**: Todas las API keys (OpenWA, Gemini) se almacenan encriptadas en la base de datos.
2. **Autenticación**: Todos los endpoints requieren autenticación mediante Manus OAuth.
3. **Rate Limiting**: Se recomienda implementar rate limiting en producción.
4. **Webhooks**: Para recibir mensajes en tiempo real, configura webhooks de OpenWA.

## Próximas Mejoras

- Integración real con OpenWA SDK
- Envío de campañas en tiempo real
- Procesamiento de mensajes con Gemini
- Exportación de datos a CSV/Excel
- Sistema de notificaciones en tiempo real
- Integración con WhatsApp Business API
