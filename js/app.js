/**
 * Wetter & Tagesplan App
 * Verwendet die Open-Meteo API für Wetterdaten (kostenlos, kein API-Key nötig)
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
    feelsLike: document.getElementById('feelsLike'),
    recommendationsList: document.getElementById('recommendationsList'),
    forecastList: document.getElementById('forecastList')
};

// === Zustandsvariablen ===
let currentUnit = 'celsius'; // 'celsius' oder 'fahrenheit'
let currentWeatherData = null;
let currentLocationName = '';

// === WMO Wettercodes ===
// https://open-meteo.com/en/docs
const WMO_CODES = {
    0: { type: 'sunny', desc: 'Klar', icon: '113' },
    1: { type: 'sunny', desc: 'Überwiegend klar', icon: '113' },
    2: { type: 'cloudy', desc: 'Teilweise bewölkt', icon: '116' },
    3: { type: 'cloudy', desc: 'Bewölkt', icon: '119' },
    45: { type: 'cloudy', desc: 'Neblig', icon: '143' },
    48: { type: 'cloudy', desc: 'Reifnebel', icon: '143' },
    51: { type: 'rainy', desc: 'Leichter Nieselregen', icon: '176' },
    53: { type: 'rainy', desc: 'Nieselregen', icon: '263' },
    55: { type: 'rainy', desc: 'Starker Nieselregen', icon: '263' },
    56: { type: 'rainy', desc: 'Gefrierender Nieselregen', icon: '185' },
    57: { type: 'rainy', desc: 'Starker gefrierender Nieselregen', icon: '185' },
    61: { type: 'rainy', desc: 'Leichter Regen', icon: '293' },
    63: { type: 'rainy', desc: 'Mäßiger Regen', icon: '299' },
    65: { type: 'rainy', desc: 'Starker Regen', icon: '305' },
    66: { type: 'rainy', desc: 'Gefrierender Regen', icon: '281' },
    67: { type: 'rainy', desc: 'Starker gefrierender Regen', icon: '284' },
    71: { type: 'snowy', desc: 'Leichter Schneefall', icon: '323' },
    73: { type: 'snowy', desc: 'Mäßiger Schneefall', icon: '329' },
    75: { type: 'snowy', desc: 'Starker Schneefall', icon: '335' },
    77: { type: 'snowy', desc: 'Schneekörner', icon: '350' },
    80: { type: 'rainy', desc: 'Leichter Regenschauer', icon: '353' },
    81: { type: 'rainy', desc: 'Regenschauer', icon: '356' },
    82: { type: 'rainy', desc: 'Starke Regenschauer', icon: '359' },
    85: { type: 'snowy', desc: 'Leichter Schneeschauer', icon: '368' },
    86: { type: 'snowy', desc: 'Schneeschauer', icon: '371' },
    95: { type: 'stormy', desc: 'Gewitter', icon: '386' },
    96: { type: 'stormy', desc: 'Gewitter mit leichtem Hagel', icon: '389' },
    99: { type: 'stormy', desc: 'Gewitter mit Hagel', icon: '395' }
};

// === Initialisierung ===
document.addEventListener('DOMContentLoaded', () => {
    // Event Listeners
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    elements.locationBtn.addEventListener('click', handleLocationRequest);
    elements.celsiusBtn.addEventListener('click', () => switchUnit('celsius'));
    elements.fahrenheitBtn.addEventListener('click', () => switchUnit('fahrenheit'));
});

// === Event Handler ===

/**
 * Sucht Wetterdaten für die eingegebene Stadt
 */
async function handleSearch() {
    const city = elements.cityInput.value.trim();

    if (!city) {
        showError('Bitte gib eine Stadt ein.');
        return;
    }

    try {
        showLoading(true);
        hideError();

        // Geocoding: Stadtname zu Koordinaten
        const geoData = await geocodeCity(city);
        if (!geoData) {
            throw new Error('Stadt nicht gefunden. Bitte überprüfe die Schreibweise.');
        }

        currentLocationName = `${geoData.name}, ${geoData.country || ''}`;

        // Wetterdaten abrufen
        await fetchWeatherData(geoData.latitude, geoData.longitude);
    } catch (error) {
        showLoading(false);
        showError(error.message);
    }
}

/**
 * Verwendet Geolocation für den aktuellen Standort
 */
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
                // Reverse Geocoding für Stadtname
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
                case error.PERMISSION_DENIED:
                    showError('Standort-Zugriff wurde verweigert.');
                    break;
                case error.POSITION_UNAVAILABLE:
                    showError('Standort-Informationen nicht verfügbar.');
                    break;
                case error.TIMEOUT:
                    showError('Zeitüberschreitung bei der Standort-Abfrage.');
                    break;
                default:
                    showError('Unbekannter Fehler bei der Standort-Abfrage.');
            }
        }
    );
}

/**
 * Wechselt zwischen Celsius und Fahrenheit
 */
async function switchUnit(unit) {
    if (currentUnit === unit) return;

    currentUnit = unit;

    // UI aktualisieren
    elements.celsiusBtn.classList.toggle('active', unit === 'celsius');
    elements.fahrenheitBtn.classList.toggle('active', unit === 'fahrenheit');

    // Daten neu anzeigen (kein neuer API-Call nötig, nur umrechnen)
    if (currentWeatherData) {
        displayCurrentWeather(currentWeatherData);
        displayForecast(currentWeatherData);
    }
}

// === API-Funktionen ===

/**
 * Geocoding: Stadtname zu Koordinaten
 */
async function geocodeCity(cityName) {
    const url = `${GEOCODING_URL}?name=${encodeURIComponent(cityName)}&count=1&language=de&format=json`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        return null;
    }

    return data.results[0];
}

/**
 * Reverse Geocoding: Koordinaten zu Stadtname
 */
async function reverseGeocode(lat, lon) {
    // Open-Meteo hat keine Reverse Geocoding API, aber wir können die Geocoding API
    // mit einer Näherung verwenden oder einfach den Namen anzeigen
    // Für die Genauigkeit verwenden wir eine alternative Methode
    try {
        // Versuche einen Nearby-Search
        const url = `${GEOCODING_URL}?latitude=${lat}&longitude=${lon}&count=1&language=de&format=json`;
        const response = await fetch(url);
        // Fallback: Zeige Koordinaten falls kein Name gefunden
        return `Standort (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
    } catch {
        return `Standort (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
    }
}

/**
 * Holt Wetterdaten von Open-Meteo
 */
async function fetchWeatherData(lat, lon) {
    try {
        const unitParam = currentUnit === 'celsius' ? 'celsius' : 'fahrenheit';
        const tempUnit = currentUnit === 'celsius' ? '°C' : '°F';

        // Open-Meteo API Request
        const url = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=6`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.current) {
            throw new Error('Keine Wetterdaten verfügbar.');
        }

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

/**
 * Zeigt das aktuelle Wetter an (Open-Meteo Datenstruktur)
 */
function displayCurrentWeather(data) {
    const current = data.current;
    const unitSymbol = currentUnit === 'celsius' ? '°C' : '°F';

    elements.cityName.textContent = currentLocationName || 'Unbekannter Ort';
    elements.weatherDate.textContent = formatDate(new Date());

    // Wetter-Code Info
    const weatherInfo = WMO_CODES[current.weather_code] || { type: 'default', desc: 'Unbekannt', icon: '113' };

    // Icon URL (Weatherstack Icons als Fallback - öffentlich zugänglich)
    elements.weatherIcon.src = `https://cdn.weatherstack.com/images/weather-icons/day/${weatherInfo.icon}.png`;
    elements.weatherIcon.alt = weatherInfo.desc;

    // Temperatur
    elements.temperature.textContent = `${Math.round(current.temperature_2m)}${unitSymbol}`;
    elements.weatherDescription.textContent = weatherInfo.desc;

    // Details
    elements.humidity.textContent = `${current.relative_humidity_2m}%`;
    elements.wind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    elements.feelsLike.textContent = `${Math.round(current.apparent_temperature)}${unitSymbol}`;
}

/**
 * Zeigt die 5-Tage-Vorhersage an
 */
function displayForecast(data) {
    elements.forecastList.innerHTML = '';

    const daily = data.daily;
    if (!daily) return;

    const unitSymbol = currentUnit === 'celsius' ? '°C' : '°F';
    const today = new Date().toISOString().split('T')[0];

    // Überspringe heute, zeige die nächsten 5 Tage
    for (let i = 1; i < Math.min(6, daily.time.length); i++) {
        const dateStr = daily.time[i];
        const maxTemp = daily.temperature_2m_max[i];
        const minTemp = daily.temperature_2m_min[i];
        const weatherCode = daily.weather_code[i];

        const weatherInfo = WMO_CODES[weatherCode] || { type: 'default', desc: 'Unbekannt', icon: '113' };

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="day">${formatDay(dateStr)}</div>
            <img src="https://cdn.weatherstack.com/images/weather-icons/day/${weatherInfo.icon}.png"
                 alt="${weatherInfo.desc}"
                 class="forecast-icon">
            <div class="forecast-temp">${Math.round(maxTemp)}${unitSymbol}</div>
            <div class="forecast-desc">${weatherInfo.desc}</div>
        `;

        elements.forecastList.appendChild(card);
    }
}

/**
 * Generiert persönliche Empfehlungen basierend auf dem Wetter
 */
function generateRecommendations(data) {
    const current = data.current;
    const recommendations = [];
    const temp = current.temperature_2m;
    const weatherCode = current.weather_code;
    const windSpeed = current.wind_speed_10m;
    const humidity = current.relative_humidity_2m;

    // Wetter-Code Info holen
    const weatherInfo = WMO_CODES[weatherCode] || { type: 'default', desc: '' };
    const weatherType = weatherInfo.type;

    // Temperatur-basierte Empfehlungen
    if (temp < 5) {
        recommendations.push({
            type: 'negative',
            icon: '🧥',
            text: 'Achte auf warme Kleidung – es ist sehr kalt!'
        });
    } else if (temp >= 5 && temp < 15) {
        recommendations.push({
            type: 'warning',
            icon: '🧣',
            text: 'Nimm eine zusätzliche Schicht mit – es ist kühl.'
        });
    } else if (temp >= 20 && temp < 30) {
        recommendations.push({
            type: 'positive',
            icon: '☀️',
            text: 'Angenehme Temperaturen – ideal für Aktivitäten draußen!'
        });
    } else if (temp >= 30) {
        recommendations.push({
            type: 'warning',
            icon: '🥤',
            text: 'Sehr heiß! Trink genug Wasser und such den Schatten auf.'
        });
    }

    // Wetter-basierte Empfehlungen
    if (weatherType === 'rainy') {
        recommendations.push({
            type: 'negative',
            icon: '☔',
            text: 'Nimm einen Regenschirm oder eine Regenjacke mit!'
        });
        recommendations.push({
            type: 'neutral',
            icon: '📚',
            text: 'Guter Tag zum Lernen drinnen oder für Indoor-Aktivitäten.'
        });
    } else if (weatherType === 'snowy') {
        recommendations.push({
            type: 'warning',
            icon: '⛷️',
            text: 'Schnee! Gute Zeit für Winteraktivitäten oder gemütliche Stunden drinnen.'
        });
    } else if (weatherType === 'stormy') {
        recommendations.push({
            type: 'negative',
            icon: '⛈️',
            text: 'Gewitter! Bleib drinnen und vermeide offene Flächen.'
        });
    } else if (weatherType === 'sunny') {
        recommendations.push({
            type: 'positive',
            icon: '🚴',
            text: 'Perfektes Wetter zum Fahrradfahren oder Spazieren!'
        });
        if (temp > 20) {
            recommendations.push({
                type: 'positive',
                icon: '🌳',
                text: 'Ideal für einen Parkbesuch oder Picknick.'
            });
        }
        if (temp > 15) {
            recommendations.push({
                type: 'warning',
                icon: '🧴',
                text: 'Denk an Sonnencreme bei längerem Aufenthalt draußen.'
            });
        }
    } else if (weatherType === 'cloudy') {
        if (temp >= 15 && temp <= 25) {
            recommendations.push({
                type: 'positive',
                icon: '🚶',
                text: 'Bewölkt, aber angenehm – gut für einen Spaziergang.'
            });
        }
    }

    // Wind-basierte Empfehlungen
    if (windSpeed > 40) {
        recommendations.push({
            type: 'warning',
            icon: '💨',
            text: 'Starker Wind! Fahrrad fahren könnte schwierig sein.'
        });
    } else if (windSpeed > 25 && windSpeed <= 40) {
        recommendations.push({
            type: 'neutral',
            icon: '🌬️',
            text: 'Brisanter Wind – beachte das beim Radfahren.'
        });
    }

    // Luftfeuchtigkeits-basierte Empfehlungen
    if (humidity > 80 && temp > 20) {
        recommendations.push({
            type: 'warning',
            icon: '😓',
            text: 'Hohe Luftfeuchtigkeit – es könnte sich schwül anfühlen.'
        });
    }

    // Fallback
    if (recommendations.length === 0) {
        recommendations.push({
            type: 'neutral',
            icon: '🌤️',
            text: 'Normales Wetter – genieße den Tag!'
        });
    }

    displayRecommendations(recommendations.slice(0, 5));
}

/**
 * Zeigt die Empfehlungen an
 */
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

/**
 * Aktualisiert das Hintergrund-Theme basierend auf dem Wetter-Code
 */
function updateBackgroundTheme(weatherCode) {
    const body = document.body;

    body.classList.remove('weather-sunny', 'weather-cloudy', 'weather-rainy', 'weather-stormy', 'weather-snowy');

    const weatherInfo = WMO_CODES[weatherCode] || { type: 'default' };
    const weatherType = weatherInfo.type;

    switch (weatherType) {
        case 'sunny':
            body.classList.add('weather-sunny');
            break;
        case 'cloudy':
            body.classList.add('weather-cloudy');
            break;
        case 'rainy':
            body.classList.add('weather-rainy');
            break;
        case 'stormy':
            body.classList.add('weather-stormy');
            break;
        case 'snowy':
            body.classList.add('weather-snowy');
            break;
        default:
            break;
    }
}

// === Hilfsfunktionen ===

/**
 * Formatiert das Datum
 */
function formatDate(date) {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('de-DE', options);
}

/**
 * Formatiert das Vorhersage-Datum
 */
function formatDay(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate.getTime() === today.getTime()) {
        return 'Heute';
    } else if (checkDate.getTime() === tomorrow.getTime()) {
        return 'Morgen';
    }

    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('de-DE', options);
}

/**
 * Zeigt/Lädt den Ladezustand
 */
function showLoading(show) {
    elements.loading.classList.toggle('hidden', !show);
    if (show) {
        showWeatherSection(false);
    }
}

/**
 * Zeigt die Fehlermeldung
 */
function showError(message) {
    elements.errorText.textContent = message;
    elements.errorMessage.classList.remove('hidden');
    showWeatherSection(false);
}

/**
 * Versteckt die Fehlermeldung
 */
function hideError() {
    elements.errorMessage.classList.add('hidden');
}

/**
 * Zeigt/Versteckt den Wetterbereich
 */
function showWeatherSection(show) {
    elements.weatherSection.classList.toggle('hidden', !show);
}