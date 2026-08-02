#!/usr/bin/env node
/* Elimina `raw_token` de los boletos ya emitidos.
 *
 * Hasta 2026-08-01 el servidor guardaba el token crudo junto a su hash, lo que
 * anulaba el propósito del hash: cualquiera con acceso de lectura a
 * tickets.json obtenía todos los boletos válidos. El servidor ya no lo guarda;
 * este script limpia los registros anteriores.
 *
 * No toca `token_hash`, así que los boletos ya entregados siguen validando.
 *
 *   node scripts/sanitize-tickets-db.js            # muestra qué haría
 *   node scripts/sanitize-tickets-db.js --apply    # escribe (crea respaldo)
 */
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.TICKETS_DB || path.join(__dirname, 'tickets.json');
const APPLY = process.argv.includes('--apply');

if (!fs.existsSync(DB_PATH)) {
  console.error(`No existe ${DB_PATH}. Usa TICKETS_DB=/ruta/tickets.json`);
  process.exit(1);
}

let db;
try {
  db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
} catch (e) {
  console.error(`No se pudo leer ${DB_PATH}: ${e.message}`);
  process.exit(1);
}
if (!Array.isArray(db)) {
  console.error('El archivo no contiene un arreglo de boletos. Aborta.');
  process.exit(1);
}

const afectados = db.filter(t => t && Object.prototype.hasOwnProperty.call(t, 'raw_token'));
const sinHash = db.filter(t => t && !t.token_hash);

console.log(`boletos totales:            ${db.length}`);
console.log(`con token crudo expuesto:   ${afectados.length}`);
console.log(`sin token_hash (revisar):   ${sinHash.length}`);

if (sinHash.length) {
  console.error('\nABORTA: hay boletos sin token_hash; limpiarlos los volvería invalidables.');
  process.exit(2);
}
if (!afectados.length) {
  console.log('\nNada que limpiar.');
  process.exit(0);
}
if (!APPLY) {
  console.log('\nSimulación. Repite con --apply para escribir.');
  process.exit(0);
}

const backup = `${DB_PATH}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
fs.copyFileSync(DB_PATH, backup);

db.forEach(t => { if (t) delete t.raw_token; });
fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');

const check = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const quedan = check.filter(t => t && 'raw_token' in t).length;
const hashes = check.filter(t => t && t.token_hash).length;

console.log(`\nrespaldo:                   ${backup}`);
console.log(`tokens crudos restantes:    ${quedan}`);
console.log(`token_hash intactos:        ${hashes}/${check.length}`);
process.exit(quedan === 0 && hashes === check.length ? 0 : 3);
