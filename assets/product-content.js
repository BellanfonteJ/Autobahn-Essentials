(() => {
  document.querySelectorAll('[data-product-content]').forEach(template => {
    const content = template.content;
    content.querySelectorAll('img, iframe').forEach(media => {
      if (!media.hasAttribute('loading')) media.loading = 'lazy';
      if (media.tagName === 'IMG' && !media.hasAttribute('decoding')) media.decoding = 'async';
    });
    template.parentElement.querySelector('noscript')?.remove();
    template.replaceWith(content);
  });
})();
