const RANDOM_USER_API = 'https://randomuser.me/api/';
const TEACHERS_API = 'http://localhost:3000/teachers';
const REQUEST_TIMEOUT = 10000;

const request = async (url, options = {}) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT), ...options });
  if (!response.ok) throw new Error(`${options.method ?? 'GET'} ${url} failed with status ${response.status}`);
  return response.json();
};

export const fetchRandomUsers = async ({ results, page }) => {
  const params = new URLSearchParams({ results, page });
  const { results: users } = await request(`${RANDOM_USER_API}?${params}`);
  return users;
};

export const fetchSavedTeachers = () => request(TEACHERS_API);

export const saveTeacher = (teacher) => request(TEACHERS_API, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(teacher),
});
