import { describe, it, expect } from 'vitest';
import {
  degreesToCompass, formatDay, toFahrenheit,
  levenshtein, WeatherAppError, buildWeatherURL, generateRecommendations
} from '../js/app.js';

describe('Temperatur-Umrechnung (C/F)', () => {
  it('rechnet 0C korrekt in Fahrenheit um', () => expect(toFahrenheit(0)).toBe(32));
  it('rechnet 100C korrekt in Fahrenheit um', () => expect(toFahrenheit(100)).toBe(212));
  it('rundet konvertierte Temperaturen', () => expect(toFahrenheit(20)).toBe(68));
});

describe('Windrichtung aus Grad', () => {
  it('erkennt Nord (0 Grad)', () => expect(degreesToCompass(0)).toBe('N'));
  it('erkennt Ost (90 Grad)', () => expect(degreesToCompass(90)).toBe('O'));
  it('erkennt Sued (180 Grad)', () => expect(degreesToCompass(180)).toBe('S'));
  it('gibt Fallback fuer fehlende Werte zurueck', () => expect(degreesToCompass(null)).toBe('–'));
});

describe('Levenshtein-Distanz (Korrekturvorschlaege)', () => {
  it('gibt 0 fuer identische Strings zurueck', () => expect(levenshtein('Berlin', 'Berlin')).toBe(0));
  it('erkennt einen einzelnen Tippfehler', () => expect(levenshtein('Berlim', 'Berlin')).toBe(1));
});

describe('WeatherAppError', () => {
  it('traegt Nachricht und Korrekturvorschlag', () => {
    const err = new WeatherAppError('Stadt nicht gefunden', 'Meintest du Berlin?');
    expect(err.message).toBe('Stadt nicht gefunden');
    expect(err.suggestion).toBe('Meintest du Berlin?');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('Zeitzonen / API-URL', () => {
  it('nutzt automatische Zeitzone der jeweiligen Stadt', () => {
    expect(buildWeatherURL(48.77, 11.43)).toContain('timezone=auto');
  });
  it('fragt Niederschlagswahrscheinlichkeit ab', () => {
    expect(buildWeatherURL(48.77, 11.43)).toContain('precipitation_probability_max');
  });
});

describe('formatDay', () => {
  it('erkennt das heutige Datum', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(formatDay(today)).toBe('Heute');
  });
});

describe('Empfehlungslogik fuer verschiedene Wetterlagen', () => {
  it('empfiehlt einen Regenschirm bei Regen', () => {
    const data = { current: { temperature_2m: 12, weather_code: 61, wind_speed_10m: 10, relative_humidity_2m: 60 } };
    expect(generateRecommendations(data).some(r => r.icon === '☔')).toBe(true);
  });
  it('empfiehlt Fahrradfahren bei Sonnenschein', () => {
    const data = { current: { temperature_2m: 25, weather_code: 0, wind_speed_10m: 10, relative_humidity_2m: 40 } };
    expect(generateRecommendations(data).some(r => r.icon === '🚴')).toBe(true);
  });
  it('empfiehlt warme Kleidung bei Kaelte', () => {
    const data = { current: { temperature_2m: -2, weather_code: 71, wind_speed_10m: 5, relative_humidity_2m: 70 } };
    expect(generateRecommendations(data).some(r => r.icon === '🧥')).toBe(true);
  });
  it('warnt vor starkem Wind', () => {
    const data = { current: { temperature_2m: 18, weather_code: 2, wind_speed_10m: 45, relative_humidity_2m: 50 } };
    expect(generateRecommendations(data).some(r => r.icon === '💨')).toBe(true);
  });
});
