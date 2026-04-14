import React, { useState, useEffect } from 'react';
import './App.css';

const API_KEY = process.env.REACT_APP_WEATHER_KEY;

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => {
    return JSON.parse(localStorage.getItem('searchHistory')) || [];
  });
  const [bg, setBg] = useState('default');

  const getBackground = (condition) => {
    if (!condition) return 'default';
    const c = condition.toLowerCase();
    if (c.includes('clear')) return 'sunny';
    if (c.includes('cloud')) return 'cloudy';
    if (c.includes('rain') || c.includes('drizzle')) return 'rainy';
    if (c.includes('thunder')) return 'thunder';
    if (c.includes('snow')) return 'snow';
    if (c.includes('mist') || c.includes('fog')) return 'mist';
    return 'default';
  };

  const fetchWeather = async (searchCity) => {
    const target = searchCity || city;
    if (!target) return;
    setLoading(true);
    setError('');
    setWeather(null);
    setForecast([]);
    try {
      const [weatherRes, forecastRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${target}&appid=${API_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${target}&appid=${API_KEY}&units=metric`)
      ]);
      if (!weatherRes.ok) throw new Error('City not found');
      const weatherData = await weatherRes.json();
      const forecastData = await forecastRes.json();
      setWeather(weatherData);
      setBg(getBackground(weatherData.weather[0].main));
      const daily = forecastData.list.filter((_, i) => i % 8 === 0).slice(0, 5);
      setForecast(daily);
      const newHistory = [target, ...history.filter(h => h !== target)].slice(0, 5);
      setHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    } catch (err) {
      setError('City not found. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchByLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const [weatherRes, forecastRes] = await Promise.all([
          fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`),
          fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`)
        ]);
        const weatherData = await weatherRes.json();
        const forecastData = await forecastRes.json();
        setWeather(weatherData);
        setCity(weatherData.name);
        setBg(getBackground(weatherData.weather[0].main));
        const daily = forecastData.list.filter((_, i) => i % 8 === 0).slice(0, 5);
        setForecast(daily);
        const newHistory = [weatherData.name, ...history.filter(h => h !== weatherData.name)].slice(0, 5);
        setHistory(newHistory);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      } catch {
        setError('Location fetch failed.');
      } finally {
        setLoading(false);
      }
    }, () => {
      setError('Location access denied.');
      setLoading(false);
    });
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') fetchWeather();
  };

  return (
    <div className={`app bg-${bg}`}>
      <div className="card">
        <h1>🌤 Weather App</h1>

        <div className="search">
          <input
            type="text"
            placeholder="Enter city name..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={handleKey}
          />
          <button onClick={() => fetchWeather()}>Search</button>
          <button className="loc-btn" onClick={fetchByLocation}>📍</button>
        </div>

        {history.length > 0 && (
          <div className="history">
            {history.map((h, i) => (
              <span key={i} onClick={() => { setCity(h); fetchWeather(h); }}>{h}</span>
            ))}
          </div>
        )}

        {loading && <p className="loading">Loading...</p>}
        {error && <p className="error">{error}</p>}

        {weather && (
          <div className="weather-info">
            <h2>{weather.name}, {weather.sys.country}</h2>
            <img
              src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
              alt={weather.weather[0].description}
              onError={(e) => e.target.style.display='none'}
            />
            <p className="temp">{Math.round(weather.main.temp)}°C</p>
            <p className="desc">{weather.weather[0].description}</p>
            <div className="details">
              <span>💧 {weather.main.humidity}%</span>
              <span>💨 {weather.wind.speed} m/s</span>
              <span>🌡️ Feels like {Math.round(weather.main.feels_like)}°C</span>
            </div>
          </div>
        )}

        {forecast.length > 0 && (
          <div className="forecast">
            <h3>5-Day Forecast</h3>
            <div className="forecast-grid">
              {forecast.map((day, i) => (
                <div key={i} className="forecast-card">
                  <p className="day">{new Date(day.dt * 1000).toLocaleDateString('en', { weekday: 'short' })}</p>
                  <img
                    src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
                    alt={day.weather[0].description}
                    onError={(e) => e.target.style.display='none'}
                  />
                  <p className="f-temp">{Math.round(day.main.temp)}°C</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;