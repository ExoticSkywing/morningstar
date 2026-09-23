(() => {
  'use strict';

  const showSuccess = (form) => {
    const wrapper = form.closest('.w-form');
    const done = wrapper && wrapper.querySelector('.w-form-done');
    const fail = wrapper && wrapper.querySelector('.w-form-fail');
    form.style.display = 'none';
    if (fail) fail.style.display = 'none';
    if (done) {
      done.style.display = 'block';
      done.setAttribute('role', 'status');
      done.setAttribute('aria-live', 'polite');
      const existing = done.textContent.trim();
      done.textContent = existing || 'Thank you! Your submission has been received.';
      done.focus?.();
    }
  };

  // Never submit data to the original Webflow account from a cloned origin.
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const email = form.querySelector('input[type="email"]');
    if (email && !email.checkValidity()) {
      email.reportValidity();
      return;
    }
    showSuccess(form);
  }, true);

  // Preserve native history/scroll restoration across app switching and reloads.
  if ('scrollRestoration' in history) history.scrollRestoration = 'auto';

  // Give reduced-motion users a deterministic non-animated state without
  // hiding content or disabling navigation.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('clone-reduced-motion');
  }
})();
