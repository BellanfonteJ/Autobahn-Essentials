(() => {
  const panel = document.querySelector('[data-collection-facets]');
  const opener = document.querySelector('[data-facet-open]');
  const backdrop = document.querySelector('[data-facet-backdrop]');
  const mobile = matchMedia('(max-width: 990px)');

  function close() {
    if (!panel) return;
    const wasOpen = panel.classList.contains('is-open');
    panel.classList.remove('is-open');
    document.body.classList.remove('is-facets-open');
    opener?.setAttribute('aria-expanded', 'false');
    if (backdrop) backdrop.hidden = true;
    if (wasOpen) panel.dispatchEvent(new CustomEvent('ae:modal-closed', { bubbles: true }));
    panel.inert = mobile.matches;
    panel.setAttribute('aria-hidden', String(mobile.matches));
    if (!mobile.matches) {
      panel.removeAttribute('role');
      panel.removeAttribute('aria-modal');
    }
  }

  function open() {
    if (!panel || !mobile.matches) return;
    window.AEGarage?.close();
    panel.classList.add('is-open');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    document.body.classList.add('is-facets-open');
    opener?.setAttribute('aria-expanded', 'true');
    if (backdrop) backdrop.hidden = false;
    panel.dispatchEvent(new CustomEvent('ae:open-modal', { bubbles: true }));
  }

  if (panel) {
    opener?.addEventListener('click', open);
    document.querySelectorAll('[data-facet-close]').forEach((button) => button.addEventListener('click', close));
    backdrop?.addEventListener('click', close);
    panel.addEventListener('ae:close-modal', close);
    document.addEventListener('ae:garage-open', close);
    mobile.addEventListener('change', close);
    close();
  }

  function navigate(form, filters) {
    const minimum = form.querySelector('[data-price-min]');
    const maximum = form.querySelector('[data-price-max]');
    maximum?.setCustomValidity('');
    if (minimum?.value && maximum?.value && Number(minimum.value) > Number(maximum.value)) {
      maximum.setCustomValidity(maximum.dataset.rangeError || 'Maximum price must be at least the minimum price.');
    }
    if (!form.reportValidity()) return;
    const url = new URL(location.href);
    url.searchParams.delete('page');
    url.searchParams.delete('section_id');
    if (filters) {
      [...url.searchParams.keys()].filter((name) => name.startsWith('filter.')).forEach((name) => url.searchParams.delete(name));
    }
    const values = new FormData(form);
    const names = new Set([...values.keys()]);
    names.forEach((name) => {
      if (!filters && name !== 'sort_by') return;
      if (filters && name === 'sort_by' && url.searchParams.has('sort_by')) return;
      url.searchParams.delete(name);
      values.getAll(name).filter((value) => String(value).trim()).forEach((value) => url.searchParams.append(name, value));
    });
    location.assign(url);
  }

  document.querySelector('[data-collection-filter-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    navigate(event.currentTarget, true);
  });
  panel?.querySelectorAll('[data-price-min], [data-price-max]').forEach((input) => input.addEventListener('input', () => {
    panel.querySelector('[data-price-max]')?.setCustomValidity('');
  }));
  const sorting = document.querySelector('[data-collection-sort]');
  sorting?.addEventListener('submit', (event) => {
    event.preventDefault();
    navigate(event.currentTarget, false);
  });
  sorting?.querySelector('select')?.addEventListener('change', () => navigate(sorting, false));
  document.querySelectorAll('[data-facet-reset]').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    const url = new URL(location.href);
    [...url.searchParams.keys()].filter((name) => name.startsWith('filter.')).forEach((name) => url.searchParams.delete(name));
    url.searchParams.delete('page');
    location.assign(url);
  }));
})();
