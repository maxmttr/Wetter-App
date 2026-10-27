/**
 * Wetter & Tagesplan App
 * Open-Meteo API — kostenlos, kein API-Key
 * V1.1: Sonnenaufgang/Sonnenuntergang, Min/Max-Temperatur, Windrichtung
 * V1.2: Stundenvorhersage, Temperaturchart (Chart.js), Städte-Vergleich, Niederschlagswahrscheinlichkeit
 * V1.3: UX & Fehlerzustände, Autocomplete, Favoriten, Cache (siehe storage.js / autocomplete.js)
 */

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL   = 'https://api.open-meteo.com/v1/forecast';

const elements = {
    cityInput:           document.getElementById('cityInput'),
    searchBtn:           document.getElementById('searchBtn'),
    locationBtn:         document.getElementById('locationBtn'),
    celsiusBtn:          document.getElementById('celsiusBtn'),
    fahrenheitBtn:       document.getElementById('fahrenheitBtn'),
    loading:             document.getElementById('loading'),
    errorMessage:        document.getElementById('errorMessage'),
    errorText:           document.getElementById('errorText'),
    errorSuggestion:     document.getElementById('errorSuggestion'),
    weatherSection:      document.getElementById('weatherSection'),
    emptyState:          document.getElementById('emptyState'),
    skeleton:            document.getElementById('skeleton'),
    cityName:            document.getElementById('cityName'),
    weatherDate:         document.getElementById('weatherDate'),
    weatherIcon:         document.getElementById('weatherIcon'),
    temperature:         document.getElementById('temperature'),
    weatherDescription:  document.getElementById('weatherDescription'),
    humidity:            document.getElementById('humidity'),
    wind:                document.getElementById('wind'),
    windDirection:       document.getElementById('windDirection'),
    feelsLike:           document.getElementById('feelsLike'),
    sunrise:             document.getElementById('sunrise'),
    sunset:              document.getElementById('sunset'),
    recommendationsList: document.getElementById('recommendationsList'),
    forecastList:        document.getElementById('forecastList'),
    updatedAt:           document.getElementById('updatedAt'),
    favoriteBtn:         document.getElementById('favoriteBtn'),
    autocompleteList:    document.getElementById('autocompleteList'),
    favoritesList:       document.getElementById('favoritesList'),
    recentList:          document.getElementById('recentList'),
    hourlyList:          document.getElementById('hourlyList'),
    tempChartCanvas:     document.getElementById('tempChart'),
    compareBtn:          document.getElementById('compareBtn'),
    compareSection:      document.getElementById('compareSection'),
    compareInput:        document.getElementById('compareInput'),
    compareSearchBtn:    document.getElementById('compareSearchBtn'),
    compareResult:       document.getElementById('compareResult'),
};

let currentUnit         = 'celsius';
let currentWeatherData  = null;
let currentLocationName = '';
let currentCity           = null;
let tempChart             = null;
let compareChart          = null;
let weatherFetchController = null;
let requestSeq             = 0;
let updatedAtTimer         = null;

const WEATHER_ICONS = {
    sunny:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="12" fill="#FFD600"/><g stroke="#FFD600" stroke-width="3" stroke-linecap="round"><line x1="32" y1="6" x2="32" y2="14"/><line x1="32" y1="50" x2="32" y2="58"/><line x1="6" y1="32" x2="14" y2="32"/><line x1="50" y1="32" x2="58" y2="32"/><line x1="13.4" y1="13.4" x2="19.3" y2="19.3"/><line x1="44.7" y1="44.7" x2="50.6" y2="50.6"/><line x1="50.6" y1="13.4" x2="44.7" y2="19.3"/><line x1="19.3" y1="44.7" x2="13.4" y2="50.6"/></g></svg>`,
    cloudy:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><circle cx="24" cy="30" r="10" fill="#B0BEC5"/><circle cx="36" cy="26" r="12" fill="#CFD8DC"/><circle cx="46" cy="32" r="8" fill="#CFD8DC"/><rect x="14" y="32" width="40" height="10" rx="5" fill="#CFD8DC"/></svg>`,
    rainy:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><circle cx="24" cy="24" r="9" fill="#90A4AE"/><circle cx="36" cy="20" r="11" fill="#B0BEC5"/><circle cx="46" cy="26" r="7" fill="#B0BEC5"/><rect x="14" y="26" width="38" height="9" rx="4.5" fill="#B0BEC5"/><g stroke="#42A5F5" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="40" x2="19" y2="52"/><line x1="32" y1="40" x2="29" y2="52"/><line x1="42" y1="40" x2="39" y2="52"/></g></svg>`,
    snowy:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><circle cx="24" cy="24" r="9" fill="#B0BEC5"/><circle cx="36" cy="20" r="11" fill="#CFD8DC"/><circle cx="46" cy="26" r="7" fill="#CFD8DC"/><rect x="14" y="26" width="38" height="9" rx="4.5" fill="#CFD8DC"/><g fill="#90CAF9"><circle cx="22" cy="46" r="3"/><circle cx="32" cy="50" r="3"/><circle cx="42" cy="46" r="3"/></g></svg>`,
    stormy:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><circle cx="22" cy="22" r="9" fill="#607D8B"/><circle cx="35" cy="18" r="12" fill="#78909C"/><circle cx="46" cy="24" r="8" fill="#78909C"/><rect x="12" y="24" width="40" height="10" rx="5" fill="#78909C"/><polyline points="34,36 28,46 33,46 27,58" stroke="#FFD600" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill="none"/></svg>`,
    fog:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><g stroke="#B0BEC5" stroke-width="3" stroke-linecap="round"><line x1="10" y1="24" x2="54" y2="24"/><line x1="14" y1="32" x2="50" y2="32"/><line x1="10" y1="40" x2="54" y2="40"/><line x1="16" y1="48" x2="48" y2="48"/></g></svg>`,
    default: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><circle cx="22" cy="30" r="10" fill="#FFD600" opacity="0.8"/><circle cx="36" cy="26" r="12" fill="#CFD8DC"/><circle cx="46" cy="32" r="8" fill="#CFD8DC"/><rect x="14" y="32" width="40" height="10" rx="5" fill="#CFD8DC"/></svg>`
};

function getWeatherIconSVG(type) {
    return WEATHER_ICONS[type] || WEATHER_ICONS['default'];
}

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

function degreesToCompass(deg) {
    if (deg == null) return '–';
    const dirs = ['N','NNO','NO','ONO','O','OSO','SO','SSO','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
}

function formatTime(isoString) {
    if (!isoString) return '–';
    return new Date(isoString).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
    return date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDay(dateStr) {
    const date  = new Date(dateStr);
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const check = new Date(date); check.setHours(0,0,0,0);
    if (check.getTime() === today.getTime())    return 'Heute';
    if (check.getTime() === tomorrow.getTime()) return 'Morgen';
    return date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
}

function toFahrenheit(c) { return Math.round(c * 9/5 + 32); }

function convertTemp(c) {
    return currentUnit === 'fahrenheit' ? toFahrenheit(c) : Math.round(c);
}

function unitSymbol() { return currentUnit === 'celsius' ? '°C' : '°F'; }

function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

class WeatherAppError extends Error {
    constructor(message, suggestion) {
        super(message);
        this.name = 'WeatherAppError';
        this.suggestion = suggestion;
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        elements.searchBtn.addEventListener('click', () => handleSearch());
        elements.cityInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
        elements.locationBtn.addEventListener('click', handleLocationRequest);
        elements.celsiusBtn.addEventListener('click', () => switchUnit('celsius'));
        elements.fahrenheitBtn.addEventListener('click', () => switchUnit('fahrenheit'));

        if (elements.favoriteBtn) {
            elements.favoriteBtn.addEventListener('click', handleToggleFavorite);
        }
        if (elements.autocompleteList && typeof CityAutocomplete !== 'undefined') {
            new CityAutocomplete(elements.cityInput, elements.autocompleteList, (city) => {
                handleSearch(city);
            });
        }
        if (elements.compareBtn) {
            elements.compareBtn.addEventListener('click', () => {
                elements.compareSection.classList.toggle('hidden');
            });
        }
        if (elements.compareSearchBtn) {
            elements.compareSearchBtn.addEventListener('click', handleCompareSearch);
        }
        if (elements.compareInput) {
            elements.compareInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleCompareSearch(); });
        }

        renderFavorites();
        renderRecent();
        restoreLastCity();
    });
}

async function restoreLastCity() {
    const last = getLastCity();
    if (!last) {
        showEmptyState();
        return;
    }
    elements.cityInput.value = last.name;
    await handleSearch(last);
}

function showEmptyState() {
    if (elements.emptyState) elements.emptyState.classList.remove('hidden');
    showWeatherSection(false);
}

function hideEmptyState() {
    if (elements.emptyState) elements.emptyState.classList.add('hidden');
}

async function handleSearch(presetCity = null) {
    const city = presetCity ? presetCity.name : elements.cityInput.value.trim();
    if (!city) {
        showError('Bitte gib eine Stadt ein.', 'Tipp: Tippe z. B. „Ingolstadt“ oder „Berlin“ und wähle einen Vorschlag aus.');
        return;
    }

    hideEmptyState();
    hideError();
    showLoading(true);
    const mySeq = ++requestSeq;

    try {
        let geo = presetCity;
        if (!geo) {
            geo = await geocodeCity(city);
        }
        if (!geo) {
            const suggestion = await suggestCorrection(city);
            throw new WeatherAppError(
                `Stadt „${city}“ wurde nicht gefunden.`,
                suggestion ? `Meintest du „${suggestion}“?` : 'Bitte überprüfe die Schreibweise oder versuche eine größere Stadt in der Nähe.'
            );
        }
        if (mySeq !== requestSeq) return;

        currentLocationName = `${geo.name}, ${geo.country || ''}`;
        currentCity = { ...geo, key: cityKey(geo) };
        await fetchWeatherData(geo.latitude, geo.longitude, mySeq);
        addRecentCity(currentCity);
        setLastCity(currentCity);
        renderRecent();
        updateFavoriteButton();
    } catch (err) {
        if (mySeq !== requestSeq) return;
        showLoading(false);
        if (err.name === 'AbortError') return;
        if (err instanceof WeatherAppError) {
            showError(err.message, err.suggestion);
        } else if (err instanceof TypeError) {
            showError('Die Wetterdaten konnten nicht geladen werden.', 'Bitte prüfe deine Internetverbindung und versuche es erneut.');
        } else {
            showError(err.message || 'Unbekannter Fehler.', 'Bitte versuche es in einem Moment erneut.');
        }
    }
}

async function suggestCorrection(query) {
    const candidates = [...getFavorites(), ...getRecentCities()].map(c => c.name);
    let best = null, bestDist = Infinity;
    for (const name of candidates) {
        const dist = levenshtein(query.toLowerCase(), name.toLowerCase());
        if (dist < bestDist) { bestDist = dist; best = name; }
    }
    return (best && bestDist <= 2) ? best : null;
}

function handleLocationRequest() {
    if (!navigator.geolocation) {
        showError('Geolocation wird von diesem Browser nicht unterstützt.', 'Nutze stattdessen die Stadtsuche oben.');
        return;
    }
    hideEmptyState();
    hideError();
    showLoading(true);
    const mySeq = ++requestSeq;

    navigator.geolocation.getCurrentPosition(
        async pos => {
            if (mySeq !== requestSeq) return;
            try {
                const name = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
                currentLocationName = name;
                currentCity = { name: name.split(',')[0], latitude: pos.coords.latitude, longitude: pos.coords.longitude, country: '' };
                currentCity.key = cityKey(currentCity);
                elements.cityInput.value = currentCity.name;
                await fetchWeatherData(pos.coords.latitude, pos.coords.longitude, mySeq);
                addRecentCity(currentCity);
                setLastCity(currentCity);
                renderRecent();
                updateFavoriteButton();
            } catch (err) {
                if (mySeq !== requestSeq) return;
                showLoading(false);
                showError('Standort-Wetterdaten konnten nicht geladen werden.', 'Bitte versuche es erneut oder nutze die Stadtsuche.');
            }
        },
        err => {
            if (mySeq !== requestSeq) return;
            showLoading(false);
            const msgs = {
                1: { m: 'Standort-Zugriff wurde verweigert.', s: 'Erlaube den Zugriff in den Browser-Einstellungen oder nutze die Stadtsuche.' },
                2: { m: 'Standort-Informationen sind derzeit nicht verfügbar.', s: 'Prüfe, ob GPS/Ortungsdienste aktiviert sind, oder nutze die Stadtsuche.' },
                3: { m: 'Zeitüberschreitung bei der Standortabfrage.', s: 'Versuche es erneut oder nutze die Stadtsuche.' },
            };
            const info = msgs[err.code] || { m: 'Unbekannter Fehler bei der Standortabfrage.', s: 'Bitte nutze die Stadtsuche.' };
            showError(info.m, info.s);
        },
        { timeout: 10000 }
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
        displayHourly(currentWeatherData);
        renderTempChart(currentWeatherData);
    }
}

async function handleCompareSearch() {
    const city = elements.compareInput ? elements.compareInput.value.trim() : '';
    if (!city) return;
    if (!currentWeatherData) { showError('Bitte zuerst eine Hauptstadt suchen.', ''); return; }
    try {
        elements.compareResult.innerHTML = '<p style="text-align:center;padding:20px">Wird geladen…</p>';
        const geo  = await geocodeCity(city);
        if (!geo) { elements.compareResult.innerHTML = '<p style="text-align:center;padding:20px;color:#dc2626">Stadt nicht gefunden.</p>'; return; }
        const url  = buildWeatherURL(geo.latitude, geo.longitude);
        const data = await (await fetch(url)).json();
        if (!data.current) { elements.compareResult.innerHTML = '<p style="text-align:center">Keine Daten.</p>'; return; }
        renderCompare(currentLocationName, currentWeatherData, `${geo.name}, ${geo.country || ''}`, data);
    } catch (err) {
        elements.compareResult.innerHTML = `<p style="color:#dc2626;padding:12px">Der Vergleich konnte nicht geladen werden. Bitte versuche es erneut.</p>`;
    }
}

function renderCompare(nameA, dataA, nameB, dataB) {
    const unit  = unitSymbol();
    const cA    = dataA.current;
    const cB    = dataB.current;
    const dA    = dataA.daily;
    const dB    = dataB.daily;
    const wA    = WMO_CODES[cA.weather_code] || { type: 'default', desc: 'Unbekannt' };
    const wB    = WMO_CODES[cB.weather_code] || { type: 'default', desc: 'Unbekannt' };

    const col = (name, data, wInfo, daily) => `
        <div class="compare-col glass-panel">
            <div class="compare-icon">${getWeatherIconSVG(wInfo.type)}</div>
            <h4>${name}</h4>
            <p class="compare-temp">${convertTemp(data.temperature_2m)}${unit}</p>
            <p class="compare-desc">${wInfo.desc}</p>
            <ul class="compare-details">
                <li><span>Gefühlt</span><strong>${convertTemp(data.apparent_temperature)}${unit}</strong></li>
                <li><span>Feuchtigkeit</span><strong>${data.relative_humidity_2m}%</strong></li>
                <li><span>Wind</span><strong>${Math.round(data.wind_speed_10m)} km/h ${degreesToCompass(data.wind_direction_10m)}</strong></li>
                <li><span>Max heute</span><strong>${convertTemp(daily.temperature_2m_max[0])}${unit}</strong></li>
                <li><span>Min heute</span><strong>${convertTemp(daily.temperature_2m_min[0])}${unit}</strong></li>
                <li><span>☔ Regen</span><strong>${daily.precipitation_probability_max ? daily.precipitation_probability_max[0] + '%' : '–'}</strong></li>
            </ul>
        </div>`;

    elements.compareResult.innerHTML = `
        <div class="compare-grid">
            ${col(nameA, cA, wA, dA)}
            <div class="compare-vs">VS</div>
            ${col(nameB, cB, wB, dB)}
        </div>`;
}

async function geocodeCity(name) {
    const data = await (await fetch(`${GEOCODING_URL}?name=${encodeURIComponent(name)}&count=1&language=de&format=json`)).json();
    return data.results?.[0] ?? null;
}

async function reverseGeocode(lat, lon) {
    try { await fetch(`${GEOCODING_URL}?latitude=${lat}&longitude=${lon}&count=1&language=de&format=json`); }
    catch {}
    return `Standort (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
}

function buildWeatherURL(lat, lon) {
    return `${WEATHER_URL}?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max` +
        `&hourly=temperature_2m,weather_code,precipitation_probability` +
        `&timezone=auto&forecast_days=6`;
}

async function fetchWeatherData(lat, lon, mySeq) {
    const key = cityKey({ latitude: lat, longitude: lon });
    const cached = getCachedWeather(key);

    if (cached) {
        if (mySeq !== requestSeq) return;
        applyWeatherData(cached.data, cached.timestamp);
        showLoading(false);
        return;
    }

    if (weatherFetchController) weatherFetchController.abort();
    weatherFetchController = new AbortController();

    let data;
    try {
        const res = await fetch(buildWeatherURL(lat, lon), { signal: weatherFetchController.signal });
        if (!res.ok) throw new WeatherAppError('Der Wetterdienst ist derzeit nicht erreichbar.', 'Bitte versuche es in ein paar Minuten erneut.');
        data = await res.json();
    } catch (err) {
        if (err.name === 'AbortError') throw err;
        if (err instanceof WeatherAppError) throw err;
        throw new WeatherAppError('Der Wetterdienst ist derzeit nicht erreichbar.', 'Bitte prüfe deine Internetverbindung und versuche es erneut.');
    }

    if (mySeq !== requestSeq) return;

    if (!data || !data.current || !data.daily) {
        throw new WeatherAppError('Für diesen Ort liegen keine vollständigen Wetterdaten vor.', 'Bitte versuche eine andere, größere Stadt in der Nähe.');
    }

    const timestamp = Date.now();
    setCachedWeather(key, data);
    applyWeatherData(data, timestamp);
    showLoading(false);
}

function applyWeatherData(data, timestamp) {
    currentWeatherData = data;
    displayCurrentWeather(data);
    displayForecast(data);
    displayHourly(data);
    renderTempChart(data);
    generateRecommendations(data);
    updateBackgroundTheme(data.current.weather_code);
    showWeatherSection(true);
    startUpdatedAtTimer(timestamp);
}

function displayCurrentWeather(data) {
    const c = data.current;
    const d = data.daily;
    elements.cityName.textContent            = currentLocationName || 'Unbekannter Ort';
    elements.weatherDate.textContent         = formatDate(new Date());
    const info = WMO_CODES[c.weather_code] || { type: 'default', desc: 'Unbekannt' };
    elements.weatherIcon.outerHTML = `<div id="weatherIcon" class="weather-icon" aria-label="${info.desc}" role="img">${getWeatherIconSVG(info.type)}</div>`;
    elements.weatherIcon = document.getElementById('weatherIcon');
    elements.temperature.textContent        = `${convertTemp(c.temperature_2m)}${unitSymbol()}`;
    elements.weatherDescription.textContent = info.desc;
    elements.humidity.textContent           = `${c.relative_humidity_2m}%`;
    elements.wind.textContent               = `${Math.round(c.wind_speed_10m)} km/h`;
    if (elements.windDirection) elements.windDirection.textContent = degreesToCompass(c.wind_direction_10m);
    elements.feelsLike.textContent = `${convertTemp(c.apparent_temperature)}${unitSymbol()}`;
    if (elements.sunrise && d?.sunrise) elements.sunrise.textContent = formatTime(d.sunrise[0]);
    if (elements.sunset  && d?.sunset)  elements.sunset.textContent  = formatTime(d.sunset[0]);
    updateFavoriteButton();
}

function startUpdatedAtTimer(timestamp) {
    if (updatedAtTimer) clearInterval(updatedAtTimer);
    const render = () => {
        if (elements.updatedAt) elements.updatedAt.textContent = formatRelativeTime(timestamp);
    };
    render();
    updatedAtTimer = setInterval(render, 30000);
}

function updateFavoriteButton() {
    if (!elements.favoriteBtn || !currentCity) return;
    const active = isFavorite(currentCity.key);
    elements.favoriteBtn.classList.toggle('active', active);
    elements.favoriteBtn.setAttribute('aria-pressed', String(active));
    elements.favoriteBtn.setAttribute('aria-label', active ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen');
}

function handleToggleFavorite() {
    if (!currentCity) return;
    toggleFavorite(currentCity);
    updateFavoriteButton();
    renderFavorites();
}

function renderFavorites() {
    if (!elements.favoritesList) return;
    const favs = getFavorites();
    elements.favoritesList.innerHTML = '';
    if (favs.length === 0) {
        elements.favoritesList.innerHTML = '<li class="chip-empty">Noch keine Favoriten gespeichert.</li>';
        return;
    }
    favs.forEach(city => {
        const li = document.createElement('li');
        li.className = 'chip';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip-btn';
        btn.textContent = city.name;
        btn.addEventListener('click', () => { elements.cityInput.value = city.name; handleSearch(city); });
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'chip-remove';
        removeBtn.setAttribute('aria-label', `${city.name} aus Favoriten entfernen`);
        removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFavorite(city.key);
            renderFavorites();
            updateFavoriteButton();
        });
        li.appendChild(btn);
        li.appendChild(removeBtn);
        elements.favoritesList.appendChild(li);
    });
}

function renderRecent() {
    if (!elements.recentList) return;
    const recent = getRecentCities();
    elements.recentList.innerHTML = '';
    if (recent.length === 0) {
        elements.recentList.innerHTML = '<li class="chip-empty">Noch keine Suchen vorhanden.</li>';
        return;
    }
    recent.forEach(city => {
        const li = document.createElement('li');
        li.className = 'chip';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip-btn';
        btn.textContent = city.name;
        btn.addEventListener('click', () => { elements.cityInput.value = city.name; handleSearch(city); });
        li.appendChild(btn);
        elements.recentList.appendChild(li);
    });
}

function displayForecast(data) {
    elements.forecastList.innerHTML = '';
    const daily = data.daily;
    if (!daily) return;
    for (let i = 1; i < Math.min(6, daily.time.length); i++) {
        const maxT  = daily.temperature_2m_max[i];
        const minT  = daily.temperature_2m_min[i];
        const code  = daily.weather_code[i];
        const info  = WMO_CODES[code] || { type: 'default', desc: 'Unbekannt' };
        const precip = daily.precipitation_probability_max?.[i] ?? null;
        const precipBar = precip !== null ? `
            <div class="precip-wrap" title="Regenwahrscheinlichkeit">
                <div class="precip-bar-bg">
                    <div class="precip-bar-fill" style="width:${precip}%"></div>
                </div>
                <span class="precip-label">${precip}%</span>
            </div>` : '';
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="day">${formatDay(daily.time[i])}</div>
            <div class="forecast-icon" aria-label="${info.desc}" role="img">${getWeatherIconSVG(info.type)}</div>
            <div class="forecast-temp">
                <span class="temp-max">${convertTemp(maxT)}${unitSymbol()}</span>
                <span class="temp-min">${convertTemp(minT)}${unitSymbol()}</span>
            </div>
            <div class="forecast-desc">${info.desc}</div>
            ${precipBar}
            <div class="forecast-tag">Prognose</div>
        `;
        elements.forecastList.appendChild(card);
    }
}

function displayHourly(data) {
    if (!elements.hourlyList || !data.hourly) return;
    elements.hourlyList.innerHTML = '';
    const hourly = data.hourly;
    const todayStr = new Date().toISOString().slice(0, 10);
    const filtered = [];
    for (let i = 0; i < hourly.time.length; i++) {
        if (!hourly.time[i].startsWith(todayStr)) continue;
        const h = parseInt(hourly.time[i].slice(11, 13), 10);
        if (h % 3 !== 0) continue;
        filtered.push(i);
    }
    if (filtered.length === 0) {
        elements.hourlyList.innerHTML = '<p style="text-align:center;opacity:.6">Keine Stundendaten für heute verfügbar.</p>';
        return;
    }
    filtered.forEach(i => {
        const hour   = hourly.time[i].slice(11, 16);
        const temp   = convertTemp(hourly.temperature_2m[i]);
        const code   = hourly.weather_code[i];
        const precip = hourly.precipitation_probability?.[i] ?? null;
        const info   = WMO_CODES[code] || { type: 'default', desc: '' };
        const item   = document.createElement('div');
        item.className = 'hourly-item';
        item.innerHTML = `
            <span class="hourly-time">${hour}</span>
            <div class="hourly-icon">${getWeatherIconSVG(info.type)}</div>
            <span class="hourly-temp">${temp}${unitSymbol()}</span>
            ${precip !== null ? `<span class="hourly-precip">💧${precip}%</span>` : ''}
        `;
        elements.hourlyList.appendChild(item);
    });
}

function renderTempChart(data) {
    if (!elements.tempChartCanvas || !data.daily) return;
    if (typeof Chart === 'undefined') return;
    const daily   = data.daily;
    const labels  = daily.time.map(d => formatDay(d));
    const maxData = daily.temperature_2m_max.map(t => convertTemp(t));
    const minData = daily.temperature_2m_min.map(t => convertTemp(t));
    const unit    = unitSymbol();
    if (tempChart) { tempChart.destroy(); tempChart = null; }
    tempChart = new Chart(elements.tempChartCanvas, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: `Max (${unit})`,
                    data: maxData,
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249,115,22,0.12)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#f97316',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    borderWidth: 2.5,
                },
                {
                    label: `Min (${unit})`,
                    data: minData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.08)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#3b82f6',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    borderWidth: 2.5,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { labels: { color: '#0f172a', font: { family: 'Inter', weight: '600' } } },
                tooltip: {
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    titleColor: '#0f172a',
                    bodyColor: '#475569',
                    borderColor: 'rgba(15,23,42,0.12)',
                    borderWidth: 1,
                }
            },
            scales: {
                x: { ticks: { color: '#475569', font: { family: 'Inter' } }, grid: { color: 'rgba(15,23,42,0.06)' } },
                y: {
                    ticks: { color: '#475569', font: { family: 'Inter' }, callback: v => `${v}${unit}` },
                    grid:  { color: 'rgba(15,23,42,0.06)' }
                }
            }
        }
    });
}

function generateRecommendations(data) {
    const c = data.current;
    const recs = [];
    const temp = c.temperature_2m, wind = c.wind_speed_10m, hum = c.relative_humidity_2m;
    const info = WMO_CODES[c.weather_code] || { type: 'default' };
    if (temp < 5)               recs.push({ type: 'negative', icon: '🧥', text: 'Achte auf warme Kleidung – es ist sehr kalt!' });
    else if (temp < 15)         recs.push({ type: 'warning',  icon: '🧣', text: 'Nimm eine zusätzliche Schicht mit – es ist kühl.' });
    else if (temp >= 20 && temp < 30) recs.push({ type: 'positive', icon: '☀️', text: 'Angenehme Temperaturen – ideal für Aktivitäten draußen!' });
    else if (temp >= 30)        recs.push({ type: 'warning',  icon: '🥤', text: 'Sehr heiß! Trink genug Wasser und such den Schatten auf.' });
    if (info.type === 'rainy')  { recs.push({ type: 'negative', icon: '☔', text: 'Nimm einen Regenschirm mit!' }); recs.push({ type: 'neutral', icon: '📚', text: 'Guter Tag für Indoor-Aktivitäten.' }); }
    else if (info.type === 'snowy')  recs.push({ type: 'warning',  icon: '⛷️', text: 'Schnee – gut für Winteraktivitäten.' });
    else if (info.type === 'stormy') recs.push({ type: 'negative', icon: '⛈️', text: 'Gewitter! Bleib drinnen.' });
    else if (info.type === 'sunny') {
        recs.push({ type: 'positive', icon: '🚴', text: 'Perfektes Wetter zum Fahrradfahren!' });
        if (temp > 15) recs.push({ type: 'warning', icon: '🧴', text: 'Sonnencreme nicht vergessen.' });
    } else if (info.type === 'cloudy' && temp >= 15) recs.push({ type: 'positive', icon: '🚶', text: 'Bewölkt, aber angenehm – gut für einen Spaziergang.' });
    if (wind > 40)              recs.push({ type: 'warning', icon: '💨', text: 'Starker Wind!' });
    else if (wind > 25)         recs.push({ type: 'neutral', icon: '🌬️', text: 'Brisanter Wind – beachte das beim Radfahren.' });
    if (hum > 80 && temp > 20)  recs.push({ type: 'warning', icon: '😓', text: 'Hohe Luftfeuchtigkeit – schwüles Gefühl möglich.' });
    if (recs.length === 0)      recs.push({ type: 'neutral', icon: '🌤️', text: 'Normales Wetter – genieße den Tag!' });
    displayRecommendations(recs.slice(0, 5));
    return recs;
}

function displayRecommendations(recs) {
    elements.recommendationsList.innerHTML = '';
    recs.forEach(r => {
        const el = document.createElement('div');
        el.className = `recommendation-item ${r.type}`;
        el.innerHTML = `<span class="recommendation-icon">${r.icon}</span><span>${r.text}</span>`;
        elements.recommendationsList.appendChild(el);
    });
}

function updateBackgroundTheme(code) {
    document.body.classList.remove('weather-sunny','weather-cloudy','weather-rainy','weather-stormy','weather-snowy');
    const t = (WMO_CODES[code] || {}).type;
    if (t) document.body.classList.add(`weather-${t}`);
}

if (typeof document !== 'undefined') {
    (function() {
        const s = document.createElement('style');
        s.textContent = `
            .weather-icon svg,.forecast-icon svg,.hourly-icon svg { width:100%;height:100%; }
            .weather-icon,#weatherIcon { width:80px;height:80px;display:flex;align-items:center;justify-content:center; }
            .forecast-icon { width:40px;height:40px;display:flex;align-items:center;justify-content:center;margin:0 auto; }
            .forecast-temp { display:flex;gap:6px;justify-content:center;align-items:baseline; }
            .temp-max { font-weight:700;font-size:1em; }
            .temp-min { font-size:.82em;opacity:.6; }
        `;
        document.head.appendChild(s);
    })();
}

function showLoading(show) {
    elements.loading.classList.toggle('hidden', !show);
    if (elements.skeleton) elements.skeleton.classList.toggle('hidden', !show);
    if (show) { showWeatherSection(false); hideEmptyState(); }
}
function showError(msg, suggestion) {
    elements.errorText.textContent = msg;
    if (elements.errorSuggestion) {
        elements.errorSuggestion.textContent = suggestion || '';
        elements.errorSuggestion.classList.toggle('hidden', !suggestion);
    }
    elements.errorMessage.classList.remove('hidden');
    showWeatherSection(false);
}
function hideError() { elements.errorMessage.classList.add('hidden'); }
function showWeatherSection(show) { elements.weatherSection.classList.toggle('hidden', !show); }

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        degreesToCompass, formatTime, formatDate, formatDay, toFahrenheit, convertTemp,
        unitSymbol, levenshtein, WeatherAppError, WMO_CODES, buildWeatherURL,
        generateRecommendations, getWeatherIconSVG
    };
}
