# Wetter & Tagesplan App

Eine moderne Web-App, die aktuelle Wetterdaten anzeigt und persönliche Tagesempfehlungen gibt.

## Projektstruktur

```
wetter-app/
├── index.html          # Haupt-HTML-Datei
├── css/
│   └── style.css       # Stylesheet mit responsivem Design
├── js/
│   └── app.js          # JavaScript-Logik und API-Integration
└── README.md           # Diese Anleitung
```

## Vorteile der Open-Meteo API

- **Kein API-Key erforderlich** – sofort einsatzbereit!
- **Vollständig kostenlos** – bis zu 10.000 Anfragen pro Tag
- **HTTPS standardmäßig** – sicherere Verbindung
- **Keine monatlichen Limits** – keine Sorge um API-Kontingente
- **Hohe Verfügbarkeit** – zuverlässige öffentliche API

## Projekt starten

### Option A: Direkt im Browser
Öffne `index.html` per Doppelklick im Browser.

### Option B: Mit VS Code Live Server
1. Installiere die Erweiterung "Live Server" in VS Code
2. Öffne den Projektordner in VS Code
3. Rechtsklick auf `index.html` → "Open with Live Server"

### Option C: Mit Python
```bash
cd wetter-app
python -m http.server 8000
# Dann öffne: http://localhost:8000
```

### Option D: Mit Node.js
```bash
npx http-server wetter-app -p 8000
# Dann öffne: http://localhost:8000
```

## Verwendete Open-Meteo API-Endpunkte

| API | Beschreibung | URL |
|-----|--------------|-----|
| Geocoding | Stadtname → Koordinaten | `https://geocoding-api.open-meteo.com/v1/search` |
| Forecast | Wetterdaten + Vorhersage | `https://api.open-meteo.com/v1/forecast` |

### Beispiel-Requests

**Geocoding (Stadt suchen):**
```
GET https://geocoding-api.open-meteo.com/v1/search?name=Berlin&count=1&language=de&format=json
```

**Wetterdaten:**
```
GET https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=6
```

### Verfügbare Wettervariablen

| Variable | Beschreibung |
|----------|--------------|
| `temperature_2m` | Aktuelle Temperatur |
| `relative_humidity_2m` | Luftfeuchtigkeit (%) |
| `apparent_temperature` | Gefühlte Temperatur |
| `weather_code` | WMO Wettercode |
| `wind_speed_10m` | Windgeschwindigkeit (km/h) |
| `temperature_2m_max` | Tageshöchsttemperatur |
| `temperature_2m_min` | Tagestiefsttemperatur |

## Features

- **Stadtsuche:** Wetter für jede Stadt weltweit abrufen
- **Mein Standort:** Automatische Standort-Erkennung per Geolocation
- **Temperatureinheiten:** Umschaltung zwischen °C und °F
- **5-Tage-Vorhersage:** Übersicht der kommenden Tage
- **Tagesempfehlungen:** Personalisierte Tipps basierend auf Wetterdaten
- **Wetter-Icons:** Passende Icons für jede Wetterlage
- **Farb-Theme:** Hintergrund ändert sich je nach Wetterlage
- **Responsives Design:** Optimiert für Desktop und Mobile

## WMO Wettercodes

Die App verwendet WMO (World Meteorological Organization) Wettercodes:

| Code | Bedeutung |
|------|-----------|
| 0-3  | Klar bis bewölkt |
| 45-48| Nebel |
| 51-57| Nieselregen |
| 61-67| Regen |
| 71-77| Schneefall |
| 80-82| Regenschauer |
| 85-86| Schneeschauer |
| 95-99| Gewitter |

## Fehlerbehandlung

Die App fängt folgende Fehler ab:
- Leere Eingabe → "Bitte gib eine Stadt ein"
- Stadt nicht gefunden → "Stadt nicht gefunden..."
- Keine Wetterdaten → "Keine Wetterdaten verfügbar"
- Geolocation verweigert → "Standort-Zugriff wurde verweigert"

## Browser-Kompatibilität

- Chrome (empfohlen)
- Firefox
- Safari
- Edge
- Mobile Browser (iOS Safari, Chrome Mobile)

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Wetterdaten von [Open-Meteo](https://open-meteo.com/) (CC BY 4.0).