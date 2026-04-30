// node _validate.mjs {TICKER}
import { readFileSync, appendFileSync } from 'fs';

const TICKER = process.argv[2];
const LOG    = 'C:/Users/murra/portal-reportes/ejecucion.log';
const log    = s => appendFileSync(LOG, s + '\n');
let ok = true;
const fail   = s => { log('VALIDATION_FAIL: ' + s); ok = false; };

try {
  const j = JSON.parse(readFileSync(`C:/Users/murra/portal-reportes/${TICKER}.json`, 'utf8'));

  ['resumen','descripcion'].forEach(k => {
    if (typeof j[k] !== 'string') fail(k + ' debe ser string, es: ' + typeof j[k]);
  });

  if (!j.tabla?.headers || !j.tabla?.rows) fail('tabla: falta headers[] o rows[]');
  else {
    const last = j.tabla.headers[j.tabla.headers.length - 1];
    if (!last?.toLowerCase().includes('yoy')) fail('tabla.headers debe terminar con Var. YoY — encontrado: ' + last);
    j.tabla.rows.forEach((row, i) => {
      if (row.length !== j.tabla.headers.length)
        fail(`tabla.rows[${i}] tiene ${row.length} cols, headers tiene ${j.tabla.headers.length}`);
    });
  }

  if (!Array.isArray(j.kpis)) fail('kpis debe ser array');
  else j.kpis.forEach((k, i) => {
    if (!k.label)                                   fail(`kpis[${i}] falta label`);
    if (!k.value && k.value !== 0)                  fail(`kpis[${i}] falta value`);
    if (!['green','yellow','red'].includes(k.signal)) fail(`kpis[${i}] signal invalido: ${k.signal}`);
  });

  for (const key of ['chart_ingresos','chart_margenes']) {
    if (!j[key]?.data || !j[key]?.series) { fail(`${key}: falta data[] o series[]`); continue; }
    j[key].series.forEach((s, i) => {
      if (typeof s !== 'object' || !s.key || !s.name)
        fail(`${key}.series[${i}] debe ser {key,name}, encontrado: ${JSON.stringify(s)}`);
    });
  }
  j.chart_ingresos?.data?.forEach((d, i) => {
    if (typeof d.revenue !== 'number') fail(`chart_ingresos.data[${i}].revenue debe ser numero`);
  });

  if (!Array.isArray(j.capital_allocation?.items))  fail('capital_allocation.items[] falta');
  if (!j.comparacion_sector?.headers || !j.comparacion_sector?.rows) fail('comparacion_sector: falta headers[] o rows[]');

  if (!Array.isArray(j.deterioro?.items)) fail('deterioro.items[] falta');
  else j.deterioro.items.forEach((it, i) => {
    if (!it.metrica)                                   fail(`deterioro.items[${i}] falta metrica`);
    if (!it.valor && it.valor !== 0)                   fail(`deterioro.items[${i}] falta valor`);
    if (!['ok','warn','bad'].includes(it.status))      fail(`deterioro.items[${i}] status invalido: ${it.status}`);
  });

  if (!Array.isArray(j.flags)) fail('flags debe ser array');
  else j.flags.forEach((f, i) => {
    if (!f.title)                                       fail(`flags[${i}] falta title`);
    if (!['green','yellow','red'].includes(f.level))    fail(`flags[${i}] level invalido: ${f.level}`);
  });

  if (typeof j.score?.score !== 'number' || !Array.isArray(j.score?.items))
    fail('score: falta score (numero) o items[]');

  if (!j.analisis_cualitativo?.estrategia) fail('analisis_cualitativo.estrategia falta');
  if (!Array.isArray(j.analisis_cualitativo?.riesgos)) fail('analisis_cualitativo.riesgos debe ser array');

  if (!Array.isArray(j.verdict?.metrics) || !Array.isArray(j.verdict?.bullets))
    fail('verdict: falta metrics[] o bullets[]');
  if (j.verdict && !['green','yellow','red'].includes(j.verdict.color))
    fail('verdict.color invalido: ' + j.verdict?.color);

  if (!Array.isArray(j.conclusion?.items)) fail('conclusion.items[] falta');

  if (j.parrafos_gratis !== 14) fail('parrafos_gratis debe ser 14');

  log(ok ? 'VALIDATION_OK' : 'VALIDATION_FAILED');
  if (!ok) process.exit(1);
} catch(e) {
  log('VALIDATION_ERROR: ' + e.message);
  process.exit(1);
}
