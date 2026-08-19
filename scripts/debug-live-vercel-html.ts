import fetch from 'node-fetch';

async function testAllSubroutes() {
  const routes = ['/', '/app', '/pricing', '/soluciones', '/recursos', '/terminos', '/privacidad', '/reembolsos'];
  
  console.log('====================================================');
  console.log('🔍 PROBANDO TODAS LAS SUBRUTAS DE PRODUCCIÓN EN ARIAPROP.ONLINE');
  console.log('====================================================\n');

  for (const r of routes) {
    const url = `https://ariaprop.online${r}?_cb=${Date.now()}`;
    const res = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const html = await res.text();
    const has5s = html.includes('< 5s') || html.includes('&lt; 5s') || html.includes('< 5 segundos') || html.includes('&lt; 5 segundos') || html.includes('menos de 5');
    const has3min = html.includes('3 minutos');

    console.log(`Route [${r}] -> Status: ${res.status} | Has "< 5s/segundos": ${has5s} | Has "3 minutos": ${has3min}`);
    if (has5s || has3min) {
      console.log(`   ⚠️ WARNING EN RUTA ${r}! Extracting matching lines...`);
      const lines = html.split('\n').filter(l => l.includes('5') || l.includes('minuto'));
      lines.forEach(l => console.log('   ->', l.trim()));
    }
  }
}

testAllSubroutes();
