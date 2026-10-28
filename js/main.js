import { COURSES, formatUsers, filterUsers, sortUsers, searchUsers, createUser, validateUser } from './users.js';
import {
  setOptions, renderTeacherList, renderStatsRows, renderSortState, renderPagination,
  renderTeacherInfo, renderFavoriteStar, renderFormErrors,
} from './view.js';

const PAGE_SIZE = 10;
const FORM_LABELS = {
  full_name: 'Name', course: 'Speciality', country: 'Country', city: 'City', email: 'Email',
  phone: 'Phone', age: 'Date of birth', gender: 'Sex', note: 'Notes',
};
const FORM_INPUTS = { age: 'b_day' };

const dom = {
  searchForm: document.getElementById('search-form'),
  filters: document.getElementById('filters'),
  teacherList: document.getElementById('teacher-list'),
  teacherEmpty: document.getElementById('teacher-empty'),
  statsHeaders: document.querySelectorAll('.stats th[data-sort]'),
  statsBody: document.getElementById('stats-body'),
  pagination: document.getElementById('pagination'),
  favoriteList: document.getElementById('favorite-list'),
  favoriteEmpty: document.getElementById('favorite-empty'),
  infoDialog: document.getElementById('info-dialog'),
  addDialog: document.getElementById('add-dialog'),
  addForm: document.getElementById('add-form'),
  addErrors: document.getElementById('add-errors'),
};

const state = {
  teachers: formatUsers(),
  filters: {},
  search: '',
  sort: { field: 'full_name', order: 'asc' },
  page: 1,
  selectedId: null,
};

const findTeacher = (id) => state.teachers.find((teacher) => teacher.id === id);
const countries = () => [...new Set(state.teachers.map((t) => t.country).filter(Boolean))].sort();
const visibleTeachers = () => searchUsers(filterUsers(state.teachers, state.filters), state.search);

// RENDERING

const renderTeachers = (teachers) => renderTeacherList(dom.teacherList, dom.teacherEmpty, teachers);

const renderFavorites = () => renderTeacherList(
  dom.favoriteList,
  dom.favoriteEmpty,
  state.teachers.filter((teacher) => teacher.favorite),
  { showSubject: false },
);

const renderStats = (teachers) => {
  const sorted = sortUsers(teachers, state.sort.field, state.sort.order);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  state.page = Math.min(state.page, pageCount);
  const start = (state.page - 1) * PAGE_SIZE;

  renderStatsRows(dom.statsBody, sorted.slice(start, start + PAGE_SIZE));
  renderSortState(dom.statsHeaders, state.sort);
  renderPagination(dom.pagination, pageCount, state.page);
};

const renderCountryOptions = () => {
  setOptions(dom.filters.elements.country, countries(), 'Any');
  setOptions(dom.addForm.elements.country, countries());
};

const render = () => {
  const teachers = visibleTeachers();
  renderTeachers(teachers);
  renderStats(teachers);
  renderFavorites();
};

// TASK 1: TEACHER INFO & FAVORITES

const openTeacherInfo = (id) => {
  const teacher = findTeacher(id);
  if (!teacher) return;
  state.selectedId = id;
  renderTeacherInfo(dom.infoDialog, teacher);
  dom.infoDialog.showModal();
};

const onCardClick = (event) => {
  const card = event.target.closest('.teacher[data-id]');
  if (card) openTeacherInfo(card.dataset.id);
};

dom.teacherList.addEventListener('click', onCardClick);
dom.favoriteList.addEventListener('click', onCardClick);

dom.infoDialog.addEventListener('click', (event) => {
  const control = event.target.closest('[data-action]');
  const action = control?.dataset.action;

  if (action === 'toggle-favorite') {
    const teacher = findTeacher(state.selectedId);
    teacher.favorite = !teacher.favorite;
    renderFavoriteStar(control, teacher.favorite);
    render();
  }

  if (action === 'toggle-map') {
    event.preventDefault();
    const frame = dom.infoDialog.querySelector('.info__mapframe');
    if (!frame.src) frame.src = frame.dataset.src;
    frame.hidden = !frame.hidden;
  }
});

dom.infoDialog.addEventListener('close', () => {
  dom.infoDialog.querySelector('.info__mapframe').removeAttribute('src');
});

const scrollFavorites = (direction) => {
  const step = dom.favoriteList.firstElementChild?.offsetWidth ?? 0;
  dom.favoriteList.scrollBy({ left: direction * step, behavior: 'smooth' });
};

document.querySelector('.carousel__arrow--prev').addEventListener('click', () => scrollFavorites(-1));
document.querySelector('.carousel__arrow--next').addEventListener('click', () => scrollFavorites(1));

// TASK 2: FILTERS

const readFilters = ({ elements }) => ({
  age: elements.age.value || undefined,
  country: elements.country.value || undefined,
  gender: elements.gender.value || undefined,
  favorite: elements.favorite.checked || undefined,
  photo: elements.photo.checked || undefined,
});

dom.filters.addEventListener('change', () => {
  state.filters = readFilters(dom.filters);
  state.page = 1;
  render();
});

// TASK 3: SORTING & PAGINATION

dom.statsHeaders.forEach((th) => {
  th.addEventListener('click', () => {
    const { field, order } = state.sort;
    state.sort = {
      field: th.dataset.sort,
      order: field === th.dataset.sort && order === 'asc' ? 'desc' : 'asc',
    };
    renderStats(visibleTeachers());
  });
});

dom.pagination.addEventListener('click', (event) => {
  const link = event.target.closest('[data-page]');
  if (!link) return;
  event.preventDefault();
  state.page = Number(link.dataset.page);
  renderStats(visibleTeachers());
});

// TASK 4: SEARCH

dom.searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  state.search = dom.searchForm.elements.query.value;
  state.page = 1;
  render();
  document.getElementById('teachers').scrollIntoView();
});

dom.searchForm.elements.query.addEventListener('input', (event) => {
  if (event.target.value === '' && state.search !== '') {
    state.search = '';
    render();
  }
});

// TASK 5: ADD TEACHER FORM

const updatePhoneHint = () => {
  const { country, phone } = dom.addForm.elements;
  phone.placeholder = state.teachers.find((t) => t.country === country.value && t.phone)?.phone ?? '';
};

const readTeacherForm = (form) =>
  Object.fromEntries([...new FormData(form)]
    .map(([name, value]) => [name, value.trim()])
    .filter(([, value]) => value !== ''));

const inputFor = (field) => {
  const input = dom.addForm.elements.namedItem(FORM_INPUTS[field] ?? field);
  return input instanceof Element ? input : null;
};

const showFormErrors = (errors) => renderFormErrors(
  dom.addForm,
  dom.addErrors,
  errors.map((error) => ({ ...error, input: inputFor(error.field) })),
  FORM_LABELS,
);

const resetAddForm = () => {
  dom.addForm.reset();
  showFormErrors([]);
  updatePhoneHint();
};

dom.addForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const teacher = createUser(readTeacherForm(dom.addForm));
  const { valid, errors } = validateUser(teacher, { optional: ['state'] });

  if (!valid) {
    showFormErrors(errors);
    inputFor(errors[0].field)?.focus();
    return;
  }

  state.teachers.push(teacher);
  renderCountryOptions();
  render();
  dom.addDialog.close();
  resetAddForm();
});

dom.addForm.elements.country.addEventListener('change', updatePhoneHint);
dom.addForm.elements.b_day.max = new Date().toISOString().slice(0, 10);

// DIALOGS

document.querySelectorAll('[data-open]').forEach((button) => {
  button.addEventListener('click', () => document.getElementById(button.dataset.open).showModal());
});

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});

// INIT

setOptions(dom.addForm.elements.course, COURSES);
renderCountryOptions();
updatePhoneHint();
render();
