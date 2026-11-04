import _ from 'lodash';
import {
  COURSES, formatUsers, mergeUsers, filterUsers, searchUsers, createUser, validateUser, countUsersBy,
} from './users.js';
import { fetchRandomUsers, fetchSavedTeachers, saveTeacher } from './api.js';
import {
  setOptions, renderTeacherList, renderMessage, renderPressed, renderTeacherInfo, renderFavoriteStar, renderFormErrors,
} from './view.js';
import { createTeacherMap, renderPieChart, renderReport, MAX_SLICES } from './widgets.js';

const INITIAL_COUNT = 50;
const NEXT_COUNT = 10;
const MESSAGES = {
  loading: 'Loading teachers…',
  loadFailed: "Couldn't load teachers. Check your connection and try again.",
  noMatches: 'No teachers match your filters.',
  noFavorites: 'No favorite teachers yet. Open a teacher and click the star.',
  saveFailed: "Couldn't save the teacher. Is json-server running (npm start)?",
};
const FORM_LABELS = {
  full_name: 'Name', course: 'Speciality', country: 'Country', city: 'City', email: 'Email',
  phone: 'Phone', age: 'Date of birth', gender: 'Sex', note: 'Notes', server: 'Server',
};
const FORM_INPUTS = { age: 'b_day' };

const dom = {
  searchForm: document.getElementById('search-form'),
  filters: document.getElementById('filters'),
  teacherList: document.getElementById('teacher-list'),
  teacherStatus: document.getElementById('teacher-status'),
  loadMore: document.getElementById('load-more'),
  statsViews: document.getElementById('stats-views'),
  statsSummary: document.getElementById('stats-summary'),
  chartPanel: document.getElementById('stats-chart-panel'),
  chartGroups: document.getElementById('chart-groups'),
  chart: document.getElementById('stats-chart'),
  reportPanel: document.getElementById('stats-report-panel'),
  report: document.getElementById('stats-report'),
  favoriteList: document.getElementById('favorite-list'),
  favoriteEmpty: document.getElementById('favorite-empty'),
  infoDialog: document.getElementById('info-dialog'),
  infoMap: document.querySelector('#info-dialog .info__mapview'),
  addDialog: document.getElementById('add-dialog'),
  addForm: document.getElementById('add-form'),
  addErrors: document.getElementById('add-errors'),
  addSubmit: document.querySelector('#add-form [type=submit]'),
};

const state = {
  teachers: [],
  rejected: 0,
  apiPage: 0,
  loading: false,
  error: null,
  filters: {},
  search: '',
  statsView: 'chart',
  chartGroup: 'course',
  selectedId: null,
  map: null,
};

const findTeacher = (id) => _.find(state.teachers, { id });
const countries = () => _(state.teachers).map('country').compact().uniq().sortBy().value();
const visibleTeachers = () => searchUsers(filterUsers(state.teachers, state.filters), state.search);

// RENDERING

const teacherStatus = (count) => {
  if (state.loading) return MESSAGES.loading;
  if (state.error) return MESSAGES.loadFailed;
  return count === 0 ? MESSAGES.noMatches : '';
};

const statsSummary = (count) => {
  const total = state.teachers.length;
  const summary = state.statsView === 'chart' ? `Showing ${count} of ${total} teachers` : `All ${total} loaded teachers`;
  return state.rejected ? `${summary} · ${state.rejected} skipped as invalid` : summary;
};

const renderTeachers = (teachers) => {
  renderTeacherList(dom.teacherList, teachers);
  renderMessage(dom.teacherStatus, teacherStatus(teachers.length));
  dom.loadMore.disabled = state.loading;
  dom.loadMore.textContent = state.loading ? 'Loading…' : 'Next';
};

const renderFavorites = () => {
  const favorites = state.teachers.filter((teacher) => teacher.favorite);
  renderTeacherList(dom.favoriteList, favorites, { showSubject: false });
  renderMessage(dom.favoriteEmpty, favorites.length ? '' : MESSAGES.noFavorites);
};

const renderStats = (teachers) => {
  const showChart = state.statsView === 'chart';
  renderMessage(dom.statsSummary, statsSummary(teachers.length));
  renderPressed(dom.statsViews, state.statsView);
  renderPressed(dom.chartGroups, state.chartGroup);
  dom.chartPanel.hidden = !showChart;
  dom.reportPanel.hidden = showChart;

  if (showChart) renderPieChart(dom.chart, countUsersBy(teachers, state.chartGroup, MAX_SLICES));
  else renderReport(dom.report, state.statsView, state.teachers);
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

// DATA LOADING

const addTeachers = (teachers) => {
  state.teachers = mergeUsers(state.teachers, teachers);
  renderCountryOptions();
  updatePhoneHint();
};

const fetchValidTeachers = async ({ results, page }) => {
  const users = formatUsers(await fetchRandomUsers({ results, page }), []);
  const teachers = users.filter((user) => validateUser(user).valid);
  const rejected = users.length - teachers.length;
  if (rejected === 0) return { teachers, rejected };

  const topUp = await fetchValidTeachers({ results: rejected, page });
  return { teachers: [...teachers, ...topUp.teachers], rejected: rejected + topUp.rejected };
};

const loadNextPage = async () => {
  const page = state.apiPage + 1;
  const results = page === 1 ? INITIAL_COUNT : NEXT_COUNT;
  const { teachers, rejected } = await fetchValidTeachers({ results, page });
  addTeachers(teachers);
  state.rejected += rejected;
  state.apiPage = page;
};

const loadSavedTeachers = async () => {
  try {
    addTeachers(await fetchSavedTeachers());
  } catch (error) {
    console.warn('Saved teachers are unavailable (json-server is not running?)', error);
  }
};

const runRequest = async (task) => {
  state.loading = true;
  state.error = null;
  render();
  try {
    await task();
  } catch (error) {
    state.error = error;
    console.error(error);
  } finally {
    state.loading = false;
    render();
  }
};

dom.loadMore.addEventListener('click', () => runRequest(loadNextPage));

// TEACHER INFO & FAVORITES

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
    dom.infoMap.hidden = !dom.infoMap.hidden;
    if (dom.infoMap.hidden) return;
    const teacher = findTeacher(state.selectedId);
    state.map ??= createTeacherMap(dom.infoMap, teacher.coordinates, teacher.full_name);
    state.map.invalidateSize();
  }
});

dom.infoDialog.addEventListener('close', () => {
  state.map?.remove();
  state.map = null;
});

const scrollFavorites = (direction) => {
  const step = dom.favoriteList.firstElementChild?.offsetWidth ?? 0;
  dom.favoriteList.scrollBy({ left: direction * step, behavior: 'smooth' });
};

document.querySelector('.carousel__arrow--prev').addEventListener('click', () => scrollFavorites(-1));
document.querySelector('.carousel__arrow--next').addEventListener('click', () => scrollFavorites(1));

// FILTERS

const readFilters = ({ elements }) => ({
  age: elements.age.value || undefined,
  country: elements.country.value || undefined,
  gender: elements.gender.value || undefined,
  favorite: elements.favorite.checked || undefined,
  photo: elements.photo.checked || undefined,
});

dom.filters.addEventListener('change', () => {
  state.filters = readFilters(dom.filters);
  render();
});

// STATISTICS

const onToggle = (group, key) => {
  group.addEventListener('click', (event) => {
    const button = event.target.closest('[data-value]');
    if (!button) return;
    state[key] = button.dataset.value;
    renderStats(visibleTeachers());
  });
};

onToggle(dom.statsViews, 'statsView');
onToggle(dom.chartGroups, 'chartGroup');

// SEARCH

dom.searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  state.search = dom.searchForm.elements.query.value;
  render();
  document.getElementById('teachers').scrollIntoView();
});

dom.searchForm.elements.query.addEventListener('input', (event) => {
  if (event.target.value === '' && state.search !== '') {
    state.search = '';
    render();
  }
});

// ADD TEACHER FORM

const updatePhoneHint = () => {
  const { country, phone } = dom.addForm.elements;
  phone.placeholder = _.find(state.teachers, (t) => t.country === country.value && t.phone)?.phone ?? '';
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

dom.addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const teacher = createUser(readTeacherForm(dom.addForm));
  const { valid, errors } = validateUser(teacher, { optional: ['state'] });

  if (!valid) {
    showFormErrors(errors);
    inputFor(errors[0].field)?.focus();
    return;
  }

  dom.addSubmit.disabled = true;
  try {
    addTeachers([await saveTeacher(teacher)]);
    render();
    dom.addDialog.close();
    resetAddForm();
  } catch (error) {
    console.error(error);
    showFormErrors([{ field: 'server', message: MESSAGES.saveFailed }]);
  } finally {
    dom.addSubmit.disabled = false;
  }
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
runRequest(() => Promise.all([loadNextPage(), loadSavedTeachers()]));
