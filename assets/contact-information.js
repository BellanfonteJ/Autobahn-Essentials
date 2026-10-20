(() => {
  const content = document.querySelector('.ae-contact-policy-page .shopify-policy__body');
  if (!content) return;
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {
    acceptNode: node => node.parentElement.closest('a, script, style, pre, code, button, textarea') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const text = node.textContent;
    const phone = text.match(/^(\s*(?:Phone(?: number)?|Telephone|Tel)\s*:\s*)(\+?[\d(][\d().\s-]*\d)(\s*)$/i);
    let matches;
    if (phone) {
      const number = phone[2].replace(/[^\d+]/g, '');
      const digits = number.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) return;
      matches = [{ index: phone[1].length, value: phone[2], href: `tel:${number}` }];
    } else {
      matches = Array.from(text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi), match => ({ index: match.index, value: match[0], href: `mailto:${match[0]}` }));
    }
    if (!matches.length) return;
    const fragment = document.createDocumentFragment();
    let offset = 0;
    matches.forEach(match => {
      fragment.append(document.createTextNode(text.slice(offset, match.index)));
      const link = document.createElement('a');
      link.href = match.href;
      link.textContent = match.value;
      fragment.append(link);
      offset = match.index + match.value.length;
    });
    fragment.append(document.createTextNode(text.slice(offset)));
    node.replaceWith(fragment);
  });

  // Split only standalone contact rows; richer merchant content stays untouched.
  content.querySelectorAll('.rte > p').forEach(row => {
    if (row.classList.contains('ae-contact-policy-detail') || row.children.length !== 1) return;
    const link = row.firstElementChild;
    if (link.tagName !== 'A') return;
    const href = link.getAttribute('href') || '';
    const type = href.startsWith('tel:') ? 'phone' : href.startsWith('mailto:') ? 'email' : null;
    if (!type) return;
    const nodes = Array.from(row.childNodes);
    const index = nodes.indexOf(link);
    const before = nodes.slice(0, index);
    const after = nodes.slice(index + 1);
    if (before.some(node => node.nodeType !== Node.TEXT_NODE) || after.some(node => node.nodeType !== Node.TEXT_NODE || node.textContent.trim())) return;
    const prefix = before.map(node => node.textContent).join('');
    const pattern = type === 'phone' ? /^\s*(?:Phone(?: number)?|Telephone|Tel)\s*:\s*$/i : /^\s*Email\s*:\s*$/i;
    if (!pattern.test(prefix)) return;
    const label = document.createElement('span');
    label.className = 'ae-contact-policy-label';
    const icon = content.closest('.ae-contact-policy-page').querySelector(`template[data-contact-policy-icon="${type}"]`)?.content.firstElementChild;
    if (icon) label.append(icon.cloneNode(true));
    before.forEach(node => label.append(node));
    row.prepend(label);
    row.classList.add('ae-contact-policy-detail');
  });
})();
