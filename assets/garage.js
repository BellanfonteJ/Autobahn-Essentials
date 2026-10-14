(() => {
  const data = window.AEFitmentData?.version === 1 ? window.AEFitmentData : { vehicles: [], products: {} };
  const vehicles = data.vehicles;
  const config = JSON.parse(document.querySelector('[data-theme-config]')?.textContent || '{}');
  const storageKey = 'autobahn:garage';
  const filterKey = 'autobahn:garageFitOnly';
  const fields = ['make', 'model', 'chassis', 'trim', 'variant'];
  const labels = { make: 'Make', model: 'Model / platform', chassis: 'Chassis', trim: 'Engine', variant: 'Submodel / drive' };
  const recordKey = { make: 'make', model: 'model', chassis: 'chassis', trim: 'engine', variant: 'variant' };
  const drawer = document.querySelector('[data-garage-drawer]');
  const toggle = document.querySelector('[data-garage-toggle]');
  const forms = Array.from(document.querySelectorAll('[data-garage-form], [data-garage-save]'));
  const grids = new Map(Array.from(document.querySelectorAll('[data-fitment-grid]'), (grid) => [grid, {
    original: Array.from(grid.children), all: null, controller: null, loading: false, error: '', generation: 0,
  }]));
  let memory;
  let filterMemory;
  let storageAvailable = true;

  const clean = (value = {}) => Object.fromEntries(['year', ...fields].map((field) => [field, String(value?.[field] || '').trim()]));
  const normalize = (value) => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const equals = (a, b) => normalize(a) === normalize(b);
  const field = (form, name) => form?.querySelector(`[name="vehicle_${name}"]`);
  const fromForm = (form) => clean(Object.fromEntries(['year', ...fields].map((name) => [name, field(form, name)?.value])));
  const match = (record, garage) => fields.every((name) => {
    const value = record[recordKey[name]];
    return value ? equals(value, garage[name]) : !['make', 'model', 'trim'].includes(name);
  });
  const complete = (garage) => Boolean(garage.make && garage.model && garage.trim && vehicles.some((record) => match(record, garage)));
  const yearValid = (garage) => !garage.year || (/^\d{4}$/.test(garage.year) && Number(garage.year) >= 1900 && Number(garage.year) <= new Date().getFullYear() + 1);
  const format = (garage) => [garage.year, garage.make, garage.model, garage.chassis && `(${garage.chassis})`, garage.trim, garage.variant].filter(Boolean).join(' ');

  function read() {
    if (memory !== undefined) return clean(memory);
    let stored;
    try { stored = localStorage.getItem(storageKey); }
    catch { storageAvailable = false; return clean(); }
    try { return clean(JSON.parse(stored || '{}')); } catch { return clean(); }
  }

  function filterOn() {
    if (filterMemory !== undefined) return filterMemory;
    try { return localStorage.getItem(filterKey) === 'true'; }
    catch { return false; }
  }

  function setFilter(value) {
    filterMemory = Boolean(value);
    try { localStorage.setItem(filterKey, String(filterMemory)); } catch { storageAvailable = false; }
  }

  function state(handle, garage = read()) {
    if (!complete(garage) || !yearValid(garage)) return 'empty';
    const product = data.products[handle];
    if (!product?.records?.length) return 'unknown';
    const matches = product.records.map((id) => vehicles[id]).filter(Boolean).filter((record) => match(record, garage));
    if (!matches.length) return 'not-listed';
    // Missing years are never interpreted as confirmation of a model year.
    if (matches.some((record) => record.years && garage.year && !record.years.includes(Number(garage.year)))) {
      if (matches.every((record) => record.years && !record.years.includes(Number(garage.year)))) return 'not-listed';
    }
    return product.review ? 'review' : 'listed';
  }

  function populate(form, garage) {
    const draft = clean(garage);
    fields.forEach((name, index) => {
      const input = field(form, name);
      if (!input) return;
      const parents = fields.slice(0, index);
      const candidates = vehicles.filter((record) => parents.every((parent) => {
        const value = record[recordKey[parent]];
        return !draft[parent] || !value || equals(value, draft[parent]);
      }));
      const values = [...new Set(candidates.map((record) => record[recordKey[name]]).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      const parentReady = parents.every((parent) => draft[parent] || field(form, parent)?.disabled);
      input.replaceChildren(new Option(values.length ? labels[name] : 'Not supplied', ''));
      values.forEach((value) => input.add(new Option(value, value)));
      input.value = values.find((value) => equals(value, draft[name])) || '';
      input.disabled = !parentReady || !values.length;
      input.required = parentReady && values.length > 0;
      draft[name] = input.value;
    });
    const year = field(form, 'year');
    if (year) {
      year.value = draft.year;
      year.max = String(new Date().getFullYear() + 1);
    }
  }

  function formError(form, message) {
    const error = form.querySelector('[data-garage-error]');
    if (!error) return;
    error.textContent = message;
    error.hidden = !message;
  }

  function validate(form) {
    const garage = fromForm(form);
    if (!vehicles.length) {
      formError(form, 'Vehicle fitment data is unavailable. Please try again later.');
      return null;
    }
    if (!form.reportValidity() || !yearValid(garage) || !complete(garage)) {
      formError(form, 'Select a complete listed vehicle and engine before saving.');
      return null;
    }
    formError(form, '');
    return garage;
  }

  function close() {
    drawer?.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
    if (drawer?.contains(document.activeElement)) toggle?.focus();
  }

  function open() {
    drawer?.classList.add('is-open');
    toggle?.setAttribute('aria-expanded', 'true');
    document.dispatchEvent(new CustomEvent('ae:garage-open'));
    field(drawer, 'make')?.focus();
  }

  function badges(garage) {
    document.querySelectorAll('[data-fitment-badge]').forEach((badge) => {
      const value = state(badge.dataset.productHandle, garage);
      const label = value === 'empty' ? 'Check fitment'
        : value === 'unknown' ? 'Fitment not supplied - confirm with us'
        : value === 'not-listed' ? 'Not listed for this vehicle'
        : value === 'review' ? 'Listed model / engine - check restrictions and year'
        : 'Listed model / engine - confirm year';
      (badge.querySelector('[data-fitment-badge-text]') || badge).textContent = label;
      badge.setAttribute('aria-label', label);
      badge.classList.remove('is-fit', 'is-check', 'is-empty');
      badge.classList.add(value === 'empty' ? 'is-empty' : 'is-check');
      badge.dataset.fitmentState = value;
    });
  }

  function status(grid, message, error = false) {
    const section = grid.closest('section');
    const controls = section?.querySelector('[data-fitment-filter-controls]');
    const output = controls?.querySelector('[data-fitment-filter-status]');
    if (output) {
      output.textContent = message;
      output.setAttribute('role', error ? 'alert' : 'status');
    }
    const retry = controls?.querySelector('[data-fitment-retry]');
    if (retry) retry.hidden = !error;
  }

  function applyGrid(grid, cache, garage, enabled) {
    if (cache.loading) return;
    const nodes = enabled && cache.all ? cache.all : cache.original;
    grid.replaceChildren(...nodes);
    let count = 0;
    nodes.forEach((card) => {
      const value = state(card.dataset.productHandle, garage);
      const listed = value === 'listed' || value === 'review';
      card.hidden = enabled && (!card.matches('[data-product-card]') || !listed);
      card.style.removeProperty('order');
      card.classList.remove('is-garage-fit');
      card.classList.toggle('is-garage-check', enabled && !listed);
      card.dataset.fitmentState = value;
      if (!card.hidden && card.matches('[data-product-card]')) count += 1;
    });
    const section = grid.closest('section');
    section?.querySelectorAll('[data-fitment-pagination]').forEach((pagination) => { pagination.hidden = enabled; });
    const empty = section?.querySelector('[data-fitment-empty]');
    if (empty) empty.hidden = !enabled || count > 0;
    if (!cache.error) status(grid, enabled
      ? `${count} listed model / engine matches. Confirm model year and installation notes before ordering.`
      : complete(garage) ? `Vehicle saved: ${format(garage)}. Model-year ranges are not verified.` : 'Save a complete vehicle to filter products.');
    document.dispatchEvent(new CustomEvent('ae:content-loaded', { detail: { scope: grid } }));
  }

  async function loadGrid(grid, cache, garage) {
    const pages = Number(grid.dataset.fitmentPages || 1);
    if (cache.all || pages <= 1) { applyGrid(grid, cache, garage, true); return; }
    if (!Number.isInteger(pages) || pages > 50 || !grid.dataset.fitmentSection) throw new Error('Collection is too large or missing its section ID');
    const generation = ++cache.generation;
    const controller = new AbortController();
    cache.controller?.abort();
    cache.controller = controller;
    cache.loading = true;
    cache.error = '';
    grid.setAttribute('aria-busy', 'true');
    status(grid, 'Checking all product pages...');
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const current = Number(grid.dataset.fitmentPage || 1);
      const results = new Map([[current, cache.original]]);
      const queue = Array.from({ length: pages }, (_, index) => index + 1).filter((page) => page !== current);
      await Promise.all(Array.from({ length: Math.min(3, queue.length) }, async () => {
        while (queue.length) {
          const page = queue.shift();
          const url = new URL(location.href);
          url.searchParams.set('section_id', grid.dataset.fitmentSection);
          url.searchParams.set('page', String(page));
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) throw new Error('Product page unavailable');
          const document = new DOMParser().parseFromString(await response.text(), 'text/html');
          const next = document.querySelector(`[data-fitment-grid][data-fitment-section="${CSS.escape(grid.dataset.fitmentSection)}"]`);
          if (!next || Number(next.dataset.fitmentPage) !== page) throw new Error('Product page did not render correctly');
          results.set(page, Array.from(next.children, (node) => window.document.importNode(node, true)));
        }
      }));
      if (generation !== cache.generation || !filterOn()) return;
      const seen = new Set();
      cache.all = Array.from(results.keys()).sort((a, b) => a - b).flatMap((page) => results.get(page)).filter((card) => {
        if (!card.matches('[data-product-card]')) return false;
        const key = card.dataset.productHandle;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } catch (error) {
      controller.abort();
      if (generation !== cache.generation) return;
      cache.error = 'Could not check every product page. Showing unfiltered results. Try again.';
      setFilter(false);
    } finally {
      clearTimeout(timeout);
      if (generation === cache.generation) {
        cache.loading = false;
        grid.setAttribute('aria-busy', 'false');
        applyGrid(grid, cache, read(), filterOn() && complete(read()));
        if (cache.error) status(grid, cache.error, true);
        syncToggles();
        badges(read());
      }
    }
  }

  function syncToggles() {
    document.querySelectorAll('[data-fitment-filter-toggle]').forEach((input) => {
      const ready = complete(read()) && yearValid(read());
      input.disabled = !ready;
      input.checked = filterOn() && ready;
    });
  }

  function update() {
    const garage = read();
    const ready = complete(garage) && yearValid(garage);
    forms.forEach((form) => populate(form, garage));
    const title = drawer?.querySelector('[data-garage-title]');
    const summary = drawer?.querySelector('[data-garage-summary]');
    if (title) title.textContent = ready ? format(garage) : Object.values(garage).some(Boolean) ? 'Update your saved vehicle' : 'No vehicle saved';
    if (summary) summary.textContent = !vehicles.length ? 'Vehicle data unavailable.' : ready
      ? `${storageAvailable ? 'Saved.' : 'Saved for this page only.'} Listed model / engine matches require year and installation-note confirmation.`
      : 'Select a listed model, platform, and engine. Model-year ranges are not supplied.';
    toggle?.classList.toggle('has-garage', ready);
    const indicator = toggle?.querySelector('[data-garage-indicator]');
    if (indicator) indicator.hidden = !ready;
    document.querySelectorAll('[data-vehicle-saved]').forEach((chip) => {
      chip.hidden = !ready;
      const text = chip.querySelector('[data-vehicle-saved-text]');
      if (text) text.textContent = ready ? format(garage) : '';
    });
    syncToggles();
    grids.forEach((cache, grid) => {
      cache.generation += 1;
      cache.controller?.abort();
      cache.loading = false;
      grid.setAttribute('aria-busy', 'false');
      if (ready && filterOn()) {
        loadGrid(grid, cache, garage).catch(() => {
          cache.error = 'Cannot check the full collection. Showing unfiltered results.';
          setFilter(false);
          applyGrid(grid, cache, garage, false);
          status(grid, cache.error, true);
          syncToggles();
        });
      } else { applyGrid(grid, cache, garage, false); }
    });
    badges(garage);
  }

  function write(garage) {
    memory = clean(garage);
    grids.forEach((cache) => { cache.error = ''; });
    try {
      if (complete(memory)) localStorage.setItem(storageKey, JSON.stringify(memory));
      else localStorage.removeItem(storageKey);
    } catch { storageAvailable = false; }
    update();
  }

  function browse(garage, part = '') {
    setFilter(true);
    const url = new URL(part ? config.searchUrl || '/search' : config.allProductsUrl || '/collections/all', location.origin);
    if (part) { url.searchParams.set('q', part); url.searchParams.set('type', 'product'); }
    url.searchParams.set('ae_garage', '1');
    if (!storageAvailable) url.searchParams.set('ae_vehicle', JSON.stringify(garage));
    location.assign(url);
  }

  forms.forEach((form) => {
    fields.forEach((name, index) => field(form, name)?.addEventListener('change', () => {
      fields.slice(index + 1).forEach((child) => { if (field(form, child)) field(form, child).value = ''; });
      populate(form, fromForm(form));
      formError(form, '');
    }));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const garage = validate(form);
      if (!garage) return;
      write(garage);
      if (form.matches('[data-garage-save]')) browse(garage, form.querySelector('[name="part_type"]')?.value || '');
      else close();
    });
  });
  document.querySelectorAll('[data-vehicle-finder]:not([data-garage-save])').forEach((form) => {
    form.addEventListener('submit', () => {
      const query = form.querySelector('[name="q"]');
      if (query) query.value = [form.querySelector('[name="vehicle_model"]')?.value, form.querySelector('[name="part_type"]')?.value].filter(Boolean).join(' ');
    });
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-garage-toggle]')) { event.stopPropagation(); drawer?.classList.contains('is-open') ? close() : open(); }
    else if (event.target.closest('[data-garage-open]')) { event.preventDefault(); open(); }
    else if (event.target.closest('[data-garage-close]')) close();
    else if (event.target.closest('[data-garage-clear], [data-vehicle-clear]')) {
      const url = new URL(location.href);
      url.searchParams.delete('ae_vehicle'); url.searchParams.delete('ae_garage');
      history.replaceState({}, '', url);
      setFilter(false); write({});
    } else if (event.target.closest('[data-garage-shop]')) {
      event.preventDefault();
      const garage = validate(drawer.querySelector('form'));
      if (garage) { write(garage); browse(garage); }
    } else if (event.target.closest('[data-fitment-retry]')) {
      grids.forEach((cache) => { cache.error = ''; });
      setFilter(true); update();
    } else if (drawer?.classList.contains('is-open') && !drawer.contains(event.target)) close();
  });
  document.addEventListener('change', (event) => {
    if (!event.target.matches('[data-fitment-filter-toggle]')) return;
    grids.forEach((cache) => { cache.error = ''; });
    setFilter(event.target.checked); update();
  });
  window.addEventListener('storage', (event) => {
    if (![storageKey, filterKey, null].includes(event.key)) return;
    memory = filterMemory = undefined; update();
  });
  const parameters = new URLSearchParams(location.search);
  try {
    const shared = clean(JSON.parse(parameters.get('ae_vehicle') || 'null'));
    if (complete(shared) && yearValid(shared)) memory = shared;
  } catch { /* Ignore invalid shared selections. */ }
  if (parameters.get('ae_garage') === '1') {
    setFilter(true);
    const url = new URL(location.href);
    url.searchParams.delete('ae_garage');
    history.replaceState({}, '', url);
  }
  window.AEGarage = { open, close, read, state, complete, update };
  update();
})();
