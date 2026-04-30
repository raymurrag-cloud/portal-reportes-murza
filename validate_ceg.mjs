import { readFileSync, appendFileSync } from 'fs';

const log = s => appendFileSync('C:/Users/murra/portal-reportes/ejecucion.log', s + '\n');
let ok = true;
const fail = s => { log('VALIDATION_FAIL: ' + s); ok = false; };

try {
  const j = JSON.parse(readFileSync('C:/Users/murra/portal-reportes/CEG.json', 'utf8'));

  ['resumen','descripcion'].forEach(k => {
    if (typeof j[k] !== 'string') fail(k + ' debe ser string, es: ' + typeof j[k]);
  });

  if (!j.tabla || !Array.isArray(j.tabla.headers) || !Array.isArray(j.tabla.rows))
    fail('tabla debe tener headers[] y rows[]');
  else {
    const lastHeader = j.tabla.headers[j.tabla.headers.length - 1];
    if (!lastHeader || !lastHeader.toLowerCase().includes('yoy'))
      fail('tabla.headers debe terminar con columna Var. YoY — encontrado: ' + lastHeader);
    j.tabla.rows.forEach((row, i) => {
      if (row.length !== j.tabla.headers.length)
        fail('tabla.rows['+i+'] tiene '+row.length+' cols pero headers tiene '+j.tabla.headers.length);
    });
  }

  if (!Array.isArray(j.kpis)) fail('kpis debe ser array');
  else j.kpis.forEach((k,i) => {
    if (!k.label) fail('kpis['+i+'] falta label');
    if (!k.value && k.value !== 0) fail('kpis['+i+'] falta value');
    if (!['green','yellow','red'].includes(k.signal)) fail('kpis['+i+'] signal invalido: '+k.signal);
  });

  if (!j.chart_ingresos || !Array.isArray(j.chart_ingresos.data) || !Array.isArray(j.chart_ingresos.series))
    fail('chart_ingresos debe tener data[] y series[]');
  else {
    j.chart_ingresos.data.forEach((d,i) => {
      if (!d.label) fail('chart_ingresos.data['+i+'] falta label');
      if (typeof d.revenue !== 'number') fail('chart_ingresos.data['+i+'].revenue debe ser numero');
    });
    j.chart_ingresos.series.forEach((s,i) => {
      if (typeof s !== 'object' || !s.key || !s.name)
        fail('chart_ingresos.series['+i+'] debe ser {key,name} — NO string. Encontrado: '+JSON.stringify(s));
    });
  }

  if (!j.chart_margenes || !Array.isArray(j.chart_margenes.data) || !Array.isArray(j.chart_margenes.series))
    fail('chart_margenes debe tener data[] y series[]');
  else j.chart_margenes.series.forEach((s,i) => {
    if (typeof s !== 'object' || !s.key || !s.name)
      fail('chart_margenes.series['+i+'] debe ser {key,name} — NO string. Encontrado: '+JSON.stringify(s));
  });

  if (!j.capital_allocation || !Array.isArray(j.capital_allocation.items))
    fail('capital_allocation debe tener items[]');

  if (!j.comparacion_sector || !Array.isArray(j.comparacion_sector.headers) || !Array.isArray(j.comparacion_sector.rows))
    fail('comparacion_sector debe tener headers[] y rows[]');

  if (!j.deterioro || !Array.isArray(j.deterioro.items))
    fail('deterioro debe tener items[]');
  else j.deterioro.items.forEach((it,i) => {
    if (!it.metrica) fail('deterioro.items['+i+'] falta metrica');
    if (!it.valor && it.valor !== 0) fail('deterioro.items['+i+'] falta valor');
    if (!['ok','warn','bad'].includes(it.status)) fail('deterioro.items['+i+'] status invalido: '+it.status);
  });

  if (!Array.isArray(j.flags)) fail('flags debe ser array');
  else j.flags.forEach((f,i) => {
    if (!f.title) fail('flags['+i+'] falta title');
    if (!['green','yellow','red'].includes(f.level)) fail('flags['+i+'] level invalido: '+f.level);
  });

  if (!j.score || typeof j.score.score !== 'number' || !Array.isArray(j.score.items))
    fail('score debe tener score (numero) e items[]');

  if (!j.analisis_cualitativo) fail('analisis_cualitativo falta');
  else {
    if (!j.analisis_cualitativo.estrategia) fail('analisis_cualitativo.estrategia falta');
    if (!Array.isArray(j.analisis_cualitativo.riesgos))
      fail('analisis_cualitativo.riesgos debe ser array de strings');
  }

  if (!j.verdict || !Array.isArray(j.verdict.metrics) || !Array.isArray(j.verdict.bullets))
    fail('verdict debe tener metrics[] y bullets[]');
  if (j.verdict && !['green','yellow','red'].includes(j.verdict.color))
    fail('verdict.color invalido: ' + j.verdict?.color);

  if (!j.conclusion || !Array.isArray(j.conclusion.items))
    fail('conclusion debe ser objeto con items[]');

  if (j.parrafos_gratis !== 14) fail('parrafos_gratis debe ser 14');

  log(ok ? 'VALIDATION_OK' : 'VALIDATION_FAILED');
  if (!ok) process.exit(1);
} catch(e) {
  log('VALIDATION_ERROR: ' + e.message);
  process.exit(1);
}
