import _ from 'lodash';
import dayjs from 'dayjs';
import { randomUserMock, additionalUsers } from './FE4U-Lab2-mock.js';

export const COURSES = [
  'Mathematics', 'Physics', 'English', 'Computer Science', 'Dancing', 'Chess',
  'Biology', 'Chemistry', 'Law', 'Art', 'Medicine', 'Statistics',
];

export const AGE_GROUPS = [
  { label: 'Under 18', max: 17 },
  { label: '18–31', max: 31 },
  { label: '32–45', max: 45 },
  { label: '46+', max: Infinity },
];

const SORTABLE_FIELDS = ['full_name', 'course', 'age', 'b_day', 'gender', 'country'];
const FIELD_ALIASES = { b_day: 'b_date' };
const CAPITALIZED_FIELDS = ['full_name', 'gender', 'note', 'state', 'city', 'country'];
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AGE_CONDITION = /^(>=|<=|>|<|=)?\s*(\d+)$/;
const AGE_RANGE = /^(\d+)\s*-\s*(\d+)$/;
const AGE_OPERATORS = { '=': _.eq, '>': _.gt, '<': _.lt, '>=': _.gte, '<=': _.lte };
const DEFAULT_PHONE_FORMAT = /^\+?[\d\s\-().]{6,20}$/;
const PHONE_FORMATS = {
  Germany: /^\d{4}-\d{7}$/,
  France: /^0\d(-\d{2}){4}$/,
  Ireland: /^0\d{2}-\d{3}-\d{4}$/,
  Denmark: /^\d{8}$/,
  Norway: /^\d{8}$/,
  Finland: /^0\d-\d{3}-\d{3}$/,
  Netherlands: /^\(\d{3}\)(-\d{3}-\d{4}| \d{7})$/,
  Spain: /^\d{3}-\d{3}-\d{3}$/,
  Switzerland: /^0\d{2} \d{3} \d{2} \d{2}$/,
  'United States': /^\(\d{3}\)[- ]\d{3}-\d{4}$/,
  Canada: /^\d{3}-\d{3}-\d{4}$/,
  Australia: /^0\d-\d{4}-\d{4}$/,
  'New Zealand': /^\(\d{3}\)-\d{3}-\d{4}$/,
  Turkey: /^\(\d{3}\)-\d{3}-\d{4}$/,
  Iran: /^\d{3}-\d{8}$/,
};

const randomColor = () => `#${_.padStart(_.random(0xffffff).toString(16), 6, '0')}`;
const capitalize = (text) => (_.isString(text) ? _.upperFirst(text) : text);
const isCapitalizedString = (value) => _.isString(value) && /^[\p{Lu}\p{Lo}]/u.test(value);

const RANDOM_USER_FIELDS = {
  id: 'login.uuid',
  title: 'name.title',
  city: 'location.city',
  state: 'location.state',
  country: 'location.country',
  postcode: 'location.postcode',
  coordinates: 'location.coordinates',
  timezone: 'location.timezone',
  email: 'email',
  b_date: 'dob.date',
  age: 'dob.age',
  phone: 'phone',
  picture_large: 'picture.large',
  picture_thumbnail: 'picture.thumbnail',
};

const fromRandomUser = (user) => ({
  ..._.mapValues(RANDOM_USER_FIELDS, (path) => _.get(user, path)),
  gender: capitalize(user.gender),
  full_name: _.compact([user.name?.first, user.name?.last]).join(' '),
});

const calculateAge = (date) => {
  const birth = dayjs(date);
  return birth.isValid() ? dayjs().diff(birth, 'year') : undefined;
};

const fromAdditionalUser = ({ b_day, ...user }) => {
  const b_date = user.b_date ?? b_day;
  return {
    ...user,
    gender: capitalize(user.gender),
    b_date,
    age: user.age ?? (b_date ? calculateAge(b_date) : undefined),
  };
};

const sameText = (a, b) => Boolean(a) && _.toLower(a) === _.toLower(b);

const isSameUser = (a, b) => sameText(a.email, b.email) || sameText(a.full_name, b.full_name);

const mergeUnique = (users) =>
  _.reduce(users, (unique, user) => {
    const existing = _.find(unique, (other) => isSameUser(other, user));
    if (existing) _.assignWith(existing, user, (current, value) => current ?? value);
    else unique.push({ ...user });
    return unique;
  }, []);

const findCourse = (name) => _.find(COURSES, (course) => _.toLower(course) === _.toLower(name));

const withDefaults = (user, index) => {
  const course = findCourse(user.course) ?? _.sample(COURSES);
  return {
    ...user,
    id: user.id ?? `generated-${index + 1}`,
    favorite: user.favorite ?? false,
    course,
    bg_color: user.bg_color ?? randomColor(),
    note: user.note ?? `Teaches ${course}.`,
  };
};

export const mergeUsers = (...lists) => mergeUnique(_.flatten(lists));

export const formatUsers = (randomUsers = randomUserMock, extraUsers = additionalUsers) =>
  _.map(mergeUnique([..._.map(randomUsers, fromRandomUser), ..._.map(extraUsers, fromAdditionalUser)]), withDefaults);

export const createUser = (fields) =>
  withDefaults(fromAdditionalUser({ id: `user-${Date.now()}`, ...fields }), 0);

const VALIDATION_RULES = [
  ..._.map(CAPITALIZED_FIELDS, (field) => ({
    field, isValid: isCapitalizedString, message: 'must start with a capital letter',
  })),
  { field: 'age', isValid: _.isFinite, message: 'must be a number' },
  {
    field: 'email',
    isValid: (email) => _.isString(email) && EMAIL_FORMAT.test(email),
    message: 'must be a valid email address',
  },
  {
    field: 'phone',
    isValid: (phone, user) => _.isString(phone) && (PHONE_FORMATS[user.country] ?? DEFAULT_PHONE_FORMAT).test(phone),
    message: (user) => `does not match the format for ${user.country}`,
  },
];

export const validateUser = (user, { optional = [] } = {}) => {
  const errors = _(VALIDATION_RULES)
    .reject(({ field }) => _.includes(optional, field) && _.isNil(user[field]))
    .reject(({ field, isValid }) => isValid(user[field], user))
    .map(({ field, message }) => ({ field, message: _.isFunction(message) ? message(user) : message }))
    .value();
  return { valid: _.isEmpty(errors), errors };
};

const matchesAge = (age, condition) => {
  if (_.isNumber(condition)) return age === condition;
  const text = _.trim(condition);
  const range = text.match(AGE_RANGE);
  if (range) return _.gte(age, Number(range[1])) && _.lte(age, Number(range[2]));
  const [, operator = '=', limit] = text.match(AGE_CONDITION) ?? [];
  return limit !== undefined && AGE_OPERATORS[operator](age, Number(limit));
};

const matchesAll = (matchers, user, criteria) =>
  _.every(_.pick(criteria, _.keys(matchers)), (value, key) => value === undefined || matchers[key](user, value));

const FILTERS = {
  country: (user, country) => user.country === country,
  age: (user, age) => matchesAge(user.age, age),
  gender: (user, gender) => _.toLower(user.gender) === _.toLower(gender),
  favorite: (user, favorite) => user.favorite === favorite,
  photo: (user, photo) => Boolean(user.picture_large) === photo,
};

export const filterUsers = (users, criteria = {}) => _.filter(users, (user) => matchesAll(FILTERS, user, criteria));

const isMissing = (value) => _.isNil(value) || _.isNaN(value);
const sortKey = (value) => (_.isString(value) ? _.deburr(_.toLower(value)) : value);

export const sortUsers = (users, field, order = 'asc') => {
  if (!_.includes(SORTABLE_FIELDS, field)) throw new Error(`Cannot sort by "${field}"`);
  const key = FIELD_ALIASES[field] ?? field;
  const value = (user) => (key === 'b_date' ? Date.parse(user.b_date) : user[key]);
  return _.orderBy(
    users,
    [(user) => isMissing(value(user)), (user) => sortKey(value(user))],
    ['asc', order === 'desc' ? 'desc' : 'asc'],
  );
};

const containsText = (value, query) => _.isString(value) && _.includes(_.toLower(value), _.toLower(query));

const QUERY_MATCHERS = {
  name: (user, name) => containsText(user.full_name, name),
  note: (user, note) => containsText(user.note, note),
  age: (user, age) => matchesAge(user.age, age),
};

const matchesQuery = (user, query) => matchesAll(QUERY_MATCHERS, user, query);

export const findUser = (users, query) => _.find(users, (user) => matchesQuery(user, query));

export const searchUsers = (users, text) => {
  const query = _.trim(text);
  if (!query) return users;
  if (AGE_CONDITION.test(query) || AGE_RANGE.test(query)) return _.filter(users, (user) => matchesAge(user.age, query));
  return _.filter(users, (user) => matchesQuery(user, { name: query }) || matchesQuery(user, { note: query }));
};

export const percentMatching = (users, query) => {
  if (_.isEmpty(users)) return 0;
  return _.round(_.meanBy(users, (user) => (matchesQuery(user, query) ? 100 : 0)), 2);
};

export const ageGroup = (age) => (_.isFinite(age) ? _.find(AGE_GROUPS, ({ max }) => age <= max).label : undefined);

const GROUP_VALUES = {
  course: (user) => user.course,
  age: (user) => ageGroup(user.age),
  gender: (user) => user.gender,
  country: (user) => user.country,
};
const GROUP_ORDER = { age: _.map(AGE_GROUPS, 'label'), gender: ['Male', 'Female'] };
const orderIndex = (order, label) => (_.includes(order, label) ? _.indexOf(order, label) : order.length);

export const countUsersBy = (users, field, maxGroups = Infinity) => {
  const counts = _.countBy(users, (user) => GROUP_VALUES[field](user) ?? 'Unknown');
  const groups = _.map(counts, (count, label) => ({ label, count }));
  const sorted = GROUP_ORDER[field]
    ? _.sortBy(groups, ({ label }) => orderIndex(GROUP_ORDER[field], label))
    : _.orderBy(groups, ['count', 'label'], ['desc', 'asc']);
  if (sorted.length <= maxGroups) return sorted;

  const rest = _.drop(sorted, maxGroups - 1);
  return [..._.take(sorted, maxGroups - 1), { label: 'Other', count: _.sumBy(rest, 'count'), other: true }];
};

export const nextBirthday = (date, today = dayjs()) => {
  const birth = dayjs(date);
  if (!date || !birth.isValid()) return undefined;
  const start = today.startOf('day');
  const thisYear = birth.year(start.year()).startOf('day');
  const next = thisYear.isBefore(start) ? birth.year(start.year() + 1).startOf('day') : thisYear;
  return { date: next, days: next.diff(start, 'day') };
};
