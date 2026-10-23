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
  // Native POST keeps the provider's anti-spam challenge and receipt intact.
  // Never display success here: only the receiving service can confirm receipt.
  let submitting = false;
  const submit = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.form-status');
  let resetTimer;
  function resetSubmission() {
    clearTimeout(resetTimer);
    submitting = false;
    submit.disabled = false;
    form.removeAttribute('aria-busy');
    status.textContent = '';
  }
  form.addEventListener('submit', event => {
    if (submitting) { event.preventDefault(); return; }
    if (!form.reportValidity()) { event.preventDefault(); return; }
    submitting = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Opening the submission page…';
    resetTimer = setTimeout(() => {
      resetSubmission();
      status.textContent = 'If the next page didn’t open, check your connection and try again.';
    }, 15000);
  });
  window.addEventListener('pageshow', resetSubmission);
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
