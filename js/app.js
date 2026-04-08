/**
 * Wetter & Tagesplan App
 * Verwendet die Open-Meteo API für Wetterdaten (kostenlos, kein API-Key nötig)
 * V1.1: Sonnenaufgang/Sonnenuntergang, Min/Max-Temperatur in Vorhersage, Windrichtung
 */

// === API-Konfiguration ===
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

// === DOM-Elemente ===
const elements = {
    cityInput: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    locationBtn: document.getElementById('locationBtn'),
    celsiusBtn: document.getElementById('celsiusBtn'),
    fahrenheitBtn: document.getElementById('fahrenheitBtn'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    weatherSection: document.getElementById('weatherSection'),
    cityName: document.getElementById('cityName'),
    weatherDate: document.getElementById('weatherDate'),
    weatherIcon: document.getElementById('weatherIcon'),
    temperature: document.getElementById('temperature'),
    weatherDescription: document.getElementById('weatherDescription'),
    humidity: document.getElementById('humidity'),
    wind: document.getElementById('wind'),
    windDirection: document.getElementById('windDirection'),
    feelsLike: document.getElementById('feelsLike'),
    sunrise: document.getElementById('sunrise'),
    sunset: document.getElementById('sunset'),
    recommendationsList: document.getElementById('recommendationsList'),
    forecastList: document.getElementById('forecastList')
};

// === Zustandsvariablen ===
let currentUnit = 'celsius'; // 'celsius' oder 'fahrenheit'
let currentWeatherData = null;
let currentLocationName = '';

// === Inline SVG Weather Icons ===
const WEATHER_ICONS = {
    sunny: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="12" fill="#FFD600"/>
        <g stroke="#FFD600" stroke-width="3" stroke-linecap="round">
            <line x1="32" y1="6"  x2="32" y2="14"/>
            <line x1="32" y1="50" x2="32" y2="58"/>
            <line x1="6"  y1="32" x2="14" y2="32"/>
            <line x1="50" y1="32" x2="58" y2="32"/>
            <line x1="13.4" y1="13.4" x2="19.3" y2="19.3"/>
            <line x1="44.7" y1="44.7" x2="50.6" y2="50.6"/>
            <line x1="50.6" y1="13.4" x2="44.7" y2="19.3"/>
            <line x1="19.3" y1="44.7" x2="13.4" y2="50.6"/>
        </g>
    </svg>`,
    cloudy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <circle cx="24" cy="30" r="10" fill="#B0BEC5"/>
        <circle cx="36" cy="26" r="12" fill="#CFD8DC"/>
        <circle cx="46" cy="32" r="8"  fill="#CFD8DC"/>
        <rect x="14" y="32" width="40" height="10" rx="5" fill="#CFD8DC"/>
    </svg>`,
    rainy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <circle cx="24" cy="24" r="9"  fill="#90A4AE"/>
        <circle cx="36" cy="20" r="11" fill="#B0BEC5"/>
        <circle cx="46" cy="26" r="7"  fill="#B0BEC5"/>
        <rect x="14" y="26" width="38" height="9" rx="4.5" fill="#B0BEC5"/>
        <g stroke="#42A5F5" stroke-width="2.5" stroke-linecap="round">
            <line x1="22" y1="40" x2="19" y2="52"/>
            <line x1="32" y1="40" x2="29" y2="52"/>
            <line x1="42" y1="40" x2="39" y2="52"/>
        </g>
    </svg>`,
    snowy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <circle cx="24" cy="24" r="9"  fill="#B0BEC5"/>
        <circle cx="36" cy="20" r="11" fill="#CFD8DC"/>
        <circle cx="46" cy="26" r="7"  fill="#CFD8DC"/>
        <rect x="14" y="26" width="38" height="9" rx="4.5" fill="#CFD8DC"/>
        <g fill="#90CAF9">
            <circle cx="22" cy="46" r="3"/>
            <circle cx="32" cy="50" r="3"/>
            <circle cx="42" cy="46" r="3"/>
        </g>
    </svg>`,
    stormy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <circle cx="22" cy="22" r="9"  fill="#607D8B"/>
        <circle cx="35" cy="18" r="12" fill="#78909C"/>
        <circle cx="46" cy="24" r="8"  fill="#78909C"/>
        <rect x="12" y="24" width="40" height="10" rx="5" fill="#78909C"/>
        <polyline points="34,36 28,46 33,46 27,58" stroke="#FFD600" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill="none"/>
    </svg>`,
    fog: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <g stroke="#B0BEC5" stroke-width="3" stroke-linecap="round">
            <line x1="10" y1="24" x2="54" y2="24"/>
            <line x1="14" y1="32" x2="50" y2="32"/>
            <line x1="10" y1="40" x2="54" y2="40"/>
            <line x1="16" y1="48" x2="48" y2="48"/>
        </g>
    </svg>`,
    default: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <circle cx="22" cy="30" r="10" fill="#FFD600" opacity="0.8"/>
        <circle cx="36" cy="26" r="12" fill="#CFD8DC"/>
        <circle cx="46" cy="32" r="8"  fill="#CFD8DC"/>
        <rect x="14" y="32" width="40" height="10" rx="5" fill="#CFD8DC"/>
    </svg>`
};

function getWeatherIconSVG(type) {
    return WEATHER_ICONS[type] || WEATHER_ICONS['default'];
}

// === WMO Wettercodes ===
const WMO_CODES = {
    0:  { type: 'sunny',  desc: 'Klar' },
    1:  { type: 'sunny',  desc: 'Überwiegend klar' },
    2:  { type: 'cloudy', desc: 'Teilweise bewölkt' },
    3:  { type: 'cloudy', desc: 'Bewölkt' },
    45: { type: 'fog',    desc: 'Neblig' },
    48: { type: 'fog',    desc: 'Reifnebel' },
    51: { type: 'rainy',  desc: 'Leichter Nieselregen' },
    53: { type: 'rainy',  desc: 'Nieselregen' },
    55: { type: 'rainy',  desc: 'Starker Nieselregen' },
    56: { type: 'rainy',  desc: 'Gefrierender Nieselregen' },
    57: { type: 'rainy',  desc: 'Starker gefrierender Nieselregen' },
    61: { type: 'rainy',  desc: 'Leichter Regen' },
    63: { type: 'rainy',  desc: 'Mäßiger Regen' },
    65: { type: 'rainy',  desc: 'Starker Regen' },
    66: { type: 'rainy',  desc: 'Gefrierender Regen' },
    67: { type: 'rainy',  desc: 'Starker gefrierender Regen' },
    71: { type: 'snowy',  desc: 'Leichter Schneefall' },
    73: { type: 'snowy',  desc: 'Mäßiger Schneefall' },
    75: { type: 'snowy',  desc: 'Starker Schneefall' },
    77: { type: 'snowy',  desc: 'Schneekörner' },
    80: { type: 'rainy',  desc: 'Leichter Regenschauer' },
    81: { type: 'rainy',  desc: 'Regenschauer' },
    82: { type: 'rainy',  desc: 'Starke Regenschauer' },
    85: { type: 'snowy',  desc: 'Leichter Schneeschauer' },
    86: { type: 'snowy',  desc: 'Schneeschauer' },
    95: { type: 'stormy', desc: 'Gewitter' },
    96: { type: 'stormy', desc: 'Gewitter mit leichtem Hagel' },
    99: { type: 'stormy', desc: 'Gewitter mit Hagel' }
};

// === Windrichtung aus Grad berechnen ===
function degreesToCompass(degrees) {
    if (degrees === null || degrees === undefined) return '–';
    const dirs = ['N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return dirs[index];
}

// === Uhrzeit aus ISO-String formatieren (HH:MM) ===
function formatTime(isoString) {
    if (!isoString) return '–';
    const date = new Date(isoString);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

// === Initialisierung ===
document.addEventListener('DOMContentLoaded', () => {
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    elements.locationBtn.addEventListener('click', handleLocationRequest);
    elements.celsiusBtn.addEventListener('click', () => switchUnit('celsius'));
    elements.fahrenheitBtn.addEventListener('click', () => switchUnit('fahrenheit'));
});

// === Event Handler ===

async function handleSearch() {
    const city = elements.cityInput.value.trim();
    if (!city) {
        showError('Bitte gib eine Stadt ein.');
        return;
    }
    try {
        showLoading(true);
        hideError();
        const geoData = await geocodeCity(city);
        if (!geoData) throw new Error('Stadt nicht gefunden. Bitte überprüfe die Schreibweise.');
        currentLocationName = `${geoData.name}, ${geoData.country || ''}`;
        await fetchWeatherData(geoData.latitude, geoData.longitude);
    } catch (error) {
        showLoading(false);
        showError(error.message);
    }
}

function handleLocationRequest() {
    if (!navigator.geolocation) {
        showError('Geolocation wird von diesem Browser nicht unterstützt.');
        return;
    }
    showLoading(true);
    hideError();
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const locationName = await reverseGeocode(latitude, longitude);
                currentLocationName = locationName;
                elements.cityInput.value = locationName.split(',')[0];
                await fetchWeatherData(latitude, longitude);
            } catch (error) {
                showError(error.message);
            }
        },
        (error) => {
            showLoading(false);
            switch (error.code) {
                case error.PERMISSION_DENIED:      showError('Standort-Zugriff wurde verweigert.'); break;
                case error.POSITION_UNAVAILABLE:   showError('Standort-Informationen nicht verfügbar.'); break;
                case error.TIMEOUT:                showError('Zeitüberschreitung bei der Standort-Abfrage.'); break;
                default:                           showError('Unbekannter Fehler bei der Standort-Abfrage.');
            }
        }
    );
}

async function switchUnit(unit) {
    if (currentUnit === unit) return;
    currentUnit = unit;
    elements.celsiusBtn.classList.toggle('active', unit === 'celsius');
    elements.fahrenheitBtn.classList.toggle('active', unit === 'fahrenheit');
    if (currentWeatherData) {
        displayCurrentWeather(currentWeatherData);
        displayForecast(currentWeatherData);
    }
}

// === API-Funktionen ===

async function geocodeCity(cityName) {
    const url = `${GEOCODING_URL}?name=${encodeURIComponent(cityName)}&count=1&language=de&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.results || data.results.length === 0) return null;
    return data.results[0];
}

async function reverseGeocode(lat, lon) {
    try {
        await fetch(`${GEOCODING_URL}?latitude=${lat}&longitude=${lon}&count=1&language=de&format=json`);
        return `Standort (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
    } catch {
        return `Standort (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
    }
}

async function fetchWeatherData(lat, lon) {
    try {
        // V1.1: wind_direction_10m zu current hinzugefügt; sunrise & sunset zu daily hinzugefügt
        const url = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
            `&timezone=auto&forecast_days=6`;
        const response = await fetch(url);
        const data = await response.json();
        if (!data.current) throw new Error('Keine Wetterdaten verfügbar.');
        currentWeatherData = data;
        displayCurrentWeather(data);
        displayForecast(data);
        generateRecommendations(data);
        updateBackgroundTheme(data.current.weather_code);
        showLoading(false);
        showWeatherSection(true);
    } catch (error) {
        showLoading(false);
        throw error;
    }
}

// === Display-Funktionen ===

function displayCurrentWeather(data) {
    const current = data.current;
    const daily   = data.daily;
    const unitSymbol = currentUnit === 'celsius' ? '°C' : '°F';

    elements.cityName.textContent    = currentLocationName || 'Unbekannter Ort';
    elements.weatherDate.textContent = formatDate(new Date());

    const weatherInfo = WMO_CODES[current.weather_code] || { type: 'default', desc: 'Unbekannt' };
    const iconSVG = getWeatherIconSVG(weatherInfo.type);
    elements.weatherIcon.outerHTML = `<div id="weatherIcon" class="weather-icon" aria-label="${weatherInfo.desc}" role="img">${iconSVG}</div>`;
    elements.weatherIcon = document.getElementById('weatherIcon');

    elements.temperature.textContent       = `${Math.round(current.temperature_2m)}${unitSymbol}`;
    elements.weatherDescription.textContent = weatherInfo.desc;
    elements.humidity.textContent          = `${current.relative_humidity_2m}%`;

    // Wind: Geschwindigkeit + Richtung (V1.1)
    const windDir = degreesToCompass(current.wind_direction_10m);
    elements.wind.textContent          = `${Math.round(current.wind_speed_10m)} km/h`;
    if (elements.windDirection) {
        elements.windDirection.textContent = windDir;
    }

    elements.feelsLike.textContent = `${Math.round(current.apparent_temperature)}${unitSymbol}`;

    // Sonnenaufgang & Sonnenuntergang für heute (Index 0) (V1.1)
    if (elements.sunrise && daily && daily.sunrise) {
        elements.sunrise.textContent = formatTime(daily.sunrise[0]);
    }
    if (elements.sunset && daily && daily.sunset) {
        elements.sunset.textContent = formatTime(daily.sunset[0]);
    }
}

function displayForecast(data) {
    elements.forecastList.innerHTML = '';
    const daily = data.daily;
    if (!daily) return;

    const unitSymbol = currentUnit === 'celsius' ? '°C' : '°F';

    for (let i = 1; i < Math.min(6, daily.time.length); i++) {
        const dateStr    = daily.time[i];
        const maxTemp    = daily.temperature_2m_max[i];
        const minTemp    = daily.temperature_2m_min[i];   // V1.1: Min-Temperatur
        const weatherCode = daily.weather_code[i];
        const weatherInfo = WMO_CODES[weatherCode] || { type: 'default', desc: 'Unbekannt' };
        const iconSVG    = getWeatherIconSVG(weatherInfo.type);

        const card = document.createElement('div');
        card.className = 'forecast-card';
        // V1.1: Min/Max statt nur Max anzeigen
        card.innerHTML = `
            <div class="day">${formatDay(dateStr)}</div>
            <div class="forecast-icon" aria-label="${weatherInfo.desc}" role="img">${iconSVG}</div>
            <div class="forecast-temp">
                <span class="temp-max">${Math.round(maxTemp)}${unitSymbol}</span>
                <span class="temp-min">${Math.round(minTemp)}${unitSymbol}</span>
            </div>
            <div class="forecast-desc">${weatherInfo.desc}</div>
        `;
        elements.forecastList.appendChild(card);
    }
}

function generateRecommendations(data) {
    const current = data.current;
    const recommendations = [];
    const temp        = current.temperature_2m;
    const weatherCode = current.weather_code;
    const windSpeed   = current.wind_speed_10m;
    const humidity    = current.relative_humidity_2m;

    const weatherInfo = WMO_CODES[weatherCode] || { type: 'default', desc: '' };
    const weatherType = weatherInfo.type;

    if (temp < 5) {
        recommendations.push({ type: 'negative', icon: '🧥', text: 'Achte auf warme Kleidung – es ist sehr kalt!' });
    } else if (temp >= 5 && temp < 15) {
        recommendations.push({ type: 'warning',  icon: '🧣', text: 'Nimm eine zusätzliche Schicht mit – es ist kühl.' });
    } else if (temp >= 20 && temp < 30) {
        recommendations.push({ type: 'positive', icon: '☀️', text: 'Angenehme Temperaturen – ideal für Aktivitäten draußen!' });
    } else if (temp >= 30) {
        recommendations.push({ type: 'warning',  icon: '🥤', text: 'Sehr heiß! Trink genug Wasser und such den Schatten auf.' });
    }

    if (weatherType === 'rainy') {
        recommendations.push({ type: 'negative', icon: '☔',  text: 'Nimm einen Regenschirm oder eine Regenjacke mit!' });
        recommendations.push({ type: 'neutral',  icon: '📚', text: 'Guter Tag zum Lernen drinnen oder für Indoor-Aktivitäten.' });
    } else if (weatherType === 'snowy') {
        recommendations.push({ type: 'warning',  icon: '⛷️', text: 'Schnee! Gute Zeit für Winteraktivitäten oder gemütliche Stunden drinnen.' });
    } else if (weatherType === 'stormy') {
        recommendations.push({ type: 'negative', icon: '⛈️', text: 'Gewitter! Bleib drinnen und vermeide offene Flächen.' });
    } else if (weatherType === 'sunny') {
        recommendations.push({ type: 'positive', icon: '🚴', text: 'Perfektes Wetter zum Fahrradfahren oder Spazieren!' });
        if (temp > 20) recommendations.push({ type: 'positive', icon: '🌳', text: 'Ideal für einen Parkbesuch oder Picknick.' });
        if (temp > 15) recommendations.push({ type: 'warning',  icon: '🧴', text: 'Denk an Sonnencreme bei längerem Aufenthalt draußen.' });
    } else if (weatherType === 'cloudy') {
        if (temp >= 15 && temp <= 25) {
            recommendations.push({ type: 'positive', icon: '🚶', text: 'Bewölkt, aber angenehm – gut für einen Spaziergang.' });
        }
    }

    if (windSpeed > 40) {
        recommendations.push({ type: 'warning', icon: '💨', text: 'Starker Wind! Fahrrad fahren könnte schwierig sein.' });
    } else if (windSpeed > 25 && windSpeed <= 40) {
        recommendations.push({ type: 'neutral', icon: '🌬️', text: 'Brisanter Wind – beachte das beim Radfahren.' });
    }

    if (humidity > 80 && temp > 20) {
        recommendations.push({ type: 'warning', icon: '😓', text: 'Hohe Luftfeuchtigkeit – es könnte sich schwül anfühlen.' });
    }

    if (recommendations.length === 0) {
        recommendations.push({ type: 'neutral', icon: '🌤️', text: 'Normales Wetter – genieße den Tag!' });
    }

    displayRecommendations(recommendations.slice(0, 5));
}

function displayRecommendations(recommendations) {
    elements.recommendationsList.innerHTML = '';
    recommendations.forEach(rec => {
        const item = document.createElement('div');
        item.className = `recommendation-item ${rec.type}`;
        item.innerHTML = `
            <span class="recommendation-icon">${rec.icon}</span>
            <span>${rec.text}</span>
        `;
        elements.recommendationsList.appendChild(item);
    });
}

function updateBackgroundTheme(weatherCode) {
    const body = document.body;
    body.classList.remove('weather-sunny', 'weather-cloudy', 'weather-rainy', 'weather-stormy', 'weather-snowy');
    const weatherInfo = WMO_CODES[weatherCode] || { type: 'default' };
    switch (weatherInfo.type) {
        case 'sunny':  body.classList.add('weather-sunny');  break;
        case 'cloudy': body.classList.add('weather-cloudy'); break;
        case 'rainy':  body.classList.add('weather-rainy');  break;
        case 'stormy': body.classList.add('weather-stormy'); break;
        case 'snowy':  body.classList.add('weather-snowy');  break;
    }
}

// === CSS für SVG-Icons nachrüsten ===
(function injectIconStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .weather-icon svg, .forecast-icon svg {
            width: 100%;
            height: 100%;
        }
        .weather-icon, #weatherIcon {
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .forecast-icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
        }
        /* V1.1: Min/Max Temperaturen in Vorhersage */
        .forecast-temp {
            display: flex;
            gap: 6px;
            justify-content: center;
            align-items: baseline;
        }
        .temp-max {
            font-weight: 700;
            font-size: 1em;
        }
        .temp-min {
            font-size: 0.82em;
            opacity: 0.6;
        }
    `;
    document.head.appendChild(style);
})();

// === Hilfsfunktionen ===

function formatDate(date) {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('de-DE', options);
}

function formatDay(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    if (checkDate.getTime() === today.getTime())     return 'Heute';
    if (checkDate.getTime() === tomorrow.getTime())  return 'Morgen';
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('de-DE', options);
}

function showLoading(show) {
    elements.loading.classList.toggle('hidden', !show);
    if (show) showWeatherSection(false);
}

function showError(message) {
    elements.errorText.textContent = message;
    elements.errorMessage.classList.remove('hidden');
    showWeatherSection(false);
}

function hideError() {
    elements.errorMessage.classList.add('hidden');
}

function showWeatherSection(show) {
    elements.weatherSection.classList.toggle('hidden', !show);
}
