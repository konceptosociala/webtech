import { useCallback, useEffect, useState } from 'react';
import { fetchForecast } from '../api/weather.js';

const KYIV = { name: 'Kyiv', country: 'Ukraine', latitude: 50.4501, longitude: 30.5234, isDefault: true };
const GEOLOCATION_OPTIONS = { timeout: 5000, maximumAge: 10 * 60 * 1000 };

const locate = () => new Promise((resolve) => {
  if (!navigator.geolocation) {
    resolve(null);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve({ name: 'Your location', latitude: coords.latitude, longitude: coords.longitude }),
    () => resolve(null),
    GEOLOCATION_OPTIONS,
  );
});

export function useForecast() {
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });

    const load = async () => {
      try {
        const place = (await locate()) ?? KYIV;
        const forecast = await fetchForecast(place, { signal: controller.signal });
        if (!controller.signal.aborted) setState({ status: 'ready', place, forecast });
      } catch (error) {
        if (!controller.signal.aborted) setState({ status: 'error', error });
      }
    };

    load();
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);
  return { ...state, retry };
}
