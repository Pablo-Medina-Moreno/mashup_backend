# Mashup Intelligence – Backend (Node.js + Express + PostgreSQL)

Backend REST para una app de recomendación de **mashups / mixes musicales** usando datos de **Spotify**.

Expone endpoints para:

- Buscar **artistas, álbumes y canciones** desde una base de datos relacional (PostgreSQL).
- Obtener **recomendaciones de mix** dado un `track_id`.
- Resolver **imágenes oficiales de Spotify** (artistas, álbumes, canciones).
- Servir todo como API JSON para el frontend.

---

## 1. Stack tecnológico

- **Node.js** + **Express** – servidor HTTP y routing.
- **PostgreSQL** – base de datos principal.
- **pg** – cliente de Postgres.
- **Axios** – llamadas a la API de Spotify.
- **dotenv** – gestión de variables de entorno.
- **cors**, **morgan** – CORS y logging HTTP.

---

## 2. Estructura del proyecto

Estructura lógica (simplificada):

```bash
mashup-backend-node/
├─ config/
│  ├─ db.js                 # Pool de conexión a PostgreSQL
│  └─ spotifyClient.js      # Cliente autenticado de la API de Spotify
│
├─ controllers/
│  ├─ albums.controller.js  # Controladores HTTP de álbumes
│  ├─ artists.controller.js # Controladores HTTP de artistas
│  ├─ mix.controller.js     # Controlador de recomendaciones de mix
│  ├─ spotifyImages.controller.js # Controladores de imágenes de Spotify
│  └─ tracks.controller.js  # Controladores HTTP de canciones
│
├─ routes/
│  ├─ albums.routes.js      # Rutas /api/albums
│  ├─ artists.routes.js     # Rutas /api/artists
│  ├─ mix.routes.js         # Rutas /api/mix
│  ├─ spotify.routes.js     # Rutas /api/spotify/...
│  ├─ tracks.routes.js      # Rutas /api/tracks
│  └─ index.js              # Root router /api
│
├─ services/
│  ├─ albums.service.js     # Lógica de acceso a BBDD para álbumes
│  ├─ artists.service.js    # Lógica de acceso a BBDD para artistas
│  ├─ mix.service.js        # Lógica de obtención de mix + candidato
│  ├─ recommendationEngine.js  # Motor de similitud entre canciones
│  ├─ spotifyImages.service.js # Llamadas a Spotify para imágenes
│  └─ tracks.service.js     # Lógica de acceso a BBDD para tracks
│
├─ index.js                 # Punto de entrada de la app (levanta el servidor)
├─ server.js                # Configuración de Express (middlewares, /api, errores)
├─ package.json             # Dependencias y scripts NPM
└─ .env                     # Variables de entorno (no se sube al repo)
```

### 3. Ejecutar en desarrollo

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Levanta el servidor en modo desarrollo

   ```bash
   npm run dev
   ```

3. Abre en el navegador

   ```bash
   http://localhost:8000/api
   ```