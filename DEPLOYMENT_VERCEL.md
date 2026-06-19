# Deployment en Vercel (Frontend Only)

## Configuración requerida

Para que Vercel solo despliegue el frontend, necesitas hacer lo siguiente:

### 1. Variables de entorno en Vercel

En tu proyecto Vercel, añade estas variables de entorno:

```
VITE_API_URL=https://tu-backend-api.com/api/trpc
```

Reemplaza `https://tu-backend-api.com` con la URL real de tu backend (Render, Railway, Fly.io, etc.)
No las declares en `vercel.json`; Vercel las gestiona desde el panel del proyecto.

### 2. Build y Output Directory

- **Build Command**: `pnpm build` (esto compila tanto frontend como backend)
- **Output Directory**: `dist/public` (Vercel solo sirve esta carpeta)
- La configuración de Vercel debe quedarse en propiedades válidas del esquema. No uses `public`, `env` ni `envFile` en `vercel.json`.

### 3. Archivos ignorados

Vercel ignorará automáticamente:
- `/server` - código del servidor
- `/drizzle` - migraciones de BD
- Los archivos `.ts` del servidor

## Backend Deployment

El backend debe desplegarse **por separado** en uno de estos servicios:

### Opción A: Render.com (Recomendado para Node.js)
1. Conecta tu repositorio de GitHub a Render
2. Selecciona "New > Web Service"
3. Configura:
   - Build Command: `pnpm build`
   - Start Command: `node dist/index.js`
   - Environment Variables:
     - `DATABASE_URL`: Tu URL de MySQL
     - `JWT_SECRET`: Token secreto
     - `NODE_ENV`: production
     - Otras variables según necesites

### Opción B: Railway.app
Similar a Render, pero:
- Database integrada (PostgreSQL/MySQL)
- Mejor UI
- Pricing más simple

### Opción C: Fly.io
Para aplicaciones más grandes y con mejor performance

## Estructura final

```
Vercel (rubwp.vercel.app) - Frontend React
    ↓
Backend API (tu-backend.render.com) - Express + tRPC
    ↓
MySQL Database
```

## Verificar que funciona

1. El frontend debe estar disponible en `https://rubwp.vercel.app`
2. Las variables de entorno deben estar configuradas
3. El backend debe estar corriendo en su propio servidor

Si el frontend intenta hacer llamadas a `/api/trpc`, asegúrate de que `VITE_API_URL` apunte al servidor backend real.
