import { useMemo, useState } from 'react';
import { AuthContext } from './AuthContext.js';
import { deleteCookie, getCookie, setCookie } from '../lib/cookies.js';

const AUTH_COOKIE = 'weather_user';
const REMEMBER_FOR = 60 * 60 * 24 * 7;

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCookie(AUTH_COOKIE));

  const value = useMemo(() => ({
    user,
    login: (name, remember) => {
      setCookie(AUTH_COOKIE, name, { maxAge: remember ? REMEMBER_FOR : undefined });
      setUser(name);
    },
    logout: () => {
      deleteCookie(AUTH_COOKIE);
      setUser(null);
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
