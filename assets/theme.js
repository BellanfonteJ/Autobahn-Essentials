document.documentElement.classList.remove('no-js');

const searchToggle = document.querySelector('[data-search-toggle]');
const searchDrawer = document.querySelector('[data-search-drawer]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const mobileNav = document.querySelector('[data-mobile-nav]');
const garageToggle = document.querySelector('[data-garage-toggle]');
const garageDrawer = document.querySelector('[data-garage-drawer]');
const garageForm = document.querySelector('[data-garage-form]');
const garageStorageKey = 'autobahn:garage';

const closeMobileMenu = () => {
  if (!menuToggle || !mobileNav) return;
  mobileNav.classList.remove('is-open');
  document.body.classList.remove('is-menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
};

const closeSearchDrawer = () => {
  if (!searchToggle || !searchDrawer) return;
  searchDrawer.classList.remove('is-open');
  searchToggle.setAttribute('aria-expanded', 'false');
};

const cleanGarage = (garage = {}) => {
  const source = garage || {};
  return {
    year: String(source.year || '').trim(),
    make: String(source.make || '').trim(),
    model: String(source.model || '').trim(),
    chassis: String(source.chassis || '').trim(),
  };
};

const hasGarage = (garage) => Object.values(cleanGarage(garage)).some(Boolean);

const readGarage = () => {
  try {
    return cleanGarage(JSON.parse(window.localStorage.getItem(garageStorageKey)) || {});
  } catch (error) {
    return cleanGarage();
  }
};

const normalizeText = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const makeAliases = {
  bmw: ['bmw'],
  audi: ['audi'],
  volkswagen: ['volkswagen', 'vw'],
  'mercedes benz': ['mercedes benz', 'mercedes', 'benz'],
  porsche: ['porsche'],
  mini: ['mini'],
};

const formatGarageVehicle = (garage) => {
  const clean = cleanGarage(garage);
  if (clean.make && clean.chassis) return `${clean.make} ${clean.chassis}`;
  return [clean.year, clean.make, clean.model].filter(Boolean).join(' ') || clean.chassis;
};

function renderSavedVehicleChips(garage = readGarage()) {
  const clean = cleanGarage(garage);
  const label = hasGarage(clean) ? formatGarageVehicle(clean) : '';

  document.querySelectorAll('[data-vehicle-saved]').forEach((chip) => {
    const text = chip.querySelector('[data-vehicle-saved-text]');
    if (label && text) {
      text.textContent = label;
      chip.removeAttribute('hidden');
    } else {
      chip.setAttribute('hidden', '');
    }
  });
}

const replaceVehicleToken = (template, vehicle) => template.replace('[vehicle]', vehicle);

const sourceHasTerm = (source, term) => {
  const normalizedTerm = normalizeText(term);
  return normalizedTerm && ` ${source} `.includes(` ${normalizedTerm} `);
};

const sourceHasAnyTerm = (source, terms) => terms.some((term) => sourceHasTerm(source, term));

const getMakeTerms = (make) => makeAliases[normalizeText(make)] || [make];

const isUniversalFitment = (source) => [
  'universal',
  'all vehicles',
  'all makes',
  'universal fit',
  'universal fitment',
].some((term) => sourceHasTerm(source, term));

const updateFitmentBadges = (garage) => {
  const clean = cleanGarage(garage);
  const savedVehicle = hasGarage(clean);
  const vehicle = formatGarageVehicle(clean);

  document.querySelectorAll('[data-fitment-badge]').forEach((badge) => {
    const labelTarget = badge.querySelector('[data-fitment-badge-text]') || badge;
    const source = normalizeText(badge.dataset.fitmentText);
    const isUniversal = source && isUniversalFitment(source);
    const chassisMatch = clean.chassis && sourceHasTerm(source, clean.chassis);
    const modelMatch = clean.model && sourceHasTerm(source, clean.model);
    const makeMatch = clean.make && sourceHasAnyTerm(source, getMakeTerms(clean.make));
    const yearMatch = clean.year && sourceHasTerm(source, clean.year);
    const isFit = source && (chassisMatch || (makeMatch && (modelMatch || yearMatch)));
    const defaultLabel = badge.dataset.fitmentDefault || 'Check fitment';

    let label = defaultLabel;
    let state = 'empty';

    if (savedVehicle && isFit && vehicle) {
      label = replaceVehicleToken(badge.dataset.fitmentMatchTemplate || 'Fits your [vehicle]', vehicle);
      state = 'fit';
    } else if (savedVehicle && isUniversal) {
      label = badge.dataset.fitmentUniversal || 'Universal fit';
      state = 'fit';
    } else if (savedVehicle && vehicle) {
      label = replaceVehicleToken(badge.dataset.fitmentCheckTemplate || 'Check fitment for [vehicle]', vehicle);
      state = 'check';
    }

    labelTarget.textContent = label;
    badge.setAttribute('aria-label', label);
    badge.classList.toggle('is-fit', state === 'fit');
    badge.classList.toggle('is-check', state === 'check');
    badge.classList.toggle('is-empty', state === 'empty');
  });
};

const setGarageFormValues = (form, garage, force = false) => {
  const clean = cleanGarage(garage);
  const fieldNames = {
    year: 'vehicle_year',
    make: 'vehicle_make',
    model: 'vehicle_model',
    chassis: 'vehicle_chassis',
  };

  Object.entries(fieldNames).forEach(([key, name]) => {
    const field = form.querySelector(`[name="${name}"]`);
    if (field && (force || !field.value)) {
      field.value = clean[key];
    }
  });
};

const getGarageFromForm = (form) => cleanGarage({
  year: form.querySelector('[name="vehicle_year"]')?.value,
  make: form.querySelector('[name="vehicle_make"]')?.value,
  model: form.querySelector('[name="vehicle_model"]')?.value,
  chassis: form.querySelector('[name="vehicle_chassis"]')?.value,
});

const updateGarageUI = (garage) => {
  const clean = cleanGarage(garage);
  const savedVehicle = hasGarage(clean);
  const vehicle = formatGarageVehicle(clean);
  const garageTitle = garageDrawer?.querySelector('[data-garage-title]');
  const garageSummary = garageDrawer?.querySelector('[data-garage-summary]');
  const garageIndicator = garageToggle?.querySelector('[data-garage-indicator]');

  if (garageForm) {
    setGarageFormValues(garageForm, clean, true);
  }

  document.querySelectorAll('[data-garage-save]').forEach((form) => {
    setGarageFormValues(form, clean, !savedVehicle);
  });

  if (garageTitle) {
    garageTitle.textContent = savedVehicle && vehicle
      ? replaceVehicleToken(garageDrawer.dataset.garageSavedTitleTemplate || 'Your [vehicle]', vehicle)
      : garageDrawer.dataset.garageEmptyTitle || 'No vehicle saved';
  }

  if (garageSummary) {
    garageSummary.textContent = savedVehicle
      ? garageDrawer.dataset.garageSavedSummary || 'Fitment badges are using this saved vehicle.'
      : garageDrawer.dataset.garageEmptySummary || 'Save your vehicle to check product fitment across the shop.';
  }

  garageToggle?.classList.toggle('has-garage', savedVehicle);
  if (garageIndicator) {
    garageIndicator.hidden = !savedVehicle;
  }

  updateFitmentBadges(clean);
  renderSavedVehicleChips(clean);
};

const writeGarage = (garage) => {
  const clean = cleanGarage(garage);

  try {
    if (hasGarage(clean)) {
      window.localStorage.setItem(garageStorageKey, JSON.stringify(clean));
    } else {
      window.localStorage.removeItem(garageStorageKey);
    }
  } catch (error) {
    // Browsers can disable localStorage; the page still updates for this visit.
  }

  updateGarageUI(clean);
};

const closeGarageDrawer = () => {
  if (!garageToggle || !garageDrawer) return;
  garageDrawer.classList.remove('is-open');
  garageToggle.setAttribute('aria-expanded', 'false');
};

const openGarageDrawer = () => {
  if (!garageToggle || !garageDrawer) return;
  garageDrawer.classList.add('is-open');
  garageToggle.setAttribute('aria-expanded', 'true');
  closeMobileMenu();
  closeSearchDrawer();
  garageDrawer.querySelector('[data-garage-input]')?.focus();
};

if (garageToggle && garageDrawer) {
  garageToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = garageDrawer.classList.toggle('is-open');
    garageToggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      closeMobileMenu();
      closeSearchDrawer();
      garageDrawer.querySelector('[data-garage-input]')?.focus();
    }
  });

  garageDrawer.querySelector('[data-garage-close]')?.addEventListener('click', closeGarageDrawer);

  garageForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    writeGarage(getGarageFromForm(garageForm));
    closeGarageDrawer();
  });

  garageDrawer.querySelector('[data-garage-clear]')?.addEventListener('click', () => {
    writeGarage(cleanGarage());
  });

  document.querySelectorAll('[data-garage-open]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openGarageDrawer();
    });
  });

  document.addEventListener('click', (event) => {
    if (!garageDrawer.classList.contains('is-open')) return;
    if (garageDrawer.contains(event.target) || garageToggle.contains(event.target)) return;
    closeGarageDrawer();
  });
}

updateGarageUI(readGarage());

if (searchToggle && searchDrawer) {
  searchToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = searchDrawer.classList.toggle('is-open');
    searchToggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) closeMobileMenu();
    if (isOpen) closeGarageDrawer();
    if (isOpen) {
      searchDrawer.querySelector('input[type="search"]')?.focus();
    }
  });

  document.addEventListener('click', (evt) => {
    if (!searchDrawer.classList.contains('is-open')) return;
    if (searchDrawer.contains(evt.target) || searchToggle.contains(evt.target)) return;
    closeSearchDrawer();
  });

  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape' && searchDrawer.classList.contains('is-open')) {
      closeSearchDrawer();
      searchToggle.focus();
    }
  });
}

if (menuToggle && mobileNav) {
  menuToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = mobileNav.classList.toggle('is-open');
    document.body.classList.toggle('is-menu-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) closeSearchDrawer();
    if (isOpen) closeGarageDrawer();
  });

  mobileNav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      closeMobileMenu();
    }
  });

  document.addEventListener('click', (event) => {
    if (!mobileNav.classList.contains('is-open')) return;
    if (mobileNav.contains(event.target) || menuToggle.contains(event.target)) return;
    closeMobileMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMobileMenu();
      closeSearchDrawer();
      closeGarageDrawer();
    }
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 991px)').matches) {
      closeMobileMenu();
    }
  });
}

document.querySelectorAll('[data-gallery-thumb]').forEach((thumbButton) => {
  thumbButton.addEventListener('click', () => {
    const gallery = thumbButton.closest('.product-gallery');
    const target = gallery?.querySelector('[data-gallery-main]') || document.querySelector('[data-gallery-main]');
    if (!target) return;

    const nextSrc = thumbButton.dataset.galleryThumbSrc;
    if (!nextSrc) return;

    target.srcset = thumbButton.dataset.galleryThumbSrcset || '';
    target.src = nextSrc;
    target.alt = thumbButton.dataset.galleryThumbAlt || '';

    if (thumbButton.dataset.galleryThumbWidth) {
      target.width = Number(thumbButton.dataset.galleryThumbWidth);
    }
    if (thumbButton.dataset.galleryThumbHeight) {
      target.height = Number(thumbButton.dataset.galleryThumbHeight);
    }

    gallery?.querySelectorAll('[data-gallery-thumb]').forEach((button) => {
      const isActive = button === thumbButton;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-current', String(isActive));
    });
  });
});

document.querySelectorAll('[data-vehicle-finder]').forEach((form) => {
  form.addEventListener('submit', () => {
    if (form.hasAttribute('data-garage-save')) {
      writeGarage(getGarageFromForm(form));
    }

    const query = form.querySelector('input[name="q"]');
    const payload = {};
    Array.from(form.querySelectorAll('input, select')).forEach((field) => {
      if (['q', 'type'].includes(field.name)) return;
      payload[field.name] = field.value.trim();
    });
    if (query) {
      const values = Object.entries(payload)
        .filter(([key]) => key !== 'part_type' || payload[key])
        .map(([, v]) => v)
        .filter(Boolean);
      query.value = values.join(' ');
    }
  });
});

document.querySelectorAll('[data-vehicle-clear]').forEach((btn) => {
  btn.addEventListener('click', () => {
    writeGarage(cleanGarage());
    document.querySelectorAll('[data-vehicle-finder]').forEach((form) => {
      form.querySelectorAll('input, select').forEach((field) => {
        if (['q', 'type'].includes(field.name)) return;
        field.value = '';
      });
    });
    renderSavedVehicleChips();
  });
});

renderSavedVehicleChips();

document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
  dropdown.addEventListener('mouseleave', () => {
    if (window.matchMedia('(min-width: 991px)').matches) {
      dropdown.removeAttribute('open');
    }
  });
});

const cartDrawer = document.querySelector('[data-cart-drawer]');
const cartDrawerBody = document.querySelector('[data-cart-drawer-body]');
const cartCountEls = document.querySelectorAll('[data-cart-count]');

function openCartDrawer() {
  if (!cartDrawer) return;
  cartDrawer.classList.add('is-open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-cart-open');
  document.querySelectorAll('[data-cart-drawer-open]').forEach((el) => el.setAttribute('aria-expanded', 'true'));
}

function closeCartDrawer() {
  if (!cartDrawer) return;
  cartDrawer.classList.remove('is-open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-cart-open');
  document.querySelectorAll('[data-cart-drawer-open]').forEach((el) => el.setAttribute('aria-expanded', 'false'));
}

function updateCartCount(count) {
  cartCountEls.forEach((el) => {
    el.textContent = String(count);
    if (count > 0) el.removeAttribute('hidden');
    else el.setAttribute('hidden', '');
  });
}

function formatMoney(cents) {
  return '$' + (cents / 100).toFixed(2);
}

function renderCartDrawer(cart) {
  if (!cartDrawerBody) return;
  updateCartCount(cart.item_count);

  if (cart.item_count === 0) {
    cartDrawerBody.innerHTML = `
      <div class="empty-state cart-drawer__empty">
        <p>Your cart is ready for its first upgrade.</p>
        <a class="button" href="/collections/all" data-cart-drawer-close>Continue shopping</a>
      </div>`;
    const footer = cartDrawer.querySelector('.cart-drawer__footer');
    if (footer) footer.remove();
    return;
  }

  const itemsHtml = cart.items.map((item, i) => `
    <li class="cart-drawer__item" data-cart-line="${i + 1}" data-key="${item.key}">
      ${item.image ? `<a href="${item.url}" class="cart-drawer__thumb"><img src="${item.image}" loading="lazy" alt=""></a>` : ''}
      <div class="cart-drawer__details">
        <a class="cart-drawer__title" href="${item.url}">${item.product_title}</a>
        ${item.variant_title && item.variant_title !== 'Default Title' ? `<p class="cart-drawer__variant">${item.variant_title}</p>` : ''}
        <div class="cart-drawer__line-row">
          <div class="cart-drawer__qty">
            <button type="button" data-cart-qty-decrement aria-label="Decrease quantity">&minus;</button>
            <input type="number" min="0" value="${item.quantity}" data-cart-qty-input aria-label="Quantity">
            <button type="button" data-cart-qty-increment aria-label="Increase quantity">+</button>
          </div>
          <span class="cart-drawer__line-price">${formatMoney(item.final_line_price)}</span>
        </div>
        <button class="cart-drawer__remove eyebrow" type="button" data-cart-remove>Remove</button>
      </div>
    </li>`).join('');

  cartDrawerBody.innerHTML = `<ul class="cart-drawer__items">${itemsHtml}</ul>`;

  let footer = cartDrawer.querySelector('.cart-drawer__footer');
  const footerHtml = `
    <div class="cart-drawer__subtotal">
      <span class="eyebrow">Subtotal</span>
      <strong>${formatMoney(cart.total_price)}</strong>
    </div>
    <a class="button button--secondary" href="/cart">View cart</a>
    <a class="button" href="/cart/checkout">Checkout</a>`;
  if (!footer) {
    footer = document.createElement('footer');
    footer.className = 'cart-drawer__footer';
    cartDrawer.querySelector('.cart-drawer__panel').appendChild(footer);
  }
  footer.innerHTML = footerHtml;
}

async function refreshCart() {
  try {
    const res = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
    if (!res.ok) return;
    const cart = await res.json();
    renderCartDrawer(cart);
  } catch (e) {
    /* network error - leave drawer state alone */
  }
}

async function changeCartLine(key, quantity) {
  try {
    const res = await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: key, quantity }),
    });
    if (!res.ok) return;
    const cart = await res.json();
    renderCartDrawer(cart);
  } catch (e) {
    /* swallow */
  }
}

if (cartDrawer) {
  document.querySelectorAll('[data-cart-drawer-open]').forEach((el) => {
    el.addEventListener('click', (evt) => {
      evt.preventDefault();
      openCartDrawer();
      refreshCart();
    });
  });

  cartDrawer.addEventListener('click', (evt) => {
    const target = evt.target;
    if (target.closest('[data-cart-drawer-close]')) {
      evt.preventDefault();
      closeCartDrawer();
      return;
    }
    const line = target.closest('[data-cart-line]');
    if (!line) return;
    const key = line.dataset.key;
    const input = line.querySelector('[data-cart-qty-input]');
    if (target.closest('[data-cart-remove]')) {
      changeCartLine(key, 0);
    } else if (target.closest('[data-cart-qty-decrement]')) {
      changeCartLine(key, Math.max(0, parseInt(input.value, 10) - 1));
    } else if (target.closest('[data-cart-qty-increment]')) {
      changeCartLine(key, parseInt(input.value, 10) + 1);
    }
  });

  cartDrawer.addEventListener('change', (evt) => {
    const input = evt.target.closest('[data-cart-qty-input]');
    if (!input) return;
    const line = input.closest('[data-cart-line]');
    if (!line) return;
    changeCartLine(line.dataset.key, Math.max(0, parseInt(input.value, 10) || 0));
  });

  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape' && cartDrawer.classList.contains('is-open')) closeCartDrawer();
  });

  document.addEventListener('submit', async (evt) => {
    const form = evt.target.closest('form[action$="/cart/add"], form[action*="/cart/add"]');
    if (!form) return;
    evt.preventDefault();
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.setAttribute('disabled', '');
    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (res.ok) {
        await refreshCart();
        openCartDrawer();
      } else {
        form.submit();
      }
    } catch (e) {
      form.submit();
    } finally {
      if (submitBtn) submitBtn.removeAttribute('disabled');
    }
  });
}

const stickyHeader = document.querySelector('.site-header--sticky');
if (stickyHeader) {
  const toggleHeaderShrink = () => {
    stickyHeader.classList.toggle('is-scrolled', window.scrollY > 60);
  };
  toggleHeaderShrink();
  window.addEventListener('scroll', toggleHeaderShrink, { passive: true });
}

const backToTop = document.querySelector('[data-back-to-top]');
if (backToTop) {
  const toggleBackToTop = () => {
    backToTop.classList.toggle('is-visible', window.scrollY > 640);
  };

  toggleBackToTop();
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
// sticky atc bar
const stickyAtc = document.getElementById('sticky-atc');
const mainAtcBtn = document.querySelector('[data-atc-main]');

if (stickyAtc && mainAtcBtn) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      stickyAtc.classList.toggle('is-visible', !entry.isIntersecting);
      stickyAtc.setAttribute('aria-hidden', String(entry.isIntersecting));
    },
    { threshold: 0, rootMargin: '-92px 0px 0px 0px' } // offset for sticky header height
  );
  observer.observe(mainAtcBtn);

  // wire the sticky btn to submit the main product form
  document.getElementById('sticky-atc-btn')?.addEventListener('click', () => {
    document.querySelector('[data-product-form]')?.requestSubmit();
  });
}
