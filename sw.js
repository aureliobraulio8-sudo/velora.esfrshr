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
  // De propósito, este handler não faz NADA — nunca chama respondWith().
  // Isto garante que nenhum pedido (login, imagens, o que for) é tocado
  // ou reencaminhado por este service worker, evitando qualquer risco de
  // interferência ou corrupção de dados (como aconteceu com o login).
  // Só precisa de existir, com este evento registado, para o Chrome
  // considerar a app "instalável" — não precisa de fazer mais nada.
});
