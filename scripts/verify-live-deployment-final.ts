import fetch from 'node-fetch';

async function verifyLiveDeploymentFinal() {
  console.log('====================================================');
  console.log('🔍 VERIFICACIÓN COMPLETA DE DESPLIEGUE EN VIVO EN ARIAPROP.ONLINE');
  console.log('====================================================\n');

  const routes = ['/', '/pricing', '/app', '/soluciones'];

  for (const r of routes) {
    const url = `https://ariaprop.online${r}?_nocache=${Date.now()}`;
    const res = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const status = res.status;
    const headers = Object.fromEntries(res.headers.entries());
    const html = await res.text();

    const has5s = html.includes('< 5s') || html.includes('&lt; 5s') || html.includes('< 5 segundos') || html.includes('&lt; 5 segundos') || html.includes('menos de 5');
    const has3min = html.includes('3 minutos');

    console.log(`📌 RUTA [${r}]`);
    console.log(`   Status: ${status}`);
    console.log(`   Vercel Deployment ID Header (x-vercel-id): ${headers['x-vercel-id']}`);
    console.log(`   x-vercel-cache: ${headers['x-vercel-cache']}`);
    console.log(`   Contiene "< 5s" / "< 5 segundos": ${has5s}`);
    console.log(`   Contiene "3 minutos": ${has3min}`);

    // Print hero badge / subtitle text
    const lines = html.split('\n').filter(l => l.includes('Respuesta') || l.includes('Segundos') || l.includes('código') || l.includes('minuto'));
    console.log('   Lineas extraídas del HTML en vivo:');
    lines.forEach(l => console.log('     ->', l.trim()));
    console.log('----------------------------------------------------\n');
  }
}

verifyLiveDeploymentFinal();
