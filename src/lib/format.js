const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const DAY_FORMAT = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

export const dayTitle = (date, index) => {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  return DAY_FORMAT.format(new Date(`${date}T00:00:00Z`));
};

export const localTime = (isoDateTime) => isoDateTime.slice(11, 16);

export const currentTime = (timeZone) =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone }).format(new Date());

export const compassPoint = (degrees) => COMPASS[Math.round(degrees / 45) % COMPASS.length];

export const temperature = (value) => `${Math.round(value)}°C`;

export const coordinates = ({ latitude, longitude }) =>
  `${Math.abs(latitude).toFixed(2)}°${latitude >= 0 ? 'N' : 'S'}, ${Math.abs(longitude).toFixed(2)}°${longitude >= 0 ? 'E' : 'W'}`;
