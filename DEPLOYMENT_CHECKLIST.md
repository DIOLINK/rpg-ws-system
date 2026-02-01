# ✅ Checklist de Deployment - Optimizaciones de Performance

## Pre-Deploy

### Client (Frontend)

- [ ] Ejecutar `npm run build` - Verificar que compile sin errores
- [ ] Revisar tamaño de bundle: debe ser ~350KB o menos
- [ ] Verificar que lazy loading funciona: páginas cargan bajo demanda
- [ ] Probar en modo preview: `npm run preview`
- [ ] Ejecutar tests: `npm test` (si existen)

### Server (Backend)

- [ ] Verificar conexión a MongoDB
- [ ] Ejecutar seeds si es primera vez:
  ```bash
  npm run seed:abilities
  npm run seed:npcs
  ```
- [ ] Verificar que índices de BD se crearon:
  ```javascript
  db.characters.getIndexes();
  db.games.getIndexes();
  ```
- [ ] Ejecutar tests: `npm test` (si existen)

### Variables de Entorno

- [ ] Client: `.env` configurado con URLs correctas
- [ ] Server: `src/.env` configurado con MongoDB URI
- [ ] Producción: `NODE_ENV=production`

---

## Deploy

### Client

```bash
cd client
npm run build
# Subir carpeta dist/ a hosting (Vercel, Netlify, etc.)
```

### Server

```bash
cd server
# Opción 1: Con PM2 (Recomendado)
npm install -g pm2
pm2 start src/index.js --name rpg-server

# Opción 2: Node directo
node src/index.js
```

---

## Post-Deploy

### Verificación Inmediata (Primeros 5 min)

- [ ] Servidor responde: `curl http://tu-servidor.com/api/health`
- [ ] Cliente carga correctamente
- [ ] Login funciona
- [ ] WebSockets conectan (revisar consola del navegador)
- [ ] No hay errores 500 en logs

### Monitoreo (Primera hora)

- [ ] Ejecutar performance monitor:
  ```bash
  node src/utils/performanceMonitor.js
  ```
- [ ] Verificar uso de memoria < 80%
- [ ] Error rate < 2%
- [ ] Response time < 500ms

### Testing Funcional

- [ ] Crear personaje
- [ ] Unirse a partida
- [ ] Sistema de turnos funciona
- [ ] Inventario funciona
- [ ] NPCs se crean correctamente
- [ ] Items se asignan correctamente

---

## Métricas a Vigilar (Primeras 24h)

### Frontend (Client)

```bash
# Lighthouse audit
npx lighthouse https://tu-sitio.com --view
```

**Objetivos**:

- Performance: >90
- First Contentful Paint: <1.5s
- Time to Interactive: <2s

### Backend (Server)

```bash
# Con PM2
pm2 monit

# Métricas manuales
node src/utils/performanceMonitor.js
```

**Objetivos**:

- Memory usage: <80%
- CPU usage: <70% (promedio)
- Error rate: <2%
- Slow queries: <10

### Base de Datos

```javascript
// En MongoDB shell
db.currentOp({ secs_running: { $gt: 1 } }); // Queries >1s
db.serverStatus().connections; // Conexiones activas
```

---

## Rollback Plan

### Si hay problemas críticos:

1. **Frontend**: Revertir a build anterior

   ```bash
   git checkout HEAD~1 client/
   npm run build
   ```

2. **Backend**: Revertir código

   ```bash
   git checkout HEAD~1 server/
   pm2 restart rpg-server
   ```

3. **Base de Datos**: Si hay problemas con índices
   ```javascript
   db.characters.dropIndexes();
   db.games.dropIndexes();
   ```

---

## Issues Comunes y Soluciones

### "Rate limit exceeded" en logs

```javascript
// Ajustar en server/src/socket/gameSocket.js
socket.use(
  socketRateLimiter.middleware({
    maxRequests: 30, // Aumentar de 20 a 30
    windowMs: 1000,
  }),
);
```

### Memoria del servidor creciendo

```bash
# Reiniciar servidor
pm2 restart rpg-server

# Revisar memory leaks
node --inspect src/index.js
# Abrir chrome://inspect
```

### Caché devolviendo datos viejos

```javascript
// En client, invalidar caché después de mutations
import { cacheService } from './utils/cacheService';
cacheService.invalidate(); // Toda la caché
```

### Bundle muy grande (>400KB)

```bash
cd client
npm run build
npx vite-bundle-visualizer
# Revisar qué dependencias son grandes
```

---

## Notificaciones

### A quién avisar

- ✅ Deploy exitoso → Equipo de desarrollo
- ⚠️ Problemas menores → Equipo técnico
- 🚨 Problemas críticos → Equipo completo + stakeholders

### Canales

- Slack/Discord: Actualizaciones en tiempo real
- Email: Resumen post-deploy
- Dashboard: Métricas en vivo (si existe)

---

## Sign-off

- [ ] Deploy completado
- [ ] Verificaciones pasadas
- [ ] Monitoreo activo
- [ ] Equipo notificado
- [ ] Documentación actualizada

**Responsable**: ******\_******  
**Fecha**: ******\_******  
**Hora**: ******\_******

---

## Recursos de Emergencia

- [PERFORMANCE_REPORT.md](./PERFORMANCE_REPORT.md) - Detalles técnicos
- [OPTIMIZATION_GUIDE.md](./OPTIMIZATION_GUIDE.md) - Troubleshooting
- [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) - Resumen ejecutivo

**Soporte técnico**: Revisar logs y performance monitor primero
