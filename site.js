/* Progressive enhancement: the content and signup form also work without JS. */
document.documentElement.classList.add('js');

const tablist = document.querySelector('.feature-tabs');
if (tablist) {
  const tabs = [...tablist.querySelectorAll('button[data-feature]')];
  const panels = tabs.map(tab => document.getElementById(`panel-${tab.dataset.feature}`));
  tablist.setAttribute('role', 'tablist');

  function selectTab(index, focus = false, updateHistory = true) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus({ preventScroll: true });
    if (updateHistory) {
      const url = new URL(location.href);
      url.searchParams.set('view', tabs[index].dataset.feature);
      history.replaceState(null, '', url);
    }
  }

  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].tabIndex = 0;
    tab.addEventListener('click', () => selectTab(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectTab(next, true);
    });
  });

  function restoreView() {
    const view = new URL(location.href).searchParams.get('view');
    const index = tabs.findIndex(tab => tab.dataset.feature === view);
    selectTab(Math.max(0, index), false, false);
  }
  restoreView();
  window.addEventListener('popstate', restoreView);
}

const form = document.querySelector('.beta-form');
if (form) {
  let submitting = false;
  const submit = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.form-status');
  const confirmation = document.querySelector('.signup-confirmation');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting || !form.reportValidity()) return;
    submitting = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Saving your application…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
        credentials: 'omit',
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) {
        throw new Error(response.status === 429
          ? 'Too many signup attempts. Please try later or email support@lygra.co.uk.'
          : response.status === 400
            ? 'Please check your details and consent, then try again.'
            : 'We couldn’t save your application. Please try again or email support@lygra.co.uk.');
      }
      form.reset();
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.querySelector('h3').focus({ preventScroll: true });
      confirmation.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    } catch (error) {
      status.textContent = error.name === 'AbortError'
        ? 'We couldn’t confirm your signup yet. Your details are still here—please try again. Retrying won’t create a duplicate.'
        : error instanceof TypeError || error instanceof SyntaxError
          ? 'We couldn’t connect. Your details are still here—please try again or email support@lygra.co.uk.'
          : error.message;
    } finally {
      clearTimeout(timeout);
      submitting = false;
      submit.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
}

document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });

const imageDialog = document.querySelector('.image-dialog');
if (imageDialog) {
  const image = imageDialog.querySelector('img');
  const caption = imageDialog.querySelector('p');
  let opener;
  document.querySelectorAll('.feature-image').forEach(figure => {
    const source = figure.querySelector('img');
    const label = figure.querySelector('figcaption').textContent;
    const button = document.createElement('button');
    button.className = 'image-zoom';
    button.type = 'button';
    button.textContent = 'View screenshot ↗';
    button.setAttribute('aria-label', `Enlarge ${label.toLowerCase()}`);
    button.addEventListener('click', () => {
      opener = button;
      image.src = source.src;
      image.alt = source.alt;
      caption.textContent = label;
      imageDialog.showModal();
    });
    figure.append(button);
  });
  imageDialog.querySelector('button').addEventListener('click', () => imageDialog.close());
  imageDialog.addEventListener('close', () => opener?.focus({ preventScroll: true }));
  imageDialog.addEventListener('click', event => {
    if (event.target !== imageDialog) return;
    const bounds = imageDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) imageDialog.close();
  });
}
