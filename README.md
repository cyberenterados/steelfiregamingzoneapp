# steelfiregamingzoneapp

SteelFire Gaming Zone: SPA en React/Vite, con API Express y MongoDB.

## Desarrollo local

- Frontend: `cd frontend && npm install && npm run dev`
- Backend: `cd backend && npm install && npm run dev`

Configura las variables locales a partir de `backend/.env.example` y `frontend/.env.example`. No subas archivos `.env` ni secretos.

## Despliegue

- Vercel: raíz `frontend/`; configura `VITE_API_URL` con la URL del backend.
- Render: raíz `backend/`; configura las variables listadas en `backend/.env.example`.

El panel privado está en `/bunker`.
