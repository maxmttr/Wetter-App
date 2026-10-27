# Wetter & Tagesplan

Eine Wetter-App mit personalisierter Tagesplanung, basierend auf der kostenlosen [Open-Meteo](https://open-meteo.com/) API. Kein API-Key nötig.

**Live-Version:** https://wetter-app-alpha.vercel.app/

## Funktionen

- Stadtsuche mit Autocomplete (Land/Region werden angezeigt)
- Automatische Standorterkennung
- °C/°F-Umschaltung
- 5-Tage-Vorhersage inkl. Niederschlagswahrscheinlichkeit
- Stundenprognose (alle 3h für den aktuellen Tag)
- Temperaturdiagramm (Chart.js)
- Vergleich zweier Städte nebeneinander
- Wetterabhängige Tagesempfehlungen (Regenschirm, Sonnencreme, Fahrradwetter, ...)
- Favoriten & zuletzt gesuchte Städte (lokal im Browser gespeichert)
- Wetterdaten-Cache mit 10 Minuten Ablaufzeit — spart unnötige API-Aufrufe
- Wiederherstellung der zuletzt gewählten Stadt beim erneuten Öffnen
- Klare Lade-, Leer- und Fehlerzustände inkl. Korrekturvorschlägen bei Tippfehlern
- Zeitstempel „Aktualisiert vor X Minuten“
- Vollständig responsive und mit Tastatur bedienbar

## Tech-Stack

Reines HTML/CSS/JavaScript (Vanilla, kein Framework, kein Build-Schritt nötig für den Betrieb).

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Diagramme:** [Chart.js](https://www.chartjs.org/) (via CDN)
- **Wetterdaten:** [Open-Meteo Geocoding-](https://open-meteo.com/en/docs/geocoding-api) und [Forecast-API](https://open-meteo.com/en/docs)
- **Hosting:** Vercel (Static Site)
- **Tests:** Vitest + jsdom
- **Code-Qualität:** ESLint, Prettier
- **CI:** GitHub Actions (Lint, Tests, Build-Check bei jedem Pull Request)

## Projektstruktur

```
├── index.html
├── css/style.css
├── js/
│   ├── app.js
│   ├── storage.js
│   └── autocomplete.js
├── tests/
│   ├── app.test.js
│   ├── storage.test.js
│   └── setup.js
├── .github/workflows/ci.yml
├── eslint.config.js
├── .prettierrc.json
└── vitest.config.js
```

## Installation & lokale Entwicklung

Voraussetzung: Node.js ≥ 18 (nur für Tests/Linting, nicht für den Betrieb selbst).

```bash
git clone https://github.com/maxmttr/Wetter-App.git
cd Wetter-App
npm install
```

### App lokal öffnen

```bash
python3 -m http.server 8000
# oder
npx serve .
```

### Tests ausführen

```bash
npm test
npm run test:watch
```

### Linting & Formatierung

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

## Deployment (Vercel)

1. Änderungen über einen Feature-Branch und Pull Request einbringen.
2. GitHub Actions führt automatisch Lint, Tests und Build-Check aus.
3. Nach Review und Merge deployt Vercel automatisch — keine Umgebungsvariablen nötig.
4. Produktionsänderungen niemals direkt auf dem produktiv verbundenen Branch, sondern immer per Pull Request.

## Umgebungsvariablen / API-Keys

Keine nötig. Open-Meteo ist kostenlos und ohne Authentifizierung nutzbar.

## Bekannte Einschränkungen

- Reverse-Geocoding zeigt aktuell nur Koordinaten, da Open-Meteo kein dediziertes Reverse-Geocoding anbietet.
- Der Cache liegt im LocalStorage und wird nicht zwischen Geräten synchronisiert.
- Chart.js wird per CDN geladen; bei geblockten externen Skripten wird nur das Diagramm ausgelassen.
