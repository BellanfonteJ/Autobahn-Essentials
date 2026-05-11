document.documentElement.classList.remove('no-js');

const searchToggle = document.querySelector('[data-search-toggle]');
const searchDrawer = document.querySelector('[data-search-drawer]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const mobileNav = document.querySelector('[data-mobile-nav]');

if (searchToggle && searchDrawer) {
  function closeSearchDrawer() {
    searchDrawer.classList.remove('is-open');
    searchToggle.setAttribute('aria-expanded', 'false');
  }

  searchToggle.addEventListener('click', () => {
    const isOpen = searchDrawer.classList.toggle('is-open');
    searchToggle.setAttribute('aria-expanded', String(isOpen));
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
  function closeMobileNav() {
    mobileNav.classList.remove('is-open');
    document.body.classList.remove('is-menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  menuToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('is-open');
    document.body.classList.toggle('is-menu-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mobileNav.addEventListener('click', (evt) => {
    const link = evt.target.closest('a');
    if (link && window.matchMedia('(max-width: 990px)').matches) closeMobileNav();
  });

  document.addEventListener('click', (evt) => {
    if (!mobileNav.classList.contains('is-open')) return;
    if (mobileNav.contains(evt.target) || menuToggle.contains(evt.target)) return;
    closeMobileNav();
  });

  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape' && mobileNav.classList.contains('is-open')) {
      closeMobileNav();
      menuToggle.focus();
    }
  });
}

document.querySelectorAll('[data-gallery-thumb]').forEach((thumb) => {
  thumb.addEventListener('click', () => {
    const target = document.querySelector('[data-gallery-main]');
    if (!target) return;
    target.src = thumb.dataset.galleryThumb;
    target.alt = thumb.alt;
  });
});

const VEHICLE_STORAGE_KEY = 'ae:vehicle';

function readSavedVehicle() {
  try {
    const raw = localStorage.getItem(VEHICLE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeSavedVehicle(data) {
  try {
    localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    /* private mode etc — fail silently */
  }
}

function clearSavedVehicle() {
  try {
    localStorage.removeItem(VEHICLE_STORAGE_KEY);
  } catch (e) {
    /* ignore */
  }
}

function vehicleLabel(v) {
  return [v.vehicle_year, v.vehicle_make, v.vehicle_model].map((x) => (x || '').trim()).filter(Boolean).join(' ');
}

function renderSavedVehicleChips() {
  const saved = readSavedVehicle();
  document.querySelectorAll('[data-vehicle-saved]').forEach((chip) => {
    const label = saved ? vehicleLabel(saved) : '';
    if (saved && label) {
      chip.querySelector('[data-vehicle-saved-text]').textContent = label;
      chip.removeAttribute('hidden');
    } else {
      chip.setAttribute('hidden', '');
    }
  });
}

function prefillVehicleForms() {
  const saved = readSavedVehicle();
  if (!saved) return;
  document.querySelectorAll('[data-vehicle-finder]').forEach((form) => {
    ['vehicle_year', 'vehicle_make', 'vehicle_model', 'part_type'].forEach((name) => {
      const field = form.querySelector(`[name="${name}"]`);
      if (field && saved[name]) field.value = saved[name];
    });
  });
}

document.querySelectorAll('[data-vehicle-finder]').forEach((form) => {
  form.addEventListener('submit', () => {
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
    if (payload.vehicle_year || payload.vehicle_make || payload.vehicle_model) {
      writeSavedVehicle(payload);
    }
  });
});

document.querySelectorAll('[data-vehicle-clear]').forEach((btn) => {
  btn.addEventListener('click', () => {
    clearSavedVehicle();
    document.querySelectorAll('[data-vehicle-finder]').forEach((form) => {
      form.querySelectorAll('input, select').forEach((field) => {
        if (['q', 'type'].includes(field.name)) return;
        field.value = '';
      });
    });
    renderSavedVehicleChips();
  });
});

prefillVehicleForms();
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
    /* network error — leave drawer state alone */
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
