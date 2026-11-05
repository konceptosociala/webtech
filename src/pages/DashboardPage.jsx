import Header from '../components/Header.jsx';
import Loader from '../components/Loader.jsx';
import DayCard from '../components/DayCard.jsx';
import { useForecast } from '../hooks/useForecast.js';
import { coordinates, currentTime, dayTitle, localTime, temperature } from '../lib/format.js';
import { describeWeather } from '../lib/weatherCodes.js';
import './DashboardPage.css';

export default function DashboardPage() {
  const { status, place, forecast, retry } = useForecast();

  return (
    <>
      <Header />
      <main className="dashboard">
        {status === 'loading' && <Loader label="Loading weather…" />}

        {status === 'error' && (
          <div className="dashboard__error" role="alert">
            <p>Couldn&apos;t load the weather. Check your connection and try again.</p>
            <button type="button" onClick={retry}>Try again</button>
          </div>
        )}

        {status === 'ready' && (
          <>
            <section className="place">
              <div>
                <h1 className="place__name">
                  {place.name} <small>{place.country ?? coordinates(place)}</small>
                </h1>
                <p className="place__now">
                  Now {temperature(forecast.current.temperature)}, {describeWeather(forecast.current.code).label.toLowerCase()}
                </p>
                {place.isDefault && <p className="place__hint">Allow location access to see the weather where you are.</p>}
              </div>
              <dl className="place__times">
                <dt>Time</dt>
                <dd>{currentTime(forecast.timezone)}</dd>
                <dt>Sunrise</dt>
                <dd>{localTime(forecast.days[0].sunrise)}</dd>
                <dt>Sunset</dt>
                <dd>{localTime(forecast.days[0].sunset)}</dd>
              </dl>
            </section>

            <ul className="days">
              {forecast.days.map((day, index) => (
                <li key={day.date}>
                  <DayCard title={dayTitle(day.date, index)} day={day} />
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}
