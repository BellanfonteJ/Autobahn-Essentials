document.documentElement.classList.remove('no-js');

const themeConfig = JSON.parse(document.querySelector('[data-theme-config]')?.textContent || '{}');
const themeMessages = themeConfig.messages || {};
const reportHealth = (code) => {
  try { window.AEHealth?.report(code); } catch { /* Diagnostics cannot interrupt shopping. */ }
};
const themeRoute = (path) => `${themeConfig.root || window.Shopify?.routes?.root || '/'}${path}`;
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

let activeModal = null;
let modalReturnFocus = null;

const focusableElements = (element) => Array.from(element.querySelectorAll(
  'a[href], button, input, select, textarea, [tabindex="0"]',
)).filter((target) => target.tabIndex >= 0 && !target.disabled && !target.closest('[hidden], [inert]') && target.getClientRects().length);

const openModal = (element, focusTarget) => {
  if (activeModal && activeModal !== element) {
    activeModal.dispatchEvent(new CustomEvent('ae:close-modal'));
  }
  if (activeModal !== element) modalReturnFocus = document.activeElement;
  activeModal = element;
  element.inert = false;
  element.setAttribute('aria-hidden', 'false');
  (focusTarget || focusableElements(element)[0])?.focus();
};

const closeModal = (element) => {
  element.setAttribute('aria-hidden', 'true');
  element.inert = true;
  if (activeModal !== element) return;
  activeModal = null;
  modalReturnFocus?.focus();
  modalReturnFocus = null;
};

document.addEventListener('keydown', (event) => {
  const dialog = activeModal || (mobileNav?.classList.contains('is-open') ? mobileNav : null);
  if (!dialog) return;
  if (event.key === 'Escape' && activeModal) {
    event.preventDefault();
    event.stopImmediatePropagation();
    activeModal.dispatchEvent(new CustomEvent('ae:close-modal'));
    return;
  }
  if (event.key !== 'Tab') return;
  const targets = activeModal ? focusableElements(dialog) : [menuToggle, ...focusableElements(dialog)];
  const first = targets[0];
  const last = targets[targets.length - 1];
  if (!first) {
    event.preventDefault();
    return;
  }
  if (!targets.includes(document.activeElement) || (event.shiftKey && document.activeElement === first)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

document.addEventListener('ae:open-modal', (event) => openModal(event.target));
document.addEventListener('ae:modal-closed', (event) => closeModal(event.target));
document.querySelectorAll('[role="dialog"][aria-hidden="false"]').forEach((dialog) => openModal(dialog));

const searchToggle = document.querySelector('[data-search-toggle]');
const searchDrawer = document.querySelector('[data-search-drawer]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const mobileNav = document.querySelector('[data-mobile-nav]');
const garageToggle = document.querySelector('[data-garage-toggle]');
const garageDrawer = document.querySelector('[data-garage-drawer]');

const initScrollReveal = () => {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealSelectors = [
    '.section-heading',
    '.collection-card',
    '.product-card',
    '.promo-tile',
    '.build-card',
    '.ae-build-card',
    '.ae-page-card',
    '.ae-card',
    '.ae-blog-post',
    '.spec-item',
    '.feature-list__item',
  ];
  const selector = revealSelectors.join(',');
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      target.classList.add('is-scroll-revealed');
      observer.unobserve(target);
    });
  }, { rootMargin: '0px 0px 72px 0px', threshold: 0.05 }) : null;

  const register = (scope) => {
    const items = Array.from(scope.querySelectorAll(selector));
    if (scope.matches?.(selector)) items.unshift(scope);
    items.forEach((element) => {
      if (element.classList.contains('scroll-reveal') || !element.closest('.main-content') ||
          element.closest('.product-info, .product-gallery, [role="dialog"]')) return;
      const siblings = Array.from(element.parentElement.children).filter((child) => child.matches(selector));
      element.style.setProperty('--scroll-reveal-delay', `${Math.min(siblings.indexOf(element), 4) * 40}ms`);
      element.classList.add('scroll-reveal');

      // Above-the-fold content stays immediate; only upcoming content gets an entrance.
      if (motionPreference.matches || !observer || element.getBoundingClientRect().top < window.innerHeight) {
        element.classList.add('is-scroll-revealed', 'is-motion-complete');
      } else {
        observer.observe(element);
      }
    });
  };

  document.addEventListener('animationend', (event) => {
    if (event.animationName === 'ae-content-enter') event.target.classList.add('is-motion-complete');
  });
  document.addEventListener('focusin', (event) => {
    const item = event.target.closest('.scroll-reveal');
    if (!item) return;
    observer?.unobserve(item);
    item.classList.add('is-scroll-revealed', 'is-motion-complete');
  });
  motionPreference.addEventListener('change', () => {
    if (!motionPreference.matches) return;
    observer?.disconnect();
    document.querySelectorAll('.scroll-reveal').forEach((element) => {
      element.classList.add('is-scroll-revealed', 'is-motion-complete');
    });
  });
  document.addEventListener('shopify:section:load', (event) => register(event.target));
  document.addEventListener('ae:content-loaded', (event) => {
    if (event.detail?.scope instanceof Element) register(event.detail.scope);
  });
  document.addEventListener('shopify:section:unload', (event) => {
    event.target.querySelectorAll('.scroll-reveal').forEach((element) => observer?.unobserve(element));
    if (event.target.matches('.scroll-reveal')) observer?.unobserve(event.target);
  });
  register(document);
};

const initHeroTypewriterSequence = () => {
  const typewriters = Array.from(document.querySelectorAll('[data-hero-typewriter]'));
  if (!typewriters.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const typeDelay = 72;
  const eraseDelay = 36;
  const phraseHoldDuration = 3400;

  const wait = (duration) => new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });

  const parseSequence = (value) => String(value || '')
    .split(';')
    .map((phrase) => {
      const [base = '', accent = ''] = phrase.split('|');
      return {
        base: base.trim(),
        accent: accent.trim(),
      };
    })
    .filter((phrase) => phrase.base && phrase.accent);

  const typeText = async (element, text) => {
    for (let index = 1; index <= text.length; index += 1) {
      element.textContent = text.slice(0, index);
      await wait(typeDelay);
    }
  };

  const eraseText = async (element) => {
    const text = element.textContent || '';
    for (let index = text.length - 1; index >= 0; index -= 1) {
      element.textContent = text.slice(0, index);
      await wait(eraseDelay);
    }
  };

  const fadePeriod = async (periodElement, keepFading = false) => {
    periodElement.classList.remove('is-fading');
    void periodElement.offsetWidth;
    periodElement.classList.add('is-visible', 'is-fading');
    if (keepFading) return;
    await wait(phraseHoldDuration);
    periodElement.classList.remove('is-fading');
  };

  typewriters.forEach(async (typewriter) => {
    const sequence = parseSequence(typewriter.dataset.heroTypewriterSequence);
    const baseElement = typewriter.querySelector('[data-hero-typewriter-base]');
    const accentElement = typewriter.querySelector('[data-hero-typewriter-accent]');
    const periodElement = typewriter.querySelector('[data-hero-typewriter-period]');
    const finalPhrase = sequence[sequence.length - 1];

    if (!sequence.length || !baseElement || !accentElement || !periodElement) return;

    const reserves = typewriter.querySelectorAll('.hero-typewriter__reserve');
    const fitHeading = () => {
      typewriter.style.fontSize = '';
      reserves.forEach((reserve, index) => {
        let widestText = '';
        let widestWidth = 0;
        sequence.forEach((phrase) => {
          const text = index === 0 ? phrase.base : `${phrase.accent}.`;
          reserve.textContent = text;
          const width = reserve.getBoundingClientRect().width;
          if (width > widestWidth) { widestWidth = width; widestText = text; }
        });
        reserve.textContent = widestText;
      });
      const width = Math.max(...Array.from(reserves, (reserve) => reserve.parentElement.getBoundingClientRect().width));
      const available = typewriter.clientWidth;
      if (width > available) {
        typewriter.style.fontSize = `${Math.floor(parseFloat(getComputedStyle(typewriter).fontSize) * available / width) - 1}px`;
      }
    };
    fitHeading();
    document.fonts?.ready.then(fitHeading);
    window.addEventListener('resize', fitHeading);

    if (reducedMotion) {
      baseElement.textContent = finalPhrase.base;
      accentElement.textContent = finalPhrase.accent;
      periodElement.textContent = '.';
      periodElement.classList.add('is-visible');
      return;
    }

    baseElement.textContent = '';
    accentElement.textContent = '';
    periodElement.textContent = '';
    for (let index = 0; index < sequence.length; index += 1) {
      const phrase = sequence[index];
      const isFinalPhrase = index === sequence.length - 1;

      await typeText(baseElement, phrase.base);
      await typeText(accentElement, phrase.accent);
      periodElement.textContent = '.';
      await wait(typeDelay);

      if (isFinalPhrase) {
        await fadePeriod(periodElement, true);
        return;
      }

      await fadePeriod(periodElement);
      periodElement.classList.remove('is-visible');
      periodElement.textContent = '';
      await wait(eraseDelay);
      await eraseText(accentElement);
      await eraseText(baseElement);
      await wait(typeDelay * 2);
    }
  });
};

const closeMobileMenu = () => {
  if (!menuToggle || !mobileNav) return;
  mobileNav.classList.remove('is-open');
  document.body.classList.remove('is-menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  if (mobileNav.contains(document.activeElement)) menuToggle.focus();
};

const closeSearchDrawer = () => {
  if (!searchToggle || !searchDrawer) return;
  searchDrawer.classList.remove('is-open');
  searchToggle.setAttribute('aria-expanded', 'false');
  if (searchDrawer.contains(document.activeElement)) searchToggle.focus();
};

const closeGarageDrawer = () => window.AEGarage?.close();
document.addEventListener('ae:garage-open', () => {
  closeMobileMenu();
  closeSearchDrawer();
});

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
    if (isOpen) focusableElements(mobileNav)[0]?.focus();
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
      const wasOpen = mobileNav.classList.contains('is-open');
      closeMobileMenu();
      closeSearchDrawer();
      closeGarageDrawer();
      if (wasOpen) menuToggle.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 991px)').matches) {
      closeMobileMenu();
    }
  });
}

function getRenderedImageRect(image) {
  const rect = image.getBoundingClientRect();
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;

  if (!naturalWidth || !naturalHeight || !rect.width || !rect.height) {
    return rect;
  }

  const naturalRatio = naturalWidth / naturalHeight;
  const boxRatio = rect.width / rect.height;

  if (naturalRatio > boxRatio) {
    const height = rect.width / naturalRatio;
    return {
      top: rect.top + (rect.height - height) / 2,
      right: rect.right,
      bottom: rect.top + (rect.height + height) / 2,
      left: rect.left,
      width: rect.width,
      height,
    };
  }

  const width = rect.height * naturalRatio;
  return {
    top: rect.top,
    right: rect.left + (rect.width + width) / 2,
    bottom: rect.bottom,
    left: rect.left + (rect.width - width) / 2,
    width,
    height: rect.height,
  };
}

document.querySelectorAll('.product-gallery').forEach((gallery) => {
  const main = gallery.querySelector('.product-gallery__main');
  const target = gallery.querySelector('[data-gallery-main]');
  const magnifier = gallery.querySelector('[data-gallery-magnifier]');
  const cursorDot = gallery.querySelector('[data-gallery-cursor-dot]');
  const openButton = gallery.querySelector('[data-gallery-open]');
  const lightbox = gallery.querySelector('[data-gallery-lightbox]');
  const lightboxImage = gallery.querySelector('[data-gallery-lightbox-image]');
  const lightboxCloseButtons = gallery.querySelectorAll('[data-gallery-lightbox-close]');
  const lightboxPrev = gallery.querySelector('[data-gallery-lightbox-prev]');
  const lightboxNext = gallery.querySelector('[data-gallery-lightbox-next]');
  const lightboxCurrent = gallery.querySelector('[data-gallery-lightbox-current]');
  const lightboxTotal = gallery.querySelector('[data-gallery-lightbox-total]');
  const lightboxStage = gallery.querySelector('[data-gallery-lightbox-stage]');
  const hoverZoomQuery = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 990px)');

  if (!main || !target) return;

  const getGalleryItems = () => {
    const thumbs = Array.from(gallery.querySelectorAll('[data-gallery-thumb]'));
    if (thumbs.length) {
      return thumbs.map((button) => ({
        src: button.dataset.galleryLightboxSrc || button.dataset.galleryThumbSrc,
        previewSrc: button.dataset.galleryThumbSrc,
        srcset: button.dataset.galleryThumbSrcset || '',
        alt: button.dataset.galleryThumbAlt || '',
        width: Number(button.dataset.galleryThumbWidth) || undefined,
        height: Number(button.dataset.galleryThumbHeight) || undefined,
        thumb: button,
      })).filter((item) => item.src);
    }

    return [{
      src: target.dataset.galleryLightboxSrc || target.currentSrc || target.src,
      previewSrc: target.currentSrc || target.src,
      srcset: target.srcset || '',
      alt: target.alt || '',
      width: target.width,
      height: target.height,
      thumb: null,
    }].filter((item) => item.src);
  };

  let galleryItems = getGalleryItems();
  let activeIndex = Math.max(0, galleryItems.findIndex((item) => item.thumb?.classList.contains('is-active')));
  let swipeStartX = null;

  const updateMagnifierImage = () => {
    if (!magnifier) return;
    const imageUrl = target.currentSrc || target.src;
    if (imageUrl) {
      magnifier.style.setProperty('--magnifier-image', `url("${imageUrl}")`);
    }
  };

  const updateLightbox = (nextIndex = activeIndex) => {
    if (!lightbox || !lightboxImage || !galleryItems.length) return;
    activeIndex = (nextIndex + galleryItems.length) % galleryItems.length;
    const item = galleryItems[activeIndex];

    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
    if (item.width) lightboxImage.width = item.width;
    if (item.height) lightboxImage.height = item.height;
    if (lightboxCurrent) lightboxCurrent.textContent = String(activeIndex + 1);
    if (lightboxTotal) lightboxTotal.textContent = String(galleryItems.length);
    if (lightboxPrev) lightboxPrev.hidden = galleryItems.length < 2;
    if (lightboxNext) lightboxNext.hidden = galleryItems.length < 2;
  };

  const openLightbox = () => {
    if (!lightbox || !lightboxImage) return;
    galleryItems = getGalleryItems();
    const currentThumbIndex = galleryItems.findIndex((item) => item.thumb?.classList.contains('is-active'));
    activeIndex = currentThumbIndex >= 0 ? currentThumbIndex : activeIndex;
    updateLightbox(activeIndex);
    lightbox.classList.add('is-open');
    document.body.classList.add('is-gallery-lightbox-open');
    openModal(lightbox, lightbox.querySelector('.product-gallery-lightbox__close'));
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    document.body.classList.remove('is-gallery-lightbox-open');
    closeModal(lightbox);
  };

  const showPreviousImage = () => updateLightbox(activeIndex - 1);
  const showNextImage = () => updateLightbox(activeIndex + 1);

  const hideMagnifier = () => {
    main.classList.remove('is-magnifying');
    main.classList.remove('is-cursor-dot-active');
  };

  const moveMagnifier = (event) => {
    if (!magnifier || !cursorDot || !hoverZoomQuery.matches) {
      hideMagnifier();
      return;
    }

    const imageRect = getRenderedImageRect(target);
    const isInsideImage =
      event.clientX >= imageRect.left &&
      event.clientX <= imageRect.right &&
      event.clientY >= imageRect.top &&
      event.clientY <= imageRect.bottom;

    if (!isInsideImage) {
      hideMagnifier();
      return;
    }

    const mainRect = main.getBoundingClientRect();
    const x = event.clientX - mainRect.left;
    const y = event.clientY - mainRect.top;
    const cursorImageX = event.clientX - imageRect.left;
    const cursorImageY = event.clientY - imageRect.top;
    const zoom = Number.parseFloat(getComputedStyle(main).getPropertyValue('--magnifier-zoom')) || 2.3;
    const lensRadius = magnifier.clientWidth / 2;
    const backgroundX = lensRadius - cursorImageX * zoom;
    const backgroundY = lensRadius - cursorImageY * zoom;

    magnifier.style.setProperty('--magnifier-x', `${x}px`);
    magnifier.style.setProperty('--magnifier-y', `${y}px`);
    magnifier.style.setProperty('--magnifier-bg-size', `${imageRect.width * zoom}px ${imageRect.height * zoom}px`);
    magnifier.style.setProperty('--magnifier-bg-position', `${backgroundX}px ${backgroundY}px`);
    cursorDot.style.setProperty('--cursor-dot-x', `${x}px`);
    cursorDot.style.setProperty('--cursor-dot-y', `${y}px`);
    updateMagnifierImage();
    main.classList.add('is-magnifying');
    main.classList.add('is-cursor-dot-active');
  };

  main.addEventListener('pointermove', moveMagnifier);
  main.addEventListener('pointerleave', hideMagnifier);
  hoverZoomQuery.addEventListener('change', hideMagnifier);
  target.addEventListener('load', updateMagnifierImage);
  updateMagnifierImage();

  openButton?.addEventListener('click', openLightbox);
  lightbox?.addEventListener('ae:close-modal', closeLightbox);
  lightboxCloseButtons.forEach((button) => button.addEventListener('click', closeLightbox));
  lightboxPrev?.addEventListener('click', showPreviousImage);
  lightboxNext?.addEventListener('click', showNextImage);

  lightboxStage?.addEventListener('pointerdown', (event) => {
    swipeStartX = event.clientX;
  });

  lightboxStage?.addEventListener('pointerup', (event) => {
    if (swipeStartX === null) return;
    const swipeDistance = event.clientX - swipeStartX;
    swipeStartX = null;
    if (Math.abs(swipeDistance) < 48 || galleryItems.length < 2) return;
    if (swipeDistance > 0) {
      showPreviousImage();
    } else {
      showNextImage();
    }
  });
  lightboxStage?.addEventListener('pointercancel', () => { swipeStartX = null; });

  document.addEventListener('keydown', (event) => {
    if (!lightbox?.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeLightbox();
    }
    if (event.key === 'ArrowLeft' && galleryItems.length > 1) {
      event.preventDefault();
      showPreviousImage();
    }
    if (event.key === 'ArrowRight' && galleryItems.length > 1) {
      event.preventDefault();
      showNextImage();
    }
  });

  gallery.querySelectorAll('[data-gallery-thumb]').forEach((thumbButton) => {
    thumbButton.addEventListener('click', () => {
      const nextSrc = thumbButton.dataset.galleryThumbSrc;
      if (!nextSrc) return;

      hideMagnifier();
      target.dataset.galleryLightboxSrc = thumbButton.dataset.galleryLightboxSrc || nextSrc;
      target.srcset = thumbButton.dataset.galleryThumbSrcset || '';
      target.src = nextSrc;
      target.alt = thumbButton.dataset.galleryThumbAlt || '';

      if (thumbButton.dataset.galleryThumbWidth) {
        target.width = Number(thumbButton.dataset.galleryThumbWidth);
      }
      if (thumbButton.dataset.galleryThumbHeight) {
        target.height = Number(thumbButton.dataset.galleryThumbHeight);
      }

      gallery.querySelectorAll('[data-gallery-thumb]').forEach((button) => {
        const isActive = button === thumbButton;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-current', String(isActive));
      });

      const nextIndex = galleryItems.findIndex((item) => item.thumb === thumbButton);
      if (nextIndex >= 0) activeIndex = nextIndex;
      if (lightbox?.classList.contains('is-open')) updateLightbox(activeIndex);
      requestAnimationFrame(updateMagnifierImage);
    });
  });
});

document.querySelectorAll('[data-product-info]').forEach((info) => {
  const form = info.querySelector('[data-product-form]');
  const select = form?.querySelector('select[name="id"]');
  const variantData = info.querySelector('[data-product-variants]');
  if (!select || !variantData) return;
  const variants = JSON.parse(variantData.content.textContent);

  select.addEventListener('change', () => {
    const variant = variants.find((item) => String(item.id) === select.value);
    if (!variant) return;
    form.dataset.variantAvailable = String(variant.available);
    info.querySelector('[data-product-price]').innerHTML = variant.priceHTML;
    const button = form.querySelector('[data-atc-main]');
    button.disabled = !variant.available || form.dataset.submitting === 'true';
    button.textContent = variant.available ? button.dataset.labelAvailable : button.dataset.labelUnavailable;
    const stock = info.querySelector('[data-product-stock]');
    stock.querySelector('.stock-counter__dot').className = `stock-counter__dot${variant.stockState === 'available' ? '' : ` stock-counter__dot--${variant.stockState}`}`;
    stock.querySelector('span:last-child').textContent = variant.stockLabel;
    info.querySelector('[data-product-sku]').textContent = variant.sku;
    const notification = info.querySelector('[data-back-in-stock]');
    notification.hidden = variant.available;
    const body = notification.querySelector('[name="contact[body]"]');
    body.value = `Stock update request for ${info.querySelector('h1').textContent} - ${variant.title} (${variant.id}), SKU: ${variant.sku}`;
    const payment = form.querySelector('[data-product-payment]');
    if (payment) payment.hidden = !variant.available;
    const error = form.querySelector('[data-product-error]');
    if (error) error.hidden = true;
    const thumb = Array.from(info.closest('.product-page').querySelectorAll('[data-gallery-thumb]'))
      .find((item) => item.dataset.mediaId === String(variant.imageId));
    thumb?.click();
    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url);
  });
});


document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
  const summary = dropdown.querySelector('summary');
  const desktopQuery = window.matchMedia('(min-width: 991px)');
  dropdown.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && dropdown.open) {
      event.stopPropagation();
      dropdown.removeAttribute('open');
      summary?.focus();
    }
  });

  dropdown.addEventListener('mouseenter', () => {
    if (desktopQuery.matches) {
      dropdown.setAttribute('open', '');
    }
  });

  dropdown.addEventListener('focusin', () => {
    if (desktopQuery.matches) {
      dropdown.setAttribute('open', '');
    }
  });

  summary?.addEventListener('click', (event) => {
    if (desktopQuery.matches) {
      event.preventDefault();
      dropdown.setAttribute('open', '');
    }
  });

  dropdown.addEventListener('mouseleave', () => {
    if (desktopQuery.matches) {
      dropdown.removeAttribute('open');
    }
  });

  dropdown.addEventListener('focusout', () => {
    if (!desktopQuery.matches) return;
    window.setTimeout(() => {
      if (!dropdown.contains(document.activeElement)) {
        dropdown.removeAttribute('open');
      }
    }, 0);
  });
});

const cartDrawer = document.querySelector('[data-cart-drawer]');
const cartDrawerBody = document.querySelector('[data-cart-drawer-body]');
const cartCountEls = document.querySelectorAll('[data-cart-count]');
const cartError = cartDrawer?.querySelector('[data-cart-error]');
let cartRequestQueue = Promise.resolve();
let cartBusyCount = 0;
let lastConfirmedCart;

function queueCartRequest(task) {
  const request = cartRequestQueue.then(task);
  cartRequestQueue = request.catch(() => {});
  return request;
}

function showCartError(message = '') {
  if (!cartError) return;
  cartError.textContent = message;
  cartError.hidden = !message;
}

function setCartBusy(busy) {
  cartBusyCount += busy ? 1 : -1;
  cartDrawer?.setAttribute('aria-busy', String(cartBusyCount > 0));
  cartDrawerBody?.querySelectorAll('button, input').forEach((control) => {
    control.disabled = cartBusyCount > 0;
  });
}

async function cartResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    const message = typeof data.description === 'string' ? data.description : data.message;
    throw new Error(typeof message === 'string' ? message : themeMessages.cartError);
  }
  return data;
}

function openCartDrawer() {
  if (!cartDrawer) return;
  closeMobileMenu();
  closeSearchDrawer();
  closeGarageDrawer();
  cartDrawer.classList.add('is-open');
  document.body.classList.add('is-cart-open');
  document.querySelectorAll('[data-cart-drawer-open]').forEach((el) => el.setAttribute('aria-expanded', 'true'));
  openModal(cartDrawer, cartDrawer.querySelector('.cart-drawer__header button'));
}

function closeCartDrawer() {
  if (!cartDrawer) return;
  cartDrawer.classList.remove('is-open');
  document.body.classList.remove('is-cart-open');
  document.querySelectorAll('[data-cart-drawer-open]').forEach((el) => el.setAttribute('aria-expanded', 'false'));
  closeModal(cartDrawer);
}

function updateCartCount(count) {
  cartCountEls.forEach((el) => {
    const changed = el.textContent !== String(count);
    el.textContent = String(count);
    if (count > 0) el.removeAttribute('hidden');
    else el.setAttribute('hidden', '');
    if (changed && count > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.remove('is-count-updated');
      void el.offsetWidth;
      el.classList.add('is-count-updated');
    }
  });
}

function formatMoney(cents, currency = themeConfig.currency || window.Shopify?.currency?.active || 'USD') {
  return new Intl.NumberFormat(document.documentElement.lang || 'en', { style: 'currency', currency }).format(cents / 100);
}

function renderCartDrawer(cart) {
  if (!cartDrawerBody) return;
  lastConfirmedCart = cart;
  updateCartCount(cart.item_count);

  if (cart.item_count === 0) {
    cartDrawerBody.innerHTML = `
      <div class="empty-state cart-drawer__empty">
        <p>${escapeHTML(themeMessages.empty || 'Your cart is ready for its first upgrade.')}</p>
        <a class="button" href="${escapeHTML(themeConfig.allProductsUrl || themeRoute('collections/all'))}">${escapeHTML(themeMessages.continueShopping || 'Continue shopping')}</a>
      </div>`;
    const footer = cartDrawer.querySelector('.cart-drawer__footer');
    if (footer) footer.remove();
    return;
  }

  const itemsHtml = cart.items.map((item, i) => `
    <li class="cart-drawer__item" data-cart-line="${i + 1}" data-key="${escapeHTML(item.key)}">
      ${item.image ? `<a href="${escapeHTML(item.url)}" class="cart-drawer__thumb"><img src="${escapeHTML(item.image)}" loading="lazy" alt="${escapeHTML(item.product_title)}"></a>` : ''}
      <div class="cart-drawer__details">
        <a class="cart-drawer__title" href="${escapeHTML(item.url)}">${escapeHTML(item.product_title)}</a>
        ${item.variant_title && item.variant_title !== 'Default Title' ? `<p class="cart-drawer__variant">${escapeHTML(item.variant_title)}</p>` : ''}
        <div class="cart-drawer__line-row">
          <div class="cart-drawer__qty">
            <button type="button" data-cart-qty-decrement aria-label="${escapeHTML(themeMessages.decrease || 'Decrease quantity')}">&minus;</button>
            <input type="number" min="0" step="1" value="${item.quantity}" data-cart-qty-input aria-label="${escapeHTML(themeMessages.quantity || 'Quantity')}">
            <button type="button" data-cart-qty-increment aria-label="${escapeHTML(themeMessages.increase || 'Increase quantity')}">+</button>
          </div>
          <span class="cart-drawer__line-price">${escapeHTML(formatMoney(item.final_line_price, cart.currency))}</span>
        </div>
        <button class="cart-drawer__remove eyebrow" type="button" data-cart-remove>${escapeHTML(themeMessages.remove || 'Remove')}</button>
      </div>
    </li>`).join('');

  cartDrawerBody.innerHTML = `<ul class="cart-drawer__items">${itemsHtml}</ul>`;

  let footer = cartDrawer.querySelector('.cart-drawer__footer');
  const footerHtml = `
    <div class="cart-drawer__subtotal">
      <span class="eyebrow">${escapeHTML(themeMessages.subtotal || 'Subtotal')}</span>
      <strong>${escapeHTML(formatMoney(cart.total_price, cart.currency))}</strong>
    </div>
    <a class="button button--secondary" href="${escapeHTML(themeConfig.cartUrl || themeRoute('cart'))}">${escapeHTML(themeMessages.viewCart || 'View cart')}</a>
    <a class="button" href="${escapeHTML(themeConfig.cartUrl || themeRoute('cart'))}/checkout">${escapeHTML(themeMessages.checkout || 'Checkout')}</a>`;
  if (!footer) {
    footer = document.createElement('footer');
    footer.className = 'cart-drawer__footer';
    cartDrawer.querySelector('.cart-drawer__panel').appendChild(footer);
  }
  footer.innerHTML = footerHtml;
  cartDrawerBody.querySelectorAll('button, input').forEach((control) => { control.disabled = cartBusyCount > 0; });
}

async function refreshCart() {
  const response = await fetch(themeRoute('cart.js'), { headers: { Accept: 'application/json' } });
  renderCartDrawer(await cartResponse(response));
}

async function changeCartLine(key, quantity) {
  if (!Number.isInteger(quantity) || quantity < 0) return;
  showCartError();
  const focusedControl = document.activeElement;
  const focusAttribute = ['data-cart-qty-decrement', 'data-cart-qty-increment', 'data-cart-qty-input', 'data-cart-remove']
    .find((attribute) => focusedControl?.hasAttribute(attribute));
  setCartBusy(true);
  try {
    await queueCartRequest(async () => {
      const res = await fetch(themeRoute('cart/change.js'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: key, quantity }),
      });
      renderCartDrawer(await cartResponse(res));
    });
  } catch (error) {
    if (lastConfirmedCart) renderCartDrawer(lastConfirmedCart);
    reportHealth('cart_change_error');
    showCartError(error.message || themeMessages.cartError || 'Unable to update your cart. Please try again.');
  } finally {
    setCartBusy(false);
    if (focusAttribute && !focusedControl.isConnected) {
      const updatedLine = Array.from(cartDrawerBody.querySelectorAll('[data-key]')).find((line) => line.dataset.key === key);
      (updatedLine?.querySelector(`[${focusAttribute}]`) || cartDrawer.querySelector('.cart-drawer__header button'))?.focus();
    }
  }
}

if (cartDrawer) {
  document.querySelectorAll('[data-cart-drawer-open]').forEach((el) => {
    el.addEventListener('click', (evt) => {
      evt.preventDefault();
      showCartError();
      openCartDrawer();
      queueCartRequest(refreshCart).catch((error) => {
        reportHealth('cart_refresh_error');
        showCartError(error.message || themeMessages.cartError);
      });
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
    if (cartBusyCount > 0) return;
    const key = line.dataset.key;
    const input = line.querySelector('[data-cart-qty-input]');
    if (target.closest('[data-cart-remove]')) {
      changeCartLine(key, 0);
    } else if (target.closest('[data-cart-qty-decrement]')) {
      changeCartLine(key, Math.max(0, Number(input.value) - 1));
    } else if (target.closest('[data-cart-qty-increment]')) {
      changeCartLine(key, Number(input.value) + 1);
    }
  });

  cartDrawer.addEventListener('change', (evt) => {
    const input = evt.target.closest('[data-cart-qty-input]');
    if (!input) return;
    const line = input.closest('[data-cart-line]');
    if (!line) return;
    if (!input.value || !input.checkValidity() || cartBusyCount > 0) return;
    changeCartLine(line.dataset.key, Number(input.value));
  });

  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape' && cartDrawer.classList.contains('is-open')) closeCartDrawer();
  });
  cartDrawer.addEventListener('ae:close-modal', closeCartDrawer);

  document.addEventListener('submit', async (evt) => {
    const form = evt.target;
    if (!(form instanceof HTMLFormElement) || !new URL(form.action).pathname.endsWith('/cart/add')) return;
    evt.preventDefault();
    if (form.dataset.submitting === 'true') return;
    const submitBtn = evt.submitter || form.querySelector('[type="submit"]');
    if (submitBtn?.disabled) return;
    form.dataset.submitting = 'true';
    const formData = new FormData(form);
    let errorTarget = form.querySelector('[data-product-error]');
    if (!errorTarget) {
      errorTarget = document.createElement('p');
      errorTarget.className = 'form-error';
      errorTarget.dataset.productError = '';
      errorTarget.setAttribute('role', 'alert');
      form.appendChild(errorTarget);
    }
    errorTarget.hidden = true;
    if (submitBtn) submitBtn.setAttribute('disabled', '');
    let added = false;
    try {
      await queueCartRequest(async () => {
        const res = await fetch(themeRoute('cart/add.js'), {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: formData,
        });
        await cartResponse(res);
        added = true;
        reportHealth('cart_add');
        await refreshCart();
      });
      showCartError();
      openCartDrawer();
    } catch (error) {
      reportHealth(added ? 'cart_refresh_error' : 'cart_add_error');
      errorTarget.textContent = added
        ? themeMessages.addedButRefreshFailed || 'Your item was added. Open the cart before adding again.'
        : error.message || themeMessages.cartError || 'Unable to update your cart. Please try again.';
      errorTarget.hidden = false;
    } finally {
      delete form.dataset.submitting;
      if (submitBtn && form.dataset.variantAvailable !== 'false') submitBtn.removeAttribute('disabled');
    }
  });
}

initScrollReveal();
initHeroTypewriterSequence();

const stickyHeader = document.querySelector('.site-header--sticky');
if (stickyHeader) {
  const shrinkAt = 60;
  const hideAt = 140;
  const intentDelta = 6;
  let lastY = window.scrollY;
  let parkedY = lastY;
  let ticking = false;

  const updateHeader = () => {
    const y = Math.max(0, window.scrollY);
    const delta = y - lastY;

    stickyHeader.classList.toggle('is-scrolled', y > shrinkAt);

    const headerIsActive = stickyHeader.contains(document.activeElement)
      || stickyHeader.querySelector('.is-open, details[open]');
    if (y <= hideAt || headerIsActive) {
      stickyHeader.classList.remove('is-hidden');
      parkedY = y;
    } else if (delta > intentDelta || y - parkedY > 24) {
      stickyHeader.classList.add('is-hidden');
      parkedY = y;
    } else if (delta < -intentDelta || parkedY - y > 24) {
      stickyHeader.classList.remove('is-hidden');
      parkedY = y;
    }

    lastY = y;
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateHeader);
  };

  updateHeader();
  window.addEventListener('scroll', onScroll, { passive: true });
  stickyHeader.addEventListener('focusin', () => stickyHeader.classList.remove('is-hidden'));
}

const backToTop = document.querySelector('[data-back-to-top]');
if (backToTop) {
  const toggleBackToTop = () => {
    backToTop.classList.toggle('is-visible', window.scrollY > 640);
    backToTop.tabIndex = window.scrollY > 640 ? 0 : -1;
  };

  toggleBackToTop();
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
}
