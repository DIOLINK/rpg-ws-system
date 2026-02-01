/**
 * Script de monitoreo de performance del servidor
 * Ejecutar con: node src/utils/performanceMonitor.js
 */

import os from 'node:os';
import process from 'node:process';

class PerformanceMonitor {
  constructor() {
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.slowQueries = [];
  }

  /**
   * Obtiene métricas del sistema
   */
  getSystemMetrics() {
    const uptime = process.uptime();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(2);

    const processMemory = process.memoryUsage();
    const heapUsedMB = (processMemory.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotalMB = (processMemory.heapTotal / 1024 / 1024).toFixed(2);
    const rssMB = (processMemory.rss / 1024 / 1024).toFixed(2);

    return {
      uptime: this.formatUptime(uptime),
      system: {
        totalMemMB: (totalMem / 1024 / 1024).toFixed(2),
        freeMemMB: (freeMem / 1024 / 1024).toFixed(2),
        usedMemMB: (usedMem / 1024 / 1024).toFixed(2),
        memUsagePercent,
      },
      process: {
        heapUsedMB,
        heapTotalMB,
        rssMB,
        pid: process.pid,
      },
      cpu: {
        cores: os.cpus().length,
        loadAvg: os.loadavg(),
      },
    };
  }

  /**
   * Formatea el uptime en formato legible
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
  }

  /**
   * Middleware para Express para trackear requests
   */
  requestTracker() {
    return (req, res, next) => {
      const start = Date.now();
      this.requestCount++;

      res.on('finish', () => {
        const duration = Date.now() - start;

        // Trackear queries lentas (> 1000ms)
        if (duration > 1000) {
          this.slowQueries.push({
            method: req.method,
            url: req.url,
            duration,
            timestamp: new Date().toISOString(),
          });

          // Mantener solo las últimas 50 queries lentas
          if (this.slowQueries.length > 50) {
            this.slowQueries.shift();
          }
        }

        // Trackear errores
        if (res.statusCode >= 400) {
          this.errorCount++;
        }
      });

      next();
    };
  }

  /**
   * Obtiene estadísticas de la aplicación
   */
  getAppMetrics() {
    const runningTime = Date.now() - this.startTime;
    const avgRequestsPerMin = (
      this.requestCount /
      (runningTime / 60000)
    ).toFixed(2);

    return {
      totalRequests: this.requestCount,
      totalErrors: this.errorCount,
      errorRate: ((this.errorCount / this.requestCount) * 100).toFixed(2) + '%',
      avgRequestsPerMin,
      slowQueries: this.slowQueries.length,
      recentSlowQueries: this.slowQueries.slice(-10),
    };
  }

  /**
   * Imprime reporte completo
   */
  printReport() {
    console.log('\n═══════════════════════════════════════════════');
    console.log('📊 PERFORMANCE MONITOR REPORT');
    console.log('═══════════════════════════════════════════════\n');

    const systemMetrics = this.getSystemMetrics();
    const appMetrics = this.getAppMetrics();

    console.log('🖥️  SYSTEM METRICS');
    console.log('─────────────────────────────────────────────');
    console.log(`Uptime: ${systemMetrics.uptime}`);
    console.log(
      `Memory Usage: ${systemMetrics.system.usedMemMB} MB / ${systemMetrics.system.totalMemMB} MB (${systemMetrics.system.memUsagePercent}%)`,
    );
    console.log(`CPU Cores: ${systemMetrics.cpu.cores}`);
    console.log(
      `Load Average: ${systemMetrics.cpu.loadAvg.map((l) => l.toFixed(2)).join(', ')}`,
    );

    console.log('\n🔧 PROCESS METRICS');
    console.log('─────────────────────────────────────────────');
    console.log(`PID: ${systemMetrics.process.pid}`);
    console.log(
      `Heap Used: ${systemMetrics.process.heapUsedMB} MB / ${systemMetrics.process.heapTotalMB} MB`,
    );
    console.log(`RSS: ${systemMetrics.process.rssMB} MB`);

    console.log('\n📈 APPLICATION METRICS');
    console.log('─────────────────────────────────────────────');
    console.log(`Total Requests: ${appMetrics.totalRequests}`);
    console.log(`Total Errors: ${appMetrics.totalErrors}`);
    console.log(`Error Rate: ${appMetrics.errorRate}`);
    console.log(`Avg Requests/min: ${appMetrics.avgRequestsPerMin}`);
    console.log(`Slow Queries (>1s): ${appMetrics.slowQueries}`);

    if (appMetrics.recentSlowQueries.length > 0) {
      console.log('\n⚠️  RECENT SLOW QUERIES');
      console.log('─────────────────────────────────────────────');
      appMetrics.recentSlowQueries.forEach((query, idx) => {
        console.log(`${idx + 1}. ${query.method} ${query.url}`);
        console.log(`   Duration: ${query.duration}ms | ${query.timestamp}`);
      });
    }

    console.log('\n═══════════════════════════════════════════════\n');
  }

  /**
   * Inicia monitoreo automático cada X segundos
   */
  startAutoMonitoring(intervalSeconds = 60) {
    console.log(
      `🔍 Performance monitor iniciado (reportes cada ${intervalSeconds}s)`,
    );

    setInterval(() => {
      this.printReport();
    }, intervalSeconds * 1000);
  }

  /**
   * Detecta posibles problemas de performance
   */
  detectIssues() {
    const issues = [];
    const systemMetrics = this.getSystemMetrics();
    const appMetrics = this.getAppMetrics();

    // Memory usage alto
    if (Number.parseFloat(systemMetrics.system.memUsagePercent) > 85) {
      issues.push({
        severity: 'HIGH',
        type: 'MEMORY',
        message: `Memory usage crítico: ${systemMetrics.system.memUsagePercent}%`,
      });
    }

    // Heap usage alto
    const heapUsagePercent =
      (Number.parseFloat(systemMetrics.process.heapUsedMB) /
        Number.parseFloat(systemMetrics.process.heapTotalMB)) *
      100;
    if (heapUsagePercent > 90) {
      issues.push({
        severity: 'HIGH',
        type: 'HEAP',
        message: `Heap usage alto: ${heapUsagePercent.toFixed(2)}%`,
      });
    }

    // Error rate alto
    if (Number.parseFloat(appMetrics.errorRate) > 5) {
      issues.push({
        severity: 'MEDIUM',
        type: 'ERRORS',
        message: `Error rate alto: ${appMetrics.errorRate}`,
      });
    }

    // Muchas queries lentas
    if (appMetrics.slowQueries > 20) {
      issues.push({
        severity: 'MEDIUM',
        type: 'SLOW_QUERIES',
        message: `Muchas queries lentas detectadas: ${appMetrics.slowQueries}`,
      });
    }

    return issues;
  }
}

// Exportar instancia singleton
export const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  performanceMonitor.startAutoMonitoring(30); // Reportes cada 30 segundos
}
