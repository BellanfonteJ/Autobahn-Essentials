(() => {
  const bar = document.querySelector('[data-mobile-purchase]');
  const form = document.querySelector('[data-product-form]');
  const main = form?.querySelector('[data-atc-main]');
  if (!bar || !form || !main) return;
  const mobile = matchMedia('(max-width: 640px)');
  const button = bar.querySelector('[data-mobile-purchase-submit]');
  const price = bar.querySelector('[data-mobile-purchase-price]');
  const canonicalPrice = form.querySelector('[data-product-price]');
  const option = form.querySelector('select[name="id"]');
  const variant = bar.querySelector('[data-mobile-purchase-variant]');
  let frame = 0;
  let barHeight = 0;

  const sync = () => {
    frame = 0;
    const editing = document.activeElement?.matches('input, textarea, select');
    const keyboard = window.visualViewport && visualViewport.height < innerHeight * 0.75;
    const eligible = mobile.matches && main.getBoundingClientRect().bottom <= 0;
    const hidden = !eligible || editing || keyboard;
    bar.hidden = hidden;
    document.body.classList.toggle('has-mobile-purchase', eligible);
    button.disabled = main.disabled || form.dataset.submitting === 'true' || form.dataset.variantAvailable === 'false';
    button.textContent = main.textContent.trim();
    if (price.innerHTML !== canonicalPrice.innerHTML) price.innerHTML = canonicalPrice.innerHTML;
    if (variant && option) variant.textContent = option.selectedOptions[0]?.textContent.trim() || '';
    const error = form.querySelector('[data-product-error]');
    const message = bar.querySelector('[data-mobile-purchase-error]');
    message.hidden = !error || error.hidden;
    message.textContent = error?.textContent || '';
    if (bar.offsetHeight) barHeight = bar.offsetHeight;
    const height = eligible ? `${barHeight}px` : '0px';
    if (document.documentElement.style.getPropertyValue('--mobile-purchase-height') !== height) document.documentElement.style.setProperty('--mobile-purchase-height', height);
  };
  const queue = () => { if (!frame) frame = requestAnimationFrame(sync); };
  new MutationObserver(queue).observe(form, { attributes: true, childList: true, subtree: true, characterData: true });
  new MutationObserver(queue).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  document.querySelectorAll('.cart-drawer, .product-gallery-lightbox, .garage-drawer, .search-drawer, [data-popup-newsletter]').forEach(node => {
    new MutationObserver(queue).observe(node, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });
  });
  variant?.addEventListener('click', () => {
    option?.scrollIntoView({ block: 'center', behavior: 'auto' });
    option?.focus({ preventScroll: true });
  });
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  window.visualViewport?.addEventListener('resize', queue);
  document.addEventListener('focusin', queue);
  document.addEventListener('focusout', queue);
  mobile.addEventListener('change', queue);
  sync();
})();
