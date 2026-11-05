export const getCookie = (name) => {
  const entry = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
};

export const setCookie = (name, value, { maxAge } = {}) => {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'path=/', 'SameSite=Lax'];
  if (maxAge) parts.push(`max-age=${maxAge}`);
  document.cookie = parts.join('; ');
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=; path=/; max-age=0`;
};
