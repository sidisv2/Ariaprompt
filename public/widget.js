(function() {
  const currentScript = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const agencyId = currentScript ? (currentScript.getAttribute('data-agency-id') || currentScript.getAttribute('data-agent-id')) : null;
  const primaryColor = currentScript ? (currentScript.getAttribute('data-color') || '#10b981') : '#10b981';

  if (!agencyId) {
    console.error('AriaProp Widget: data-agency-id is required.');
    return;
  }

  // Prevenir duplicados
  if (document.getElementById('ariaprop-widget-root')) return;

  const container = document.createElement('div');
  container.id = 'ariaprop-widget-root';
  container.style.position = 'fixed';
  container.style.bottom = '24px';
  container.style.right = '24px';
  container.style.zIndex = '999999';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'flex-end';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  // Contenedor Iframe
  const iframeContainer = document.createElement('div');
  iframeContainer.id = 'ariaprop-iframe-container';
  iframeContainer.style.width = '380px';
  iframeContainer.style.height = '600px';
  iframeContainer.style.maxWidth = 'calc(100vw - 32px)';
  iframeContainer.style.maxHeight = 'calc(100vh - 100px)';
  iframeContainer.style.borderRadius = '16px';
  iframeContainer.style.overflow = 'hidden';
  iframeContainer.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
  iframeContainer.style.marginBottom = '12px';
  iframeContainer.style.display = 'none';
  iframeContainer.style.transition = 'all 0.3s ease';

  const iframe = document.createElement('iframe');
  iframe.src = `https://ariaprop.online/embed/chat?agencyId=${encodeURIComponent(agencyId)}`;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.allow = 'microphone; camera; autoplay';
  iframeContainer.appendChild(iframe);

  // Botón Flotante
  const button = document.createElement('button');
  button.id = 'ariaprop-toggle-btn';
  button.style.width = '56px';
  button.style.height = '56px';
  button.style.borderRadius = '50%';
  button.style.backgroundColor = primaryColor;
  button.style.border = 'none';
  button.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
  button.style.cursor = 'pointer';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.transition = 'transform 0.2s ease';
  button.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;

  let isOpen = false;
  button.onclick = () => {
    isOpen = !isOpen;
    iframeContainer.style.display = isOpen ? 'block' : 'none';
    button.innerHTML = isOpen 
      ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
      : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
  };

  container.appendChild(iframeContainer);
  container.appendChild(button);
  document.body.appendChild(container);
})();
