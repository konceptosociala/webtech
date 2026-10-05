document.querySelectorAll('[data-open]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.getElementById(btn.dataset.open).showModal();
  });
});

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
});

const star = document.querySelector('.info__star');
star?.addEventListener('click', () => {
  const on = star.getAttribute('aria-pressed') !== 'true';
  star.setAttribute('aria-pressed', on);
  star.innerHTML = on ? '&#9733;' : '&#9734;';
});

document.querySelector('[data-toggle-map]')?.addEventListener('click', (e) => {
  e.preventDefault();
  const frame = document.querySelector('.info__mapframe');
  frame.hidden = !frame.hidden;
});
