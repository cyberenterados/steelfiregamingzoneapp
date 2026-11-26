# Revisión de seguridad previa a publicación

Fecha: 2026-11-25

## Alcance

Revisión previa a publicar el repositorio. Se comprobaron los archivos de entorno y su exclusión de Git, autenticación y autorización del panel, rutas públicas de la API, configuración de despliegue e informes de dependencias disponibles.

## Hallazgo

| # | Severidad | Archivo | Líneas | Hallazgo | Confianza |
|---|---|---|---|---|---|
| 1 | Baja | `backend/src/server.js` | 155-171 | La ruta pública de corazones recibe `visitorId` del cliente y lo usa para limitar votos. Como el cliente puede inventar otro identificador, puede inflar el contador enviando solicitudes repetidas con valores distintos. | 10/10 |

### Recomendación

Tratar el contador como una métrica comunitaria no verificada o aplicar controles adicionales de abuso, como limitación de solicitudes y señales del servidor. La identidad almacenada en `localStorage` por sí sola no prueba que cada voto corresponda a una persona distinta.

## Controles observados

- `backend/.env` está excluido por `.gitignore` y no aparece como archivo rastreado en el repositorio revisado. No incluir valores secretos en el repositorio.
- Las rutas de administración requieren un JWT firmado y las rutas de escritura de videos y moderación requieren el rol de administrador.
- Los comentarios nuevos quedan pendientes de moderación; el frontend los inserta como texto y no como HTML.
- Los informes de dependencias disponibles no encontraron vulnerabilidades de producción en frontend ni backend. El escaneo completo del frontend reportó avisos en dependencias de desarrollo de `live-server`; revisar su necesidad antes de desplegar.

## Límites

Esta revisión no valida la configuración real de GitHub, Render, Vercel o MongoDB Atlas ni sustituye una auditoría de seguridad completa. Antes de publicar, confirmar que los secretos estén configurados únicamente como variables locales ignoradas o variables de entorno del proveedor.
