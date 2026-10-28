const cardTemplate = document.getElementById('teacher-card');

export const initials = (fullName = '') =>
  fullName.split(/\s+/).filter(Boolean).map((part) => part[0].toUpperCase()).join('.');

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB') : '');

export const setOptions = (select, values, placeholder) => {
  const current = select.value;
  const options = values.map((value) => new Option(value, value));
  if (placeholder !== undefined) options.unshift(new Option(placeholder, ''));
  select.replaceChildren(...options);
  if (values.includes(current)) select.value = current;
};

const fillAvatar = (avatar, teacher) => {
  const img = avatar.querySelector('img');
  const letters = avatar.querySelector('.avatar__initials');
  const hasPhoto = Boolean(teacher.picture_large);

  img.hidden = !hasPhoto;
  letters.hidden = hasPhoto;
  if (hasPhoto) {
    img.src = teacher.picture_large;
    img.alt = teacher.full_name;
  } else {
    letters.textContent = initials(teacher.full_name);
  }
};

const createCard = (teacher, { showSubject = true } = {}) => {
  const card = cardTemplate.content.firstElementChild.cloneNode(true);
  const [first, ...rest] = teacher.full_name.split(' ');

  card.dataset.id = teacher.id;
  card.classList.toggle('teacher--fav', Boolean(teacher.favorite));
  fillAvatar(card.querySelector('.avatar'), teacher);
  card.querySelector('.teacher__name').append(first, document.createElement('br'), rest.join(' '));
  card.querySelector('.teacher__country').textContent = teacher.country ?? '';

  const subject = card.querySelector('.teacher__subject');
  if (showSubject) subject.textContent = teacher.course;
  else subject.remove();

  return card;
};

export const renderTeacherList = (list, emptyMessage, teachers, options) => {
  list.replaceChildren(...teachers.map((teacher) => createCard(teacher, options)));
  emptyMessage.hidden = teachers.length > 0;
};

const STAT_COLUMNS = [
  (t) => t.full_name,
  (t) => t.course,
  (t) => t.age ?? '',
  (t) => formatDate(t.b_date),
  (t) => t.gender,
  (t) => t.country ?? '',
];

export const renderStatsRows = (tbody, teachers) => {
  tbody.replaceChildren();
  teachers.forEach((teacher) => {
    const row = tbody.insertRow();
    STAT_COLUMNS.forEach((value) => { row.insertCell().textContent = value(teacher); });
  });
};

export const renderSortState = (headers, { field, order }) => {
  headers.forEach((th) => {
    if (th.dataset.sort === field) th.setAttribute('aria-sort', order === 'asc' ? 'ascending' : 'descending');
    else th.removeAttribute('aria-sort');
  });
};

export const renderPagination = (list, pageCount, currentPage) => {
  const items = Array.from({ length: pageCount }, (_, index) => {
    const page = index + 1;
    const item = document.createElement('li');
    const control = document.createElement(page === currentPage ? 'span' : 'a');
    control.textContent = page;
    if (page === currentPage) {
      control.className = 'pagination__current';
    } else {
      control.href = '#statistics';
      control.dataset.page = page;
    }
    item.append(control);
    return item;
  });
  list.replaceChildren(...items);
};

const mapUrl = ({ latitude, longitude }) => {
  const [lat, lon] = [Number(latitude), Number(longitude)];
  const delta = 0.2;
  const params = new URLSearchParams({
    bbox: [lon - delta, lat - delta, lon + delta, lat + delta].join(','),
    layer: 'mapnik',
    marker: `${lat},${lon}`,
  });
  return `https://www.openstreetmap.org/export/embed.html?${params}`;
};

export const renderTeacherInfo = (dialog, teacher) => {
  const field = (name) => dialog.querySelector(`[data-field="${name}"]`);
  const hasPhoto = Boolean(teacher.picture_large);

  field('photo').hidden = !hasPhoto;
  field('photo').src = teacher.picture_large ?? '';
  field('photo').alt = teacher.full_name;
  field('initials').hidden = hasPhoto;
  field('initials').textContent = initials(teacher.full_name);
  field('initials').style.backgroundColor = teacher.bg_color;

  field('name').textContent = teacher.full_name;
  field('course').textContent = teacher.course;
  field('location').textContent = [teacher.city, teacher.country].filter(Boolean).join(', ');
  field('age-gender').textContent = [teacher.age, teacher.gender].filter((v) => v != null).join(', ');
  field('email').textContent = teacher.email ?? '';
  field('email').href = teacher.email ? `mailto:${teacher.email}` : '';
  field('phone').textContent = teacher.phone ?? '';
  field('note').textContent = teacher.note ?? '';

  renderFavoriteStar(dialog.querySelector('[data-action="toggle-favorite"]'), teacher.favorite);

  const mapLink = dialog.querySelector('[data-action="toggle-map"]');
  const mapFrame = dialog.querySelector('.info__mapframe');
  mapLink.hidden = !teacher.coordinates;
  mapFrame.hidden = true;
  mapFrame.dataset.src = teacher.coordinates ? mapUrl(teacher.coordinates) : '';
};

export const renderFavoriteStar = (star, isFavorite) => {
  star.setAttribute('aria-pressed', String(Boolean(isFavorite)));
  star.textContent = isFavorite ? '★' : '☆';
};

export const renderFormErrors = (form, list, errors, labels) => {
  [...form.elements].forEach((element) => element.removeAttribute('aria-invalid'));
  errors.forEach(({ input }) => input?.setAttribute('aria-invalid', 'true'));

  list.replaceChildren(...errors.map(({ field, message }) => {
    const item = document.createElement('li');
    item.textContent = `${labels[field] ?? field}: ${message}`;
    return item;
  }));
  list.hidden = errors.length === 0;
};
