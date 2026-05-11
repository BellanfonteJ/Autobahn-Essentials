document.documentElement.classList.remove('no-js');

const searchToggle = document.querySelector('[data-search-toggle]');
const searchDrawer = document.querySelector('[data-search-drawer]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const mobileNav = document.querySelector('[data-mobile-nav]');

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

if (searchToggle && searchDrawer) {
  searchToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = searchDrawer.classList.toggle('is-open');
    searchToggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) closeMobileMenu();
    if (isOpen) {
      searchDrawer.querySelector('input[type="search"]')?.focus();
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
    }
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 991px)').matches) {
      closeMobileMenu();
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

document.querySelectorAll('[data-vehicle-finder]').forEach((form) => {
  form.addEventListener('submit', () => {
    const query = form.querySelector('input[name="q"]');
    if (!query) return;
    const values = Array.from(form.querySelectorAll('input, select'))
      .filter((field) => !['q', 'type'].includes(field.name))
      .map((field) => field.value.trim())
      .filter(Boolean);
    query.value = values.join(' ');
  });
});

document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
  dropdown.addEventListener('mouseleave', () => {
    if (window.matchMedia('(min-width: 991px)').matches) {
      dropdown.removeAttribute('open');
    }
  });
});

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
