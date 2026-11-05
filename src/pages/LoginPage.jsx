import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext.js';
import { checkCredentials, validateLoginForm } from '../auth/credentials.js';
import './LoginPage.css';

const EMPTY_FORM = { login: '', password: '', remember: false };

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  if (user) return <Navigate to="/dashboard" replace />;

  const handleChange = ({ target }) => {
    const value = target.type === 'checkbox' ? target.checked : target.value;
    setValues((current) => ({ ...current, [target.name]: value }));
    setErrors((current) => ({ ...current, [target.name]: undefined, form: undefined }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const fieldErrors = validateLoginForm(values);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    if (!checkCredentials(values)) {
      setErrors({ form: 'Incorrect login or password' });
      return;
    }
    login(values.login.trim().toLowerCase(), values.remember);
    navigate('/dashboard', { replace: true });
  };

  return (
    <main className="login">
      <form className="login__card" onSubmit={handleSubmit} noValidate>
        <h1 className="login__title">Log to Web App</h1>

        {errors.form && <p className="login__alert" role="alert">{errors.form}</p>}

        <Field label="Login" name="login" value={values.login} error={errors.login}
          onChange={handleChange} placeholder="Username" autoComplete="username" />
        <Field label="Password" name="password" type="password" value={values.password} error={errors.password}
          onChange={handleChange} placeholder="••••••" autoComplete="current-password" />

        <label className="login__remember">
          <input type="checkbox" name="remember" checked={values.remember} onChange={handleChange} />
          Remember me
        </label>

        <button type="submit" className="login__submit">Login</button>
      </form>
    </main>
  );
}

function Field({ label, name, error, ...inputProps }) {
  const errorId = `${name}-error`;
  return (
    <div className="login__field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} {...inputProps} />
      {error && <p className="login__error" id={errorId}>{error}</p>}
    </div>
  );
}
