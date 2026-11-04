import { nextBirthday } from './users.js';

const cardTemplate = document.getElementById('teacher-card');

export const initials = (fullName = '') =>
  fullName.split(/\s+/).filter(Boolean).map((part) => part[0].toUpperCase()).join('.');

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

export const renderTeacherList = (list, teachers, options) => {
  list.replaceChildren(...teachers.map((teacher) => createCard(teacher, options)));
};

export const renderMessage = (element, text) => {
  element.textContent = text;
  element.hidden = !text;
};

export const renderPressed = (group, value) => {
  group.querySelectorAll('[data-value]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.value === value));
  });
};

const birthdayText = (birthday) => {
  if (!birthday) return '';
  const date = birthday.date.format('D MMMM');
  if (birthday.days === 0) return `Birthday: today, ${date}!`;
  if (birthday.days === 1) return `Birthday: tomorrow, ${date}`;
  return `Birthday: ${date}, in ${birthday.days} days`;
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
  field('birthday').textContent = birthdayText(nextBirthday(teacher.b_date));
  field('note').textContent = teacher.note ?? '';

  renderFavoriteStar(dialog.querySelector('[data-action="toggle-favorite"]'), teacher.favorite);

  dialog.querySelector('[data-action="toggle-map"]').hidden = !teacher.coordinates;
  dialog.querySelector('.info__mapview').hidden = true;
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
