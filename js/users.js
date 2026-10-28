import { randomUserMock, additionalUsers } from './FE4U-Lab2-mock.js';

export const COURSES = [
  'Mathematics', 'Physics', 'English', 'Computer Science', 'Dancing', 'Chess',
  'Biology', 'Chemistry', 'Law', 'Art', 'Medicine', 'Statistics',
];

const SORTABLE_FIELDS = ['full_name', 'course', 'age', 'b_day', 'gender', 'country'];
const FIELD_ALIASES = { b_day: 'b_date' };
const CAPITALIZED_FIELDS = ['full_name', 'gender', 'note', 'state', 'city', 'country'];
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AGE_CONDITION = /^(>=|<=|>|<|=)?\s*(\d+)$/;
const AGE_RANGE = /^(\d+)\s*-\s*(\d+)$/;
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

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];
const randomColor = () => `#${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0')}`;
const capitalize = (text) => (typeof text === 'string' && text ? text[0].toUpperCase() + text.slice(1) : text);
const isCapitalizedString = (value) => typeof value === 'string' && /^[\p{Lu}\p{Lo}]/u.test(value);

const fromRandomUser = (user) => ({
  id: user.login?.uuid,
  gender: capitalize(user.gender),
  title: user.name?.title,
  full_name: [user.name?.first, user.name?.last].filter(Boolean).join(' '),
  city: user.location?.city,
  state: user.location?.state,
  country: user.location?.country,
  postcode: user.location?.postcode,
  coordinates: user.location?.coordinates,
  timezone: user.location?.timezone,
  email: user.email,
  b_date: user.dob?.date,
  age: user.dob?.age,
  phone: user.phone,
  picture_large: user.picture?.large,
  picture_thumbnail: user.picture?.thumbnail,
});

const calculateAge = (date) => {
  const birth = new Date(date);
  if (Number.isNaN(birth.getTime())) return undefined;
  const now = new Date();
  const hadBirthday = now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  return now.getFullYear() - birth.getFullYear() - (hadBirthday ? 0 : 1);
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

const lower = (text) => text?.toLowerCase();

const isSameUser = (a, b) =>
  (a.email && lower(a.email) === lower(b.email)) ||
  (a.full_name && lower(a.full_name) === lower(b.full_name));

const mergeUnique = (users) =>
  users.reduce((unique, user) => {
    const existing = unique.find((other) => isSameUser(other, user));
    if (!existing) return [...unique, { ...user }];
    Object.entries(user).forEach(([field, value]) => {
      if (existing[field] == null) existing[field] = value;
    });
    return unique;
  }, []);

const withDefaults = (user, index) => {
  const course = COURSES.find((name) => name.toLowerCase() === String(user.course).toLowerCase()) ?? pickRandom(COURSES);
  return {
    ...user,
    id: user.id ?? `generated-${index + 1}`,
    favorite: user.favorite ?? false,
    course,
    bg_color: user.bg_color ?? randomColor(),
    note: user.note ?? `Teaches ${course}.`,
  };
};

export const mergeUsers = (...lists) => mergeUnique(lists.flat());

export const formatUsers = (randomUsers = randomUserMock, extraUsers = additionalUsers) =>
  mergeUnique([...randomUsers.map(fromRandomUser), ...extraUsers.map(fromAdditionalUser)]).map(withDefaults);

export const createUser = (fields) =>
  withDefaults(fromAdditionalUser({ id: `user-${Date.now()}`, ...fields }), 0);

export const validateUser = (user, { optional = [] } = {}) => {
  const errors = [];
  const check = (field, isValid, message) => {
    if (optional.includes(field) && user[field] == null) return;
    if (!isValid) errors.push({ field, message });
  };

  CAPITALIZED_FIELDS.forEach((field) => check(field, isCapitalizedString(user[field]), 'must start with a capital letter'));
  check('age', typeof user.age === 'number' && Number.isFinite(user.age), 'must be a number');
  check('email', typeof user.email === 'string' && EMAIL_FORMAT.test(user.email), 'must be a valid email address');

  const phoneFormat = PHONE_FORMATS[user.country] ?? DEFAULT_PHONE_FORMAT;
  check('phone', typeof user.phone === 'string' && phoneFormat.test(user.phone), `does not match the format for ${user.country}`);

  return { valid: errors.length === 0, errors };
};

const matchesAge = (age, condition) => {
  if (typeof condition === 'number') return age === condition;
  const range = String(condition).trim().match(AGE_RANGE);
  if (range) return age >= Number(range[1]) && age <= Number(range[2]);
  const [, operator = '=', limit] = String(condition).trim().match(AGE_CONDITION) ?? [];
  if (limit === undefined) return false;
  const value = Number(limit);
  return {
    '=': age === value,
    '>': age > value,
    '<': age < value,
    '>=': age >= value,
    '<=': age <= value,
  }[operator];
};

export const filterUsers = (users, { country, age, gender, favorite, photo } = {}) =>
  users.filter((user) =>
    (country === undefined || user.country === country) &&
    (age === undefined || matchesAge(user.age, age)) &&
    (gender === undefined || user.gender?.toLowerCase() === gender.toLowerCase()) &&
    (favorite === undefined || user.favorite === favorite) &&
    (photo === undefined || Boolean(user.picture_large) === photo));

const isMissing = (value) => value == null || Number.isNaN(value);

const compareValues = (a, b) => {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
};

export const sortUsers = (users, field, order = 'asc') => {
  if (!SORTABLE_FIELDS.includes(field)) throw new Error(`Cannot sort by "${field}"`);
  const key = FIELD_ALIASES[field] ?? field;
  const direction = order === 'desc' ? -1 : 1;
  const value = (user) => (key === 'b_date' ? Date.parse(user.b_date) : user[key]);
  return [...users].sort((a, b) => {
    const [first, second] = [value(a), value(b)];
    if (isMissing(first) || isMissing(second)) return isMissing(first) - isMissing(second);
    return direction * compareValues(first, second);
  });
};

const containsText = (value, query) =>
  typeof value === 'string' && value.toLowerCase().includes(String(query).toLowerCase());

const matchesQuery = (user, { name, note, age }) =>
  (name === undefined || containsText(user.full_name, name)) &&
  (note === undefined || containsText(user.note, note)) &&
  (age === undefined || matchesAge(user.age, age));

export const findUser = (users, query) => users.find((user) => matchesQuery(user, query));

export const searchUsers = (users, text) => {
  const query = String(text ?? '').trim();
  if (!query) return users;
  if (AGE_CONDITION.test(query) || AGE_RANGE.test(query)) return users.filter((user) => matchesAge(user.age, query));
  return users.filter((user) => matchesQuery(user, { name: query }) || matchesQuery(user, { note: query }));
};

export const percentMatching = (users, query) => {
  if (users.length === 0) return 0;
  const matching = users.filter((user) => matchesQuery(user, query)).length;
  return Number(((matching / users.length) * 100).toFixed(2));
};
