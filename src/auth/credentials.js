const CREDENTIALS = { login: 'oleksandr4', password: 'oleksandr4' };

export const validateLoginForm = ({ login, password }) => {
  const errors = {};
  if (!login.trim()) errors.login = 'Enter your login';
  if (!password) errors.password = 'Enter your password';
  return errors;
};

export const checkCredentials = ({ login, password }) =>
  login.trim().toLowerCase() === CREDENTIALS.login && password === CREDENTIALS.password;
