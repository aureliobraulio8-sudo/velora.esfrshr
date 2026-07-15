// VELORA IA — Service Worker
//
// IMPORTANTE: este service worker existe só para permitir que a app seja
// instalável no telemóvel (é um requisito técnico do Chrome/Android).
// De propósito, NÃO guarda nada em cache — todos os pedidos vão sempre
// direto à internet, para os utilizadores verem sempre a versão mais
// recente do site, sem nunca terem conteúdo desatualizado.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Deixa passar todos os pedidos directamente para a rede, sem cache.
  event.respondWith(fetch(event.request));
});
