(() => {
  if (window.AEHealth) return;
  const allowed = new Set([
    'cart_add', 'cart_add_error', 'cart_refresh_error', 'cart_change_error',
    'garage_data_unavailable', 'garage_load_error', 'search_no_results',
    'script_error', 'unhandled_rejection', 'image_error',
  ]);
  const counts = {};
  const recent = [];

  // Diagnostics stay in this document's memory; no identifiers or payloads are retained.
  const report = (code) => {
    if (!allowed.has(code)) return;
    counts[code] = Math.min((counts[code] || 0) + 1, 9999);
    recent.push(code);
    if (recent.length > 50) recent.shift();
  };
  window.AEHealth = Object.freeze({
    report,
    snapshot: () => ({ version: 1, counts: { ...counts }, recent: [...recent] }),
  });
  window.addEventListener('error', (event) => {
    if (event.target instanceof HTMLImageElement && event.target.closest('main')) report('image_error');
    else if (event instanceof ErrorEvent) report('script_error');
  }, true);
  window.addEventListener('unhandledrejection', () => report('unhandled_rejection'));
  if (document.querySelector('[data-search-result-count="0"]')) report('search_no_results');
})();
