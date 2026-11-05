import { describeWeather } from '../lib/weatherCodes.js';
import { compassPoint, temperature } from '../lib/format.js';
import './DayCard.css';

export default function DayCard({ title, day }) {
  const weather = describeWeather(day.code);

  return (
    <article className="day">
      <h3 className="day__title">{title}</h3>
      <p className="day__summary">
        <span className="day__icon" aria-hidden="true">{weather.icon}</span>
        {weather.label}
      </p>
      <p>Max: {temperature(day.max)}</p>
      <p>Min: {temperature(day.min)}</p>
      <p className="day__wind">
        <span className="day__arrow" style={{ transform: `rotate(${day.windDirection + 180}deg)` }} aria-hidden="true">↑</span>
        {Math.round(day.windSpeed)} m/s {compassPoint(day.windDirection)}
      </p>
      <dl className="day__details">
        <dt>Humidity</dt>
        <dd>{Math.round(day.humidity)}%</dd>
        <dt>Pressure</dt>
        <dd>{Math.round(day.pressure)} hPa</dd>
        <dt>Precipitation</dt>
        <dd>{day.precipitation}%</dd>
        <dt>UV index</dt>
        <dd>{day.uvIndex.toFixed(1)}</dd>
      </dl>
    </article>
  );
}
