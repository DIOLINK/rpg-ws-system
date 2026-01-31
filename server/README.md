# Proyecto de prueba de Node.js y React

Este proyecto es un ejemplo de cómo se puede construir una aplicación web usando Node.js en el backend y React en el frontend.

## Tecnologías utilizadas

- **Node.js**: Backend
- **React**: Frontend
- **Express**: Framework de backend
- **Vite**: Framework de frontend

## Características

- Backend en Node.js con Express
- Frontend en React con Vite
- API REST
- Autenticación básica

## Uso

1. **Instala las dependencias**

   ```bash
   npm install
   ```

2. **Inicia el servidor**

   ```bash
   npm start
   ```

## Exponer el proyecto localmente con HTTPS usando ngrok

Puedes compartir tu proyecto local de forma segura usando [ngrok](https://ngrok.com/), que te proporciona una URL pública con HTTPS, incluso si tu servidor local solo corre en HTTP.

### Pasos para usar ngrok

1. **Instala ngrok**  
   Descarga e instala ngrok desde [https://ngrok.com/download](https://ngrok.com/download) y sigue las instrucciones para tu sistema operativo.

2. **Autentica tu cuenta (solo la primera vez)**  
   Si es la primera vez que usas ngrok, ejecuta:

   ```
   ngrok config add-authtoken <TU_AUTHTOKEN>
   ```

   Puedes obtener tu authtoken gratis registrándote en ngrok.

3. **Inicia tu servidor local**
   - Backend:
     ```
     cd server
     npm install
     npm start
     ```
   - Frontend:
     ```
     cd client
     npm install
     npm run dev
     ```
     Por defecto, el frontend suele correr en el puerto 5173 y el backend en el 3000 (ajusta según tu configuración).

4. **Expón el puerto deseado con ngrok**  
   Por ejemplo, para el frontend:

   ```
   ngrok http 5173
   ```

   Para el backend:

   ```
   ngrok http 3000
   ```

5. **Comparte la URL HTTPS generada**  
   ngrok mostrará una URL como `https://xxxx.ngrok.io` que puedes compartir para acceder a tu proyecto desde cualquier lugar.

### Notas

- No necesitas configurar HTTPS en tu máquina local, ngrok se encarga del certificado SSL.
- Si usas variables de entorno para dominios, asegúrate de permitir el dominio de ngrok temporalmente.
- ngrok tiene un plan gratuito con ciertas limitaciones (sesiones de 2 horas, URLs aleatorias).
