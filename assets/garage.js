(() => {
  const data = window.AEFitmentData?.version === 1 ? window.AEFitmentData : { vehicles: [], products: {} };
  const vehicles = data.vehicles;
  const config = JSON.parse(document.querySelector('[data-theme-config]')?.textContent || '{}');
  const reportHealth = (code) => {
    try { window.AEHealth?.report(code); } catch { /* Diagnostics cannot interrupt browsing. */ }
  };
  if (!vehicles.length) reportHealth('garage_data_unavailable');
  const storageKey = 'autobahn:garage:v2';
  const legacyKey = 'autobahn:garage';
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
  let editingId = null;
  let addingVehicle = false;
  let pageOnly = false;

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

  const identity = (garage) => JSON.stringify(['year', ...fields].map((name) => normalize(garage[name])));
  const hasVehicle = (garage) => Object.values(clean(garage)).some(Boolean);
  const newId = () => window.crypto?.randomUUID?.() || `vehicle-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const emptyCollection = () => ({ version: 2, activeId: null, vehicles: [] });

  function collectionFrom(value) {
    if (value?.version !== 2) {
      const garage = clean(value);
      return hasVehicle(garage) ? { version: 2, activeId: 'legacy-vehicle', vehicles: [{ id: 'legacy-vehicle', ...garage }] } : emptyCollection();
    }
    const result = emptyCollection();
    const seen = new Set();
    if (!Array.isArray(value.vehicles)) return result;
    value.vehicles.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') return;
      const garage = clean(entry);
      const key = identity(garage);
      if (!hasVehicle(garage) || seen.has(key)) return;
      seen.add(key);
      let id = typeof entry.id === 'string' && /^[a-zA-Z0-9-]{1,100}$/.test(entry.id) ? entry.id : `vehicle-${index}`;
      while (result.vehicles.some((vehicle) => vehicle.id === id)) id += '-copy';
      result.vehicles.push({ id, ...garage });
    });
    result.activeId = value.activeId === null ? null
      : result.vehicles.find((entry) => entry.id === value.activeId)?.id || result.vehicles[0]?.id || null;
    return result;
  }

  function readCollection(fresh = false) {
    if (memory !== undefined && (!fresh || !storageAvailable || pageOnly)) return collectionFrom(memory);
    let stored;
    try { stored = localStorage.getItem(storageKey) ?? localStorage.getItem(legacyKey); }
    catch { storageAvailable = false; return collectionFrom(memory); }
    try { return collectionFrom(JSON.parse(stored || '{}')); } catch { return emptyCollection(); }
  }

  function read() {
    const collection = readCollection();
    return clean(collection.vehicles.find((entry) => entry.id === collection.activeId));
  }

  function persist(collection) {
    memory = collectionFrom(collection);
    grids.forEach((cache) => { cache.error = ''; });
    forms.forEach((form) => formError(form, ''));
    try {
      localStorage.setItem(storageKey, JSON.stringify(memory));
      storageAvailable = true;
      pageOnly = false;
    } catch { storageAvailable = false; }
    const url = new URL(location.href);
    if (url.searchParams.has('ae_vehicle') || url.searchParams.has('ae_garage')) {
      url.searchParams.delete('ae_garage');
      const active = read();
      if (!storageAvailable && complete(active) && yearValid(active)) url.searchParams.set('ae_vehicle', JSON.stringify(active));
      else url.searchParams.delete('ae_vehicle');
      history.replaceState({}, '', url);
    }
    update();
  }

  function selectVehicle(id) {
    const collection = readCollection(true);
    if (!collection.vehicles.some((entry) => entry.id === id)) return;
    editingId = null;
    addingVehicle = false;
    collection.activeId = id;
    persist(collection);
  }

  function removeVehicle(id) {
    const collection = readCollection(true);
    const index = collection.vehicles.findIndex((entry) => entry.id === id);
    if (index < 0) return;
    collection.vehicles.splice(index, 1);
    if (collection.activeId === id) collection.activeId = collection.vehicles[Math.min(index, collection.vehicles.length - 1)]?.id || null;
    if (editingId === id) editingId = null;
    if (!collection.activeId) setFilter(false);
    persist(collection);
    (drawer?.querySelector('[data-garage-select]:checked') || drawer?.querySelector('[data-garage-add]'))?.focus();
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
    resetEditor();
  }

  function open() {
    drawer?.classList.add('is-open');
    toggle?.setAttribute('aria-expanded', 'true');
    document.dispatchEvent(new CustomEvent('ae:garage-open'));
    field(drawer, 'make')?.focus();
  }

  function resetEditor() {
    editingId = null;
    addingVehicle = false;
    const form = drawer?.querySelector('[data-garage-form]');
    if (!form) return;
    populate(form, read());
    formError(form, '');
    editorLabels();
  }

  function editorLabels() {
    const form = drawer?.querySelector('[data-garage-form]');
    const heading = form?.querySelector('[data-garage-editor-title]');
    const submit = form?.querySelector('[type="submit"]');
    const cancel = form?.querySelector('[data-garage-cancel]');
    if (heading) heading.textContent = editingId ? heading.dataset.editLabel : heading.dataset.addLabel;
    if (submit) submit.textContent = editingId ? submit.dataset.editLabel : submit.dataset.saveLabel;
    if (cancel) cancel.hidden = !editingId && !addingVehicle;
  }

  function renderVehicles(collection) {
    const container = drawer?.querySelector('[data-garage-vehicles]');
    const template = drawer?.querySelector('[data-garage-vehicle-template]');
    if (!container || !template) return;
    const focused = container.contains(document.activeElement) ? document.activeElement : null;
    const focusedId = focused?.closest('[data-garage-vehicle]')?.dataset.garageVehicle;
    const focusedControl = focused?.matches('[data-garage-select]') ? '[data-garage-select]'
      : focused?.matches('[data-garage-edit]') ? '[data-garage-edit]' : '[data-garage-remove]';
    const rows = collection.vehicles.map((garage) => {
      const row = template.content.firstElementChild.cloneNode(true);
      row.dataset.garageVehicle = garage.id;
      const selected = collection.activeId === garage.id;
      row.classList.toggle('is-active', selected);
      row.querySelector('[data-garage-vehicle-name]').textContent = format(garage);
      const radio = row.querySelector('[data-garage-select]');
      radio.value = garage.id;
      radio.checked = selected;
      row.querySelector('[data-garage-active-label]').hidden = !selected;
      row.querySelectorAll('[data-garage-edit], [data-garage-remove]').forEach((button) => {
        const label = `${button.dataset.label}: ${format(garage)}`;
        button.setAttribute('aria-label', label);
        button.title = label;
      });
      return row;
    });
    container.replaceChildren(...rows);
    const empty = drawer.querySelector('[data-garage-vehicles-empty]');
    if (empty) empty.hidden = Boolean(rows.length);
    const count = drawer.querySelector('[data-garage-count]');
    if (count) count.textContent = String(rows.length);
    if (focusedId) rows.find((row) => row.dataset.garageVehicle === focusedId)?.querySelector(focusedControl)?.focus();
    editorLabels();
  }

  function badges(garage) {
    document.querySelectorAll('[data-fitment-source]').forEach((element) => {
      const review = data.products[element.dataset.productHandle]?.sourceReview;
      const link = element.querySelector('[data-fitment-source-link]');
      const note = element.querySelector('[data-fitment-source-note]');
      element.hidden = true;
      link?.removeAttribute('href');
      if (!link || !note || review?.scope !== 'model-engine' || !/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedAt || '')) return;
      let url;
      try { url = new URL(review.url); } catch { return; }
      if (url.protocol !== 'https:' || url.hostname !== 'armmotorsports.com' || url.username || url.password || url.port || url.search || url.hash || !url.pathname.startsWith('/products/')) return;
      link.href = url.href;
      note.textContent = ` Model/engine rows reviewed ${review.reviewedAt}. Model-year compatibility remains unverified. ${review.notes || ''}`;
      element.hidden = false;
    });
    document.querySelectorAll('[data-fitment-badge]').forEach((badge) => {
      const value = state(badge.dataset.productHandle, garage);
      const label = value === 'empty' ? 'Check fitment'
        : value === 'unknown' ? 'Fitment not supplied - confirm with us'
        : value === 'not-listed' ? 'Not listed for this vehicle'
        : value === 'review' ? 'Listed model / engine - check restrictions and year'
        : 'Listed model / engine - confirm year';
      (badge.querySelector('[data-fitment-badge-text]') || badge).textContent = label;
      if (badge.classList.contains('fitment-badge--card')) {
        const compact = { empty: 'Check fitment', unknown: 'Fitment unknown - confirm', 'not-listed': 'Not listed for your vehicle', review: 'Listed - check year & restrictions', listed: 'Listed - confirm year' };
        (badge.querySelector('[data-fitment-badge-text]') || badge).textContent = compact[value];
      }
      badge.setAttribute('aria-label', label);
      badge.title = label;
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
      reportHealth('garage_load_error');
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
    const collection = readCollection();
    const garage = read();
    const ready = complete(garage) && yearValid(garage);
    const emptyTitle = collection.vehicles.length ? 'No vehicle selected' : 'No vehicle saved';
    forms.forEach((form) => {
      if (form.matches('[data-garage-form]') && (editingId || addingVehicle)) return;
      populate(form, garage);
    });
    const title = drawer?.querySelector('[data-garage-title]');
    const summary = drawer?.querySelector('[data-garage-summary]');
    if (title) title.textContent = ready ? format(garage) : Object.values(garage).some(Boolean) ? 'Update your saved vehicle' : emptyTitle;
    if (summary) summary.textContent = !vehicles.length ? 'Vehicle data unavailable.' : ready
      ? `${storageAvailable && !pageOnly ? 'Saved in this browser.' : 'Saved for this page only.'} Listed model / engine matches require year and installation-note confirmation.`
      : 'Select a listed model, platform, and engine. Model-year ranges are not supplied.';
    renderVehicles(collection);
    toggle?.classList.toggle('has-garage', ready);
    const indicator = toggle?.querySelector('[data-garage-indicator]');
    if (indicator) indicator.hidden = !ready;
    document.querySelectorAll('[data-garage-bar]').forEach((bar) => {
      const vehicle = bar.querySelector('[data-garage-bar-vehicle]');
      if (vehicle) vehicle.textContent = ready ? format(garage) : Object.values(garage).some(Boolean) ? 'Update your saved vehicle' : emptyTitle;
      const note = bar.querySelector('[data-garage-bar-note]');
      if (note) note.hidden = !ready;
      const clearButton = bar.querySelector('[data-garage-bar-clear]');
      if (clearButton) clearButton.hidden = !Object.values(garage).some(Boolean);
      const change = bar.querySelector('[data-garage-bar-change]');
      if (change) change.textContent = collection.vehicles.length > 1 ? `My Garage (${collection.vehicles.length})` : ready ? 'Change' : 'Choose vehicle';
    });
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
          reportHealth('garage_load_error');
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

  function write(garage, form) {
    const collection = readCollection(true);
    const editId = form?.matches('[data-garage-form]') ? editingId : null;
    const duplicate = collection.vehicles.find((entry) => identity(entry) === identity(garage));
    if (editId && !collection.vehicles.some((entry) => entry.id === editId)) {
      formError(form, 'This vehicle was removed in another tab. Cancel editing and add it again if needed.');
      return false;
    }
    if (editId && duplicate && duplicate.id !== editId) {
      formError(form, 'This vehicle is already in My Garage. Select it from your vehicles.');
      return false;
    }
    const id = editId || duplicate?.id || newId();
    const index = collection.vehicles.findIndex((entry) => entry.id === id);
    const entry = { id, ...clean(garage) };
    if (index < 0) collection.vehicles.push(entry);
    else collection.vehicles[index] = entry;
    collection.activeId = id;
    editingId = null;
    addingVehicle = false;
    persist(collection);
    return true;
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
      if (!write(garage, form)) return;
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
    else if (event.target.closest('[data-garage-add]')) {
      editingId = null;
      addingVehicle = true;
      const form = drawer.querySelector('[data-garage-form]');
      populate(form, {});
      formError(form, '');
      editorLabels();
      field(form, 'make')?.focus();
    } else if (event.target.closest('[data-garage-cancel]')) {
      resetEditor();
      drawer?.querySelector('[data-garage-add]')?.focus();
    } else if (event.target.closest('[data-garage-edit]')) {
      const id = event.target.closest('[data-garage-vehicle]')?.dataset.garageVehicle;
      const garage = readCollection().vehicles.find((entry) => entry.id === id);
      if (!garage) return;
      editingId = id;
      addingVehicle = false;
      const form = drawer.querySelector('[data-garage-form]');
      populate(form, garage);
      formError(form, '');
      editorLabels();
      field(form, 'make')?.focus();
    } else if (event.target.closest('[data-garage-remove]')) {
      removeVehicle(event.target.closest('[data-garage-vehicle]')?.dataset.garageVehicle);
    }
    else if (event.target.closest('[data-garage-clear], [data-vehicle-clear]')) {
      const url = new URL(location.href);
      url.searchParams.delete('ae_vehicle'); url.searchParams.delete('ae_garage');
      history.replaceState({}, '', url);
      setFilter(false);
      const collection = readCollection(true);
      collection.activeId = null;
      editingId = null;
      addingVehicle = false;
      persist(collection);
    } else if (event.target.closest('[data-garage-shop]')) {
      event.preventDefault();
      const garage = validate(drawer.querySelector('form'));
      if (garage && write(garage, drawer.querySelector('form'))) browse(garage);
    } else if (event.target.closest('[data-fitment-retry]')) {
      grids.forEach((cache) => { cache.error = ''; });
      setFilter(true); update();
    } else if (drawer?.classList.contains('is-open') && !drawer.contains(event.target)) close();
  });
  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-garage-select]')) { selectVehicle(event.target.value); return; }
    if (!event.target.matches('[data-fitment-filter-toggle]')) return;
    grids.forEach((cache) => { cache.error = ''; });
    setFilter(event.target.checked); update();
  });
  window.addEventListener('storage', (event) => {
    if (![storageKey, legacyKey, filterKey, null].includes(event.key)) return;
    // Old open tabs may still write a single vehicle. Merge it instead of losing the saved list.
    if (event.key === legacyKey) {
      let garage;
      try { garage = clean(JSON.parse(localStorage.getItem(legacyKey) || '{}')); } catch { return; }
      if (hasVehicle(garage)) { write(garage); return; }
      const collection = readCollection(true);
      collection.activeId = null;
      setFilter(false);
      persist(collection);
      return;
    }
    filterMemory = undefined;
    if (event.key === filterKey) { update(); return; }
    memory = undefined;
    pageOnly = false;
    if (event.key !== filterKey) { editingId = null; addingVehicle = false; }
    update();
  });
  const parameters = new URLSearchParams(location.search);
  try {
    const shared = clean(JSON.parse(parameters.get('ae_vehicle') || 'null'));
    if (complete(shared) && yearValid(shared)) {
      const collection = readCollection();
      let entry = collection.vehicles.find((vehicle) => identity(vehicle) === identity(shared));
      if (!entry) { entry = { id: newId(), ...shared }; collection.vehicles.push(entry); }
      collection.activeId = entry.id;
      memory = collection;
      pageOnly = true;
    }
  } catch { /* Ignore invalid shared selections. */ }
  if (parameters.get('ae_garage') === '1') {
    setFilter(true);
    const url = new URL(location.href);
    url.searchParams.delete('ae_garage');
    history.replaceState({}, '', url);
  }
  window.AEGarage = { open, close, read, state, complete, update, list: () => readCollection().vehicles };
  const header = document.querySelector('.site-header--sticky');
  const ticker = document.querySelector('.announcement-bar');
  let offsetFrame = 0;
  let followUntil = 0;
  const offset = () => {
    const bottom = Math.max(0, header?.getBoundingClientRect().bottom || 0, ticker?.getBoundingClientRect().bottom || 0);
    document.documentElement.style.setProperty('--garage-bar-offset', `${bottom}px`);
  };
  const followHeader = () => {
    offset();
    offsetFrame = performance.now() < followUntil ? requestAnimationFrame(followHeader) : 0;
  };
  const queueOffset = () => {
    if (!offsetFrame) offsetFrame = requestAnimationFrame(followHeader);
  };
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(queueOffset);
    if (header) observer.observe(header);
    if (ticker) observer.observe(ticker);
  }
  if (header) {
    let previousClass = header.className;
    new MutationObserver(() => {
      if (header.className === previousClass) return;
      previousClass = header.className;
      // Follow only the short header transition, not a permanent animation loop.
      followUntil = performance.now() + (matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 400);
      queueOffset();
    }).observe(header, { attributes: true, attributeFilter: ['class'] });
    header.addEventListener('transitionend', queueOffset);
  }
  window.addEventListener('scroll', queueOffset, { passive: true });
  window.addEventListener('resize', queueOffset);
  offset();
  update();
})();
