const FORECAST_API = 'https://api.open-meteo.com/v1/forecast';
const FORECAST_DAYS = 5;
const DAILY_FIELDS = [
  'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'wind_speed_10m_max', 'wind_direction_10m_dominant',
  'precipitation_probability_max', 'relative_humidity_2m_mean', 'pressure_msl_mean', 'uv_index_max', 'sunrise', 'sunset',
];

const toForecast = ({ timezone, current, daily }) => ({
  timezone,
  current: { temperature: current.temperature_2m, code: current.weather_code },
  days: daily.time.map((date, index) => ({
    date,
    code: daily.weather_code[index],
    max: daily.temperature_2m_max[index],
    min: daily.temperature_2m_min[index],
    windSpeed: daily.wind_speed_10m_max[index],
    windDirection: daily.wind_direction_10m_dominant[index],
    precipitation: daily.precipitation_probability_max[index],
    humidity: daily.relative_humidity_2m_mean[index],
    pressure: daily.pressure_msl_mean[index],
    uvIndex: daily.uv_index_max[index],
    sunrise: daily.sunrise[index],
    sunset: daily.sunset[index],
  })),
});

export async function fetchForecast({ latitude, longitude }, { signal } = {}) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    daily: DAILY_FIELDS.join(','),
    current: 'temperature_2m,weather_code',
    timezone: 'auto',
    forecast_days: FORECAST_DAYS,
    wind_speed_unit: 'ms',
  });
  const response = await fetch(`${FORECAST_API}?${params}`, { signal });
  if (!response.ok) throw new Error(`Weather request failed with status ${response.status}`);
  return toForecast(await response.json());
}
