import { describe, it, expect, beforeEach } from 'vitest';
import {
  getFavorites, isFavorite, addFavorite, removeFavorite,
  getRecentCities, addRecentCity,
  getLastCity, setLastCity,
  getCachedWeather, setCachedWeather,
  cityKey, formatRelativeTime, MAX_RECENT
} from '../js/storage.js';

const cityA = { name: 'Ingolstadt', latitude: 48.7665, longitude: 11.4257, country: 'Deutschland' };

beforeEach(() => {
  localStorage.clear();
});

describe('Favoriten', () => {
  it('speichert eine Stadt als Favorit', () => {
    addFavorite(cityA);
    expect(isFavorite(cityKey(cityA))).toBe(true);
  });

  it('entfernt einen Favoriten', () => {
    addFavorite(cityA);
    removeFavorite(cityKey(cityA));
    expect(isFavorite(cityKey(cityA))).toBe(false);
  });

  it('verhindert Duplikate', () => {
    addFavorite(cityA);
    addFavorite(cityA);
    expect(getFavorites().length).toBe(1);
  });
});

describe('Zuletzt gesuchte Staedte', () => {
  it('begrenzt die Liste auf MAX_RECENT Eintraege', () => {
    for (let i = 0; i < 10; i++) {
      addRecentCity({ name: `Stadt${i}`, latitude: i, longitude: i, country: 'DE' });
    }
    expect(getRecentCities().length).toBe(MAX_RECENT);
  });

  it('setzt die neueste Suche an den Anfang', () => {
    addRecentCity({ name: 'Berlin', latitude: 52.52, longitude: 13.4, country: 'DE' });
    addRecentCity({ name: 'Muenchen', latitude: 48.13, longitude: 11.58, country: 'DE' });
    expect(getRecentCities()[0].name).toBe('Muenchen');
  });
});

describe('Wetterdaten-Cache', () => {
  it('liefert frisch gecachte Daten zurueck', () => {
    const key = cityKey(cityA);
    setCachedWeather(key, { current: { temperature_2m: 20 } });
    const cached = getCachedWeather(key);
    expect(cached).not.toBeNull();
    expect(cached.data.current.temperature_2m).toBe(20);
  });

  it('gibt null zurueck, wenn der Cache abgelaufen ist', () => {
    const key = cityKey(cityA);
    setCachedWeather(key, { current: { temperature_2m: 20 } });
    const raw = JSON.parse(localStorage.getItem('wetterapp_weather_cache'));
    raw[key].timestamp = Date.now() - 11 * 60 * 1000;
    localStorage.setItem('wetterapp_weather_cache', JSON.stringify(raw));
    expect(getCachedWeather(key)).toBeNull();
  });
});

describe('Zuletzt gewaehlte Stadt', () => {
  it('speichert und liest die letzte Stadt', () => {
    setLastCity(cityA);
    expect(getLastCity().name).toBe('Ingolstadt');
  });
});

describe('Zeitstempel-Formatierung', () => {
  it('zeigt "Gerade aktualisiert" fuer sehr aktuelle Zeitstempel', () => {
    expect(formatRelativeTime(Date.now())).toBe('Gerade aktualisiert');
  });

  it('zeigt Minuten korrekt an', () => {
    expect(formatRelativeTime(Date.now() - 5 * 60000)).toBe('Aktualisiert vor 5 Minuten');
  });

  it('zeigt Stunden korrekt an', () => {
    expect(formatRelativeTime(Date.now() - 90 * 60000)).toBe('Aktualisiert vor 1 Stunde');
  });
});
