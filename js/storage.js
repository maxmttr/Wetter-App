/**
 * storage.js — LocalStorage-Persistenz für Wetter & Tagesplan
 * Verantwortlich für: Favoriten, zuletzt gesuchte Städte, zuletzt gewählte Stadt,
 * Wetterdaten-Cache mit Ablaufzeit.
 * Reine Hilfsfunktionen, keine DOM-Zugriffe.
 */

const STORAGE_KEYS = {
    FAVORITES:     'wetterapp_favorites',
    RECENT:        'wetterapp_recent',
    LAST_CITY:     'wetterapp_last_city',
    WEATHER_CACHE: 'wetterapp_weather_cache',
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_RECENT = 6;

function safeParse(json, fallback) {
    try {
        const val = JSON.parse(json);
        return val ?? fallback;
    } catch {
        return fallback;
    }
}

function readStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        return safeParse(raw, fallback);
    } catch {
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

function getFavorites() {
    return readStorage(STORAGE_KEYS.FAVORITES, []);
}

function isFavorite(cityKeyValue) {
    return getFavorites().some(f => f.key === cityKeyValue);
}

function addFavorite(city) {
    const favs = getFavorites();
    const key = cityKey(city);
    if (favs.some(f => f.key === key)) return favs;
    const updated = [...favs, { ...city, key }];
    writeStorage(STORAGE_KEYS.FAVORITES, updated);
    return updated;
}

function removeFavorite(cityKeyToRemove) {
    const updated = getFavorites().filter(f => f.key !== cityKeyToRemove);
    writeStorage(STORAGE_KEYS.FAVORITES, updated);
    return updated;
}

function toggleFavorite(city) {
    const key = cityKey(city);
    return isFavorite(key) ? removeFavorite(key) : addFavorite(city);
}

function getRecentCities() {
    return readStorage(STORAGE_KEYS.RECENT, []);
}

function addRecentCity(city) {
    const key = cityKey(city);
    let recent = getRecentCities().filter(c => c.key !== key);
    recent.unshift({ ...city, key, searchedAt: Date.now() });
    recent = recent.slice(0, MAX_RECENT);
    writeStorage(STORAGE_KEYS.RECENT, recent);
    return recent;
}

function clearRecentCities() {
    writeStorage(STORAGE_KEYS.RECENT, []);
}

function getLastCity() {
    return readStorage(STORAGE_KEYS.LAST_CITY, null);
}

function setLastCity(city) {
    writeStorage(STORAGE_KEYS.LAST_CITY, { ...city, key: cityKey(city) });
}

function getCachedWeather(cityKeyValue) {
    const cache = readStorage(STORAGE_KEYS.WEATHER_CACHE, {});
    const entry = cache[cityKeyValue];
    if (!entry) return null;
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL_MS) return null;
    return { data: entry.data, timestamp: entry.timestamp, ageMs: age };
}

function setCachedWeather(cityKeyValue, data) {
    const cache = readStorage(STORAGE_KEYS.WEATHER_CACHE, {});
    cache[cityKeyValue] = { data, timestamp: Date.now() };
    const entries = Object.entries(cache);
    if (entries.length > 20) {
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const trimmed = entries.slice(entries.length - 20);
        writeStorage(STORAGE_KEYS.WEATHER_CACHE, Object.fromEntries(trimmed));
    } else {
        writeStorage(STORAGE_KEYS.WEATHER_CACHE, cache);
    }
}

function invalidateCachedWeather(cityKeyValue) {
    const cache = readStorage(STORAGE_KEYS.WEATHER_CACHE, {});
    delete cache[cityKeyValue];
    writeStorage(STORAGE_KEYS.WEATHER_CACHE, cache);
}

function cityKey(city) {
    const lat = Number(city.latitude).toFixed(2);
    const lon = Number(city.longitude).toFixed(2);
    return `${lat},${lon}`;
}

function formatRelativeTime(timestamp) {
    const diffMs = Date.now() - timestamp;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Gerade aktualisiert';
    if (minutes === 1) return 'Aktualisiert vor 1 Minute';
    if (minutes < 60) return `Aktualisiert vor ${minutes} Minuten`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Aktualisiert vor 1 Stunde';
    if (hours < 24) return `Aktualisiert vor ${hours} Stunden`;
    const days = Math.floor(hours / 24);
    return days === 1 ? 'Aktualisiert vor 1 Tag' : `Aktualisiert vor ${days} Tagen`;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getFavorites, isFavorite, addFavorite, removeFavorite, toggleFavorite,
        getRecentCities, addRecentCity, clearRecentCities,
        getLastCity, setLastCity,
        getCachedWeather, setCachedWeather, invalidateCachedWeather,
        cityKey, formatRelativeTime, CACHE_TTL_MS, MAX_RECENT
    };
}
