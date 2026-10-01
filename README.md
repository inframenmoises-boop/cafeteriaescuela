# Cafetería Escolar

Aplicación de gestión con React, Express y MySQL.

## Configurar Aiven

1. Ejecuta `script_cafeteria_limpio.sql` en la base `defaultdb` desde DBeaver.
2. Copia `.env.example` como `.env` y completa host, puerto, usuario y contraseña de Aiven.
3. Descarga el certificado CA de Aiven y guárdalo como `ca.pem` en la raíz del proyecto. Mantén `DB_SSL=true` y `DB_SSL_CA=./ca.pem`.

## Desarrollo

```sh
npm install
npm run dev
```

Abre `http://localhost:5173`. El servidor Express usa `http://localhost:3000` y Vite reenvía allí las solicitudes `/api`.

## Producción

### Vercel

Vercel publica el frontend de Vite y ejecuta la API Express desde `api/[...path].js`. Configura estas variables en Project Settings → Environment Variables, para Production y Preview:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` con los datos de Aiven.
- `DB_SSL=true`.
- `DB_SSL_CA` con el contenido completo del certificado CA de Aiven, no con la ruta local `./ca.pem`.

Después de agregar las variables, vuelve a desplegar el proyecto.

### Ejecución con Node.js

```sh
npm run build
npm start
```

Express sirve la interfaz compilada y la API en el puerto indicado por `PORT`.