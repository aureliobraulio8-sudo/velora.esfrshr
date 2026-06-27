// VELORA IA — Inicialização instantânea de tema e idioma
// Este script corre SÍNCRONAMENTE antes da página renderizar
// Elimina flash de cor e atraso de idioma

(function() {
  function get(k, d) {
    try { return JSON.parse(localStorage.getItem('vp_' + k)) ?? d; } catch(e) { return d; }
  }

  // Aplicar tema instantaneamente
  var dark = get('dark', true);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');

  // Guardar idioma para uso imediato
  window._LANG = get('lang', 'pt');
  window._DARK = dark;
})();
