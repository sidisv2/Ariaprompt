async function testMemoryConversation() {
  console.log('💬 Testing "Memoria & Contexto" on https://ariaprop.online/api/chat...\n');

  const apiUrl = 'https://ariaprop.online/api/chat';

  // 5-step conversation flow
  const turns = [
    'Hola, estoy buscando un departamento de 2 dormitorios en Mendoza con presupuesto de 450 USD para alquilar.',
    '¿Tienen alguna opción disponible en esa zona?',
    '¿Cuántos metros cuadrados tiene y en qué calle queda?', // Depends on remembering Mendoza, 450 USD, depto!
    '¿Cuál es el precio mensual?', // Asks price without mentioning property
    'Perfecto, ¿cuántos dormitorios me dijiste que tenía?', // Asks bedrooms without repeating previous input
  ];

  const history: { sender: string; content: string }[] = [];

  for (let i = 0; i < turns.length; i++) {
    const userMsg = turns[i];
    console.log(`\n==================================================`);
    console.log(`👤 USER (Turno ${i + 1}): "${userMsg}"`);

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: history,
          lang: 'es',
        }),
      });

      const data = await res.json();
      const botResponse = data.text || 'Sin respuesta';

      console.log(`🤖 AGENT: "${botResponse.trim()}"`);

      // Append to history for memory test
      history.push({ sender: 'user', content: userMsg });
      history.push({ sender: 'bot', content: botResponse.trim() });
    } catch (err: any) {
      console.error(`❌ Error in turn ${i + 1}:`, err.message);
    }
  }
}

testMemoryConversation();
