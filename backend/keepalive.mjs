#!/usr/bin/env node
/**
 * Mantiene la sesión de CPG viva y sincroniza el portal automáticamente
 * Uso: node keepalive.mjs
 * Requiere: ADMIN_PASS en variable de entorno
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const CPG_URL    = 'https://localhost:5000';
const SYNC_EVERY_MINUTES = 60; // sincroniza cada 60 min
const TICKLE_EVERY_MS    = 55 * 1000; // ping cada 55 segundos

let lastSync   = 0;
let syncing    = false;
let sessionOk  = true;

function log(msg) {
  const hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  console.log(`[${hora}] ${msg}`);
}

async function tickle() {
  try {
    const res  = await fetch(`${CPG_URL}/v1/api/tickle`, { method: 'POST' });
    const data = await res.json();
    return data?.iserver?.authenticated ?? data?.authenticated ?? false;
  } catch {
    return false;
  }
}

function runSync() {
  return new Promise(resolve => {
    if (syncing) return resolve();
    syncing = true;
    log('Sincronizando portafolio...');

    const proc = spawn('node', [join(__dirname, 'sync_cpg.mjs')], {
      stdio: 'inherit',
      env: { ...process.env },
    });

    proc.on('close', code => {
      if (code === 0) {
        lastSync = Date.now();
        log('✓ Sync completado');
      } else {
        log('⚠  Sync falló (revisa el log arriba)');
      }
      syncing = false;
      resolve();
    });
  });
}

async function loop() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Murza Inversiones — CPG Keepalive');
  console.log(`  Sync automático cada ${SYNC_EVERY_MINUTES} minutos`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!process.env.ADMIN_PASS) {
    console.error('❌ Falta ADMIN_PASS en las variables de entorno.');
    console.error('   Agrega ADMIN_PASS=tupassword al archivo .env.local');
    process.exit(1);
  }

  // Sync inmediato al arrancar
  await runSync();

  while (true) {
    await new Promise(r => setTimeout(r, TICKLE_EVERY_MS));

    const autenticado = await tickle();

    if (!autenticado) {
      if (sessionOk) {
        log('⚠  Sesión IB expirada. Abre https://localhost:5000 y haz login.');
        sessionOk = false;
      }
      continue;
    }

    if (!sessionOk) {
      log('✓ Sesión IB restaurada.');
      sessionOk = true;
    }

    const minutesElapsed = (Date.now() - lastSync) / 60000;
    if (minutesElapsed >= SYNC_EVERY_MINUTES && !syncing) {
      await runSync();
    }
  }
}

loop().catch(err => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});
