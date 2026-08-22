(function() {
  var currentScript = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var agencyId = currentScript.getAttribute('data-agency-id') || currentScript.getAttribute('data-agent-id') || 'aria-default';
  var brandColor = currentScript.getAttribute('data-color') || '#10b981';
  var position = currentScript.getAttribute('data-position') || 'bottom-right';

  // Prevent duplicate insertion
  if (document.getElementById('aria-chat-widget-container')) return;

  var container = document.createElement('div');
  container.id = 'aria-chat-widget-container';
  container.style.position = 'fixed';
  container.style.zIndex = '999999';
  container.style.bottom = '20px';
  if (position === 'bottom-left') {
    container.style.left = '20px';
  } else {
    container.style.right = '20px';
  }

  // Floating trigger button
  var trigger = document.createElement('button');
  trigger.id = 'aria-chat-trigger-btn';
  trigger.style.width = '60px';
  trigger.style.height = '60px';
  trigger.style.borderRadius = '30px';
  trigger.style.backgroundColor = brandColor;
  trigger.style.color = '#020617';
  trigger.style.border = 'none';
  trigger.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
  trigger.style.cursor = 'pointer';
  trigger.style.display = 'flex';
  trigger.style.alignItems = 'center';
  trigger.style.justifyContent = 'center';
  trigger.style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
  trigger.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';

  // Iframe for actual chat
  var iframe = document.createElement('iframe');
  iframe.id = 'aria-chat-iframe';
  iframe.src = 'https://ariaprop.online/embed/chat/' + encodeURIComponent(agencyId);
  iframe.style.display = 'none';
  iframe.style.width = '380px';
  iframe.style.height = '600px';
  iframe.style.maxHeight = 'calc(100vh - 100px)';
  iframe.style.maxWidth = 'calc(100vw - 40px)';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '24px';
  iframe.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
  iframe.style.marginBottom = '12px';
  iframe.allow = 'microphone; camera; autoplay';

  var isOpen = false;
  trigger.onclick = function() {
    isOpen = !isOpen;
    if (isOpen) {
      iframe.style.display = 'block';
      trigger.style.transform = 'scale(0.9)';
    } else {
      iframe.style.display = 'none';
      trigger.style.transform = 'scale(1)';
    }
  };

  container.appendChild(iframe);
  container.appendChild(trigger);
  document.body.appendChild(container);
})();
