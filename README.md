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

```sh
npm run build
npm start
```

Express sirve la interfaz compilada y la API en el puerto indicado por `PORT`.