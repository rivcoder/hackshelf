// PWA Registration and Install Prompt Controller
(() => {
  'use strict';

  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          // Listen for updates
          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (installing) {
              installing.onstatechange = () => {
                if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available
                  const toast = document.getElementById('toast');
                  if (toast) {
                    toast.textContent = 'App updated. Refresh to get the latest version.';
                    toast.className = 'show';
                    setTimeout(() => { toast.className = ''; }, 4500);
                  }
                }
              };
            }
          };
        })
        .catch(err => {
          console.warn('ServiceWorker registration failed: ', err);
        });
    });
  }

  // 2. Install App Prompt Banner / Button handler
  let deferredPrompt;
  const installBtn = document.getElementById('installBtn');

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) {
      installBtn.hidden = false;
      installBtn.addEventListener('click', async () => {
        installBtn.hidden = true;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
      });
    }
  });

  window.addEventListener('appinstalled', () => {
    if (installBtn) installBtn.hidden = true;
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = 'Hackshelf installed to your home screen!';
      toast.className = 'show';
      setTimeout(() => { toast.className = ''; }, 4000);
    }
  });
})();
